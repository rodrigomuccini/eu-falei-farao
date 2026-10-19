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
  linhas.push('Agência Corsini 24h: +20 114 414 1314');
  return linhas.join('\n');
}

function sosUI(campo, html) { const el = document.getElementById('sos-' + campo); if (el) el.innerHTML = html; }

async function iniciarSOS() {
  if (SOS.ativo) return;
  const cfg = Cfg.get();
  Object.assign(SOS, { ativo: true, id: 'sos' + Date.now(), selfie: null, audio: null, audioTipo: '', pos: null, stream: null, rec: null, autoEnviado: false });
  const o = document.createElement('div'); o.className = 'overlay sos-tela'; o.id = 'sos-overlay';
  o.innerHTML = `<h1 style="color:var(--red);margin:4px 0 2px">🆘 SOS ativado</h1>
    <p class="small" style="margin:0 0 10px">Fique calma. O app está gravando e localizando. Use os botões abaixo para avisar o ${esc(cfg.familiaNome)}.</p>
    <div class="row" style="align-items:flex-start;gap:12px">
      <video id="sos-video" playsinline muted autoplay style="flex:0 0 96px;width:96px;height:128px;object-fit:cover;border-radius:12px;background:#000"></video>
      <ul class="clean small" style="flex:1">
        <li id="sos-local">📍 Buscando localização…</li>
        <li id="sos-foto">📸 Abrindo a câmera…</li>
        <li id="sos-audio">🎙️ Preparando gravação…</li>
        <li id="sos-auto">${cfg.callmebot ? '💬 Aviso automático no WhatsApp: aguardando localização…' : '💬 Aviso automático no WhatsApp: não configurado'}</li>
      </ul>
    </div>
    <a class="btn green" id="sos-wa" href="#" onclick="return sosWhatsApp()">💬 1. WhatsApp para ${esc(cfg.familiaNome)} (localização)</a>
    <a class="btn red" id="sos-sms" href="#" onclick="return sosSMS()">✉️ 2. SMS para ${esc(cfg.familiaNome)} (funciona sem internet)</a>
    <button class="btn nile" id="sos-share" onclick="sosCompartilhar()" disabled>📤 3. Enviar selfie e áudio</button>
    <div class="row"><a class="btn secondary" href="${telLink(cfg.familiaTel)}">📞 Ligar ${esc(cfg.familiaNome)}</a><a class="btn secondary" href="tel:123">🚑 123</a></div>
    <button class="btn outline" id="sos-parar" onclick="sosPararAudio()">⏹ Parar gravação agora</button>
    <button class="btn outline" onclick="encerrarSOS()">Fechar SOS</button>`;
  document.body.appendChild(o);

  // 1) Localização
  Pos.agora(12000).then(p => { if (p) { SOS.pos = p; sosLocalUI(); sosAutomatico(); } else sosUI('local', '📍 Sem GPS. Ative a Localização em Ajustes.'); salvarSOS(); });
  if (navigator.geolocation) SOS.watch = navigator.geolocation.watchPosition(p => { SOS.pos = Pos.guardar(p); sosLocalUI(); }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
  setTimeout(() => { if (!SOS.autoEnviado && SOS.ativo) sosAutomatico(); }, 15000);

  // 2) Selfie + 3) Áudio
  try {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: true }); }
    catch { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); sosUI('foto', '📸 Câmera não liberada.'); }
    if (!SOS.ativo) { stream.getTracks().forEach(t => t.stop()); return; }
    SOS.stream = stream;
    if (stream.getVideoTracks().length) {
      const v = document.getElementById('sos-video'); v.srcObject = stream;
      await new Promise(r => { if (v.readyState >= 2) r(); else v.onloadeddata = r; setTimeout(r, 2500); });
      await new Promise(r => setTimeout(r, 900));
      const c = document.createElement('canvas'); c.width = v.videoWidth || 720; c.height = v.videoHeight || 960;
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      SOS.selfie = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
      stream.getVideoTracks().forEach(t => t.stop());
      sosUI('foto', '📸 Selfie tirada ✓'); document.getElementById('sos-share').disabled = false; salvarSOS();
    }
    sosGravarAudio(new MediaStream(stream.getAudioTracks()));
  } catch (e) {
    sosUI('foto', '📸 Câmera não liberada.'); sosUI('audio', '🎙️ Microfone não liberado. Em Ajustes > Safari, permita Câmera e Microfone.');
  }
}

function sosLocalUI() {
  const p = SOS.pos; if (!p) return; const l = descreverLocal(p.lat, p.lon);
  sosUI('local', `📍 ${esc(l ? l.nome : '')} <span class="muted">(±${p.acc} m)</span> ✓`);
}

function sosGravarAudio(audioStream) {
  if (!window.MediaRecorder || !audioStream.getAudioTracks().length) { sosUI('audio', '🎙️ Gravação de áudio indisponível neste aparelho.'); return; }
  const tipos = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  const tipo = tipos.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(audioStream, tipo ? { mimeType: tipo } : undefined);
  const partes = []; SOS.rec = rec; SOS.audioTipo = rec.mimeType || tipo || 'audio/mp4';
  rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
  rec.onstop = () => {
    clearInterval(SOS.timer); audioStream.getTracks().forEach(t => t.stop());
    if (SOS.stream) SOS.stream.getTracks().forEach(t => t.stop());
    SOS.audio = new Blob(partes, { type: SOS.audioTipo });
    sosUI('audio', `🎙️ Áudio gravado (${Math.round(SOS.audio.size / 1024)} KB) ✓`);
    const b = document.getElementById('sos-parar'); if (b) b.hidden = true;
    document.getElementById('sos-share') && (document.getElementById('sos-share').disabled = false);
    salvarSOS();
  };
  rec.start(1000);
  let resta = SOS_SEGUNDOS;
  sosUI('audio', `🎙️ Gravando áudio… ${resta} s`);
  SOS.timer = setInterval(() => { resta--; sosUI('audio', `🎙️ Gravando áudio… ${resta} s`); if (resta <= 0 && rec.state === 'recording') rec.stop(); }, 1000);
}
function sosPararAudio() { if (SOS.rec && SOS.rec.state === 'recording') SOS.rec.stop(); }

// Alerta automático no WhatsApp (CallMeBot): só texto, sem precisar tocar em nada.
function sosAutomatico() {
  const cfg = Cfg.get(); if (SOS.autoEnviado || !cfg.callmebot) return;
  if (!navigator.onLine) { sosUI('auto', '💬 Sem internet: use o SMS (botão 2).'); return; }
  SOS.autoEnviado = true;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cfg.familiaTel)}&text=${encodeURIComponent(sosMensagem())}&apikey=${encodeURIComponent(cfg.callmebot)}`;
  fetch(url, { mode: 'no-cors' }).then(() => sosUI('auto', '💬 Aviso automático enviado ao WhatsApp ✓')).catch(() => { SOS.autoEnviado = false; sosUI('auto', '💬 Aviso automático falhou. Use os botões 1 e 2.'); });
}

function sosWhatsApp() { const cfg = Cfg.get(); window.location.href = waLink(cfg.familiaTel, sosMensagem()); return false; }
function sosSMS() { const cfg = Cfg.get(); window.location.href = `sms:${cfg.familiaTel.replace(/[^\d+]/g, '')}&body=${encodeURIComponent(sosMensagem())}`; return false; }

async function sosCompartilhar() {
  const arquivos = [];
  if (SOS.selfie) arquivos.push(new File([SOS.selfie], 'sos-selfie.jpg', { type: 'image/jpeg' }));
  if (SOS.audio) arquivos.push(new File([SOS.audio], 'sos-audio.' + (/webm/.test(SOS.audioTipo) ? 'webm' : 'm4a'), { type: SOS.audioTipo }));
  if (!arquivos.length) return toast('Ainda sem selfie ou áudio');
  const dados = { files: arquivos, text: sosMensagem() };
  if (navigator.canShare && navigator.canShare(dados)) {
    try { await navigator.share(dados); } catch (e) { if (e.name !== 'AbortError') toast('Não consegui abrir o compartilhamento'); }
  } else toast('Este iPhone não permite enviar arquivos daqui. Use os botões 1 e 2.');
}

async function salvarSOS() {
  try { await IDB.put('sos', { id: SOS.id, criado: Number(SOS.id.slice(3)), pos: SOS.pos, selfie: SOS.selfie, audio: SOS.audio, audioTipo: SOS.audioTipo }); } catch {}
}

function encerrarSOS() {
  if (SOS.rec && SOS.rec.state === 'recording') SOS.rec.stop();
  if (SOS.stream) SOS.stream.getTracks().forEach(t => t.stop());
  if (SOS.watch != null && navigator.geolocation) navigator.geolocation.clearWatch(SOS.watch);
  clearInterval(SOS.timer);
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
  Object.assign(SOS, { selfie: s.selfie, audio: s.audio, audioTipo: s.audioTipo, pos: s.pos || SOS.pos });
  sosCompartilhar();
}
