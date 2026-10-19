/* ===== Utilidades ===== */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TZ = 'Africa/Cairo', TZBR = 'America/Sao_Paulo';
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
function partsIn(tz, d = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(d);
  const o = {}; p.forEach(x => o[x.type] = x.value);
  return { iso: `${o.year}-${o.month}-${o.day}`, hm: `${o.hour === '24' ? '00' : o.hour}:${o.minute}`, h: +(o.hour === '24' ? 0 : o.hour), m: +o.minute };
}
function hojeISO() { const q = new URLSearchParams(location.search).get('d'); return q || Store.get('debugDate', null) || partsIn(TZ).iso; }
function fmtData(iso) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d, 12)); return `${DIAS[dt.getUTCDay()]}, ${d} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][m-1]}`; }
function fmtDataCurta(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}`; }
function diaPorData(iso) { return ROTEIRO.find(d => d.data === iso); }
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
function telLink(t) { return 'tel:' + t.replace(/[^+\d]/g, ''); }
function waLink(t, text) { const n = t.replace(/[^\d]/g, ''); return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`; }
function fmtTel(t) { return t.replace(/^\+(\d{2})(\d+)$/, '+$1 $2'); }

/* ===== Voz ===== */
let VOICES = [];
function loadVoices() { VOICES = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, lang = 'pt-BR') {
  if (!('speechSynthesis' in window)) return toast('Este celular não tem leitura em voz.');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = lang.startsWith('ar') ? 0.85 : 0.95;
  const pref = VOICES.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  const best = pref.find(v => /Luciana|Francisca|Maged|Tarik|Laila|Mariam/i.test(v.name)) || pref[0];
  if (best) u.voice = best;
  speechSynthesis.speak(u);
}
function stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); pararAudio(); }

/* ===== Áudio gravado (funciona com o iPhone no silencioso e sem internet) ===== */
const PLAYER = new Audio();
PLAYER.preload = 'auto';
// Não fixar a sessão de áudio em "playback": no Safari isso impede gravar pelo microfone (SOS).
// O <audio> do iPhone já toca com a chave de silencioso ligada.
function sessaoAudio(tipo) { try { if (navigator.audioSession) navigator.audioSession.type = tipo; } catch {} }
sessaoAudio('auto');
let AUDIO_ATUAL = null, AUDIO_RESERVA = null;
function tocar(src, reservaTexto, reservaLang) {
  if (AUDIO_ATUAL === src && PLAYER.src) {
    if (PLAYER.paused) PLAYER.play().catch(() => {}); else PLAYER.pause();
    return;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  AUDIO_ATUAL = src; AUDIO_RESERVA = reservaTexto ? [reservaTexto, reservaLang || 'pt-BR'] : null;
  PLAYER.src = audioURL(src);
  PLAYER.currentTime = 0;
  const p = PLAYER.play();
  if (p) p.catch(err => {
    if (err && err.name === 'NotAllowedError') return toast('Toque de novo para ouvir');
    usarReserva();
  });
  atualizarPlayerUI();
}
function usarReserva() {
  if (!AUDIO_RESERVA) return toast('Áudio indisponível agora. Abra com internet uma vez.');
  const [t, l] = AUDIO_RESERVA; AUDIO_ATUAL = null; speak(t, l);
}
PLAYER.addEventListener('error', () => { if (AUDIO_ATUAL) usarReserva(); });
function pararAudio() { PLAYER.pause(); if (AUDIO_ATUAL) { try { PLAYER.currentTime = 0; } catch {} } AUDIO_ATUAL = null; atualizarPlayerUI(); }
function fmtTempo(t) { if (!isFinite(t)) return '0:00'; t = Math.floor(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
function atualizarPlayerUI() {
  document.querySelectorAll('[data-audio]').forEach(b => {
    const ativo = b.dataset.audio === AUDIO_ATUAL;
    const tocando = ativo && !PLAYER.paused;
    b.classList.toggle('tocando', tocando);
    if (b.dataset.rotulo) b.innerHTML = tocando ? '⏸ Pausar' : (ativo && PLAYER.currentTime > 0 ? '▶️ Continuar' : b.dataset.rotulo);
    else b.textContent = tocando ? '⏸' : '🔊';
  });
  const bar = $('#player-bar');
  if (bar) {
    const ativo = bar.dataset.audio === AUDIO_ATUAL;
    const d = PLAYER.duration, c = ativo ? PLAYER.currentTime : 0;
    bar.max = isFinite(d) && ativo ? d : 100; bar.value = c;
    $('#player-tempo').textContent = ativo && isFinite(d) ? `${fmtTempo(c)} / ${fmtTempo(d)}` : '';
  }
}
['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach(ev => PLAYER.addEventListener(ev, atualizarPlayerUI));
PLAYER.addEventListener('ended', () => { AUDIO_ATUAL = null; atualizarPlayerUI(); });
function pularAudio(seg) { if (AUDIO_ATUAL) PLAYER.currentTime = Math.max(0, Math.min((PLAYER.duration || 0), PLAYER.currentTime + seg)); }

/* Guardar todos os áudios no celular para usar sem internet */
const AUDIO_CACHE = 'farao-audio-v2';
async function audiosGuardados() {
  if (!('caches' in window)) return 0;
  try { const c = await caches.open(AUDIO_CACHE); const ks = await c.keys(); const set = new Set(ks.map(k => k.url)); return AUDIOS.filter(a => set.has(new URL(a, location.href).href)).length; } catch { return 0; }
}
let BAIXANDO = false;
async function baixarAudios(silencioso) {
  if (BAIXANDO || !('caches' in window) || !navigator.onLine) return;
  BAIXANDO = true;
  try {
    const c = await caches.open(AUDIO_CACHE);
    for (const a of AUDIOS) {
      if (await c.match(new URL(a, location.href).href)) continue;
      try { const r = await fetch(a, { cache: 'reload' }); if (r.ok) await c.put(new URL(a, location.href).href, r); } catch {}
      const el = $('#audios-status'); if (el) el.textContent = `Baixando áudios… ${await audiosGuardados()} de ${AUDIOS.length}`;
    }
    // apaga versões antigas que não estão mais na lista
    const atuais = new Set(AUDIOS.map(a => new URL(a, location.href).href));
    for (const k of await c.keys()) if (!atuais.has(k.url)) await c.delete(k);
  } finally { BAIXANDO = false; }
  const n = await audiosGuardados();
  const el = $('#audios-status'); if (el) el.innerHTML = statusAudiosTexto(n);
  if (!silencioso) toast(n === AUDIOS.length ? 'Áudios guardados no celular' : 'Alguns áudios faltaram. Tente de novo no wi-fi.');
}
function statusAudiosTexto(n) { return n >= AUDIOS.length ? `✓ Todos os ${AUDIOS.length} áudios guardados. Funcionam sem internet.` : `${n} de ${AUDIOS.length} áudios guardados no celular.`; }
window.addEventListener('load', () => setTimeout(() => baixarAudios(true), 4000));

/* ===== Estado ===== */
const SOS_TEL_PADRAO = '+5511987511415'; // Rodrigo
const Cfg = {
  get() {
    const c = Object.assign({ nome: '', amiga: 'Iracema', familiaNome: 'Rodrigo', familiaTel: '', pin: '', callmebot: '' }, Store.get('cfg', {}));
    if (!c.familiaTel) { c.familiaTel = SOS_TEL_PADRAO; c.familiaNome = c.familiaNome || 'Rodrigo'; }
    return c;
  },
  set(c) { Store.set('cfg', c); },
};
const Rem = {
  list() { return Store.get('remedios', []); },
  save(l) { Store.set('remedios', l); },
  tomados(iso) { return Store.get('tomados.' + iso, {}); },
  marcar(iso, key, v) { const t = Rem.tomados(iso); if (v) t[key] = Date.now(); else delete t[key]; Store.set('tomados.' + iso, t); },
};
const Ficha = { get() { return Store.get('ficha', { condicoes: [], alergias: [] }); }, set(f) { Store.set('ficha', f); } };
const Gastos = { list() { return Store.get('gastos', []); }, save(l) { Store.set('gastos', l); } };
const Rates = { get() { return Store.get('rates', { USD_EGP: DINHEIRO.cotacaoPadrao.USD_EGP, USD_BRL: DINHEIRO.cotacaoPadrao.USD_BRL, em: null }); }, set(r) { Store.set('rates', r); } };

/* ===== Overlay (cartão grande) ===== */
function overlay(html) {
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<button class="close" onclick="this.parentNode.remove(); stopSpeak()">✕</button>${html}`;
  document.body.appendChild(o);
  return o;
}
function mostrarCartao(pt, ar, en, falar) {
  overlay(`<div class="big"><div class="ar">${esc(ar)}</div><div class="en">${esc(en)}</div><div class="pt">${esc(pt)}</div>
  ${falar ? `<button class="btn nile" onclick="tocar('${falar}', ${esc(JSON.stringify(ar))}, 'ar-EG')">🔊 Falar em árabe</button>` : ''}
  <p class="muted small">Mostre esta tela para a pessoa.</p></div>`);
}

/* ===== Router ===== */
const NAV = ['hoje', 'roteiro', 'guia', 'frases', 'mais'];
function go(h) { location.hash = '#' + h; }
window.addEventListener('hashchange', render);
window.addEventListener('load', () => { importarDoLink(); render(true); });
// render(true) redesenha a mesma tela mantendo a posição de rolagem (usado ao marcar itens).
function render(manter) {
  const y = manter === true ? window.scrollY : 0;
  if (manter !== true) stopSpeak();
  const raw = location.hash.slice(1) || 'hoje';
  const [view, ...args] = raw.split('/');
  const fn = Views[view] || Views.hoje;
  const main = $('#main');
  if (manter !== true) { main.innerHTML = ''; window.scrollTo(0, 0); }
  const res = fn(...args);
  const fim = r => { draw(r, view); if (y) window.scrollTo(0, y); };
  if (res && res.then) res.then(fim); else fim(res);
}
function draw(r, view) {
  if (!r) return;
  $('#main').innerHTML = r.html;
  $('#title').textContent = r.title || 'Eu falei Faraó';
  const back = $('#back');
  back.hidden = NAV.includes(view);
  back.onclick = () => history.length > 1 ? history.back() : go('hoje');
  document.querySelectorAll('nav.bottom a').forEach(a => a.classList.toggle('active', a.dataset.nav === (r.nav || view)));
  if (r.after) r.after();
}

/* ===== Views ===== */
const Views = {};

Views.hoje = () => {
  const cfg = Cfg.get();
  const iso = hojeISO();
  const dia = diaPorData(iso);
  const eg = partsIn(TZ), br = partsIn(TZBR);
  let html = '';
  const relogios = `<div class="clock"><div><span class="muted small">Egito</span><b id="clk-eg">${eg.hm}</b></div><div><span class="muted small">Brasil</span><b id="clk-br">${br.hm}</b></div></div>`;
  if (!dia) {
    const ini = new Date(VIAGEM.inicio + 'T00:00:00'), hoje = new Date(iso + 'T00:00:00');
    const faltam = Math.round((ini - hoje) / 864e5);
    if (faltam > 0) {
      html += `<div class="hero"><div class="muted">${fmtData(iso)}</div><h1>Falta${faltam > 1 ? 'm' : ''} ${faltam} dia${faltam > 1 ? 's' : ''} para o Egito</h1><div class="muted">${VIAGEM.titulo}</div></div>`;
      html += SOS_BOTAO() + relogios;
      html += `<h2>Antes de embarcar</h2>${checklistMala()}`;
      html += `<div class="card nile"><b>Instale o app na tela de início</b><p class="small">No Safari, toque no botão de compartilhar (quadrado com seta) e depois em "Adicionar à Tela de Início". Assim ele abre como aplicativo e funciona sem internet.</p></div>`;
    } else {
      html += `<div class="hero"><h1>Bem-vinda de volta!</h1><div class="muted">A viagem terminou em ${fmtDataCurta(VIAGEM.fim)}. O roteiro e o guia continuam aqui para lembrar.</div></div>` + relogios;
    }
    return { title: 'Hoje', html, after: tickClock };
  }
  const hotel = dia.hotel ? HOTEIS[dia.hotel] : null;
  html += `<div class="hero"><div class="muted">${fmtData(iso)} · Dia ${dia.n} de ${ROTEIRO.length}</div><h1>${esc(dia.titulo)}</h1><div class="muted">📍 ${esc(dia.cidade)}</div></div>`;
  html += SOS_BOTAO() + relogios;
  html += `<div id="clima"></div>`;
  html += `<div class="grid2" style="margin:12px 0">
    <a class="btn" href="#frases"><span class="ico">💬</span>Frases</a>
    <a class="btn" href="#camera"><span class="ico">📷</span>Traduzir com câmera</a>
    <a class="btn nile" href="#album"><span class="ico">🖼️</span>Fotos da viagem</a>
    <a class="btn nile" href="#dinheiro"><span class="ico">💵</span>Dinheiro</a>
    <a class="btn green" href="#familia"><span class="ico">💚</span>Avisar família</a>
    <a class="btn secondary" href="#ajuda"><span class="ico">⛑️</span>Ajuda</a></div>`;
  html += `<h2>Remédios de hoje</h2>` + remediosHoje(iso);
  html += `<h2>Programa de hoje</h2><div class="card tap" onclick="go('dia/${dia.n}')"><div class="body"><p>${esc(dia.resumo)}</p><ul class="dots">${dia.atividades.map(a => `<li><b>${esc(a.t)}</b></li>`).join('')}</ul>${dia.opcionais.length ? `<p class="small"><span class="pill opt">Opcional</span>${dia.opcionais.map(o => esc(o.t)).join(' · ')}</p>` : ''}<p class="muted small">Toque para ver detalhes e dicas</p></div><span class="chev">›</span></div>`;
  if (dia.dicas.length) html += `<div class="card sand"><b>Dicas de hoje</b><ul class="dots">${dia.dicas.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>`;
  if (hotel) html += hotelCard(hotel);
  if (dia.lugares.length) html += `<h2>Para ouvir no caminho</h2>` + dia.lugares.filter(id => LUGARES[id]).map(id => `<div class="card tap" onclick="go('lugar/${id}')"><div class="body"><b>${esc(LUGARES[id].nome)}</b><div class="muted small">${esc(LUGARES[id].epoca)}</div></div><span class="chev">›</span></div>`).join('');
  return { title: 'Hoje', html, after: () => { tickClock(); clima(dia.cidade, iso); } };
};

function tickClock() {
  const f = () => { const a = $('#clk-eg'), b = $('#clk-br'); if (!a) return; a.textContent = partsIn(TZ).hm; b.textContent = partsIn(TZBR).hm; };
  f(); clearInterval(window._clk); window._clk = setInterval(f, 15000);
}
async function clima(cidade, iso) {
  const el = $('#clima'); if (!el) return;
  const c = CIDADES[cidade]; if (!c) return;
  const key = 'clima.' + cidade + '.' + iso;
  let w = Store.get(key, null) || ((Store.get('clima16', {})[cidade] || {})[iso]) || null;
  if (!w && navigator.onLine) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FCairo&forecast_days=1`);
      const j = await r.json(); w = { max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]) }; Store.set(key, w);
    } catch {}
  }
  if (!w) return;
  const quente = w.max >= 32;
  el.innerHTML = `<div class="card ${quente ? 'red' : 'sand'}" style="display:flex;gap:12px;align-items:center"><div class="num">${w.max}°</div><div><b>${esc(cidade)} hoje: máxima ${w.max}°, mínima ${w.min}°</b><div class="small">${quente ? 'Dia muito quente: água a cada 30 minutos, chapéu e sombra sempre que der.' : 'Leve uma blusa para a noite.'}</div></div></div>`;
}
function hotelCard(h) {
  return `<div class="card"><b>🏨 ${esc(h.nome)}</b><div class="small">${esc(h.endereco)}</div><div class="muted small">${esc(h.regime)}</div>
  <div class="row" style="margin-top:10px">
    <button class="btn secondary sm" onclick="mostrarCartao('Me leve a este endereço, por favor', ${esc(JSON.stringify(h.enderecoAr))}, ${esc(JSON.stringify(h.nome + ' — ' + h.endereco))}, false)">🚕 Mostrar ao taxista</button>
    ${h.tel ? `<a class="btn secondary sm" href="${telLink(h.tel)}">📞 Ligar</a>` : ''}
    ${h.maps ? `<a class="btn secondary sm" href="${h.maps}" target="_blank">🗺️ Mapa</a>` : ''}
  </div>${h.telNota ? `<p class="muted small">${esc(h.telNota)}</p>` : ''}</div>`;
}
function checklistMala() {
  const done = Store.get('mala', {});
  return MALA.map(c => `<div class="card"><b>${esc(c.cat)}</b>${c.itens.map(i => { const k = c.cat + '|' + i; return `<div class="check ${done[k] ? 'done' : ''}" onclick="toggleMala(${esc(JSON.stringify(k))})"><div class="box">${done[k] ? '✓' : ''}</div><div class="label">${esc(i)}</div></div>`; }).join('')}</div>`).join('');
}
function toggleMala(k) { const d = Store.get('mala', {}); if (d[k]) delete d[k]; else d[k] = 1; Store.set('mala', d); render(true); }

const SOS_BOTAO = () => `<button class="sos-btn" onclick="iniciarSOS()"><span style="font-size:1.8rem">🆘</span><span>SOS<small>Selfie, áudio e localização para ${esc(Cfg.get().familiaNome)}</small></span></button>`;

/* ---- Remédios ---- */
function dosesDoDia(iso) {
  const out = [];
  Rem.list().forEach(r => (r.horarios || []).forEach(h => out.push({ key: r.id + '@' + h, h, r })));
  return out.sort((a, b) => a.h.localeCompare(b.h));
}
function remediosHoje(iso) {
  const doses = dosesDoDia(iso);
  if (!doses.length) return `<div class="card tap" onclick="go('remedios')"><div class="body">Nenhum remédio cadastrado ainda.<div class="muted small">Toque para cadastrar e receber lembretes.</div></div><span class="chev">›</span></div>`;
  const tom = Rem.tomados(iso); const agora = partsIn(TZ).hm;
  const next = doses.find(d => !tom[d.key]);
  return `<div class="card">${doses.map(d => `<div class="check ${tom[d.key] ? 'done' : ''} ${d === next ? 'next' : ''}" onclick="toggleDose('${iso}','${d.key}')"><div class="box">${tom[d.key] ? '✓' : ''}</div><div class="hora">${d.h}</div><div class="label"><b>${esc(d.r.nome)}</b> ${esc(d.r.dose || '')}${d.r.instrucao ? `<div class="muted small">${esc(d.r.instrucao)}</div>` : ''}</div></div>`).join('')}
  ${next ? `<p class="small" style="margin-top:10px">${next.h <= agora ? '⚠️ Dose pendente' : 'Próxima dose'}: <b>${next.h} · ${esc(next.r.nome)}</b></p>` : '<p class="small" style="margin-top:10px;color:var(--green)">✓ Todos os remédios de hoje tomados</p>'}
  <a class="btn outline sm" href="#remedios">Gerenciar remédios</a></div>`;
}
function toggleDose(iso, key) { const t = Rem.tomados(iso); Rem.marcar(iso, key, !t[key]); render(true); }

Views.remedios = () => {
  const l = Rem.list();
  let html = `<p class="muted">Cadastre cada remédio com os horários locais (do Egito). Os horários aparecem na tela Hoje para marcar quando tomar.</p>`;
  html += l.map(r => `<div class="card"><div class="row"><div><b>${esc(r.nome)}</b> <span class="muted">${esc(r.dose || '')}</span><div class="small">⏰ ${(r.horarios || []).join(' · ')}${r.instrucao ? ' · ' + esc(r.instrucao) : ''}</div>${r.obs ? `<div class="muted small">${esc(r.obs)}</div>` : ''}</div><button class="icobtn" style="flex:0 0 48px" onclick="editarRemedio('${r.id}')">✏️</button></div></div>`).join('');
  html += `<button class="btn" onclick="editarRemedio('')">＋ Adicionar remédio</button>`;
  if (l.length) {
    html += `<h2>Lembretes com alarme</h2><div class="card"><p class="small">O jeito mais seguro no iPhone é criar os alarmes no app <b>Relógio</b>, um para cada horário. Eles tocam no horário local, mesmo com o fuso diferente. Ou importe os lembretes no Calendário:</p><button class="btn nile" onclick="exportarICS()">📅 Adicionar ao Calendário do iPhone</button><p class="muted small">Vai abrir uma tela de importação. Toque em "Adicionar tudo". Os eventos se repetem todo dia até ${fmtDataCurta(VIAGEM.fim)} com alerta na hora.</p></div>`;
  }
  return { title: 'Remédios', html, nav: 'mais' };
};
function editarRemedio(id) {
  const l = Rem.list(); const r = l.find(x => x.id === id) || { id: '', nome: '', dose: '', horarios: ['08:00'], instrucao: '', obs: '' };
  const o = overlay(`<h2>${id ? 'Editar' : 'Novo'} remédio</h2>
    <label class="f">Nome do remédio</label><input id="r-nome" value="${esc(r.nome)}" placeholder="Ex.: Losartana">
    <label class="f">Dose</label><input id="r-dose" value="${esc(r.dose)}" placeholder="Ex.: 1 comprimido de 50 mg">
    <label class="f">Horários (separados por vírgula)</label><input id="r-hor" value="${esc((r.horarios || []).join(', '))}" placeholder="Ex.: 08:00, 20:00">
    <label class="f">Instrução</label><select id="r-inst"><option value="">—</option>${['Em jejum', 'Com comida', 'Depois do café', 'Antes de dormir', 'Com bastante água', 'Longe de outros remédios (1 hora)'].map(i => `<option ${r.instrucao === i ? 'selected' : ''}>${i}</option>`).join('')}</select>
    <label class="f">Observação</label><textarea id="r-obs" placeholder="Ex.: para a pressão. Receita na pasta azul.">${esc(r.obs)}</textarea>
    <button class="btn" id="r-save">Salvar</button>${id ? `<button class="btn outline" id="r-del">Excluir</button>` : ''}`);
  $('#r-save', o).onclick = () => {
    const nome = $('#r-nome', o).value.trim(); if (!nome) return toast('Escreva o nome do remédio');
    const horarios = $('#r-hor', o).value.split(/[,;\s]+/).map(h => h.trim()).filter(Boolean).map(h => { const m = h.match(/^(\d{1,2})[:h]?(\d{2})?$/); return m ? `${String(m[1]).padStart(2, '0')}:${m[2] || '00'}` : null; }).filter(Boolean);
    if (!horarios.length) return toast('Informe pelo menos um horário, ex.: 08:00');
    const novo = { id: id || 'r' + Date.now(), nome, dose: $('#r-dose', o).value.trim(), horarios, instrucao: $('#r-inst', o).value, obs: $('#r-obs', o).value.trim() };
    const idx = l.findIndex(x => x.id === id); if (idx >= 0) l[idx] = novo; else l.push(novo);
    Rem.save(l); o.remove(); render(true); toast('Remédio salvo');
  };
  if (id) $('#r-del', o).onclick = () => { if (confirm('Excluir este remédio?')) { Rem.save(l.filter(x => x.id !== id)); o.remove(); render(true); } };
}
function exportarICS() {
  const l = Rem.list(); const ini = VIAGEM.inicio.replace(/-/g, ''), fim = VIAGEM.fim.replace(/-/g, '');
  const ev = [];
  l.forEach(r => (r.horarios || []).forEach(h => {
    const hh = h.replace(':', '');
    ev.push(`BEGIN:VEVENT\r\nUID:${r.id}-${hh}@egito\r\nDTSTAMP:${ini}T000000Z\r\nDTSTART:${ini}T${hh}00\r\nDTEND:${ini}T${hh}00\r\nRRULE:FREQ=DAILY;UNTIL=${fim}T235959\r\nSUMMARY:💊 ${r.nome}${r.dose ? ' – ' + r.dose : ''}\r\nDESCRIPTION:${r.instrucao || ''} ${r.obs || ''}\r\nBEGIN:VALARM\r\nTRIGGER:PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:Hora do remédio: ${r.nome}\r\nEND:VALARM\r\nEND:VEVENT`);
  }));
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Eu falei Farao//PT\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:Remédios – Egito\r\n${ev.join('\r\n')}\r\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'remedios-egito.ics'; document.body.appendChild(a); a.click(); a.remove();
}

/* ---- Roteiro ---- */
Views.roteiro = () => {
  const iso = hojeISO();
  const html = `<div class="card sand"><b>${esc(VIAGEM.titulo)}</b><div class="small">${fmtDataCurta(VIAGEM.inicio)} a ${fmtDataCurta(VIAGEM.fim)} · ${esc(VIAGEM.operadora)}</div><div class="muted small">Voucher ${esc(VIAGEM.voucher)} · ${esc(VIAGEM.acomodacao)}</div></div>` +
    ROTEIRO.map(d => `<div class="card tap ${d.data === iso ? 'nile' : ''}" onclick="go('dia/${d.n}')"><div class="body"><div class="muted small">Dia ${d.n} · ${fmtData(d.data)}${d.data === iso ? ' · <b>HOJE</b>' : ''}</div><b>${esc(d.titulo)}</b><div class="small">📍 ${esc(d.cidade)}${d.hotel ? ' · 🏨 ' + esc(HOTEIS[d.hotel].nome) : ''}</div></div><span class="chev">›</span></div>`).join('') +
    `<h2>Hotéis e cruzeiro</h2>` + Object.values(HOTEIS).map(hotelCard).join('') +
    `<h2>Incluído no pacote</h2><div class="card"><ul class="dots"><li>Chip de internet 5 GB (WhatsApp, Instagram, Facebook; sem vídeos)</li><li>Guia em português em todos os passeios</li><li>Voos internos com 25 kg + 8 kg de mão</li><li>Visto de entrada</li><li>Gorjeta da tripulação do cruzeiro (US$ 50) já paga</li></ul><p class="small"><b>Não incluído:</b> bebidas, passeios opcionais, gorjeta de guia e motorista (sugestão: US$ 8 por pessoa por dia).</p></div>`;
  return { title: 'Roteiro', html };
};
Views.dia = n => {
  const d = ROTEIRO.find(x => x.n === +n); if (!d) return Views.roteiro();
  const hotel = d.hotel ? HOTEIS[d.hotel] : null;
  let html = `<div class="hero"><div class="muted">Dia ${d.n} · ${fmtData(d.data)}</div><h1>${esc(d.titulo)}</h1><div class="muted">📍 ${esc(d.cidade)}</div></div><p>${esc(d.resumo)}</p>`;
  html += `<h2>Programa</h2><div class="card"><ul class="clean">${d.atividades.map(a => `<li><b>${esc(a.t)}</b><div class="small">${esc(a.d)}</div>${a.lugar && LUGARES[a.lugar] ? `<a href="#lugar/${a.lugar}" class="small">📖 Ouvir a história</a>` : ''}</li>`).join('')}</ul></div>`;
  if (d.opcionais.length) html += `<h2>Opcionais (pagos à parte)</h2><div class="card nile"><ul class="clean">${d.opcionais.map(o => `<li><b>${esc(o.t)}</b><div class="small">${esc(o.d)}</div>${o.lugar && LUGARES[o.lugar] ? `<a href="#lugar/${o.lugar}" class="small">📖 Ouvir a história</a>` : ''}</li>`).join('')}</ul></div>`;
  if (d.dicas.length) html += `<h2>Dicas do dia</h2><div class="card sand"><ul class="dots">${d.dicas.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  if (hotel) html += `<h2>Onde dormir</h2>` + hotelCard(hotel);
  const prev = ROTEIRO.find(x => x.n === d.n - 1), next = ROTEIRO.find(x => x.n === d.n + 1);
  html += `<div class="row">${prev ? `<a class="btn secondary" href="#dia/${prev.n}">‹ Dia ${prev.n}</a>` : '<span></span>'}${next ? `<a class="btn secondary" href="#dia/${next.n}">Dia ${next.n} ›</a>` : ''}</div>`;
  return { title: `Dia ${d.n}`, html, nav: 'roteiro' };
};

/* ---- Guia histórico ---- */
Views.guia = (tab = 'lugares') => {
  let html = `<div class="tabs"><button class="${tab === 'lugares' ? 'active' : ''}" onclick="go('guia/lugares')">Lugares</button><button class="${tab === 'faraos' ? 'active' : ''}" onclick="go('guia/faraos')">Faraós</button><button class="${tab === 'deuses' ? 'active' : ''}" onclick="go('guia/deuses')">Deuses</button><button class="${tab === 'fotos' ? 'active' : ''}" onclick="go('guia/fotos')">Fotografia</button></div>`;
  if (tab === 'lugares') {
    const ordem = []; ROTEIRO.forEach(d => d.lugares.forEach(id => { if (!ordem.includes(id) && LUGARES[id]) ordem.push(id); }));
    html += `<p class="muted">Toque em um lugar e use "Ouvir" para escutar a história enquanto visita.</p>` + ordem.map(id => { const l = LUGARES[id]; const dia = ROTEIRO.find(d => d.lugares.includes(id)); return `<div class="card tap" onclick="go('lugar/${id}')"><div class="body"><b>${esc(l.nome)}</b><div class="muted small">${esc(l.regiao)} · Dia ${dia.n} (${fmtDataCurta(dia.data)})</div></div><span class="chev">›</span></div>`; }).join('');
  } else if (tab === 'faraos') {
    html += FARAOS.map((f, i) => `<div class="card"><div class="row"><div><b>${esc(f.nome)}</b><div class="muted small">${esc(f.epoca)}</div></div><button class="icobtn nile" style="flex:0 0 48px" data-audio="audio/faraos/${i}.m4a" onclick="tocar('audio/faraos/${i}.m4a', ${esc(JSON.stringify(f.nome + '. ' + f.texto))})">🔊</button></div><p class="small">${esc(f.texto)}</p></div>`).join('');
  } else if (tab === 'deuses') {
    html += DEUSES.map(f => `<div class="card"><b>${esc(f.nome)}</b><p class="small">${esc(f.texto)}</p></div>`).join('');
  } else {
    html += `<div class="card"><ul class="dots">${FOTOGRAFIA.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><p class="muted small">Cada lugar no guia tem a sua dica de foto específica.</p>`;
  }
  return { title: 'Guia', html, nav: 'guia' };
};
Views.lugar = id => {
  const l = LUGARES[id]; if (!l) return Views.guia();
  const texto = `${l.nome}. ${l.epoca}. ${l.historia}`;
  const html = `<div class="hero"><div class="muted">${esc(l.regiao)} · ${esc(l.epoca)}</div><h1>${esc(l.nome)}</h1></div>
  <div class="card nile player"><button class="btn nile" data-audio="audio/lugares/${id}.m4a" data-rotulo="🔊 Ouvir a história" onclick="tocar('audio/lugares/${id}.m4a', ${esc(JSON.stringify(texto))})">🔊 Ouvir a história</button>
  <input type="range" id="player-bar" data-audio="audio/lugares/${id}.m4a" min="0" max="100" value="0" step="1" oninput="if(AUDIO_ATUAL===this.dataset.audio) PLAYER.currentTime=+this.value">
  <div class="row small"><button class="btn secondary sm" onclick="pularAudio(-15)">⏪ 15s</button><span id="player-tempo" class="muted" style="text-align:center"></span><button class="btn secondary sm" onclick="pularAudio(15)">15s ⏩</button></div>
  <p class="muted small" style="margin:6px 0 0">Funciona com o iPhone no silencioso. Aumente o volume pelos botões laterais.</p></div>
  <div class="card"><p>${esc(l.historia)}</p></div>
  <h2>O que não perder</h2><div class="card sand"><ul class="dots">${l.olhar.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <h2>📸 Foto</h2><div class="card"><p class="small">${esc(l.foto)}</p></div>
  <h2>Na prática</h2><div class="card nile"><p class="small">${esc(l.pratico)}</p></div>`;
  return { title: l.nome, html, nav: 'guia' };
};

/* ---- Frases ---- */
Views.frases = (cat) => {
  const cats = FRASES.map(c => c.cat); const atual = cat ? decodeURIComponent(cat) : cats[0];
  const grupo = FRASES.find(c => c.cat === atual) || FRASES[0]; const ci = FRASES.indexOf(grupo);
  let html = `<a class="btn" href="#camera">📷 Traduzir placa ou cardápio com a câmera</a><div class="card nile"><b>Traduzir qualquer coisa</b><p class="small">Para conversa ao vivo e para fotografar cardápios, use o Google Tradutor (instale e baixe os pacotes Português, Árabe e Inglês para funcionar sem internet).</p><div class="row"><a class="btn sm nile" href="https://translate.google.com/?sl=pt&tl=ar&op=translate" target="_blank">Abrir Tradutor</a><button class="btn sm secondary" onclick="traduzirTexto()">Escrever e traduzir</button></div></div>`;
  html += `<div class="tabs">${cats.map(c => `<button class="${c === atual ? 'active' : ''}" onclick="go('frases/${encodeURIComponent(c)}')">${esc(c)}</button>`).join('')}</div>`;
  html += `<div class="card">${grupo.itens.map((f, ii) => `<div class="frase"><div class="body"><div class="pt">${esc(f.pt)}</div><div class="tr small">${esc(f.tr)}</div><div class="ar">${esc(f.ar)}</div></div><button class="icobtn nile" data-audio="audio/frases/${ci}_${ii}.m4a" onclick="tocar('audio/frases/${ci}_${ii}.m4a', ${esc(JSON.stringify(f.ar))}, 'ar-EG')">🔊</button><button class="icobtn" onclick="mostrarCartao(${esc(JSON.stringify(f.pt))}, ${esc(JSON.stringify(f.ar))}, ${esc(JSON.stringify(f.en))}, 'audio/frases/${ci}_${ii}.m4a')">👁️</button></div>`).join('')}</div>
  <p class="muted small">🔊 fala em árabe · 👁️ mostra a frase grande em árabe e inglês para a pessoa ler.</p>`;
  return { title: 'Frases', html, nav: 'frases' };
};
function traduzirTexto() {
  const o = overlay(`<h2>Escrever e traduzir</h2><p class="small">Escreva em português. Vai abrir o Google Tradutor com o texto pronto em árabe.</p><textarea id="tx" placeholder="Ex.: Preciso de um remédio para dor de cabeça"></textarea><div class="row"><button class="btn nile" id="tx-ar">→ Árabe</button><button class="btn secondary" id="tx-en">→ Inglês</button></div>`);
  const open = tl => { const t = $('#tx', o).value.trim(); if (!t) return toast('Escreva alguma coisa'); window.open(`https://translate.google.com/?sl=pt&tl=${tl}&text=${encodeURIComponent(t)}&op=translate`, '_blank'); };
  $('#tx-ar', o).onclick = () => open('ar'); $('#tx-en', o).onclick = () => open('en');
}

/* ---- Ajuda / SOS ---- */
Views.ajuda = async () => {
  const cfg = Cfg.get();
  let html = SOS_BOTAO() + `<div class="card red"><b>Em emergência médica: ligue 123 (ambulância) e avise a Corsini. Fale devagar em português, eles entendem.</b></div>`;
  html += `<h2>Ligar agora</h2>`;
  html += `<a class="btn red" href="tel:123">🚑 Ambulância · 123</a><a class="btn red" href="tel:126">👮 Polícia Turística · 126</a>`;
  html += VIAGEM.emergencia.slice(0, 2).map(e => `<div class="row"><a class="btn nile" href="${telLink(e.tel)}">📞 Corsini 24h</a><a class="btn green" href="${waLink(e.tel)}" target="_blank">💬 WhatsApp</a></div><p class="muted small" style="margin-top:-4px">${esc(e.nome)} · ${fmtTel(e.tel)} · fala português</p>`).join('');
  if (cfg.familiaTel) html += `<div class="row"><a class="btn" href="${telLink(cfg.familiaTel)}">📞 ${esc(cfg.familiaNome)}</a><a class="btn green" href="${waLink(cfg.familiaTel)}" target="_blank">💬 WhatsApp</a></div>`;
  html += `<button class="btn" onclick="enviarLocalizacao()">📍 Mandar minha localização para ${esc(cfg.familiaNome || 'a família')}</button>`;
  html += `<h2>Perto de mim</h2><div class="row"><a class="btn secondary" href="https://maps.google.com/?q=hospital" target="_blank">🏥 Hospital</a><a class="btn secondary" href="https://maps.google.com/?q=pharmacy" target="_blank">💊 Farmácia</a></div>`;
  html += `<a class="btn outline" href="#ficha">🩺 Minha ficha médica (mostrar ao médico)</a>`;
  html += `<h2>O que fazer se…</h2><div class="card">${EMERGENCIA.oqueFazer.map(x => `<details><summary>${esc(x.t)}</summary><p class="small">${esc(x.d)}</p></details>`).join('')}</div>`;
  html += `<h2>Outros telefones</h2><div class="card"><ul class="clean">${[...EMERGENCIA.locais.slice(2), ...EMERGENCIA.brasil, ...VIAGEM.emergencia.slice(2)].map(e => `<li><div class="row"><div><b>${esc(e.nome)}</b><div class="muted small">${esc(e.desc || '')}</div></div><a class="btn secondary sm" href="${telLink(e.tel)}">${esc(fmtTel(e.tel))}</a></div></li>`).join('')}</ul></div>`;
  html += `<div class="card sand"><b>Farmácias</b><p class="small">${esc(EMERGENCIA.farmacia)}</p><b>Hospitais</b><p class="small">${esc(EMERGENCIA.hospitais)}</p></div>`;
  html += `<a class="btn outline" href="#localizacao">📍 Compartilhar localização em tempo real</a>`;
  html += await sosHistoricoHtml();
  return { title: 'Ajuda', html, nav: 'mais' };
};
function enviarLocalizacao() {
  const cfg = Cfg.get(); if (!cfg.familiaTel) return toast('Cadastre o telefone da família em Configurações');
  toast('Buscando localização…');
  Pos.agora(12000).then(p => {
    if (!p) return toast('Não consegui pegar o GPS. Ative a Localização em Ajustes.');
    const l = descreverLocal(p.lat, p.lon); const idade = Math.round((Date.now() - p.t) / 60000);
    const msg = `📍 Estou aqui${l ? ': ' + l.nome : ''}${idade > 2 ? ` (há ${idade} min)` : ''}\n${mapsLink(p.lat, p.lon)}`;
    window.location.href = waLink(cfg.familiaTel, msg);
  });
}

/* ---- Ficha médica ---- */
Views.ficha = (modo) => {
  const f = Ficha.get(); const cfg = Cfg.get();
  if (modo === 'mostrar') {
    const L = (pt, en, ar) => `<div class="muted small">${pt} · ${en} · <span dir="rtl">${ar}</span></div>`;
    const rem = Rem.list();
    const html = `<div class="card"><h2 style="margin-top:0">Medical information · معلومات طبية</h2>
      ${L('Nome', 'Name', 'الاسم')}<p><b>${esc(f.nome || cfg.nome || '')}</b></p>
      ${L('Nascimento', 'Date of birth', 'تاريخ الميلاد')}<p><b>${esc(f.nasc || '')}</b></p>
      ${L('Tipo sanguíneo', 'Blood type', 'فصيلة الدم')}<p><b>${esc(f.sangue || '?')}</b></p>
      ${L('Condições', 'Medical conditions', 'الحالات الطبية')}<ul class="dots">${(f.condicoes || []).map(id => CONDICOES.find(c => c.id === id)).filter(Boolean).map(c => `<li>${esc(c.en)} <span dir="rtl" style="display:inline-block">${esc(c.ar)}</span> <span class="muted small">(${esc(c.pt)})</span></li>`).join('')}${f.condOutras ? `<li>${esc(f.condOutras)}</li>` : ''}</ul>
      ${L('Alergias', 'Allergies', 'الحساسية')}<ul class="dots">${(f.alergias || []).length || f.alergOutras ? (f.alergias || []).map(id => ALERGIAS.find(c => c.id === id)).filter(Boolean).map(c => `<li>${esc(c.en)} <span dir="rtl" style="display:inline-block">${esc(c.ar)}</span></li>`).join('') + (f.alergOutras ? `<li>${esc(f.alergOutras)}</li>` : '') : '<li>No known allergies · لا توجد حساسية معروفة</li>'}</ul>
      ${L('Remédios em uso', 'Current medication', 'الأدوية الحالية')}<ul class="dots">${rem.map(r => `<li><b>${esc(r.nome)}</b> ${esc(r.dose)} – ${(r.horarios || []).join(', ')}</li>`).join('') || '<li>—</li>'}</ul>
      ${f.cirurgias ? L('Cirurgias', 'Surgeries', 'العمليات الجراحية') + `<p>${esc(f.cirurgias)}</p>` : ''}
      ${L('Contato de emergência', 'Emergency contact', 'جهة اتصال للطوارئ')}<p><b>${esc(f.contatoNome || cfg.familiaNome)}</b> · ${esc(f.contatoTel || cfg.familiaTel)} (Brazil)</p>
      ${f.seguro ? L('Seguro-viagem', 'Travel insurance', 'تأمين السفر') + `<p><b>${esc(f.seguro)}</b> · Apólice/Policy: ${esc(f.apolice || '')} · ${esc(f.seguroTel || '')}</p>` : ''}
      ${f.medico ? L('Médico no Brasil', 'Doctor in Brazil', 'الطبيب في البرازيل') + `<p>${esc(f.medico)}</p>` : ''}
      <p class="muted small">Portuguese speaker. Please call the emergency contact or the tour operator Corsini (+20 114 414 1314) for translation.</p></div>
      <a class="btn secondary" href="#ficha">Editar ficha</a>`;
    return { title: 'Ficha médica', html, nav: 'mais' };
  }
  const chk = (arr, lista, key) => lista.map(c => `<label class="chk"><input type="checkbox" data-k="${key}" value="${c.id}" ${(arr || []).includes(c.id) ? 'checked' : ''}> ${esc(c.pt)}</label>`).join('');
  const html = `<a class="btn nile" href="#ficha/mostrar">🩺 Mostrar ao médico (inglês e árabe)</a>
  <div class="card"><label class="f">Nome completo</label><input id="f-nome" value="${esc(f.nome || '')}">
  <label class="f">Data de nascimento</label><input id="f-nasc" value="${esc(f.nasc || '')}" placeholder="dd/mm/aaaa">
  <label class="f">Tipo sanguíneo</label><select id="f-sangue">${['?', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(s => `<option ${f.sangue === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
  <h3>Condições de saúde</h3>${chk(f.condicoes, CONDICOES, 'condicoes')}<label class="f">Outras condições</label><textarea id="f-condOutras">${esc(f.condOutras || '')}</textarea>
  <h3>Alergias</h3>${chk(f.alergias, ALERGIAS, 'alergias')}<label class="f">Outras alergias</label><textarea id="f-alergOutras">${esc(f.alergOutras || '')}</textarea>
  <label class="f">Cirurgias e tratamentos anteriores</label><textarea id="f-cirurgias" placeholder="Ex.: tireoidectomia total em 2018; mastectomia em 2020">${esc(f.cirurgias || '')}</textarea>
  <h3>Contato de emergência</h3><label class="f">Nome</label><input id="f-contatoNome" value="${esc(f.contatoNome || cfg.familiaNome || '')}"><label class="f">Telefone (com +55)</label><input id="f-contatoTel" value="${esc(f.contatoTel || cfg.familiaTel || '')}" inputmode="tel">
  <h3>Seguro-viagem</h3><label class="f">Seguradora</label><input id="f-seguro" value="${esc(f.seguro || '')}"><label class="f">Número da apólice</label><input id="f-apolice" value="${esc(f.apolice || '')}"><label class="f">Telefone da assistência 24h</label><input id="f-seguroTel" value="${esc(f.seguroTel || '')}" inputmode="tel">
  <label class="f">Médico no Brasil (nome e telefone)</label><input id="f-medico" value="${esc(f.medico || '')}">
  <button class="btn" onclick="salvarFicha()">Salvar ficha</button></div>
  <p class="muted small">Os remédios da ficha vêm da tela Remédios. Tudo fica guardado só neste celular.</p>`;
  return { title: 'Ficha médica', html, nav: 'mais' };
};
function salvarFicha() {
  const g = id => $('#f-' + id).value.trim();
  const f = { nome: g('nome'), nasc: g('nasc'), sangue: $('#f-sangue').value, condOutras: g('condOutras'), alergOutras: g('alergOutras'), cirurgias: g('cirurgias'), contatoNome: g('contatoNome'), contatoTel: g('contatoTel'), seguro: g('seguro'), apolice: g('apolice'), seguroTel: g('seguroTel'), medico: g('medico'), condicoes: [], alergias: [] };
  document.querySelectorAll('input[type=checkbox][data-k]').forEach(c => { if (c.checked) f[c.dataset.k].push(c.value); });
  Ficha.set(f); toast('Ficha salva'); go('ficha/mostrar');
}

/* ---- Documentos ---- */
Views.documentos = async () => {
  const cfg = Cfg.get();
  if (cfg.pin && sessionStorage.getItem('pinok') !== cfg.pin) {
    return { title: 'Documentos', nav: 'mais', html: `<div class="card"><h2 style="margin-top:0">Digite o PIN</h2><input id="pin" inputmode="numeric" type="password" placeholder="••••" style="font-size:1.6rem;text-align:center;letter-spacing:8px"><button class="btn" onclick="(function(){ if ($('#pin').value === Cfg.get().pin) { sessionStorage.setItem('pinok', $('#pin').value); render(true); } else toast('PIN incorreto'); })()">Abrir</button></div>` };
  }
  const docs = await DB.all();
  const html = `<p class="muted">Fotografe passaporte, cartão de vacina, seguro, cartões, receitas. Ficam guardados só neste celular, para mostrar quando precisar.</p>
  <div class="row"><label class="btn"><input type="file" accept="image/*" capture="environment" hidden onchange="addDoc(this)">📷 Fotografar</label><label class="btn secondary"><input type="file" accept="image/*" hidden onchange="addDoc(this)">🖼️ Da galeria</label></div>
  <div class="docgrid">${docs.map(d => `<div class="doc" onclick="verDoc('${d.id}')"><img src="${URL.createObjectURL(d.blob)}" alt=""><div class="t">${esc(d.titulo)}</div></div>`).join('')}</div>
  ${!docs.length ? '<p class="muted">Nenhum documento ainda. Sugestões: passaporte (página da foto), cartão de febre amarela, cartão do seguro, cartão de crédito (frente), receitas médicas, voucher da agência, passagem aérea.</p>' : ''}
  <p class="muted small" style="margin-top:20px">${cfg.pin ? '🔒 Protegido por PIN.' : 'Dica: defina um PIN em Configurações para proteger esta área.'}</p>`;
  return { title: 'Documentos', html, nav: 'mais' };
};
async function addDoc(input) {
  const file = input.files[0]; if (!file) return;
  const titulo = prompt('Nome do documento (ex.: Passaporte)', '') || 'Documento';
  toast('Guardando…');
  const blob = await reduzirImagem(file, 1800);
  await DB.put({ id: 'd' + Date.now(), titulo, blob, criado: Date.now() });
  render(true);
}
function reduzirImagem(file, max) {
  return new Promise(res => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(url); res(b || file); }, 'image/jpeg', 0.88);
    };
    img.onerror = () => res(file);
    img.src = url;
  });
}
async function verDoc(id) {
  const d = (await DB.all()).find(x => x.id === id); if (!d) return;
  const o = overlay(`<div class="docview" style="text-align:center"><h2>${esc(d.titulo)}</h2><img src="${URL.createObjectURL(d.blob)}" alt=""><div class="row" style="margin-top:12px"><button class="btn secondary" id="d-ren">Renomear</button><button class="btn outline" id="d-del">Excluir</button></div></div>`);
  $('#d-del', o).onclick = async () => { if (confirm('Excluir "' + d.titulo + '"?')) { await DB.del(id); o.remove(); render(true); } };
  $('#d-ren', o).onclick = async () => { const t = prompt('Novo nome', d.titulo); if (t) { d.titulo = t; await DB.put(d); o.remove(); render(true); } };
}

/* ---- Dinheiro ---- */
Views.dinheiro = () => {
  const r = Rates.get();
  const html = `<div class="card conv"><b>Conversor</b><p class="muted small">Digite em qualquer campo.</p>
    <div class="row" style="margin:8px 0"><input id="c-egp" inputmode="decimal" value="100"><span class="cur">EGP</span></div>
    <div class="row" style="margin:8px 0"><input id="c-usd" inputmode="decimal"><span class="cur">US$</span></div>
    <div class="row" style="margin:8px 0"><input id="c-brl" inputmode="decimal"><span class="cur">R$</span></div>
    <p class="muted small" id="c-info">1 US$ = ${r.USD_EGP.toFixed(2)} EGP · 1 US$ = R$ ${r.USD_BRL.toFixed(2)} · 1 EGP ≈ R$ ${(r.USD_BRL / r.USD_EGP).toFixed(3)}${r.em ? ' · atualizado ' + r.em : ' · cotação de referência'}</p>
    <button class="btn secondary sm" onclick="atualizarCotacao()">↻ Atualizar cotação</button></div>
  <div class="card sand"><b>Referência rápida</b><div class="kv"><span>10 EGP</span><b>≈ R$ ${(10 * r.USD_BRL / r.USD_EGP).toFixed(2)}</b></div><div class="kv"><span>50 EGP</span><b>≈ R$ ${(50 * r.USD_BRL / r.USD_EGP).toFixed(2)}</b></div><div class="kv"><span>100 EGP</span><b>≈ R$ ${(100 * r.USD_BRL / r.USD_EGP).toFixed(2)}</b></div><div class="kv"><span>500 EGP</span><b>≈ R$ ${(500 * r.USD_BRL / r.USD_EGP).toFixed(2)}</b></div><div class="kv"><span>US$ 1</span><b>≈ ${r.USD_EGP.toFixed(0)} EGP</b></div></div>
  <p class="small">${esc(DINHEIRO.notas)}</p>
  <h2>Gorjetas (baksheesh)</h2><div class="card">${DINHEIRO.gorjetas.map(g => `<div class="kv"><span>${esc(g.q)}</span><b style="max-width:50%">${esc(g.v)}</b></div>`).join('')}</div>
  <h2>Quanto vale (para pechinchar)</h2><div class="card">${DINHEIRO.pechincha.map(g => `<div class="kv"><span>${esc(g.item)}</span><b style="max-width:55%">${esc(g.faixa)}</b></div>`).join('')}</div>
  <div class="card sand"><b>Como pechinchar</b><ul class="dots">${DINHEIRO.comoPechinchar.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <h2>Golpes comuns</h2><div class="card">${DINHEIRO.golpes.map(x => `<details><summary>${esc(x.t)}</summary><p class="small">${esc(x.d)}</p></details>`).join('')}</div>
  <h2>Meus gastos</h2>${gastosHtml()}`;
  return { title: 'Dinheiro', html, nav: 'mais', after: ligarConversor };
};
function ligarConversor() {
  const r = Rates.get(); const e = $('#c-egp'), u = $('#c-usd'), b = $('#c-brl');
  const f = n => (Math.round(n * 100) / 100).toString();
  const from = src => { const v = parseFloat(String(src.value).replace(',', '.')) || 0; let usd = src === e ? v / r.USD_EGP : src === u ? v : v / r.USD_BRL; if (src !== e) e.value = f(usd * r.USD_EGP); if (src !== u) u.value = f(usd); if (src !== b) b.value = f(usd * r.USD_BRL); };
  [e, u, b].forEach(x => x.oninput = () => from(x)); from(e);
}
async function atualizarCotacao() {
  if (!navigator.onLine) return toast('Sem internet agora. Usando a última cotação.');
  try { const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json(); const r = { USD_EGP: j.rates.EGP, USD_BRL: j.rates.BRL, em: new Date().toLocaleDateString('pt-BR') }; Rates.set(r); render(true); toast('Cotação atualizada'); } catch { toast('Não consegui atualizar'); }
}
function gastosHtml() {
  const r = Rates.get(); const l = Gastos.list();
  const brl = g => g.moeda === 'EGP' ? g.valor * r.USD_BRL / r.USD_EGP : g.moeda === 'USD' ? g.valor * r.USD_BRL : g.valor;
  const total = l.reduce((s, g) => s + brl(g), 0);
  return `<div class="card"><div class="row"><input id="g-valor" inputmode="decimal" placeholder="Valor"><select id="g-moeda" style="flex:0 0 90px"><option>EGP</option><option>USD</option><option>BRL</option></select></div><input id="g-desc" placeholder="O que foi (ex.: lenço no bazar)" style="margin-top:8px"><button class="btn secondary" onclick="addGasto()">＋ Anotar gasto</button>
  ${l.slice().reverse().map(g => `<div class="gasto"><span>${esc(g.desc)} <span class="muted small">${g.data}</span></span><b>${g.valor} ${g.moeda} <span class="muted small">≈ R$ ${brl(g).toFixed(0)}</span></b></div>`).join('')}
  ${l.length ? `<div class="kv" style="margin-top:8px"><span><b>Total</b></span><b>≈ R$ ${total.toFixed(2)}</b></div><button class="btn outline sm" onclick="if(confirm('Apagar todos os gastos?')){Gastos.save([]);render(true)}">Limpar</button>` : ''}</div>`;
}
function addGasto() { const v = parseFloat($('#g-valor').value.replace(',', '.')); if (!v) return toast('Digite o valor'); const l = Gastos.list(); l.push({ valor: v, moeda: $('#g-moeda').value, desc: $('#g-desc').value.trim() || 'Gasto', data: fmtDataCurta(hojeISO()) }); Gastos.save(l); render(true); }

/* ---- Comida, cultura, mala ---- */
Views.comida = () => ({ title: 'Comida', nav: 'mais', html: `<div class="card red"><b>Regras de ouro</b><ul class="dots">${COMIDA.regras.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><h2>O que pedir</h2>${COMIDA.pratos.map(p => `<div class="card"><b>${esc(p.nome)}</b><p class="small">${esc(p.desc)}</p></div>`).join('')}<a class="btn secondary" href="#frases/${encodeURIComponent('Restaurante')}">Frases para o restaurante</a>` });
Views.cultura = () => ({ title: 'Cultura e roupa', nav: 'mais', html: `<h2 style="margin-top:0">Como se vestir</h2><div class="card">${CULTURA.roupa.map(r => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(r.onde)}</b><div class="small">${esc(r.como)}</div></div>`).join('')}</div><h2>Etiqueta</h2><div class="card"><ul class="dots">${CULTURA.etiqueta.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><h2>Fuso horário</h2><div class="card sand"><p class="small">${esc(CULTURA.fuso)}</p></div><h2>Para puxar conversa</h2><div class="card"><ul class="dots">${CULTURA.curiosidades.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` });
Views.mala = () => ({ title: 'Mala', nav: 'mais', html: checklistMala() });

/* ---- Família ---- */
Views.familia = () => {
  const cfg = Cfg.get(); const iso = hojeISO(); const dia = diaPorData(iso);
  const eg = partsIn(TZ), br = partsIn(TZBR);
  const madrugada = br.h < 7 || br.h >= 23;
  const resumo = dia ? `Oi! Hoje foi o dia ${dia.n} da viagem: ${dia.titulo}. ${dia.resumo} Estou bem! 😘` : 'Oi! Estou bem! 😘';
  let html = `<div class="clock"><div><span class="muted small">Egito</span><b id="clk-eg">${eg.hm}</b></div><div><span class="muted small">Brasil</span><b id="clk-br">${br.hm}</b></div></div>`;
  if (madrugada) html += `<div class="card sand small">No Brasil agora é ${br.hm}. Talvez estejam dormindo: mande mensagem em vez de ligar.</div>`;
  if (!cfg.familiaTel) html += `<div class="card red">Cadastre o WhatsApp da família em <a href="#config">Configurações</a> para os botões funcionarem.</div>`;
  html += `<a class="btn green" href="${cfg.familiaTel ? waLink(cfg.familiaTel, 'Estou bem! 💚 ' + (dia ? 'Hoje: ' + dia.titulo : '')) : '#config'}" target="_blank">💚 Mandar "Estou bem"</a>
  <a class="btn green" href="${cfg.familiaTel ? waLink(cfg.familiaTel, resumo) : '#config'}" target="_blank">📝 Mandar resumo do dia</a>
  <button class="btn" onclick="enviarLocalizacao()">📍 Mandar minha localização</button>
  <div class="row">${cfg.familiaTel ? `<a class="btn secondary" href="${telLink(cfg.familiaTel)}">📞 Ligar para ${esc(cfg.familiaNome)}</a><a class="btn secondary" href="${waLink(cfg.familiaTel)}" target="_blank">💬 Abrir conversa</a>` : ''}</div>
  <div class="card nile small"><b>Ligação de graça pelo WhatsApp:</b> abra a conversa e toque no telefone no canto de cima. Funciona com o chip ou com o wi-fi do hotel.</div>
  <h2>Mandar fotos</h2><div class="card small">No wi-fi do hotel, à noite: abra Fotos, selecione as melhores do dia, toque em compartilhar e escolha o WhatsApp da família. Para ver as fotos no computador em casa, basta estar com o iCloud ligado.</div>`;
  return { title: 'Família', html, nav: 'mais', after: tickClock };
};

/* ---- Mais ---- */
Views.mais = () => {
  const itens = [['album', '🖼️', 'Fotos da viagem'], ['camera', '📷', 'Traduzir com câmera'], ['localizacao', '📍', 'Localização ao vivo'], ['offline', '📶', 'Usar sem internet'], ['diagnostico', '🩻', 'Diagnóstico'], ['remedios', '💊', 'Remédios'], ['documentos', '🛂', 'Documentos'], ['ficha', '🩺', 'Ficha médica'], ['dinheiro', '💵', 'Dinheiro'], ['comida', '🍽️', 'Comida'], ['cultura', '🧕', 'Cultura e roupa'], ['familia', '💚', 'Família'], ['mala', '🧳', 'Mala'], ['guia/fotos', '📸', 'Fotografia'], ['ajuda', '🆘', 'Ajuda'], ['config', '⚙️', 'Configurações']];
  return { title: 'Mais', html: `<div class="grid2">${itens.map(([h, i, t]) => `<a class="btn secondary" href="#${h}"><span class="ico">${i}</span>${t}</a>`).join('')}</div><p class="muted small" style="margin-top:20px;text-align:center">Eu falei Faraó · versão 2 · funciona sem internet depois de aberto uma vez.</p>` };
};

/* ---- Configurações ---- */
Views.config = () => {
  const c = Cfg.get();
  const html = `<div class="card"><label class="f">Nome dela</label><input id="k-nome" value="${esc(c.nome)}"><label class="f">Companheira de viagem</label><input id="k-amiga" value="${esc(c.amiga)}">
  <label class="f">Nome do contato da família</label><input id="k-fn" value="${esc(c.familiaNome)}"><label class="f">WhatsApp da família (com +55 e DDD)</label><input id="k-ft" value="${esc(c.familiaTel)}" inputmode="tel" placeholder="+5511999999999">
  <label class="f">PIN para Documentos (4 números, ou vazio)</label><input id="k-pin" value="${esc(c.pin)}" inputmode="numeric" maxlength="6">
  <label class="f">Chave do CallMeBot (aviso automático de SOS no WhatsApp)</label><input id="k-cmb" value="${esc(c.callmebot)}" placeholder="opcional" autocomplete="off">
  <p class="muted small">Com essa chave, o SOS manda sozinho uma mensagem com a localização para o WhatsApp de ${esc(c.familiaNome)}, sem ela precisar tocar em nada. Veja como obter em Localização ao vivo.</p>
  <button class="btn" onclick="salvarCfg()">Salvar</button></div>
  <a class="btn outline" href="#diagnostico">🩻 Diagnóstico (se algo não funcionar)</a>
  <h2>Áudios sem internet</h2><div class="card small"><p id="audios-status">Verificando…</p><button class="btn secondary" onclick="baixarAudios(false)">⬇️ Baixar todos os áudios agora</button><p class="muted">São cerca de 7 MB. Faça no wi-fi antes de viajar.</p></div>
  <h2>Instalar no iPhone</h2><div class="card small"><ol style="padding-left:20px;margin:0"><li>Abra este endereço no <b>Safari</b>.</li><li>Toque no botão de compartilhar (quadrado com seta para cima).</li><li>Toque em <b>"Adicionar à Tela de Início"</b> e depois em Adicionar.</li></ol><p>O ícone "Eu falei Faraó" aparece como um aplicativo e funciona sem internet.</p></div>
  <h2>Configurar pelo computador</h2><div class="card small"><p>Preencha remédios, ficha médica e contatos aqui e gere um link. Ao abrir o link no iPhone, tudo é importado (documentos com foto não vão no link).</p><button class="btn secondary" onclick="gerarLink()">🔗 Gerar link de configuração</button></div>
  <h2>Dados</h2><div class="card small"><button class="btn outline" onclick="if(confirm('Apagar TUDO (remédios, ficha, documentos, gastos)?')){localStorage.clear();indexedDB.deleteDatabase('egito-mae');location.reload()}">Apagar todos os dados deste celular</button>
  <label class="f">Simular data (para testar; deixe vazio na viagem)</label><input id="k-dbg" value="${esc(Store.get('debugDate', '') || '')}" placeholder="2026-10-21"><button class="btn secondary sm" onclick="Store.set('debugDate', $('#k-dbg').value.trim()||null); go('hoje')">Aplicar</button></div>`;
  return { title: 'Configurações', html, nav: 'mais', after: async () => { const el = $('#audios-status'); if (el) el.innerHTML = statusAudiosTexto(await audiosGuardados()); } };
};
function salvarCfg() { Cfg.set({ nome: $('#k-nome').value.trim(), amiga: $('#k-amiga').value.trim(), familiaNome: $('#k-fn').value.trim() || 'Família', familiaTel: $('#k-ft').value.replace(/[^\d+]/g, ''), pin: $('#k-pin').value.trim(), callmebot: $('#k-cmb').value.trim() }); toast('Salvo'); }
function gerarLink() {
  const data = { cfg: Cfg.get(), remedios: Rem.list(), ficha: Ficha.get() };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const url = location.origin + location.pathname + '#import=' + b64;
  if (navigator.share) navigator.share({ title: 'Configuração do app Eu falei Faraó', url }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copiado. Mande pelo WhatsApp.'));
  else prompt('Copie o link:', url);
}
function importarDoLink() {
  const m = location.hash.match(/^#import=(.+)$/); if (!m) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (data.cfg) Cfg.set(data.cfg); if (data.remedios) Rem.save(data.remedios); if (data.ficha) Ficha.set(data.ficha);
    history.replaceState(null, '', location.pathname + location.search + '#hoje'); toast('Configuração importada!');
  } catch { toast('Link de configuração inválido'); }
}
