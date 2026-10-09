[package.json](https://github.com/user-attachments/files/33233596/package.json)
[servidor.js](https://github.com/user-attachments/files/33233630/servidor.js)[matriz.html](https://github.com/user-attachments/files/33233634/matriz.html)[filial.html](https://github.com/user-attachments/files/33233638/filial.html)<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Painel Filial UBS</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; min-height: 100vh; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
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
