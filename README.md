[matriz.html](https://github.com/user-attachments/files/33233682/matriz.html)
[servidor.js](https://github.com/user-attachments/files/33233651/servidor.js)
[package.json](https://github.com/user-attachments/files/33233596/package.json)
[servidor.js](https://github.com/user-attachments/files/33233630/servidor.js)[matriz.html](https://github.com/user-attachments/files/33233634/matriz.html)[filial.html](https://github.com/user-attachments/files/33233638/filial.html)<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Painel Filial UBS</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Matriz UBS</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
  h1 { font-size: 20px; color: #f1f5f9; }
  h2 { font-size: 13px; color: #94a3b8; font-weight: normal; margin-bottom: 16px; }
  .matriz { max-width: 1300px; margin: 0 auto; }
  .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 16px 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; }
  .status-servidor { font-size: 12px; padding: 4px 10px; border-radius: 6px; background: #334155; color: #94a3b8; }
  .status-servidor.ok { background: #14532d; color: #86efac; }
  .status-servidor.err { background: #7f1d1d; color: #fecaca; }
  .stats { display: flex; gap: 20px; font-size: 13px; align-items: center; }
  .stat-online { color: #22c55e; } .stat-offline { color: #ef4444; } .stat-novos { color: #3b82f6; }
  .toggle-som { background: #334155; border: none; color: #e2e8f0; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .toggle-som.ativo { background: #16a34a; color: white; }
  .aviso-banner { background: #7c2d12; border: 1px solid #ea580c; color: #fed7aa; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; display: none; align-items: center; gap: 10px; }
  .aviso-banner.ativo { display: flex; }
  .aviso-banner.urgente { background: #7f1d1d; border-color: #dc2626; color: #fecaca; animation: pulse-aviso 1.5s infinite; }
  @keyframes pulse-aviso { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .grid-ubs { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
  .ubs-card { background: #1e293b; border: 2px solid #334155; border-radius: 10px; padding: 12px 10px; cursor: pointer; transition: all 0.2s; text-align: center; position: relative; user-select: none; }
  .ubs-card:hover { transform: translateY(-2px); border-color: #475569; }
  .ubs-card.online { border-color: #16a34a; }
  .ubs-card.offline { border-color: #dc2626; opacity: 0.5; }
  .ubs-card.piscando { animation: piscar 1s infinite; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }
  @keyframes piscar { 0%, 100% { background: #1e293b; } 50% { background: #1e3a8a; } }
  .ubs-nome { font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #f1f5f9; }
  .ubs-status { font-size: 10px; display: flex; align-items: center; justify-content: center; gap: 4px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot.online { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
  .dot.offline { background: #ef4444; }
  .badge-novo { position: absolute; top: -6px; right: -6px; background: #3b82f6; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: bold; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 100; }
  .modal-overlay.ativo { display: flex; }
  .painel-ubs { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; width: 780px; max-width: 92vw; max-height: 88vh; overflow-y: auto; }
  .painel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #334155; }
  .painel-titulo { font-size: 18px; font-weight: bold; color: #f1f5f9; }
  .btn-fechar { background: #334155; border: none; color: #e2e8f0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .grid-setores { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .setor-card { background: #0f172a; border: 2px solid #334155; border-radius: 10px; padding: 16px; position: relative; }
  .setor-card.piscando { animation: piscar-setor 1s infinite; border-color: #3b82f6; }
  @keyframes piscar-setor { 0%, 100% { background: #0f172a; } 50% { background: #1e3a8a; } }
  .setor-nome { font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 8px; }
  .setor-dados { font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .setor-dados b { color: #cbd5e1; }
  .setor-timestamp { font-size: 10px; color: #64748b; margin-top: 8px; font-style: italic; }
  .badge-setor { position: absolute; top: 8px; right: 8px; background: #3b82f6; color: white; font-size: 9px; padding: 2px 6px; border-radius: 8px; font-weight: bold; }
  .historico-toggle { font-size: 10px; color: #3b82f6; cursor: pointer; margin-top: 8px; user-select: none; }
  .historico-lista { margin-top: 8px; border-top: 1px solid #1e293b; padding-top: 8px; max-height: 160px; overflow-y: auto; display: none; }
  .historico-lista.aberto { display: block; }
  .historico-item { font-size: 10px; color: #94a3b8; padding: 4px 0; border-bottom: 1px solid #1e293b; }
  .historico-item .ht { color: #64748b; }
  .historico-item .hd { color: #cbd5e1; }
  .barra-acoes { display: flex; gap: 8px; margin-bottom: 16px; }
  .btn-acao { background: #334155; border: none; color: #e2e8f0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .btn-acao.vermelho { background: #7f1d1d; } .btn-acao.laranja { background: #7c2d12; }
</style>
</head>
<body>
<div class="matriz">
  <div class="topbar">
    <div><h1>🏥 Matriz UBS</h1><h2>Monitoramento em tempo real</h2></div>
    <div class="stats">
      <span class="stat-online">🟢 <b id="stat-online">0</b> online</span>
      <span class="stat-offline">🔴 <b id="stat-offline">0</b> offline</span>
      <span class="stat-novos">🔵 <b id="stat-novos">0</b> novos</span>
      <button class="toggle-som" id="toggle-som" onclick="toggleSom()">🔇 Som OFF</button>
      <span class="status-servidor" id="status-servidor">⚪ Conectando...</span>
      <button class="toggle-som" onclick="sair()" style="background:#7f1d1d;">🚪 Sair</button>
    </div>
  </div>
  <div class="barra-acoes">
    <button class="btn-acao" onclick="enviarAviso('info')">📢 Aviso INFO</button>
    <button class="btn-acao laranja" onclick="enviarAviso('alerta')">⚠️ Aviso ALERTA</button>
    <button class="btn-acao vermelho" onclick="enviarAviso('urgente')">🚨 Aviso URGENTE</button>
  </div>
  <div class="aviso-banner" id="aviso-banner"><span>📢</span><span id="aviso-texto">—</span></div>
  <div class="grid-ubs" id="grid-ubs"></div>
</div>
<div class="modal-overlay" id="modal-ubs">
  <div class="painel-ubs">
    <div class="painel-header">
      <div><div class="painel-titulo" id="modal-titulo">UBS</div><div class="painel-status" id="modal-status">—</div></div>
      <button class="btn-fechar" onclick="fecharModal()">✕ Fechar</button>
    </div>
    <div class="grid-setores" id="grid-setores"></div>
  </div>
</div>
<script>
let ubsMap = {}, ubsSelecionada = null, ws = null;
let somLigado = false;
let audioCtx = null;

function tocarBip() {
  if (!somLigado) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

function toggleSom() {
  somLigado = !somLigado;
  const b = document.getElementById('toggle-som');
  b.textContent = somLigado ? '🔊 Som ON' : '🔇 Som OFF';
  b.className = 'toggle-som' + (somLigado ? ' ativo' : '');
  if (somLigado) tocarBip();
}

function sair() {
  // limpa cookie e storage
  document.cookie = 'token=; path=/; max-age=0';
  localStorage.removeItem('token_ubs');
  location.href = '/';
}

function conectarWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}`);
  ws.onopen = () => {
    setStatus('ok', '🟢 Servidor conectado');
    ws.send(JSON.stringify({ type: 'ola_matriz' }));
  };
  ws.onclose = () => { setStatus('err', '🔴 Desconectado'); setTimeout(conectarWS, 3000); };
  ws.onerror = () => setStatus('err', '🔴 Erro');
  ws.onmessage = (ev) => handleMsg(JSON.parse(ev.data));
}

function setStatus(t, txt) {
  const el = document.getElementById('status-servidor');
  el.className = 'status-servidor ' + t;
  el.textContent = txt;
}

function handleMsg(msg) {
  switch (msg.type) {
    case 'estado_inicial':
      msg.ubs.forEach(u => { ubsMap[u.id] = u; });
      renderGrid();
      break;
    case 'ubs_registrada':
      ubsMap[msg.ubs.id] = msg.ubs;
      renderGrid();
      break;
    case 'ubs_online':
      if (ubsMap[msg.ubs_id]) { ubsMap[msg.ubs_id].online = true; renderGrid(); }
      break;
    case 'ubs_offline':
      if (ubsMap[msg.ubs_id]) { ubsMap[msg.ubs_id].online = false; renderGrid(); }
      break;
    case 'novo_dado':
      if (ubsMap[msg.ubs_id]) {
        const ubs = ubsMap[msg.ubs_id];
        ubs.piscando = true;
        ubs.novosDados = (ubs.novosDados || 0) + 1;
        const setor = ubs.setores.find(s => s.id === msg.setor_id);
        if (setor) {
          setor.piscando = true;
          setor.dados = { ...setor.dados, ...msg.dados };
          setor.ultimaAtualizacao = new Date().toISOString();
          if (!setor.historico) setor.historico = [];
          setor.historico.unshift({ ts: setor.ultimaAtualizacao, dados: { ...setor.dados } });
          if (setor.historico.length > 50) setor.historico.length = 50;
        }
        renderGrid();
        if (ubsSelecionada === ubs.id) renderSetores(ubs);
        tocarBip();
      }
      break;
    case 'parar_piscar':
      if (ubsMap[msg.ubs_id]) {
        const ubs = ubsMap[msg.ubs_id];
        ubs.piscando = false;
        const setor = ubs.setores.find(s => s.id === msg.setor_id);
        if (setor) setor.piscando = false;
        renderGrid();
        if (ubsSelecionada === ubs.id) renderSetores(ubs);
      }
      break;
    case 'aviso':
    case 'aviso_enviado':
      mostrarAviso(msg.aviso);
      tocarBip();
      break;
  }
}

function renderGrid() {
  const grid = document.getElementById('grid-ubs');
  const lista = Object.values(ubsMap).sort((a, b) => a.nome.localeCompare(b.nome));
  if (lista.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">Nenhuma UBS conectada ainda.</div>';
    atualizaStats();
    return;
  }
  grid.innerHTML = '';
  lista.forEach(ubs => {
    const card = document.createElement('div');
    card.className = `ubs-card ${ubs.online ? 'online' : 'offline'} ${ubs.piscando ? 'piscando' : ''}`;
    card.onclick = () => abrirModal(ubs.id);
    card.innerHTML = `
      <div class="ubs-nome">${ubs.nome}</div>
      <div class="ubs-status"><span class="dot ${ubs.online ? 'online' : 'offline'}"></span><span>${ubs.online ? 'Online' : 'Offline'}</span></div>
      ${ubs.novosDados > 0 ? `<div class="badge-novo">${ubs.novosDados}</div>` : ''}`;
    grid.appendChild(card);
  });
  atualizaStats();
}

function atualizaStats() {
  const lista = Object.values(ubsMap);
  document.getElementById('stat-online').textContent = lista.filter(u => u.online).length;
  document.getElementById('stat-offline').textContent = lista.length - lista.filter(u => u.online).length;
  document.getElementById('stat-novos').textContent = lista.reduce((a, u) => a + (u.novosDados || 0), 0);
}

function abrirModal(ubsId) {
  const ubs = ubsMap[ubsId];
  if (!ubs) return;
  ubsSelecionada = ubsId;
  ubs.novosDados = 0;
  ubs.piscando = false;
  document.getElementById('modal-titulo').textContent = ubs.nome;
  document.getElementById('modal-status').innerHTML = `<span class="dot ${ubs.online ? 'online' : 'offline'}"></span> ${ubs.online ? 'Online' : 'Offline'}`;
  renderSetores(ubs);
  document.getElementById('modal-ubs').classList.add('ativo');
  renderGrid();
}

function renderSetores(ubs) {
  const grid = document.getElementById('grid-setores');
  grid.innerHTML = '';
  if (!ubs.setores || ubs.setores.length === 0) {
    grid.innerHTML = '<div style="color:#64748b;padding:20px;">Nenhum setor.</div>';
    return;
  }
  ubs.setores.forEach(setor => {
    const card = document.createElement('div');
    card.className = `setor-card ${setor.piscando ? 'piscando' : ''}`;
    const dados = Object.entries(setor.dados || {})
      .map(([k, v]) => `<div>${k}: <b>${v || '—'}</b></div>`).join('') || '<div style="color:#64748b;">Sem dados</div>';
    const ts = setor.ultimaAtualizacao ? new Date(setor.ultimaAtualizacao).toLocaleTimeString('pt-BR') : '—';

    const hist = (setor.historico || []).slice(0, 10).map(h => `
      <div class="historico-item">
        <span class="ht">${new Date(h.ts).toLocaleString('pt-BR')}</span> —
        <span class="hd">${Object.entries(h.dados).map(([k,v]) => `${k}: ${v || '—'}`).join(' | ')}</span>
      </div>`).join('') || '<div style="color:#64748b;font-size:10px;">Sem histórico.</div>';

    card.innerHTML = `
      ${setor.piscando ? '<div class="badge-setor">NOVO</div>' : ''}
      <div class="setor-nome">📋 ${setor.nome}</div>
      <div class="setor-dados">${dados}</div>
      <div class="setor-timestamp">Atualizado: ${ts}</div>
      <div class="historico-toggle" onclick="toggleHistorico(this)">▸ Ver histórico (${(setor.historico||[]).length})</div>
      <div class="historico-lista">${hist}</div>`;
    grid.appendChild(card);
  });
}

function toggleHistorico(el) {
  const lista = el.nextElementSibling;
  lista.classList.toggle('aberto');
  el.textContent = lista.classList.contains('aberto')
    ? '▾ Ocultar histórico'
    : `▸ Ver histórico (${lista.children.length})`;
}

function fecharModal() {
  document.getElementById('modal-ubs').classList.remove('ativo');
  ubsSelecionada = null;
}

function enviarAviso(p) {
  const textos = {
    info:    { titulo: 'Campanha de vacinação', mensagem: 'Campanha de vacinação inicia', prioridade: 'info' },
    alerta:  { titulo: 'Estoque baixo',         mensagem: 'Estoque baixo em 5 UBSs', prioridade: 'alerta' },
    urgente: { titulo: 'Surtos suspeitos',      mensagem: 'Surtos suspeitos - notificar em 2h', prioridade: 'urgente' }
  };
  const aviso = textos[p];
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'aviso', aviso }));
  } else {
    console.warn('WebSocket não conectado — aviso não enviado');
  }
}

function mostrarAviso(aviso) {
  const b = document.getElementById('aviso-banner');
  const t = document.getElementById('aviso-texto');
  t.textContent = `[${aviso.prioridade.toUpperCase()}] ${aviso.mensagem}`;
  b.className = 'aviso-banner ativo' + (aviso.prioridade === 'urgente' ? ' urgente' : '');
  if (aviso.prioridade !== 'urgente') setTimeout(() => b.classList.remove('ativo'), 12000);
}

conectarWS();
</script>
</body>
</html>e8f0; padding: 20px; min-height: 100vh; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Porta dinâmica (Render fornece PORT). Local usa 3000.
const PORTA = process.env.PORT || 3000;
const ARQUIVO_DADOS = path.join(__dirname, 'dados.json');
const MAX_HISTORICO = 50; // por setor
const SENHA_MATRIZ = 'ubs2026'; // ← troque pela sua senha
const TOKENS = new Set(); // tokens válidos em memória

let ubsMap = {};
const clientesWS = new Set();

// ---------- Persistência ----------
function carregarDados() {
  try {
    if (fs.existsSync(ARQUIVO_DADOS)) {
      const raw = fs.readFileSync(ARQUIVO_DADOS, 'utf8');
      ubsMap = JSON.parse(raw);
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

// ---------- WebSocket manual (sem libs) ----------
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
    salvarDados();
    broadcast({ type: 'novo_dado', ubs_id: msg.ubs_id, setor_id: msg.setor_id, dados: msg.dados });
    enviarWS(cliente, { type: 'parar_piscar', ubs_id: msg.ubs_id, setor_id: msg.setor_id });
    return;
  }

  if (msg.type === 'heartbeat' && msg.ubs_id) {
    const ubs = ubsMap[msg.ubs_id];
    if (ubs && !ubs.online) {
      ubs.online = true;
      broadcast({ type: 'ubs_online', ubs_id: ubs.id });
      salvarDados();
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

  // WebSocket upgrade
  if (req.headers.upgrade === 'websocket') return aceitarWS(req, req.socket);

  // ---------- Autenticação ----------
  if (url === '/api/login' && req.method === 'POST') {
    const body = await lerCorpo(req);
    if (body.senha === SENHA_MATRIZ) {
      const token = crypto.randomBytes(24).toString('hex');
      TOKENS.add(token);
      // expira em 24h
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
  // /matriz exige login
  if (url === '/matriz') {
    const cookie = req.headers.cookie || '';
    const token = cookie.match(/token=([a-f0-9]+)/)?.[1];
    if (!token || !TOKENS.has(token)) {
      return htmlFile(res, 'login.html');
    }
    return htmlFile(res, 'matriz.html');
  }

  // raiz cai no login
  if (url === '/') return htmlFile(res, 'login.html');

  // filial aberta
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

// ---------- Keep-alive para o Render (evita hibernar) ----------
// O Render define RENDER_EXTERNAL_URL automaticamente.
// A cada 10 minutos o servidor faz um GET em si mesmo para manter o serviço acordado.
const URL_EXTERNA = process.env.RENDER_EXTERNAL_URL;
if (URL_EXTERNA) {
  setInterval(() => {
    https.get(URL_EXTERNA, (res) => {
      console.log(`[keep-alive] Ping enviado. Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[keep-alive] Erro no ping:', err.message);
    });
  }, 10 * 60 * 1000); // 10 minutos
  console.log(`🔁 Keep-alive ativo para: ${URL_EXTERNA}`);
}
  h2 { font-size: 13px; color: #94a3b8; font-weight: normal; margin-bottom: 20px; }
  .status-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #1e293b; border-radius: 10px; border: 1px solid #334155; margin-bottom: 16px; font-size: 13px; }
  .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
  .status-dot.online { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
  .status-dot.offline { background: #ef4444; }
  .config { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .config label { font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px; }
  .config input { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 13px; width: 100%; margin-bottom: 12px; }
  .btn { background: #3b82f6; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn.verde { background: #16a34a; }
  .grid-setores { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px; }
  .setor-card { background: #1e293b; border: 2px solid #334155; border-radius: 10px; padding: 16px; }
  .setor-nome { font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 10px; }
  .campo { margin-bottom: 8px; }
  .campo label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .campo input { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 6px 10px; border-radius: 6px; font-size: 12px; width: 100%; }
  .campo input:focus { outline: none; border-color: #3b82f6; }
  .btn-setor { background: #2563eb; border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 8px; font-weight: 600; }
  .btn-setor:hover { background: #1d4ed8; }
  .log { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; max-height: 200px; overflow-y: auto; color: #94a3b8; margin-top: 20px; }
  .log-entry { padding: 3px 0; border-bottom: 1px solid #1e293b; }
  .log-entry.ok { color: #22c55e; } .log-entry.err { color: #ef4444; } .log-entry.info { color: #3b82f6; }
  .aviso { background: #7f1d1d; border: 1px solid #dc2626; color: #fecaca; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: none; font-size: 13px; }
  .aviso.ativo { display: block; }
</style>
</head>
<body>
<div class="container">
  <h1>🏥 Painel da Filial UBS</h1>
  <h2>Envie atualizações dos setores para a Matriz</h2>

  <div class="aviso" id="aviso-box"><b>📢 AVISO DA MATRIZ:</b> <span id="aviso-texto"></span></div>

  <div class="status-bar">
    <div><span class="status-dot offline" id="status-dot"></span><span id="status-texto">Desconectado</span></div>
    <div>UBS: <b id="ubs-nome">—</b></div>
  </div>

  <div class="config" id="config-box">
    <label>ID da UBS</label>
    <input type="text" id="input-id" value="ubs-01">
    <label>Nome da UBS</label>
    <input type="text" id="input-nome" value="UBS Centro">
    <label>Servidor (Matriz) — deixe vazio se aberto pelo mesmo servidor</label>
    <input type="text" id="input-servidor" placeholder="(vazio = mesma origem)">
    <button class="btn verde" onclick="registrar()">✅ Registrar e Conectar</button>
  </div>

  <div class="grid-setores" id="grid-setores" style="display:none;"></div>
  <div class="log" id="log"></div>
</div>

<script>
let ubsId = null;
let ubsNome = null;
let servidor = null;
let online = false;
let ws = null;
let hb = null;

// Campos por setor — todos texto livre
const SETORES = [
  { id: 'recepcao',      nome: 'Recepção',      campos: ['atendimentos', 'fila'] },
  { id: 'enfermagem',    nome: 'Enfermagem',    campos: ['procedimentos', 'leitos'] },
  { id: 'farmacia',      nome: 'Farmácia',      campos: ['estoque', 'dispensacoes'] },
  { id: 'administracao', nome: 'Administração', campos: ['processos', 'oficios'] }
];

function log(msg, tipo = 'info') {
  const d = document.getElementById('log');
  const e = document.createElement('div');
  e.className = `log-entry ${tipo}`;
  e.textContent = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  d.appendChild(e);
  d.scrollTop = d.scrollHeight;
}

async function registrar() {
  ubsId   = document.getElementById('input-id').value.trim();
  ubsNome = document.getElementById('input-nome').value.trim();
  const campo = document.getElementById('input-servidor').value.trim().replace(/\/$/, '');
  servidor = campo || location.origin;

  if (!ubsId || !ubsNome) return log('❌ Preencha ID e Nome', 'err');

  // monta setores vazios só pra registro inicial
  const setoresIniciais = SETORES.map(s => ({
    id: s.id,
    nome: s.nome,
    dados: Object.fromEntries(s.campos.map(c => [c, '']))
  }));

  try {
    const res = await fetch(`${servidor}/api/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubs_id: ubsId, nome: ubsNome, setores: setoresIniciais })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    online = true;
    document.getElementById('ubs-nome').textContent = ubsNome;
    document.getElementById('status-dot').className = 'status-dot online';
    document.getElementById('status-texto').textContent = 'Online';
    document.getElementById('config-box').style.display = 'none';
    document.getElementById('grid-setores').style.display = 'grid';
    log(`✅ Registrada como ${ubsNome}`, 'ok');

    renderSetores();
    conectarWS();
    iniciarHeartbeat();
  } catch (e) {
    log(`❌ Falha: ${e.message}`, 'err');
  }
}

function renderSetores() {
  const g = document.getElementById('grid-setores');
  g.innerHTML = '';
  SETORES.forEach(s => {
    const c = document.createElement('div');
    c.className = 'setor-card';
    const camposHTML = s.campos.map(campo => `
      <div class="campo">
        <label>${campo}</label>
        <input type="text" id="input-${s.id}-${campo}" placeholder="digite livremente...">
      </div>`).join('');
    c.innerHTML = `
      <div class="setor-nome">📋 ${s.nome}</div>
      ${camposHTML}
      <button class="btn-setor" onclick="enviarDados('${s.id}')">📤 Enviar atualização</button>`;
    g.appendChild(c);
  });
}

function enviarDados(setorId) {
  if (!online) return log('❌ Não conectada ao servidor', 'err');
  const setor = SETORES.find(s => s.id === setorId);
  if (!setor) return;

  const dados = {};
  setor.campos.forEach(campo => {
    const el = document.getElementById(`input-${setorId}-${campo}`);
    dados[campo] = el ? el.value.trim() : '';
  });

  const payload = { type: 'dados_setor', ubs_id: ubsId, setor_id: setorId, dados };

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    log(`📤 Enviado ${setor.nome}: ${JSON.stringify(dados)}`, 'ok');
  } else {
    log('❌ WebSocket desconectado', 'err');
  }
}

function conectarWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}`);

  ws.onopen = () => {
    log('🔌 WebSocket conectado', 'ok');
    ws.send(JSON.stringify({ type: 'ola_filial', ubs_id: ubsId }));
  };
  ws.onclose = () => {
    log('🔌 WebSocket fechado, reconectando em 3s...', 'err');
    setTimeout(conectarWS, 3000);
  };
  ws.onerror = () => log('⚠️ Erro no WebSocket', 'err');
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data);
      if (m.type === 'aviso') {
        document.getElementById('aviso-box').classList.add('ativo');
        document.getElementById('aviso-texto').textContent =
          `[${m.aviso.prioridade.toUpperCase()}] ${m.aviso.mensagem}`;
        log(`📢 Aviso: ${m.aviso.mensagem}`, 'info');
      }
    } catch (e) {}
  };
}

function iniciarHeartbeat() {
  clearInterval(hb);
  hb = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', ubs_id: ubsId }));
    }
  }, 5000);
}
</script>
</body>
</html>
