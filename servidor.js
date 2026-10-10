const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = process.env.PORT || 3000;
const ARQUIVO_DADOS = path.join(__dirname, 'dados.json');
const MAX_HISTORICO = 50;
const TOKENS = new Set();
const TIMEOUT_HEARTBEAT = 15 * 1000;

// ============ CREDENCIAIS INICIAIS ============
const DADOS_INICIAIS = {
  presidencia: {
    usuario: 'presidente',
    senha: 'presidencia2026',
    nome: 'Carlos Eduardo Antunes Craveiro',
    cargo: 'Presidente'
  },
  diretorias: [
    {
      id: 'dir-saude-bucal',
      nome: 'Diretoria de Saúde Bucal',
      usuario: 'daniel',
      senha: 'saude2026',
      diretor: 'Daniel Kakimoto de Capitani',
      tipo: 'operacional',
      unidades: []
    },
    {
      id: 'dir-atencao-especializada',
      nome: 'Diretoria de Atenção Especializada',
      usuario: 'angelica',
      senha: 'atencao2026',
      diretor: 'Angélica Oliveira Costa',
      tipo: 'operacional',
      unidades: [
        { id: 'centro-reabilitacao', nome: 'Centro de Reabilitação', regiao: 'Atenção Especializada' },
        { id: 'ciama',               nome: 'CIAMA - Centro de Incentivo ao Aleitamento Materno', regiao: 'Atenção Especializada' },
        { id: 'cemin',               nome: 'CEMIN - Centro Municipal de Infectologia', regiao: 'Atenção Especializada' },
        { id: 'caps',                nome: 'CAPS - Centro de Atenção Psicossocial', regiao: 'Atenção Especializada' },
        { id: 'caps-ad',             nome: 'CAPS AD - Álcool e Drogas', regiao: 'Atenção Especializada' },
        { id: 'ubs',                 nome: 'UBS - Unidade Básica de Saúde', regiao: 'Atenção Especializada' },
        { id: 'centro-gestacional',  nome: 'Centro Gestacional', regiao: 'Atenção Especializada' },
        { id: 'caps-infantil',       nome: 'CAPS Infantil', regiao: 'Atenção Especializada' }
      ]
    },
    {
      id: 'dir-atencao-basica',
      nome: 'Diretoria de Atenção Básica',
      usuario: 'fernanda',
      senha: 'basica2026',
      diretor: 'Fernanda Carolina Souza Lima Paiuri',
      tipo: 'operacional',
      unidades: [
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
      ]
    },
    {
      id: 'dir-financeira',
      nome: 'Diretoria Financeira',
      usuario: 'liliane',
      senha: 'financeira2026',
      diretor: 'Liliane Maria de Melo Aniceto de Souza',
      tipo: 'operacional',
      unidades: []
    },
    {
      id: 'dir-administrativa',
      nome: 'Diretoria Administrativa',
      usuario: 'williams',
      senha: 'admin2026',
      diretor: 'Williams Alves Santana',
      tipo: 'operacional',
      unidades: []
    }
  ],
  orgaos_apoio: [
    { id: 'apoio-controladoria', nome: 'Controladoria Interna', usuario: 'fabiana', senha: 'control2026', responsavel: 'Fabiana Centurião' },
    { id: 'apoio-juridico', nome: 'Jurídico', usuario: 'juridico', senha: 'juridico2026', responsavel: null },
    { id: 'apoio-nep', nome: 'NEP - Núcleo de Ensino e Pesquisa', usuario: 'nep', senha: 'nep2026', responsavel: null },
    { id: 'apoio-seguranca', nome: 'Segurança do Trabalho', usuario: 'seguranca', senha: 'seguranca2026', responsavel: null }
  ]
};

// ============ ESTADO ============
let estado = JSON.parse(JSON.stringify(DADOS_INICIAIS));
let ubsMap = {};
const clientesWS = new Set();

// ============ TIMEOUT HEARTBEAT ============
setInterval(() => {
  const agora = Date.now();
  Object.values(ubsMap).forEach(ubs => {
    if (ubs.online && ubs.ultimoHeartbeat && (agora - ubs.ultimoHeartbeat) > TIMEOUT_HEARTBEAT) {
      ubs.online = false;
      broadcast({ type: 'ubs_offline', ubs_id: ubs.id });
      salvarDados();
    }
  });
}, 5000);

// ============ PERSISTÊNCIA ============
function carregarDados() {
  try {
    if (fs.existsSync(ARQUIVO_DADOS)) {
      const raw = fs.readFileSync(ARQUIVO_DADOS, 'utf8');
      const dados = JSON.parse(raw);
      if (dados.ubsMap && !dados.estado) {
        ubsMap = dados.ubsMap || {};
        estado = JSON.parse(JSON.stringify(DADOS_INICIAIS));
      } else {
        ubsMap = dados.ubsMap || {};
        estado = dados.estado || JSON.parse(JSON.stringify(DADOS_INICIAIS));
      }
      Object.values(ubsMap).forEach(u => { u.online = false; });
      console.log(`💾 Dados carregados: ${Object.keys(ubsMap).length} unidades ativas`);
    } else {
      estado = JSON.parse(JSON.stringify(DADOS_INICIAIS));
      ubsMap = {};
      console.log('🆕 Primeira execução: usando dados iniciais');
    }
  } catch (e) {
    console.error('⚠️ Falha ao carregar dados.json:', e.message);
    estado = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    ubsMap = {};
  }
}

let salvarTimer = null;
function salvarDados() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    try {
      fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify({ estado, ubsMap }, null, 2), 'utf8');
    } catch (e) {
      console.error('⚠️ Falha ao salvar dados.json:', e.message);
    }
  }, 500);
}

// ============ WEBSOCKET ============
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
  const cliente = { socket, buffer: Buffer.alloc(0), papel: null, usuario: null };
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

// ============ HELPERS ============
function encontrarDiretoriaDaUnidade(ubsId) {
  return estado.diretorias.find(d => d.unidades.some(u => u.id === ubsId));
}

function podeInteragir(origem, destino) {
  if (!origem || !destino) return false;
  if (origem.tipo === 'presidencia') return true;
  if (destino.tipo === 'presidencia') return true;
  if (origem.tipo === 'diretoria' && destino.tipo === 'apoio') return true;
  if (origem.tipo === 'apoio' && destino.tipo === 'diretoria') return true;
  if (origem.tipo === 'diretoria' && destino.tipo === 'diretoria') return false;
  if (origem.tipo === 'apoio' && destino.tipo === 'apoio') return true;
  if (origem.tipo === 'unidade' && destino.tipo === 'unidade') return false;
  if (origem.tipo === 'unidade' && destino.tipo === 'diretoria') {
    const dir = encontrarDiretoriaDaUnidade(origem.id);
    return dir && dir.id === destino.id;
  }
  if (origem.tipo === 'diretoria' && destino.tipo === 'unidade') {
    const dir = encontrarDiretoriaDaUnidade(destino.id);
    return dir && dir.id === origem.id;
  }
  return false;
}

// ============ TRATAR MENSAGENS WS ============
function tratarMensagem(cliente, msg) {
  if (!msg || !msg.type) return;

  // ===== HANDSHAKE =====
  if (msg.type === 'ola_matriz' || msg.type === 'ola_diretoria' || msg.type === 'ola_presidencia' || msg.type === 'ola_apoio') {
    cliente.papel = msg.type.replace('ola_', '');
    cliente.usuario = msg.usuario || null;

    // Lista completa de unidades (usada por matriz, presidência e apoio)
    const listaTodas = (() => {
      const todas = [];
      estado.diretorias.forEach(d => {
        d.unidades.forEach(u => todas.push({ id: u.id, nome: u.nome, regiao: u.regiao || d.nome }));
      });
      return todas;
    })();

    // Matriz antiga: recebe TUDO
    if (msg.type === 'ola_matriz') {
      enviarWS(cliente, {
        type: 'estado_inicial',
        ubs: Object.values(ubsMap),
        listaUSF: listaTodas
      });
      return;
    }

    // Diretoria: recebe só as unidades da sua diretoria
    if (msg.type === 'ola_diretoria') {
      const dirId = msg.usuario;
      const dir = estado.diretorias.find(d => d.id === dirId);
      if (!dir) return;

      const idsDaDiretoria = dir.unidades.map(u => u.id);
      const ubsFiltradas = Object.values(ubsMap).filter(u => idsDaDiretoria.includes(u.id));

      enviarWS(cliente, {
        type: 'estado_inicial',
        ubs: ubsFiltradas,
        listaUSF: dir.unidades.map(u => ({ id: u.id, nome: u.nome, regiao: u.regiao || dir.nome }))
      });
      return;
    }

    // Presidência: recebe TUDO
    if (msg.type === 'ola_presidencia') {
      enviarWS(cliente, {
        type: 'estado_inicial',
        ubs: Object.values(ubsMap),
        listaUSF: listaTodas
      });
      return;
    }

    // Apoio: recebe TUDO (só consulta)
    if (msg.type === 'ola_apoio') {
      enviarWS(cliente, {
        type: 'estado_inicial',
        ubs: Object.values(ubsMap),
        listaUSF: listaTodas
      });
      return;
    }

    return;
  }

  if (msg.type === 'ola_filial') {
    cliente.papel = 'filial';
    cliente.ubs_id = msg.ubs_id;
    return;
  }

  // ===== DADOS =====
  if (msg.type === 'dados_setor' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (!ubs) return;
    const setor = ubs.setores.find(s => s.id === msg.setor_id);
    if (setor) {
      setor.dados = { ...setor.dados, ...(msg.dados || {}) };
      setor.ultimaAtualizacao = new Date().toISOString();
      if (!setor.historico) setor.historico = [];
      setor.historico.unshift({ ts: setor.ultimaAtualizacao, dados: { ...setor.dados } });
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

// ============ HTTP HELPERS ============
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

function autenticar(usuario, senha) {
  if (estado.presidencia && estado.presidencia.usuario === usuario && estado.presidencia.senha === senha) {
    return { ok: true, papel: 'presidencia', dados: { nome: estado.presidencia.nome, cargo: estado.presidencia.cargo } };
  }
  const dir = estado.diretorias.find(d => d.usuario === usuario && d.senha === senha);
  if (dir) {
    return { ok: true, papel: 'diretoria', dados: { id: dir.id, nome: dir.nome, diretor: dir.diretor } };
  }
  const apoio = estado.orgaos_apoio.find(o => o.usuario === usuario && o.senha === senha);
  if (apoio) {
    return { ok: true, papel: 'apoio', dados: { id: apoio.id, nome: apoio.nome, responsavel: apoio.responsavel } };
  }
  return { ok: false };
}

function getToken(req) {
  const cookie = req.headers.cookie || '';
  const t = cookie.match(/token=([a-f0-9]+)/)?.[1];
  if (!t) return null;
  return [...TOKENS].find(x => x.token === t) || null;
}

function requirePresidencia(req) {
  const t = getToken(req);
  return t && t.papel === 'presidencia';
}

// ============ SERVIDOR HTTP ============
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = req.url.split('?')[0];

  if (req.headers.upgrade === 'websocket') return aceitarWS(req, req.socket);

  // ===== LOGIN =====
  if (url === '/api/login' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const r = autenticar(body.usuario, body.senha);
    if (r.ok) {
      const token = crypto.randomBytes(24).toString('hex');
      TOKENS.add({ token, papel: r.papel, dados: r.dados, ts: Date.now() });
      setTimeout(() => {
        for (const t of TOKENS) if (t.token === token) TOKENS.delete(t);
      }, 24 * 60 * 60 * 1000);
      return json(res, 200, { ok: true, token, papel: r.papel, dados: r.dados });
    }
    return json(res, 401, { ok: false, erro: 'Usuário ou senha inválidos' });
  }

  if (url === '/api/logout' && req.method === 'POST') {
    const body = await lerCorpo(req);
    for (const t of TOKENS) if (t.token === body.token) TOKENS.delete(t);
    return json(res, 200, { ok: true });
  }

  if (url === '/api/verificar' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const t = [...TOKENS].find(x => x.token === body.token);
    return json(res, 200, { ok: !!t, papel: t?.papel, dados: t?.dados });
  }

  // ===== LISTA PÚBLICA DE UNIDADES =====
  if (url === '/api/usfs') {
    const todas = [];
    estado.diretorias.forEach(d => {
      d.unidades.forEach(u => {
        todas.push({
          id: u.id,
          nome: u.nome,
          regiao: u.regiao || d.nome
        });
      });
    });
    return json(res, 200, { usfs: todas });
  }

  // ===== LISTA DE UNIDADES (por diretoria) =====
  if (url === '/api/unidades') {
    const t = getToken(req);
    if (!t) return json(res, 401, { ok: false });

    if (t.papel === 'presidencia' || t.papel === 'apoio') {
      const todas = [];
      estado.diretorias.forEach(d => {
        d.unidades.forEach(u => todas.push({ ...u, diretoria: d.nome, diretoria_id: d.id }));
      });
      return json(res, 200, { ok: true, unidades: todas });
    }
    if (t.papel === 'diretoria') {
      const d = estado.diretorias.find(x => x.id === t.dados.id);
      if (!d) return json(res, 404, { ok: false });
      return json(res, 200, { ok: true, unidades: d.unidades });
    }
    return json(res, 403, { ok: false });
  }

  // ===== ADMIN =====
  if (url === '/api/admin/estado' && req.method === 'GET') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    return json(res, 200, { ok: true, estado });
  }

  if (url === '/api/admin/diretoria' && req.method === 'POST') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    const body = await lerCorpo(req);
    const d = estado.diretorias.find(x => x.id === body.id);
    if (!d) return json(res, 404, { ok: false, erro: 'Diretoria não encontrada' });
    if (body.nome) d.nome = body.nome;
    if (body.diretor) d.diretor = body.diretor;
    if (body.usuario) d.usuario = body.usuario;
    if (body.senha) d.senha = body.senha;
    salvarDados();
    return json(res, 200, { ok: true, diretoria: d });
  }

  if (url === '/api/admin/unidade' && req.method === 'POST') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    const body = await lerCorpo(req);
    const d = estado.diretorias.find(x => x.id === body.diretoria_id);
    if (!d) return json(res, 404, { ok: false, erro: 'Diretoria não encontrada' });
    if (d.unidades.some(u => u.id === body.id)) {
      return json(res, 400, { ok: false, erro: 'ID já existe' });
    }
    d.unidades.push({
      id: body.id,
      nome: body.nome,
      regiao: body.regiao || d.nome
    });
    salvarDados();
    return json(res, 200, { ok: true, diretoria: d });
  }

  if (url === '/api/admin/unidade/remover' && req.method === 'POST') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    const body = await lerCorpo(req);
    const d = estado.diretorias.find(x => x.id === body.diretoria_id);
    if (!d) return json(res, 404, { ok: false });
    d.unidades = d.unidades.filter(u => u.id !== body.unidade_id);
    salvarDados();
    return json(res, 200, { ok: true, diretoria: d });
  }

  if (url === '/api/admin/apoio' && req.method === 'POST') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    const body = await lerCorpo(req);
    const o = estado.orgaos_apoio.find(x => x.id === body.id);
    if (!o) return json(res, 404, { ok: false });
    if (body.nome) o.nome = body.nome;
    if (body.responsavel) o.responsavel = body.responsavel;
    if (body.usuario) o.usuario = body.usuario;
    if (body.senha) o.senha = body.senha;
    salvarDados();
    return json(res, 200, { ok: true, orgao: o });
  }

  if (url === '/api/admin/presidencia' && req.method === 'POST') {
    if (!requirePresidencia(req)) return json(res, 403, { ok: false });
    const body = await lerCorpo(req);
    if (body.nome) estado.presidencia.nome = body.nome;
    if (body.usuario) estado.presidencia.usuario = body.usuario;
    if (body.senha) estado.presidencia.senha = body.senha;
    salvarDados();
    return json(res, 200, { ok: true, presidencia: estado.presidencia });
  }

  // ===== REGISTRO DE UNIDADE =====
  if (url === '/api/registrar' && req.method === 'POST') {
    const body = await lerCorpo(req);
    const id = body.ubs_id;
    const existente = ubsMap[id];

    const dir = encontrarDiretoriaDaUnidade(id);
    if (!dir) {
      return json(res, 404, { ok: false, erro: 'Unidade não cadastrada em nenhuma diretoria' });
    }

    const unidade = dir.unidades.find(u => u.id === id);

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
      nome: unidade.nome,
      regiao: unidade.regiao,
      diretoria_id: dir.id,
      diretoria_nome: dir.nome,
      online: true,
      ultimoHeartbeat: Date.now(),
      setores: setoresNovos,
      documentos: existente?.documentos || [],
      novosDados: existente?.novosDados || 0
    };
    salvarDados();
    broadcast({ type: 'ubs_registrada', ubs: ubsMap[id] });
    console.log(`✅ Unidade registrada: ${unidade.nome} (${id}) → ${dir.nome}`);
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
    return res.end(JSON.stringify({ estado, ubsMap }, null, 2));
  }

  // ===== PÁGINAS PROTEGIDAS =====
  if (url === '/presidencia' || url === '/diretoria' || url === '/apoio' || url === '/admin') {
    const t = getToken(req);
    if (!t) return htmlFile(res, 'login.html');

    if (url === '/presidencia' && t.papel !== 'presidencia') return htmlFile(res, 'login.html');
    if (url === '/diretoria' && t.papel !== 'diretoria') return htmlFile(res, 'login.html');
    if (url === '/apoio' && t.papel !== 'apoio') return htmlFile(res, 'login.html');
    if (url === '/admin' && t.papel !== 'presidencia') return htmlFile(res, 'login.html');

    if (url === '/presidencia') return htmlFile(res, 'presidencia.html');
    if (url === '/diretoria') return htmlFile(res, 'diretoria.html');
    if (url === '/apoio') return htmlFile(res, 'apoio.html');
    if (url === '/admin') return htmlFile(res, 'admin.html');
  }

  // ===== MATRIZ ANTIGA =====
  if (url === '/matriz') {
    return htmlFile(res, 'matriz.html');
  }

  // ===== PÁGINAS PÚBLICAS =====
  if (url === '/') return htmlFile(res, 'login.html');
  if (url === '/filial') return htmlFile(res, 'filial.html');

  // ===== PWA =====
  if (url === '/manifest.json') {
    return fs.readFile(path.join(__dirname, 'manifest.json'), (e, d) => {
      if (e) { res.writeHead(404); return res.end('não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
      res.end(d);
    });
  }
  if (url === '/sw.js') {
    return fs.readFile(path.join(__dirname, 'sw.js'), (e, d) => {
      if (e) { res.writeHead(404); return res.end('não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(d);
    });
  }
  if (url === '/favicon.ico') { res.writeHead(204); return res.end(); }

  res.writeHead(404); res.end('Rota não encontrada');
});

carregarDados();

server.listen(PORTA, '0.0.0.0', () => {
  const os = require('os');
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n🏛️ Servidor Fundação São Sebastião rodando!\n');
  console.log(`   Login:        http://localhost:${PORTA}/`);
  console.log(`   Matriz:       http://localhost:${PORTA}/matriz`);
  console.log(`   Presidência:  http://localhost:${PORTA}/presidencia`);
  console.log(`   Diretoria:    http://localhost:${PORTA}/diretoria`);
  console.log(`   Apoio:        http://localhost:${PORTA}/apoio`);
  console.log(`   Admin:        http://localhost:${PORTA}/admin`);
  console.log(`   Filial:       http://localhost:${PORTA}/filial`);
  ips.forEach(ip => {
    console.log(`   LAN:          http://${ip}:${PORTA}/`);
  });
  console.log(`\n📋 ${estado.diretorias.length} diretorias | ${estado.orgaos_apoio.length} órgãos de apoio`);
  console.log('   (deixe esta janela aberta)\n');
});

const URL_EXTERNA = process.env.RENDER_EXTERNAL_URL;
if (URL_EXTERNA) {
  setInterval(() => {
    https.get(URL_EXTERNA, (res) => {
      console.log(`[keep-alive] Ping: ${res.statusCode}`);
    }).on('error', () => {});
  }, 10 * 60 * 1000);
  console.log(`🔁 Keep-alive ativo`);
}
