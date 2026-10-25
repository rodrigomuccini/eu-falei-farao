/* ===== Intérprete: tradução falada dentro do app (precisa de internet) ===== */
const LINGUAS = {
  ar: { nome: 'Árabe', rec: ['ar-EG', 'ar-SA', 'ar'], voz: 'ar-SA', mm: 'ar', botao: 'اضغط وتكلم', ouvindo: 'أنا أسمع…', dir: 'rtl' },
  en: { nome: 'Inglês', rec: ['en-US', 'en-GB'], voz: 'en-US', mm: 'en', botao: 'Tap and speak', ouvindo: 'Listening…' },
  es: { nome: 'Espanhol', rec: ['es-ES', 'es-MX'], voz: 'es-ES', mm: 'es', botao: 'Toca y habla', ouvindo: 'Escuchando…' },
  fr: { nome: 'Francês', rec: ['fr-FR'], voz: 'fr-FR', mm: 'fr', botao: 'Touchez et parlez', ouvindo: "J'écoute…" },
  it: { nome: 'Italiano', rec: ['it-IT'], voz: 'it-IT', mm: 'it', botao: 'Tocca e parla', ouvindo: 'Ascolto…' },
  de: { nome: 'Alemão', rec: ['de-DE'], voz: 'de-DE', mm: 'de', botao: 'Tippen und sprechen', ouvindo: 'Ich höre zu…' },
};
const PT = { rec: ['pt-BR'], voz: 'pt-BR', mm: 'pt-BR' };
const INT = { rec: null, ouvindo: null, log: [], parado: true, silencios: 0 };
const Reconhecedor = window.SpeechRecognition || window.webkitSpeechRecognition;

async function traduzirTexto(texto, de, para) { return traduzirServico(texto, de, para); }

/* --- Voz da tradução no iPhone ---
   1) O iPhone só deixa falar se a voz for "liberada" num toque na tela: liberamos no toque do microfone.
   2) cancel() seguido de speak() faz o Safari engolir a fala: só cancela se estiver falando, e espera.
   3) Depois do microfone, o som pode ir para o alto-falante de ligação: muda para "playback" antes de falar. */
function desbloquearVoz() {
  if (INT.vozLiberada || !('speechSynthesis' in window)) return;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.rate = 2; speechSynthesis.speak(u); INT.vozLiberada = true; } catch {}
}
function vozesDe(lang) { try { return speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())); } catch { return []; } }
async function esperarVozes() {
  if (!('speechSynthesis' in window) || speechSynthesis.getVoices().length) return;
  await new Promise(ok => { const t = setTimeout(ok, 1200); speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(t); ok(); }, { once: true }); });
}
// Parte síncrona: precisa rodar dentro do toque quando o iPhone exigir.
function falarAgora(texto, lang) {
  const vozes = vozesDe(lang);
  sessaoAudio('playback');
  return new Promise(ok => { try {
    const u = new SpeechSynthesisUtterance(texto); u.lang = lang; u.rate = lang.startsWith('pt') ? 0.95 : 0.85; u.volume = 1;
    try { const melhor = vozes.find(v => v.lang.replace('_', '-') === lang) || vozes[0]; if (melhor) u.voice = melhor; } catch (e) { registrarErro('voz-escolher', e); }
    let comecou = false, acabou = false;
    const fim = r => { if (acabou) return; acabou = true; clearTimeout(tInicio); clearTimeout(tFim); sessaoAudio('auto'); ok(r); };
    u.onstart = () => { comecou = true; };
    u.onend = () => fim({ ok: true });
    u.onerror = ev => { registrarErro('voz-' + (ev.error || 'erro'), lang); fim({ ok: false, motivo: ev.error === 'not-allowed' ? 'bloqueado' : (vozes.length ? 'erro' : 'semVoz') }); };
    // Se não começar a falar em 3 s, o iPhone bloqueou ou não tem a voz
    const tInicio = setTimeout(() => { if (!comecou) { try { speechSynthesis.cancel(); } catch {} fim({ ok: false, motivo: vozes.length ? 'bloqueado' : 'semVoz' }); } }, 3000);
    const tFim = setTimeout(() => fim({ ok: comecou }), Math.min(30000, 4000 + texto.length * 140));
    speechSynthesis.speak(u);
  } catch (e) { registrarErro('voz-falar', e); sessaoAudio('auto'); ok({ ok: false, motivo: 'erro' }); } });
}
async function falarTexto(texto, lang) {
  if (!('speechSynthesis' in window)) return { ok: false, motivo: 'semSuporte' };
  if (!texto) return { ok: true };
  await esperarVozes();
  if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); await new Promise(r => setTimeout(r, 150)); }
  return falarAgora(texto, lang);
}

function intLingua() { return LINGUAS[Store.get('intLingua', 'ar')] || LINGUAS.ar; }

Views.interprete = () => {
  const lg = Store.get('intLingua', 'ar'); const L = intLingua();
  const auto = Store.get('intAuto', true), frente = Store.get('intFrente', false);
  const temVoz = !!Reconhecedor;
  const html = `
  ${navigator.onLine ? '' : `<div class="card red small"><b>Sem internet agora.</b> A tradução daqui precisa de internet. Use o <a href="#conversa">app Traduzir do iPhone</a>, que funciona sem internet.</div>`}
  <div class="card small" style="padding:10px 14px">
    <div class="row" style="align-items:center"><label class="f" style="margin:0;flex:0 0 auto">A outra pessoa fala</label>
      <select id="int-lingua" onchange="Store.set('intLingua', this.value); pararInterprete(); render(true)">${Object.entries(LINGUAS).map(([k, v]) => `<option value="${k}" ${k === lg ? 'selected' : ''}>${v.nome}</option>`).join('')}</select></div>
    <label class="chk"><input type="checkbox" ${auto ? 'checked' : ''} onchange="Store.set('intAuto', this.checked)"> Modo automático: depois de cada tradução, já escuta a outra pessoa</label>
    <label class="chk"><input type="checkbox" ${frente ? 'checked' : ''} onchange="Store.set('intFrente', this.checked); render(true)"> Frente a frente: metade de cima virada para a outra pessoa</label>
  </div>

  <div class="int-painel int-outro ${frente ? 'virado' : ''}" dir="${L.dir || 'ltr'}">
    <div class="int-texto" id="int-txt-outro">${esc(L.botao)} 👇</div>
    <button class="btn int-mic" id="int-btn-outro" onclick="ouvirInterprete('outro')">🎤 ${esc(L.botao)}</button>
  </div>
  <div class="int-painel int-eu">
    <div class="int-texto" id="int-txt-eu">Toque no botão e fale em português.</div>
    <button class="btn green int-mic" id="int-btn-eu" onclick="ouvirInterprete('eu')">🎤 Toque e fale (português)</button>
  </div>
  <div id="int-resultado"></div>
  <button class="btn outline" onclick="pararInterprete()">⏹ Parar</button>
  <p class="muted small" id="int-status">${temVoz ? 'Tire o iPhone do silencioso e aumente o volume para ouvir a tradução.' : 'Este iPhone não deixa o app ouvir direto. Use o ditado do teclado abaixo.'}</p>

  <details ${temVoz ? '' : 'open'}><summary>Escrever ou ditar pelo teclado</summary>
    <p class="small">Toque na caixa e use o <b>microfone do teclado</b> do iPhone para ditar. Depois toque em traduzir.</p>
    <textarea id="int-digitar" placeholder="Escreva ou dite aqui"></textarea>
    <div class="row"><button class="btn green sm" onclick="traduzirDigitado('eu')">Eu disse isto → ${esc(L.nome)}</button><button class="btn nile sm" onclick="traduzirDigitado('outro')">${esc(L.nome)} → português</button></div>
  </details>

  <h2>Conversa</h2><div class="card" id="int-log">${intLogHtml()}</div>
  <a class="btn secondary sm" href="#conversa">Sem internet? Use o app Traduzir do iPhone</a>`;
  return { title: 'Tradutor falado', html, nav: 'frases' };
};

function intLogHtml() {
  if (!INT.log.length) return '<p class="muted small">As frases traduzidas aparecem aqui.</p>';
  return INT.log.slice().reverse().map((m, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="muted small">${m.quem === 'eu' ? 'Você' : 'Outra pessoa'} · ${m.hora}</div><div ${m.dirOrig === 'rtl' ? 'dir="rtl" class="ar" style="font-size:1.1rem"' : ''}>${esc(m.orig)}</div><div ${m.dirTr === 'rtl' ? 'dir="rtl" class="ar" style="font-size:1.25rem;font-weight:700"' : 'style="font-weight:700"'}>${esc(m.tr)}</div><button class="btn secondary sm" onclick="pararReconhecimento(); falarAgora(${esc(JSON.stringify(m.tr))}, '${m.vozTr}')">🔊 Repetir</button></div>`).join('');
}
function intUI(quem, texto, dir) { const el = document.getElementById('int-txt-' + quem); if (el) { el.textContent = texto; el.dir = dir || 'auto'; } }
function intStatus(t) { const el = document.getElementById('int-status'); if (el) el.innerHTML = t; }
function intBotoes(ativo) { ['eu', 'outro'].forEach(q => { const b = document.getElementById('int-btn-' + q); if (b) b.classList.toggle('ouvindo', q === ativo); }); }

const SILENCIO_MS = 1500, LIMITE_FALA_MS = 25000;
function ouvirInterprete(quem, tentativa = 0) {
  // Tocar de novo no botão de quem está falando encerra e traduz na hora
  desbloquearVoz();
  if (INT.terminar && INT.ouvindo === quem && !INT.parado) { INT.terminar('manual'); return; }
  if (!Reconhecedor) { intStatus('Este iPhone não deixa o app ouvir direto. Use o ditado do teclado em "Escrever ou ditar pelo teclado".'); const d = document.querySelector('details'); if (d) d.open = true; return; }
  if (!navigator.onLine) { intStatus('Sem internet: a tradução não funciona. Use o <a href="#conversa">app Traduzir do iPhone</a>.'); return; }
  pararReconhecimento(); if ('speechSynthesis' in window) speechSynthesis.cancel();
  INT.parado = false;
  const meu = INT.seq = (INT.seq || 0) + 1;
  const L = intLingua(); const cfg = quem === 'eu' ? PT : L;
  const chave = 'intRec.' + cfg.rec[0]; const base = Store.get(chave, 0);
  const idx = Math.min(base + tentativa, cfg.rec.length - 1); const codigo = cfg.rec[idx];
  const rec = new Reconhecedor(); INT.rec = rec; INT.ouvindo = quem;
  rec.lang = codigo; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let final = '', parcial = '', algumResultado = false, concluido = false, timerSil = null;
  const dir = quem === 'eu' ? 'ltr' : L.dir;
  intBotoes(quem);
  const btn = document.getElementById('int-btn-' + quem); if (btn) btn.textContent = quem === 'eu' ? '🎤 Ouvindo… toque aqui quando terminar' : '🎤 ' + L.ouvindo;
  intStatus(quem === 'eu' ? '🎤 Ouvindo você… quando parar de falar, o app traduz sozinho.' : `🎤 Ouvindo a outra pessoa (${L.nome})…`);
  const limite = setTimeout(() => terminar('limite'), LIMITE_FALA_MS);

  // O iPhone nem sempre avisa quando a pessoa terminou: o app decide pelo silêncio.
  const terminar = async motivo => {
    if (concluido) return; concluido = true;
    clearTimeout(timerSil); clearTimeout(limite);
    if (INT.seq !== meu) return; // outra escuta começou depois desta
    INT.terminar = null; INT.ouvindo = null; if (INT.rec === rec) INT.rec = null;
    try { rec.stop(); } catch {}
    intBotoes(null); intRotulos();
    if (INT.parado) return;
    const texto = (final + ' ' + parcial).replace(/\s+/g, ' ').trim();
    if (!texto) {
      INT.semTexto = (INT.semTexto || 0) + 1;
      if (algumResultado === false && INT.semTexto >= 2) {
        intStatus('O iPhone não está escrevendo o que é falado. Use o <b>ditado do teclado</b> logo abaixo, ou o <a href="#conversa">app Traduzir do iPhone</a>.');
        const d = document.querySelector('details'); if (d) d.open = true; INT.semTexto = 0; return;
      }
      if (Store.get('intAuto', true) && motivo !== 'manual' && INT.silencios++ < 2) return ouvirInterprete(quem);
      intStatus('Não ouvi nada. Toque no botão e fale mais perto do celular.'); return;
    }
    INT.silencios = 0; INT.semTexto = 0;
    await processarFala(quem, texto);
  };
  INT.terminar = terminar;

  rec.onresult = ev => {
    algumResultado = true; final = ''; parcial = '';
    // Reconstrói tudo a cada evento (o iPhone às vezes repete os resultados anteriores)
    for (let i = 0; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) final += t + ' '; else parcial += t + ' '; }
    const t = (final + parcial).trim(); if (t) intUI(quem, t, dir);
    clearTimeout(timerSil); timerSil = setTimeout(() => terminar('silencio'), SILENCIO_MS);
  };
  rec.onerror = ev => {
    registrarErro('interprete-' + ev.error, ev.message || ev.error);
    if (ev.error === 'language-not-supported' && idx + 1 < cfg.rec.length) { concluido = true; clearTimeout(limite); Store.set(chave, idx + 1); INT.terminar = null; return setTimeout(() => ouvirInterprete(quem, 0), 200); }
    const msg = { 'not-allowed': 'O iPhone bloqueou o microfone ou o ditado. Em Ajustes → Apps → Safari, permita o Microfone, e em Ajustes → Geral → Teclado, ligue Ativar Ditado.', 'service-not-allowed': 'O ditado do iPhone está desligado. Em Ajustes → Geral → Teclado, ligue Ativar Ditado. Enquanto isso, use o ditado do teclado abaixo.', 'network': 'Sem conexão com o serviço de voz. Confira a internet.', 'audio-capture': 'O microfone está sendo usado por outro app.' }[ev.error];
    if (msg) { concluido = true; clearTimeout(limite); clearTimeout(timerSil); INT.terminar = null; INT.ouvindo = null; intBotoes(null); intRotulos(); intStatus(msg); }
  };
  rec.onend = () => { if (!concluido) terminar('fim'); };
  sessaoAudio('auto');
  try { rec.start(); } catch (e) { registrarErro('interprete-start', e); concluido = true; clearTimeout(limite); INT.terminar = null; intBotoes(null); intRotulos(); intStatus('Não consegui ligar o microfone: ' + esc(erroTexto(e))); }
}

function intResultado(m, etapas, aviso) {
  const el = document.getElementById('int-resultado'); if (!el) return;
  const L = intLingua(); const alvo = m.quem === 'eu' ? L.nome : 'português';
  el.innerHTML = `<div class="card int-res">
    <div class="small">${etapas.map(e => `<span class="pill ${e.ok === false ? 'red' : e.ok ? 'green' : ''}">${e.ok === false ? '✕' : e.ok ? '✓' : '…'} ${e.t}</span>`).join(' ')}</div>
    <div class="muted small" style="margin-top:8px">${m.quem === 'eu' ? 'Você disse' : 'A outra pessoa disse'}</div>
    <div ${m.dirOrig === 'rtl' ? 'dir="rtl" class="ar" style="font-size:1.15rem"' : ''}>${esc(m.orig)}</div>
    <div class="muted small" style="margin-top:8px">Tradução (${esc(alvo)})</div>
    <div class="int-trad" ${m.dirTr === 'rtl' ? 'dir="rtl"' : ''}>${esc(m.tr || '…')}</div>
    ${aviso ? `<p class="small" style="color:var(--red);font-weight:700">${aviso}</p>` : ''}
    ${m.tr ? `<button class="btn ${aviso ? 'red' : 'nile'}" onclick="ouvirResultado()">🔊 Ouvir em ${esc(alvo)}</button>
    <button class="btn secondary" onclick="mostrarTraducao()">👁️ Mostrar em tela cheia</button>` : ''}
  </div>`;
  if (aviso) try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
}
function mostrarTraducao() {
  const m = INT.log[INT.log.length - 1]; if (!m) return;
  overlay(`<div class="big"><div class="${m.dirTr === 'rtl' ? 'ar' : 'en'}" dir="${m.dirTr}" style="font-size:2.4rem;font-weight:800">${esc(m.tr)}</div><div class="pt">${esc(m.orig)}</div>
    <button class="btn nile" onclick="ouvirResultado()">🔊 Ouvir</button><p class="muted small">Mostre esta tela para a pessoa.</p></div>`);
}
async function ouvirResultado() {
  const m = INT.log[INT.log.length - 1]; if (!m) return;
  pararReconhecimento();
  if (!('speechSynthesis' in window)) return;
  // Fala na hora, ainda dentro do toque (o iPhone aceita sempre)
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  INT.vozLiberada = true;
  const r = await falarAgora(m.tr, m.vozTr);
  if (r.ok) { intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: true, t: 'Traduzi' }, { ok: true, t: 'Falei' }]); if (Store.get('intAuto', true) && !INT.parado) setTimeout(() => ouvirInterprete(m.quem === 'eu' ? 'outro' : 'eu'), 350); }
  else intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: true, t: 'Traduzi' }, { ok: false, t: 'Falei' }], avisoVoz(r.motivo, m));
}
function avisoVoz(motivo, m) {
  const L = intLingua(); const lingua = m.quem === 'eu' ? L.nome : 'Português (Brasil)';
  if (motivo === 'semVoz') return `Este iPhone não tem a voz em ${esc(lingua)}. Baixe em Ajustes → Acessibilidade → Conteúdo Falado → Vozes → ${esc(lingua)}. Enquanto isso, use "Mostrar em tela cheia".`;
  return 'O iPhone não deixou falar sozinho. Toque no botão vermelho abaixo para ouvir. Confira também se o iPhone está fora do silencioso e com volume alto.';
}

async function processarFala(quem, texto) {
  const L = intLingua(); const de = quem === 'eu' ? PT.mm : L.mm, para = quem === 'eu' ? L.mm : PT.mm;
  const outro = quem === 'eu' ? 'outro' : 'eu';
  const m = { quem, orig: texto, tr: '', vozTr: quem === 'eu' ? L.voz : PT.voz, dirOrig: quem === 'eu' ? 'ltr' : L.dir, dirTr: quem === 'eu' ? L.dir : 'ltr', hora: partsIn(TZ).hm };
  intResultado(m, [{ ok: true, t: 'Ouvi' }, { t: 'Traduzindo' }]);
  intStatus('Traduzindo…');
  try { m.tr = await traduzirTexto(texto, de, para); }
  catch (e) {
    registrarErro('interprete-traduzir', e);
    const dica = { NaoTraduziu: 'Repita com outras palavras, em frases curtas.', SemInternet: 'Sem internet. Use o <a href="#conversa">app Traduzir do iPhone</a>.', Limite: 'Use o <a href="#conversa">app Traduzir do iPhone</a> até amanhã.' }[e.name] || 'Toque no botão verde e tente de novo.';
    intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: false, t: 'Traduzi' }], `Não consegui traduzir: ${esc(e.message)}. ${dica}`);
    intStatus('⚠️ Não consegui traduzir.'); return;
  }
  INT.log.push(m);
  const log = document.getElementById('int-log'); if (log) log.innerHTML = intLogHtml();
  intUI(outro, m.tr, m.dirTr);
  intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: true, t: 'Traduzi' }, { t: 'Falando' }]);
  intStatus('🔊 Falando a tradução…');
  const r = await falarTexto(m.tr, m.vozTr);
  if (!r.ok) {
    intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: true, t: 'Traduzi' }, { ok: false, t: 'Falei' }], avisoVoz(r.motivo, m));
    intStatus('⚠️ Toque em Ouvir para escutar a tradução.'); return; // espera o toque, que o iPhone sempre aceita
  }
  intResultado(m, [{ ok: true, t: 'Ouvi' }, { ok: true, t: 'Traduzi' }, { ok: true, t: 'Falei' }]);
  if (INT.parado || location.hash.slice(1).split('/')[0] !== 'interprete') return;
  if (Store.get('intAuto', true)) setTimeout(() => { if (!INT.parado) ouvirInterprete(outro); }, 350);
  else intStatus('Pronto. Toque no botão de quem vai falar.');
}

async function traduzirDigitado(quem) {
  desbloquearVoz();
  const el = document.getElementById('int-digitar'); const t = el && el.value.trim(); if (!t) return toast('Escreva ou dite alguma coisa');
  if (!navigator.onLine) return intStatus('Sem internet: a tradução não funciona. Use o <a href="#conversa">app Traduzir do iPhone</a>.');
  INT.parado = true; await processarFala(quem, t); el.value = '';
}
function intRotulos() { const L = intLingua(); const a = document.getElementById('int-btn-eu'), b = document.getElementById('int-btn-outro'); if (a) a.textContent = '🎤 Toque e fale (português)'; if (b) b.textContent = '🎤 ' + L.botao; }
function pararReconhecimento() { INT.seq = (INT.seq || 0) + 1; INT.terminar = null; INT.ouvindo = null; if (INT.rec) { const r = INT.rec; INT.rec = null; try { r.abort(); } catch {} } }
function pararInterprete() { INT.parado = true; pararReconhecimento(); if ('speechSynthesis' in window) speechSynthesis.cancel(); intBotoes(null); intRotulos(); intStatus('Parado. Toque no botão de quem vai falar.'); }
window.addEventListener('hashchange', () => { if (!/^#interprete/.test(location.hash)) { INT.parado = true; pararReconhecimento(); } });
