/* ===== Tradutor com câmera: foto com tradução sobreposta e modo ao vivo ===== */
let OCR = null, OCR_CARREGANDO = null;
const absUrl = p => new URL(p, location.href).href;
function carregarScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

async function ocrWorker(progresso) {
  if (OCR) return OCR;
  if (OCR_CARREGANDO) return OCR_CARREGANDO;
  OCR_CARREGANDO = (async () => {
    if (!window.Tesseract) await carregarScript('vendor/tesseract/tesseract.min.js');
    const w = await Tesseract.createWorker(['ara', 'eng'], 1, {
      workerPath: absUrl('vendor/tesseract/worker.min.js'), corePath: absUrl('vendor/tesseract/core'), langPath: absUrl('vendor/tesseract/lang'),
      workerBlobURL: false, logger: m => { if (progresso && m.status) progresso(m); },
    });
    OCR = w; Store.set('ocrPronto', true); return w;
  })();
  try { return await OCR_CARREGANDO; } finally { OCR_CARREGANDO = null; }
}

const temArabe = t => /[؀-ۿ]/.test(t);
const limparLinha = t => t.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[|_~^`]+/g, ' ').replace(/\s+/g, ' ').trim();
function linhasDe(data) {
  const out = [];
  const add = l => { const t = limparLinha(l.text || ''); if (t.replace(/[^\p{L}]/gu, '').length >= 2 && (l.confidence || 0) >= 45) out.push({ text: t, bbox: l.bbox, conf: l.confidence }); };
  if (data.blocks) data.blocks.forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(add)));
  else if (data.lines) data.lines.forEach(add);
  return out;
}

function glossarioTraduz(t) {
  const baixo = t.toLowerCase(); const achados = [];
  for (const [o, pt] of [...GLOSSARIO].sort((a, b) => b[0].length - a[0].length)) if (baixo.includes(o.toLowerCase()) && !achados.some(a => a.o.includes(o))) achados.push({ o, pt });
  return achados.length ? '≈ ' + achados.map(a => a.pt).join(', ') : null;
}
async function traduzirLinha(t) {
  const de = temArabe(t) ? 'ar' : 'en';
  const cache = Store.get('tradCache', {}); const k = de + '|' + t;
  if (cache[k]) return cache[k];
  if (navigator.onLine) {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t.slice(0, 450))}&langpair=${de}|pt-BR`);
      const j = await r.json(); const tr = j && j.responseData && j.responseData.translatedText;
      if (tr && j.responseStatus == 200 && !/MYMEMORY WARNING|QUERY LENGTH/i.test(tr)) {
        const ks = Object.keys(cache); if (ks.length > 600) ks.slice(0, 200).forEach(x => delete cache[x]);
        cache[k] = tr; Store.set('tradCache', cache); return tr;
      }
    } catch {}
  }
  return glossarioTraduz(t) || (temArabe(t) ? '(sem internet: tradução indisponível)' : t);
}

// Desenha caixas com a tradução por cima de cada linha de texto.
function desenharTraducoes(ctx, linhas, escala = 1, dx = 0, dy = 0) {
  for (const l of linhas) {
    if (!l.tr) continue;
    const x = l.bbox.x0 * escala + dx, y = l.bbox.y0 * escala + dy, w = Math.max(40, (l.bbox.x1 - l.bbox.x0) * escala), h = Math.max(16, (l.bbox.y1 - l.bbox.y0) * escala);
    let fs = Math.max(11, Math.min(h * 0.82, 44)); ctx.font = `700 ${fs}px -apple-system, Helvetica, Arial, sans-serif`;
    let palavras = l.tr.split(' '), linhasTxt = [l.tr];
    while (ctx.measureText(l.tr).width > w * 1.9 && fs > 11) { fs -= 1; ctx.font = `700 ${fs}px -apple-system, Helvetica, Arial, sans-serif`; }
    if (ctx.measureText(l.tr).width > w) { const meio = Math.ceil(palavras.length / 2); linhasTxt = [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')]; }
    const larg = Math.max(w, ...linhasTxt.map(t => ctx.measureText(t).width + 10)), alt = Math.max(h, linhasTxt.length * fs * 1.15 + 6);
    ctx.fillStyle = 'rgba(255, 249, 235, 0.93)'; ctx.strokeStyle = 'rgba(200, 150, 46, 0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 2, y - 2, larg + 4, alt + 4, 6) : ctx.rect(x - 2, y - 2, larg + 4, alt + 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1f1a14'; ctx.textBaseline = 'top';
    linhasTxt.forEach((t, i) => ctx.fillText(t, x + 4, y + 2 + i * fs * 1.15));
  }
}

Views.camera = () => {
  const pronto = Store.get('ocrPronto', false);
  const html = `<div class="grid2">
    <label class="btn"><input type="file" accept="image/*" capture="environment" hidden onchange="traduzirFoto(this)"><span class="ico">📸</span>Fotografar e traduzir</label>
    <button class="btn nile" onclick="cameraAoVivo()"><span class="ico">🎥</span>Câmera ao vivo</button></div>
  <label class="btn secondary"><input type="file" accept="image/*" hidden onchange="traduzirFoto(this)">🖼️ Traduzir uma foto da galeria</label>
  <p class="muted small" id="ocr-status">${pronto ? '✓ Leitura de texto pronta, funciona sem internet.' : 'Na primeira vez o app baixa a leitura de texto (cerca de 12 MB). Faça no wi-fi.'}</p>
  <div id="cam-resultado"></div>
  <div class="card nile small"><b>Dica:</b> a tradução de frases precisa de internet. Sem internet, o app traduz as palavras mais comuns de placas e cardápios. Para conversas e tradução ao vivo mais rápida, o app <b>Google Tradutor</b> também tem câmera: abra o app e toque em <b>Câmera</b>.
  <div class="row" style="margin-top:8px"><a class="btn secondary sm" href="https://apps.apple.com/app/id414706506" target="_blank">Baixar Google Tradutor</a></div></div>`;
  return { title: 'Traduzir com câmera', html, nav: 'frases' };
};

function ocrProgresso(m) {
  const el = $('#ocr-status') || $('#vivo-status'); if (!el) return;
  const pct = m.progress ? ` ${Math.round(m.progress * 100)}%` : '';
  const txt = { 'loading tesseract core': 'Preparando leitura de texto', 'initializing tesseract': 'Iniciando', 'loading language traineddata': 'Carregando idiomas (árabe e inglês)', 'initializing api': 'Quase pronto', 'recognizing text': 'Lendo o texto' }[m.status] || m.status;
  el.textContent = txt + pct + '…';
}

async function traduzirFoto(input) {
  const file = input.files && input.files[0]; input.value = ''; if (!file) return;
  const box = $('#cam-resultado'); box.innerHTML = '<div class="card">Preparando a foto…</div>';
  const r = await reduzirPara(file, 1600, 0.9); if (!r) { box.innerHTML = '<div class="card red">Não consegui abrir a foto.</div>'; return; }
  const img = await createImageBitmap(r.blob);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.className = 'cam-canvas';
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  box.innerHTML = ''; box.appendChild(c);
  const lista = document.createElement('div'); lista.className = 'card'; lista.innerHTML = '<p class="small" id="ocr-status2">Lendo o texto…</p>'; box.appendChild(lista);
  try {
    const w = await ocrWorker(ocrProgresso);
    const { data } = await w.recognize(c, {}, { blocks: true });
    const linhas = linhasDe(data);
    const st = $('#ocr-status'); if (st) st.textContent = '✓ Leitura de texto pronta, funciona sem internet.';
    if (!linhas.length) { lista.innerHTML = '<p>Não encontrei texto. Chegue mais perto e deixe o texto reto e bem iluminado.</p>'; return; }
    lista.innerHTML = '<p class="small muted">Traduzindo…</p>';
    await Promise.all(linhas.slice(0, 25).map(async l => { l.tr = await traduzirLinha(l.text); }));
    ctx.drawImage(img, 0, 0); desenharTraducoes(ctx, linhas);
    const todo = linhas.map(l => l.text).join('\n');
    lista.innerHTML = `<b>Texto encontrado</b><ul class="clean">${linhas.map(l => `<li><div class="${temArabe(l.text) ? 'ar' : ''}" style="${temArabe(l.text) ? 'font-size:1.2rem' : ''}">${esc(l.text)}</div><div><b>${esc(l.tr || '')}</b></div></li>`).join('')}</ul>
      <a class="btn secondary sm" href="https://translate.google.com/?sl=auto&tl=pt&text=${encodeURIComponent(todo.slice(0, 1500))}&op=translate" target="_blank">Ver no Google Tradutor</a>`;
  } catch (e) {
    lista.innerHTML = `<p>Não consegui ler o texto agora${navigator.onLine ? '' : ' (na primeira vez precisa de internet para preparar a leitura)'}.</p>`;
  }
}

/* --- Modo ao vivo --- */
const VIVO = { ativo: false };
async function cameraAoVivo() {
  const o = document.createElement('div'); o.className = 'vivo'; o.id = 'vivo';
  o.innerHTML = `<video id="vivo-video" playsinline muted autoplay></video><canvas id="vivo-canvas"></canvas>
    <div class="vivo-barra"><span id="vivo-status">Abrindo a câmera…</span><div class="row"><button class="btn secondary sm" id="vivo-pausa">⏸ Congelar</button><button class="btn red sm" onclick="fecharVivo()">✕ Fechar</button></div></div>`;
  document.body.appendChild(o);
  Object.assign(VIVO, { ativo: true, pausado: false, linhas: [], ultimo: null });
  $('#vivo-pausa').onclick = () => { VIVO.pausado = !VIVO.pausado; const v = $('#vivo-video'); if (VIVO.pausado) { v.pause(); $('#vivo-pausa').textContent = '▶️ Continuar'; } else { v.play(); $('#vivo-pausa').textContent = '⏸ Congelar'; vivoLoop(); } };
  try {
    VIVO.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    const v = $('#vivo-video'); v.srcObject = VIVO.stream; await v.play().catch(() => {});
    $('#vivo-status').textContent = 'Preparando a leitura de texto…';
    await ocrWorker(ocrProgresso);
    $('#vivo-status').textContent = 'Aponte para o texto e segure firme';
    vivoLoop();
  } catch (e) { $('#vivo-status').textContent = 'Não consegui abrir a câmera. Em Ajustes, permita a câmera para o app.'; }
}
async function vivoLoop() {
  if (!VIVO.ativo || VIVO.pausado || VIVO.lendo) return;
  const v = $('#vivo-video'); if (!v || !v.videoWidth) { setTimeout(vivoLoop, 400); return; }
  VIVO.lendo = true;
  try {
    const esc_ = Math.min(1, 1280 / v.videoWidth);
    const f = document.createElement('canvas'); f.width = Math.round(v.videoWidth * esc_); f.height = Math.round(v.videoHeight * esc_);
    f.getContext('2d').drawImage(v, 0, 0, f.width, f.height);
    $('#vivo-status').textContent = 'Lendo…';
    const { data } = await OCR.recognize(f, {}, { blocks: true });
    const linhas = linhasDe(data).slice(0, 12);
    await Promise.all(linhas.map(async l => { l.tr = await traduzirLinha(l.text); }));
    VIVO.linhas = linhas; VIVO.quadro = { w: f.width, h: f.height };
    vivoDesenhar();
    $('#vivo-status').textContent = linhas.length ? `${linhas.length} trecho${linhas.length > 1 ? 's' : ''} traduzido${linhas.length > 1 ? 's' : ''}` : 'Procurando texto…';
  } catch { $('#vivo-status').textContent = 'Tentando de novo…'; }
  VIVO.lendo = false;
  if (VIVO.ativo && !VIVO.pausado) setTimeout(vivoLoop, 600);
}
function vivoDesenhar() {
  const v = $('#vivo-video'), c = $('#vivo-canvas'); if (!v || !c || !VIVO.quadro) return;
  const W = v.clientWidth, H = v.clientHeight; const dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  // vídeo em "contain": calcula a área visível
  const s = Math.min(W / VIVO.quadro.w, H / VIVO.quadro.h); const dx = (W - VIVO.quadro.w * s) / 2, dy = (H - VIVO.quadro.h * s) / 2;
  desenharTraducoes(ctx, VIVO.linhas, s, dx, dy);
}
function fecharVivo() {
  VIVO.ativo = false; if (VIVO.stream) VIVO.stream.getTracks().forEach(t => t.stop());
  const o = $('#vivo'); if (o) o.remove();
}
