const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = process.env.PORT || 3000;
const ARQUIVO_DADOS = path.join(__dirname, 'dados.json');
const MAX_HISTORICO = 50;
const SENHA_MATRIZ = 'ubs2026';
const TOKENS = new Set();
const TIMEOUT_HEARTBEAT = 15 * 1000;

const USFS = [
  { id: 'usf-01', nome: 'USF Canto do Mar',       regiao: 'Costa Norte' },
  { id: 'usf-02', nome: 'USF Enseada I',          regiao: 'Costa Norte' },
  { id: 'usf-03', nome: 'USF Enseada II',         regiao: 'Costa Norte' },
  { id: 'usf-04', nome: 'USF Jaraguá',            regiao: 'Costa Norte' },
  { id: 'usf-05', nome: 'USF Centro',             regiao: 'Região Central' },
  { id: 'usf-06', nome: 'USF Pontal da Cruz',     regiao: 'Região Central' },
  { id: 'usf-07', nome: 'USF Morro do Abrigo I',  regiao: 'Região Central' },
  { id: 'usf-08', nome: 'USF Morro do Abrigo II', regiao: 'Região Central' },
  { id: 'usf-09', nome: 'USF Olaria',             regiao: 'Região Central' },
  { id: 'usf-10', nome: 'USF Itatinga I',         regiao: 'Região Central' },
  { id: 'usf-11', nome: 'USF Itatinga II',        regiao: 'Região Central' },
  { id: 'usf-12', nome: 'USF Topolândia I',       regiao: 'Região Central' },
  { id: 'usf-13', nome: 'USF Topolândia II',      regiao: 'Região Central' },
  { id: 'usf-14', nome: 'USF Varadouro',          regiao: 'Região Central' },
  { id: 'usf-15', nome: 'USF Barequeçaba',        regiao: 'Costa Sul' },
  { id: 'usf-16', nome: 'USF Maresias',           regiao: 'Costa Sul' },
  { id: 'usf-17', nome: 'USF Boiçucanga I',       regiao: 'Costa Sul' },
  { id: 'usf-18', nome: 'USF Boiçucanga II',      regiao: 'Costa Sul' },
  { id: 'usf-19', nome: 'USF Camburi',            regiao: 'Costa Sul' },
  { id: 'usf-20', nome: 'USF Juquehy I',          regiao: 'Costa Sul' },
  { id: 'usf-21', nome: 'USF Juquehy II',         regiao: 'Costa Sul' },
  { id: 'usf-22', nome: 'USF Barra do Sahy',      regiao: 'Costa Sul' },
  { id: 'usf-23', nome: 'USF Barra do Una',       regiao: 'Costa Sul' },
  { id: 'usf-24', nome: 'USF FSPSS',              regiao: 'Costa Sul' }
];

let ubsMap = {};
const clientesWS = new Set();

setInterval(() => {
  const agora = Date.now();
  Object.values(ubsMap).forEach(ubs => {
    if (ubs.online && ubs.ultimoHeartbeat && (agora - ubs.ultimoHeartbeat) > TIMEOUT_HEARTBEAT) {
      ubs.online = false;
      broadcast({ type: 'ubs_offline', ubs_id: ubs.id });
      salvarDados();
      console.log(`🔴 USF offline por inatividade: ${ubs.nome}`);
    }
  });
}, 5000);

function carregarDados() {
  try {
    if (fs.existsSync(ARQUIVO_DADOS)) {
      const raw = fs.readFileSync(ARQUIVO_DADOS, 'utf8');
      ubsMap = JSON.parse(raw);
      Object.values(ubsMap).forEach(u => { u.online = false; });
      console.log(`💾 Dados carregados: ${Object.keys(ubsMap).length} USF`);
    }
  } catch (e) {
    console.error('⚠️ Falha ao carregar dados.json:', e.message);
    ubsMap = {};
  }
}

let salvarTimer = null;
function salvarDados() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    try {
      fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(ubsMap, null, 2), 'utf8');
    } catch (e) {
      console.error('⚠️ Falha ao salvar dados.json:', e.message);
    }
  }, 500);
}

function aceitarWS(req, socket) {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  const cliente = { socket, buffer: Buffer.alloc(0) };
  clientesWS.add(cliente);
  socket.on('data', (chunk) => processarFrames(cliente, chunk));
  socket.on('close', () => clientesWS.delete(cliente));
  socket.on('error', () => clientesWS.delete(cliente));
}

function processarFrames(cliente, chunk) {
  cliente.buffer = Buffer.concat([cliente.buffer, chunk]);
  while (cliente.buffer.length >= 2) {
    const b0 = cliente.buffer[0], b1 = cliente.buffer[1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) === 0x80;
    let len = b1 & 0x7f, offset = 2;
    if (len === 126) { len = cliente.buffer.readUInt16BE(2); offset = 4; }
    else if (len === 127) { len = Number(cliente.buffer.readBigUInt64BE(2)); offset = 10; }
    const maskLen = masked ? 4 : 0;
    if (cliente.buffer.length < offset + maskLen + len) break;
    let payload = cliente.buffer.slice(offset + maskLen, offset + maskLen + len);
    if (masked) {
      const mask = cliente.buffer.slice(offset, offset + 4);
      payload = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]));
    }
    cliente.buffer = cliente.buffer.slice(offset + maskLen + len);
    if (opcode === 0x8) { cliente.socket.end(); clientesWS.delete(cliente); return; }
    if (opcode === 0x1 || opcode === 0x2) {
      try { tratarMensagem(cliente, JSON.parse(payload.toString('utf8'))); } catch (e) {}
    }
  }
}

function enviarWS(cliente, obj) {
  const data = Buffer.from(JSON.stringify(obj));
  const len = data.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0]=0x81; header[1]=126; header.writeUInt16BE(len,2); }
  else { header = Buffer.alloc(10); header[0]=0x81; header[1]=127; header.writeBigUInt64BE(BigInt(len),2); }
  try { cliente.socket.write(Buffer.concat([header, data])); } catch(e) {}
}
function broadcast(obj) { clientesWS.forEach(c => enviarWS(c, obj)); }

function tratarMensagem(cliente, msg) {
  if (!msg || !msg.type) return;

  if (msg.type === 'ola_matriz') {
    cliente.papel = 'matriz';
    enviarWS(cliente, {
      type: 'estado_inicial',
      ubs: Object.values(ubsMap),
      listaUSF: USFS
    });
    return;
  }
  if (msg.type === 'ola_filial') {
    cliente.papel = 'filial';
    cliente.ubs_id = msg.ubs_id;
    return;
  }

  if (msg.type === 'dados_setor' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (!ubs) return;
    const setor = ubs.setores.find(s => s.id === msg.setor_id);
    if (setor) {
      setor.dados = { ...setor.dados, ...(msg.dados || {}) };
      setor.ultimaAtualizacao = new Date().toISOString();
      if (!setor.historico) setor.historico = [];
      setor.historico.unshift({
        ts: setor.ultimaAtualizacao,
        dados: { ...setor.dados }
      });
      if (setor.historico.length > MAX_HISTORICO) setor.historico.length = MAX_HISTORICO;
    }
    ubs.novosDados = (ubs.novosDados || 0) + 1;
    ubs.ultimoHeartbeat = Date.now();
    ubs.online = true;
    salvarDados();
    broadcast({ type: 'novo_dado', ubs_id: msg.ubs_id, setor_id: msg.setor_id, dados: msg.dados });
    enviarWS(cliente, { type: 'parar_piscar', ubs_id: msg.ubs_id, setor_id: msg.setor_id });
    return;
  }

  if (msg.type === 'heartbeat' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (ubs) {
      ubs.ultimoHeartbeat = Date.now();
      if (!ubs.online) {
        ubs.online = true;
        broadcast({ type: 'ubs_online', ubs_id: ubs.id });
        salvarDados();
      }
    }
    return;
  }

  if (msg.type === 'aviso' && msg.aviso) {
    broadcast({ type: 'aviso', aviso: msg.aviso });
    return;
  }

  if (msg.type === 'documento_setor' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (!ubs) return;
    if (!ubs.documentos) ubs.documentos = [];
    msg.documentos.forEach(doc => {
      ubs.documentos.unshift({
        ...doc,
        setor_id: msg.setor_id,
        setor_nome: msg.setor_nome,
        origem: 'filial',
        destino: 'matriz',
        ts: new Date().toISOString()
      });
    });
    if (ubs.documentos.length > 200) ubs.documentos.length = 200;
    ubs.ultimoHeartbeat = Date.now();
    ubs.online = true;
    salvarDados();
    broadcast({
      type: 'documento_recebido',
      ubs_id: msg.ubs_id,
      ubs_nome: ubs.nome,
      setor_id: msg.setor_id,
      setor_nome: msg.setor_nome,
      documentos: msg.documentos,
      origem: 'filial'
    });
    return;
  }

  if (msg.type === 'documento_matriz' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (!ubs) return;
    if (!ubs.documentos) ubs.documentos = [];
    msg.documentos.forEach(doc => {
      ubs.documentos.unshift({
        ...doc,
        setor_id: null,
        setor_nome: null,
        origem: 'matriz',
        destino: 'filial',
        ts: new Date().toISOString()
      });
    });
    if (ubs.documentos.length > 200) ubs.documentos.length = 200;
    salvarDados();
    broadcast({
      type: 'documento_recebido',
      ubs_id: msg.ubs_id,
      ubs_nome: ubs.nome,
      setor_id: null,
      setor_nome: null,
      documentos: msg.documentos,
      origem: 'matriz'
    });
    return;
  }

  if (msg.type === 'marcar_docs_lidos' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (ubs && ubs.documentos) {
      ubs.documentos.forEach(d => {
        if (d.origem !== msg.origem) d.lido = true;
      });
      salvarDados();
    }
    return;
  }
}

function lerCorpo(req) {
  return new Promise((res) => {
    let b = ''; req.on('data', c => b += c); req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch(e){ res({}); } });
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}
function htmlFile(res, nome) {
  return fs.readFile(path.join(__dirname, nome), (e, d) => {
    if (e) { res.writeHead(404); return res.end(nome + ' não encontrado'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(d);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = req.url.split('?')[0];

  if (req.headers.upgrade === 'websocket') return aceitarWS(req, req.socket);

  // ---------- Autenticação ----------
  if (url === '/api/login' && req.method === 'POST') {
    const body = await lerCorpo(req);
    if (body.senha === SENHA_MATRIZ) {
      const token = crypto.randomBytes(24).toString('hex');
      TOKENS.add(token);
      setTimeout(() => TOKENS.delete(token), 24 * 60 * 60 * 1000);
      return json(res, 200, { ok: true, token });
    }
    return json(res, 401, { ok: false, erro: 'Senha inválida' });
  }

  if (url === '/api/verificar' && req.method === 'POST') {
    const body = await lerCorpo(req);
    return json(res, 200, { ok: TOKENS.has(body.token) });
  }

  if (url === '/api/logout' && req.method === 'POST') {
    const body = await lerCorpo(req);
    TOKENS.delete(body.token);
    return json(res, 200, { ok: true });
  }

  if (url === '/api/usfs') {
    return json(res, 200, { usfs: USFS });
  }

  if (url === '/api/marcar-lido' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const ubs = ubsMap[body.ubs_id];
    if (ubs) {
      ubs.novosDados = 0;
      salvarDados();
    }
    return json(res, 200, { ok: true });
  }

  // ---------- Rotas de dados ----------
  if (url === '/api/registrar' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const id = body.ubs_id;
    const existente = ubsMap[id];

    const setoresNovos = (body.setores || []).map(s => {
      const antigo = existente?.setores?.find(x => x.id === s.id);
      return {
        ...s,
        dados: antigo?.dados || s.dados,
        historico: antigo?.historico || [],
        ultimaAtualizacao: antigo?.ultimaAtualizacao || null
      };
    });

    ubsMap[id] = {
      id,
      nome: body.nome,
      regiao: body.regiao || null,
      online: true,
      ultimoHeartbeat: Date.now(),
      setores: setoresNovos,
      documentos: existente?.documentos || [],
      novosDados: existente?.novosDados || 0
    };
    salvarDados();
    broadcast({ type: 'ubs_registrada', ubs: ubsMap[id] });
    console.log(`✅ USF registrada: ${body.nome} (${id})`);
    return json(res, 200, { ok: true, ubs: ubsMap[id] });
  }

  if (url === '/api/aviso' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const aviso = { titulo: body.titulo, mensagem: body.mensagem, prioridade: body.prioridade || 'info', ts: Date.now() };
    broadcast({ type: 'aviso', aviso });
    return json(res, 200, { ok: true });
  }

  if (url === '/api/backup') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="dados.json"'
    });
    return res.end(JSON.stringify(ubsMap, null, 2));
  }

  // ---------- Páginas HTML ----------
  if (url === '/matriz') {
    const cookie = req.headers.cookie || '';
    const token = cookie.match(/token=([a-f0-9]+)/)?.[1];
    if (!token || !TOKENS.has(token)) {
      return htmlFile(res, 'login.html');
    }
    return htmlFile(res, 'matriz.html');
  }

  if (url === '/') return htmlFile(res, 'login.html');
  if (url === '/filial') return htmlFile(res, 'filial.html');

  // ---------- PWA ----------
  if (url === '/manifest.json') {
    return fs.readFile(path.join(__dirname, 'manifest.json'), (e, d) => {
      if (e) { res.writeHead(404); return res.end('manifest.json não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
      res.end(d);
    });
  }

  if (url === '/sw.js') {
    return fs.readFile(path.join(__dirname, 'sw.js'), (e, d) => {
      if (e) { res.writeHead(404); return res.end('sw.js não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(d);
    });
  }

  if (url === '/favicon.ico') {
    res.writeHead(204); return res.end();
  }

  res.writeHead(404); res.end('Rota não encontrada');
});

carregarDados();

server.listen(PORTA, '0.0.0.0', () => {
  const os = require('os');
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n🏥 Servidor Matriz USF rodando!\n');
  console.log(`   Login:   http://localhost:${PORTA}/`);
  console.log(`   Matriz:  http://localhost:${PORTA}/matriz`);
  ips.forEach(ip => {
    console.log(`   LAN:     http://${ip}:${PORTA}/matriz`);
    console.log(`   Filial:  http://${ip}:${PORTA}/filial`);
  });
  console.log(`\n💾 Backup: http://localhost:${PORTA}/api/backup`);
  console.log(`🔑 Senha da matriz: ${SENHA_MATRIZ}`);
  console.log(`📋 USFs cadastradas: ${USFS.length}`);
  console.log('   (deixe esta janela aberta)\n');
});

const URL_EXTERNA = process.env.RENDER_EXTERNAL_URL;
if (URL_EXTERNA) {
  setInterval(() => {
    https.get(URL_EXTERNA, (res) => {
      console.log(`[keep-alive] Ping enviado. Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[keep-alive] Erro no ping:', err.message);
    });
  }, 10 * 60 * 1000);
  console.log(`🔁 Keep-alive ativo para: ${URL_EXTERNA}`);
}
