/* ===== Registro de erros e diagnóstico do aparelho ===== */
function erroTexto(e) {
  if (!e) return 'erro desconhecido';
  if (typeof e === 'string') return e;
  const n = e.name && e.name !== 'Error' ? e.name + ': ' : '';
  return (n + (e.message || String(e))).slice(0, 300);
}
function registrarErro(onde, e) {
  try { const l = Store.get('erros', []); l.push({ t: Date.now(), onde, erro: erroTexto(e) }); Store.set('erros', l.slice(-40)); } catch {}
}
window.addEventListener('error', ev => registrarErro('pagina', ev.error || ev.message));
window.addEventListener('unhandledrejection', ev => registrarErro('promessa', ev.reason));
function comTempo(promessa, ms, msg) {
  let t; return Promise.race([promessa, new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error(msg || 'demorou demais'), { name: 'Tempo' })), ms); })]).finally(() => clearTimeout(t));
}
function explicarErroMidia(e, oque) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return `O iPhone bloqueou a ${oque} para este app. Feche o app (arraste para cima na lista de apps abertos), abra de novo pelo ícone e toque em Permitir quando o iPhone perguntar. Se não perguntar: Ajustes → Apps → Safari → ${oque === 'câmera' ? 'Câmera' : 'Microfone'} → Perguntar.`;
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return `Não encontrei a ${oque} do aparelho.`;
  if (n === 'NotReadableError' || n === 'AbortError') return `A ${oque} está sendo usada por outro app. Feche a câmera, o FaceTime ou o WhatsApp e tente de novo.`;
  if (n === 'SemSuporte') return `Este jeito de abrir o app não permite usar a ${oque}. Abra pelo ícone na tela de início ou pelo Safari (não pelo WhatsApp).`;
  return `Não consegui usar a ${oque}.`;
}
function infoAparelho() {
  const ua = navigator.userAgent; const ios = (ua.match(/OS (\d+)_(\d+)/) || []).slice(1).join('.');
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const appInterno = /FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(ua) || (/iPhone/.test(ua) && !/Safari/.test(ua) && !standalone);
  return { ios: ios || '?', standalone, appInterno, ua };
}

const DIAG = { linhas: [] };
function diagLinha(ok, t, d) { DIAG.linhas.push({ ok, t, d }); const el = $('#diag-lista'); if (el) el.insertAdjacentHTML('beforeend', `<div class="check ${ok === true ? 'done' : ''}" style="cursor:default"><div class="box" style="${ok === false ? 'border-color:var(--red);color:var(--red)' : ''}">${ok === true ? '✓' : ok === false ? '✕' : '·'}</div><div class="label"><b>${esc(t)}</b><div class="muted small">${esc(d || '')}</div></div></div>`); }
async function testarMidia(nome, constraints) {
  try {
    const s = await comTempo(navigator.mediaDevices.getUserMedia(constraints), 20000, 'sem resposta');
    const tr = s.getTracks().map(t => t.kind + (t.label ? ' (' + t.label.slice(0, 30) + ')' : '')).join(', ');
    s.getTracks().forEach(t => t.stop()); diagLinha(true, nome, tr || 'ok'); return true;
  } catch (e) { diagLinha(false, nome, erroTexto(e)); return false; }
}
async function rodarDiagnostico(btn) {
  sessaoAudio('play-and-record');
  btn.disabled = true; btn.textContent = 'Testando… aceite os pedidos do iPhone';
  DIAG.linhas = []; $('#diag-lista').innerHTML = '';
  const a = infoAparelho();
  diagLinha(null, `iOS ${a.ios} · ${a.standalone ? 'aberto pelo ícone (app)' : 'aberto no navegador'}`, a.appInterno ? 'Parece estar dentro de outro app (WhatsApp/Instagram). Abra no Safari.' : navigator.userAgent.slice(0, 120));
  diagLinha(navigator.onLine, 'Internet', navigator.onLine ? 'conectado' : 'sem internet');
  diagLinha(!!(navigator.serviceWorker && navigator.serviceWorker.controller), 'Modo sem internet ativo', navigator.serviceWorker && navigator.serviceWorker.controller ? 'ok' : 'abra o app mais uma vez com internet');
  // GPS
  await new Promise(r => { if (!navigator.geolocation) { diagLinha(false, 'GPS', 'sem suporte'); return r(); }
    navigator.geolocation.getCurrentPosition(p => { Pos.guardar(p); diagLinha(true, 'GPS', `±${Math.round(p.coords.accuracy)} m`); r(); }, e => { diagLinha(false, 'GPS', `código ${e.code}: ${e.message}`); r(); }, { enableHighAccuracy: true, timeout: 15000 }); });
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    await testarMidia('Câmera da frente (selfie do SOS)', { video: { facingMode: 'user' } });
    await testarMidia('Câmera de trás (tradutor ao vivo)', { video: { facingMode: { ideal: 'environment' } } });
    const mic = await testarMidia('Microfone (áudio do SOS)', { audio: true });
    if (mic) diagLinha(!!window.MediaRecorder, 'Gravação de áudio', window.MediaRecorder ? ['audio/mp4', 'audio/webm'].filter(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)).join(', ') || 'formato padrão' : 'sem suporte');
  } else diagLinha(false, 'Câmera e microfone', 'este navegador não permite (abra no Safari ou pelo ícone)');
  // Leitura de texto
  diagLinha(typeof WebAssembly === 'object', 'WebAssembly', typeof WebAssembly === 'object' ? 'ok' : 'desligado (Modo de Isolamento?)');
  try {
    const t0 = Date.now(); const w = await ocrWorker(m => { const el = $('#diag-ocr'); if (el) el.textContent = m.status + (m.progress ? ' ' + Math.round(m.progress * 100) + '%' : ''); });
    const c = document.createElement('canvas'); c.width = 700; c.height = 220; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 700, 220); x.fillStyle = '#000'; x.font = 'bold 80px Arial'; x.fillText('EXIT 123', 40, 140);
    const { data } = await comTempo(w.recognize(c), 90000, 'leitura demorou demais');
    diagLinha(/EXIT/i.test(data.text), 'Leitura de texto', `leu "${(data.text || '').trim()}" em ${Math.round((Date.now() - t0) / 1000)} s · idiomas ${OCR_LANGS.join('+')}`);
  } catch (e) { diagLinha(false, 'Leitura de texto', erroTexto(e)); }
  // Compartilhar arquivos
  try { const f = new File([new Blob(['x'], { type: 'image/jpeg' })], 't.jpg', { type: 'image/jpeg' }); diagLinha(!!(navigator.canShare && navigator.canShare({ files: [f] })), 'Enviar arquivos (selfie/áudio)', navigator.canShare ? 'ok' : 'sem suporte'); } catch (e) { diagLinha(false, 'Enviar arquivos', erroTexto(e)); }
  try { const est = await navigator.storage.estimate(); diagLinha(true, 'Espaço do app', `${Math.round(est.usage / 1048576)} MB usados de ${Math.round(est.quota / 1048576)} MB`); } catch {}
  sessaoAudio('auto');
  btn.disabled = false; btn.textContent = '🔁 Testar de novo';
  $('#diag-enviar').hidden = false;
}
function relatorioDiag() {
  const a = infoAparelho(); const erros = Store.get('erros', []).slice(-12);
  return ['Diagnóstico do app Eu falei Faraó', new Date().toLocaleString('pt-BR'), `iOS ${a.ios} · ${a.standalone ? 'ícone' : 'navegador'}`, a.ua, '',
    ...DIAG.linhas.map(l => `${l.ok === true ? 'OK' : l.ok === false ? 'FALHOU' : '--'} ${l.t}: ${l.d}`), '', 'Últimos erros:',
    ...(erros.length ? erros.map(e => `${new Date(e.t).toLocaleString('pt-BR')} [${e.onde}] ${e.erro}`) : ['nenhum'])].join('\n');
}
Views.diagnostico = () => {
  const erros = Store.get('erros', []).slice(-8).reverse();
  const html = `<div class="card nile small">Este teste verifica câmera, microfone, GPS e leitura de texto neste iPhone. O iPhone vai pedir permissão: toque em <b>Permitir</b>. No fim, mande o relatório para o ${esc(Cfg.get().familiaNome)}.</div>
    <button class="btn" onclick="rodarDiagnostico(this)">▶️ Iniciar diagnóstico</button>
    <div class="card" id="diag-lista"></div><p class="muted small" id="diag-ocr"></p>
    <button class="btn green" id="diag-enviar" hidden onclick="window.location.href = waLink(Cfg.get().familiaTel, relatorioDiag())">💬 Enviar relatório pelo WhatsApp</button>
    <h2>Últimos erros</h2><div class="card small">${erros.length ? erros.map(e => `<div class="kv"><span>${new Date(e.t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${esc(e.onde)}</span><b style="max-width:60%">${esc(e.erro)}</b></div>`).join('') : 'Nenhum erro registrado.'}</div>`;
  return { title: 'Diagnóstico', html, nav: 'mais' };
};
