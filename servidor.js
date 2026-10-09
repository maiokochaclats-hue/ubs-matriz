const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Porta dinâmica (Render fornece PORT). Local usa 3000.
const PORTA = process.env.PORT || 3000;
const ARQUIVO_DADOS = path.join(__dirname, 'dados.json');
const MAX_HISTORICO = 50;
const SENHA_MATRIZ = 'ubs2026'; // ← troque pela sua senha
const TOKENS = new Set();
const TIMEOUT_HEARTBEAT = 15 * 1000; // 15s sem heartbeat = offline

let ubsMap = {};
const clientesWS = new Set();

// ---------- Timeout de heartbeat ----------
setInterval(() => {
  const agora = Date.now();
  Object.values(ubsMap).forEach(ubs => {
    if (ubs.online && ubs.ultimoHeartbeat && (agora - ubs.ultimoHeartbeat) > TIMEOUT_HEARTBEAT) {
      ubs.online = false;
      broadcast({ type: 'ubs_offline', ubs_id: ubs.id });
      salvarDados();
      console.log(`🔴 UBS offline por inatividade: ${ubs.nome}`);
    }
  });
}, 5000);

// ---------- Persistência ----------
function carregarDados() {
  try {
    if (fs.existsSync(ARQUIVO_DADOS)) {
      const raw = fs.readFileSync(ARQUIVO_DADOS, 'utf8');
      ubsMap = JSON.parse(raw);
      // ao carregar, considera todas offline (o heartbeat vai reativar)
      Object.values(ubsMap).forEach(u => { u.online = false; });
      console.log(`💾 Dados carregados: ${Object.keys(ubsMap).length} UBS`);
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

// ---------- WebSocket manual ----------
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

// ---------- Lógica ----------
function tratarMensagem(cliente, msg) {
  if (!msg || !msg.type) return;

  if (msg.type === 'ola_matriz') {
    cliente.papel = 'matriz';
    enviarWS(cliente, { type: 'estado_inicial', ubs: Object.values(ubsMap) });
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
}

// ---------- HTTP ----------
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

  // ---------- Marcar lido (zera novosDados) ----------
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
      online: true,
      ultimoHeartbeat: Date.now(),
      setores: setoresNovos,
      novosDados: existente?.novosDados || 0
    };
    salvarDados();
    broadcast({ type: 'ubs_registrada', ubs: ubsMap[id] });
    console.log(`✅ UBS registrada: ${body.nome} (${id})`);
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

  res.writeHead(404); res.end('Rota não encontrada');
});

carregarDados();

server.listen(PORTA, '0.0.0.0', () => {
  const os = require('os');
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n🏥 Servidor Matriz UBS rodando!\n');
  console.log(`   Login:   http://localhost:${PORTA}/`);
  console.log(`   Matriz:  http://localhost:${PORTA}/matriz`);
  ips.forEach(ip => {
    console.log(`   LAN:     http://${ip}:${PORTA}/matriz`);
    console.log(`   Filial:  http://${ip}:${PORTA}/filial`);
  });
  console.log(`\n💾 Backup: http://localhost:${PORTA}/api/backup`);
  console.log(`🔑 Senha da matriz: ${SENHA_MATRIZ}`);
  console.log('   (deixe esta janela aberta)\n');
});

// ---------- Keep-alive para o Render ----------
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
