/* ===== SOS: selfie automática, áudio de 30 s, localização e envio ao Rodrigo ===== */
const SOS = { ativo: false };
const SOS_SEGUNDOS = 30;

function sosMensagem() {
  const cfg = Cfg.get(); const p = SOS.pos || Pos.ultima();
  const eg = partsIn(TZ); const iso = hojeISO(); const dia = diaPorData(iso);
  const hotel = dia && dia.hotel ? HOTEIS[dia.hotel] : null;
  const linhas = [`🆘 SOS! ${cfg.nome || 'Mãe'} precisa de ajuda.`, `Hora no Egito: ${eg.hm} (${fmtDataCurta(eg.iso)})`];
  if (p) {
    const l = descreverLocal(p.lat, p.lon);
    const idade = Math.round((Date.now() - p.t) / 60000);
    linhas.push(`Local: ${l ? l.nome : ''}${idade > 2 ? ` (posição de ${idade} min atrás)` : ''}`);
    linhas.push(`Mapa: ${mapsLink(p.lat, p.lon)}`);
    linhas.push(`Coordenadas: ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)} (±${p.acc} m)`);
  } else linhas.push('Localização ainda não disponível.');
  if (dia) linhas.push(`Roteiro: Dia ${dia.n}, ${dia.titulo} (${dia.cidade})`);
  if (hotel) linhas.push(`Hotel: ${hotel.nome}${hotel.tel ? ' ' + hotel.tel : ''}`);
  linhas.push('Localização ao vivo: app Buscar.');
  linhas.push('Agência Corsini 24h: +20 114 414 1314');
  return linhas.join('\n');
}

function sosUI(campo, html) { const el = document.getElementById('sos-' + campo); if (el) el.innerHTML = html; }

async function iniciarSOS() {
  if (SOS.ativo) return;
  const cfg = Cfg.get();
  Object.assign(SOS, { ativo: true, id: 'sos' + Date.now(), selfie: null, audio: null, audioTipo: '', video: null, pos: null, stream: null, streamAudio: null, rec: null, autoEnviado: false, envios: {}, fila: [], links: {}, ultimoEnvioPos: null });
  const o = document.createElement('div'); o.className = 'overlay sos-tela'; o.id = 'sos-overlay';
  o.innerHTML = `<h1 style="color:var(--red);margin:4px 0 2px">🆘 SOS ativado</h1>
    <p class="small" style="margin:0 0 10px">Fique calma. O app está gravando e localizando. Use os botões abaixo para avisar o ${esc(cfg.familiaNome)}.</p>
    <div class="row" style="align-items:flex-start;gap:12px">
      <video id="sos-video" playsinline muted autoplay style="flex:0 0 96px;width:96px;height:128px;object-fit:cover;border-radius:12px;background:#000"></video>
      <ul class="clean small" style="flex:1">
        <li id="sos-local">📍 Buscando localização…</li>
        <li id="sos-foto">📸 Abrindo a câmera…</li>
        <li id="sos-audio">🎙️ Preparando gravação…</li>
        <li id="sos-auto">${cfg.ntfy || cfg.callmebot ? '🔔 Aviso automático: aguardando localização…' : '🔔 Aviso automático: não configurado'}</li>
      </ul>
    </div>
    <a class="btn green" id="sos-wa" href="#" onclick="return sosWhatsApp()">💬 1. WhatsApp para ${esc(cfg.familiaNome)} (localização)</a>
    <a class="btn red" id="sos-sms" href="#" onclick="return sosSMS()">✉️ 2. SMS para ${esc(cfg.familiaNome)} (funciona sem internet)</a>
    <button class="btn nile" id="sos-share" onclick="sosCompartilhar()" disabled>📤 3. Enviar selfie e áudio</button>
    <div class="row"><a class="btn secondary" href="${telLink(cfg.familiaTel)}">📞 Ligar ${esc(cfg.familiaNome)}</a><a class="btn secondary" href="tel:123">🚑 123</a></div>
    <div id="sos-planob"></div>
    <p class="muted small">${esc(cfg.familiaNome)} também vê você ao vivo no app <b>Buscar</b>.</p>
    <button class="btn outline" id="sos-parar" onclick="sosPararAudio()">⏹ Parar gravação agora</button>
    <button class="btn outline" onclick="encerrarSOS()">Fechar SOS</button>`;
  document.body.appendChild(o);
  sosPlanoB();

  // 1) Localização
  Pos.agora(12000).then(p => { if (p) { SOS.pos = p; sosLocalUI(); sosAutomatico(); } else sosUI('local', '📍 Sem GPS. Ative a Localização em Ajustes.'); salvarSOS(); });
  if (navigator.geolocation) SOS.watch = navigator.geolocation.watchPosition(p => { SOS.pos = Pos.guardar(p); sosLocalUI(); }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
  setTimeout(() => { if (!SOS.autoEnviado && SOS.ativo) sosAutomatico(); }, 12000);
  sosAcompanhar();

  // 2) Selfie e 3) Áudio: câmera e microfone pedidos separadamente
  sosMidia();
}

async function sosMidia() {
  sessaoAudio('play-and-record');
  const temGUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  let video = null, audio = null, erroV = null, erroA = null;
  if (temGUM) {
    try { video = await comTempo(navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }), 15000, 'a câmera não respondeu'); } catch (e) { erroV = e; registrarErro('sos-camera', e); }
    if (!SOS.ativo) { if (video) video.getTracks().forEach(t => t.stop()); return; }
    if (video) {
      SOS.stream = video;
      try {
        const v = document.getElementById('sos-video'); v.srcObject = video; await v.play().catch(() => {});
        await new Promise(r => { if (v.videoWidth) r(); else { v.onloadedmetadata = r; setTimeout(r, 3000); } });
        await new Promise(r => setTimeout(r, 900));
        const c = document.createElement('canvas'); c.width = v.videoWidth || 720; c.height = v.videoHeight || 960;
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        SOS.selfie = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
        sosUI('foto', '📸 Selfie tirada ✓'); sosHabilitarEnvio(); salvarSOS(); sosEnviar('selfie');
      } catch (e) { registrarErro('sos-selfie', e); sosUI('foto', '📸 Não consegui tirar a selfie.'); }
      video.getTracks().forEach(t => t.stop());
    }
    try { audio = await comTempo(navigator.mediaDevices.getUserMedia({ audio: true }), 15000, 'o microfone não respondeu'); } catch (e) { erroA = e; registrarErro('sos-microfone', e); }
    if (!SOS.ativo) { if (audio) audio.getTracks().forEach(t => t.stop()); return; }
    if (audio) { SOS.streamAudio = audio; sosGravarAudio(audio); }
  } else { erroV = erroA = Object.assign(new Error('getUserMedia indisponível'), { name: 'SemSuporte' }); registrarErro('sos-midia', erroV); }
  if (!video) sosUI('foto', `📸 ${esc(explicarErroMidia(erroV, 'câmera'))}`);
  if (!audio) sosUI('audio', `🎙️ ${esc(explicarErroMidia(erroA, 'microfone'))}`);
  if (!video || !audio) sosPlanoB();
}

// Plano B: câmera nativa do iPhone (não depende da permissão do navegador)
function sosPlanoB() {
  const el = document.getElementById('sos-planob'); if (!el || el.innerHTML) return;
  el.innerHTML = `<p class="small" style="margin:10px 0 2px"><b>Se a selfie ou o áudio não aparecerem acima</b>, use a câmera do iPhone: grave um vídeo curto mostrando o rosto e falando o que aconteceu.</p>
    <label class="btn red"><input type="file" accept="video/*" capture="user" hidden onchange="sosArquivo(this, 'video')">🎥 Gravar vídeo com a câmera do iPhone</label>
    <label class="btn secondary"><input type="file" accept="image/*" capture="user" hidden onchange="sosArquivo(this, 'selfie')">🤳 Só tirar uma selfie</label>`;
}
function sosArquivo(input, tipo) {
  const f = input.files && input.files[0]; if (!f) return;
  if (tipo === 'video') { SOS.video = f; sosUI('audio', `🎥 Vídeo gravado (${Math.round(f.size / 1048576 * 10) / 10} MB) ✓`); SOS.envios && delete SOS.envios.video; sosEnviar('video'); }
  else { SOS.selfie = f; sosUI('foto', '📸 Selfie tirada ✓'); SOS.envios && delete SOS.envios.selfie; sosEnviar('selfie'); }
  sosHabilitarEnvio(); salvarSOS();
}
function sosHabilitarEnvio() { const b = document.getElementById('sos-share'); if (b) b.disabled = false; }

function sosLocalUI() {
  const p = SOS.pos; if (!p) return; const l = descreverLocal(p.lat, p.lon);
  sosUI('local', `📍 ${esc(l ? l.nome : '')} <span class="muted">(±${p.acc} m)</span> ✓`);
}

function sosGravarAudio(audioStream) {
  if (!window.MediaRecorder || !audioStream.getAudioTracks().length) { sosUI('audio', '🎙️ Gravação de áudio indisponível neste aparelho.'); return; }
  const tipos = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  const tipo = tipos.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  let rec; try { rec = new MediaRecorder(audioStream, tipo ? { mimeType: tipo } : undefined); } catch (e) { registrarErro('sos-gravador', e); try { rec = new MediaRecorder(audioStream); } catch (e2) { sosUI('audio', '🎙️ Não consegui gravar o áudio.'); sosPlanoB(); return; } }
  const partes = []; SOS.rec = rec; SOS.audioTipo = rec.mimeType || tipo || 'audio/mp4';
  rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
  rec.onstop = () => {
    clearInterval(SOS.timer); audioStream.getTracks().forEach(t => t.stop());
    SOS.audio = new Blob(partes, { type: SOS.audioTipo });
    sosUI('audio', `🎙️ Áudio gravado (${Math.round(SOS.audio.size / 1024)} KB) ✓`);
    const b = document.getElementById('sos-parar'); if (b) b.hidden = true;
    sosHabilitarEnvio(); salvarSOS(); sosEnviar('audio');
  };
  rec.start(1000);
  let resta = SOS_SEGUNDOS;
  sosUI('audio', `🎙️ Gravando áudio… ${resta} s`);
  SOS.timer = setInterval(() => { resta--; sosUI('audio', `🎙️ Gravando áudio… ${resta} s`); if (resta <= 0 && rec.state === 'recording') rec.stop(); }, 1000);
}
function sosPararAudio() { if (SOS.rec && SOS.rec.state === 'recording') SOS.rec.stop(); }

/* --- Alerta automático para o celular do Rodrigo (ntfy; CallMeBot como alternativa) --- */
const NTFY = 'https://ntfy.sh';
async function ntfyPublicar(dados) {
  const c = Cfg.get(); if (!c.ntfy) return null;
  const r = await comTempo(fetch(NTFY + '/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: c.ntfy, ...dados }) }), 20000, 'sem resposta do ntfy');
  if (!r.ok) throw new Error('ntfy ' + r.status); return r.json();
}
async function ntfyArquivo(blob, nome, titulo) {
  const c = Cfg.get(); if (!c.ntfy || !blob || blob.size > 14.5 * 1048576) return null;
  const r = await comTempo(fetch(`${NTFY}/${encodeURIComponent(c.ntfy)}`, { method: 'PUT', body: blob, headers: { Filename: nome, Title: titulo, Priority: '4', Tags: 'paperclip' } }), 90000, 'envio do arquivo demorou demais');
  if (!r.ok) throw new Error('ntfy arquivo ' + r.status);
  const j = await r.json(); return j.attachment && j.attachment.url;
}
function sosAutoStatus() {
  const partes = []; const e = SOS.envios || {};
  if (e.alerta) partes.push('alerta ✓'); if (e.selfie) partes.push('selfie ✓'); if (e.audio) partes.push('áudio ✓'); if (e.video) partes.push('vídeo ✓');
  const pend = (SOS.fila || []).length;
  sosUI('auto', partes.length ? `🔔 Enviado sozinho ao ${esc(Cfg.get().familiaNome)}: ${partes.join(', ')}${pend ? ` · ${pend} esperando internet` : ''}` : (pend ? '🔔 Sem internet: envio automático assim que conectar. Use o SMS (botão 2).' : '🔔 Enviando aviso automático…'));
}
// Fila: tenta enviar; se falhar, guarda para quando a internet voltar.
async function sosEnviar(tipo) {
  const c = Cfg.get(); if (!c.ntfy && !c.callmebot) return;
  SOS.envios = SOS.envios || {}; SOS.fila = (SOS.fila || []).filter(t => t !== tipo);
  if (SOS.envios[tipo]) return;
  try {
    if (!navigator.onLine) throw new Error('offline');
    if (tipo === 'alerta') {
      const p = SOS.pos || Pos.ultima();
      if (c.ntfy) await ntfyPublicar({ title: `SOS: ${c.nome || 'Mãe'} precisa de ajuda`, message: sosMensagem(), priority: 5, tags: ['rotating_light', 'sos'], ...(p ? { click: mapsLink(p.lat, p.lon), actions: [{ action: 'view', label: 'Abrir mapa', url: mapsLink(p.lat, p.lon) }] } : {}) });
      else await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(c.familiaTel)}&text=${encodeURIComponent(sosMensagem())}&apikey=${encodeURIComponent(c.callmebot)}`, { mode: 'no-cors' });
    } else if (c.ntfy) {
      const arq = tipo === 'selfie' ? [SOS.selfie, 'sos-selfie.jpg', 'SOS - selfie'] : tipo === 'audio' ? [SOS.audio, 'sos-audio.' + (/webm/.test(SOS.audioTipo) ? 'webm' : 'm4a'), 'SOS - audio de 30 s'] : [SOS.video, 'sos-video.mov', 'SOS - video'];
      if (!arq[0]) return;
      const url = await ntfyArquivo(...arq);
      if (url) { SOS.links = SOS.links || {}; SOS.links[tipo] = url; }
    } else return;
    SOS.envios[tipo] = Date.now();
  } catch (e) { if (e.message !== 'offline') registrarErro('sos-envio-' + tipo, e); SOS.fila.push(tipo); }
  sosAutoStatus(); salvarSOS();
}
function sosAutomatico() { if (SOS.autoEnviado) return; SOS.autoEnviado = true; sosEnviar('alerta'); }
window.addEventListener('online', () => { if (SOS.ativo || (SOS.fila && SOS.fila.length)) [...(SOS.fila || [])].forEach(sosEnviar); });

// Atualiza a localização no celular do Rodrigo enquanto a tela de SOS estiver aberta
function sosAcompanhar() {
  clearInterval(SOS.acomp);
  SOS.acomp = setInterval(async () => {
    const c = Cfg.get(); if (!SOS.ativo || !c.ntfy || !SOS.pos || !navigator.onLine) return;
    const u = SOS.ultimoEnvioPos;
    if (u && distKm(u.lat, u.lon, SOS.pos.lat, SOS.pos.lon) < 0.03 && Date.now() - u.t < 10 * 60000) return;
    const l = descreverLocal(SOS.pos.lat, SOS.pos.lon);
    try { await ntfyPublicar({ title: 'SOS: localização atualizada', message: `${l ? l.nome : ''} · ±${SOS.pos.acc} m\n${mapsLink(SOS.pos.lat, SOS.pos.lon)}`, priority: 4, tags: ['round_pushpin'], click: mapsLink(SOS.pos.lat, SOS.pos.lon) }); SOS.ultimoEnvioPos = { ...SOS.pos, t: Date.now() }; } catch (e) { registrarErro('sos-acompanhar', e); }
  }, 120000);
}

function sosWhatsApp() { const cfg = Cfg.get(); window.location.href = waLink(cfg.familiaTel, sosMensagem()); return false; }
function sosSMS() { const cfg = Cfg.get(); window.location.href = `sms:${cfg.familiaTel.replace(/[^\d+]/g, '')}&body=${encodeURIComponent(sosMensagem())}`; return false; }

async function sosCompartilhar() {
  const arquivos = [];
  if (SOS.selfie) arquivos.push(new File([SOS.selfie], 'sos-selfie.jpg', { type: 'image/jpeg' }));
  if (SOS.audio) arquivos.push(new File([SOS.audio], 'sos-audio.' + (/webm/.test(SOS.audioTipo) ? 'webm' : 'm4a'), { type: SOS.audioTipo }));
  if (SOS.video) arquivos.push(SOS.video instanceof File ? SOS.video : new File([SOS.video], 'sos-video.mov', { type: SOS.video.type || 'video/quicktime' }));
  if (!arquivos.length) return toast('Ainda sem selfie, áudio ou vídeo');
  const dados = { files: arquivos, text: sosMensagem() };
  if (navigator.canShare && navigator.canShare(dados)) {
    try { await navigator.share(dados); } catch (e) { if (e.name !== 'AbortError') toast('Não consegui abrir o compartilhamento'); }
  } else if (navigator.share && arquivos.length > 1) {
    for (const f of arquivos) { if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: sosMensagem() }); } catch {} break; } }
  } else toast('Este iPhone não permite enviar arquivos daqui. Use os botões 1 e 2.');
}

async function salvarSOS() {
  try { await IDB.put('sos', { id: SOS.id, criado: Number(SOS.id.slice(3)), pos: SOS.pos, selfie: SOS.selfie, audio: SOS.audio, audioTipo: SOS.audioTipo, video: SOS.video || null, envios: SOS.envios || {}, fila: SOS.fila || [] }); } catch (e) { registrarErro('sos-salvar', e); }
}

function encerrarSOS() {
  sessaoAudio('auto');
  if (SOS.rec && SOS.rec.state === 'recording') SOS.rec.stop();
  if (SOS.stream) SOS.stream.getTracks().forEach(t => t.stop());
  if (SOS.streamAudio) SOS.streamAudio.getTracks().forEach(t => t.stop());
  if (SOS.watch != null && navigator.geolocation) navigator.geolocation.clearWatch(SOS.watch);
  clearInterval(SOS.timer); clearInterval(SOS.acomp);
  const o = document.getElementById('sos-overlay'); if (o) o.remove();
  SOS.ativo = false;
}

// Lista de SOS anteriores (para reenviar depois, se não havia internet)
async function sosHistoricoHtml() {
  let l = []; try { l = await IDB.all('sos'); } catch {}
  if (!l.length) return '';
  return `<h2>SOS gravados</h2><div class="card">${l.reverse().map(s => { const d = new Date(s.criado); const p = s.pos; return `<div class="kv"><span>${d.toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${p ? ' · ' + esc((descreverLocal(p.lat, p.lon) || {}).nome || '') : ''}</span><button class="btn secondary sm" onclick="reenviarSOS('${s.id}')">📤 Reenviar</button></div>`; }).join('')}</div>`;
}
async function reenviarSOS(id) {
  const s = await IDB.get('sos', id); if (!s) return;
  Object.assign(SOS, { selfie: s.selfie, audio: s.audio, audioTipo: s.audioTipo, video: s.video, pos: s.pos || SOS.pos });
  sosCompartilhar();
}
