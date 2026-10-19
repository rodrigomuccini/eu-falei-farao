/* ===== Usar sem internet: preparação e aviso de conexão ===== */
async function guardarPrevisao() {
  const out = {};
  for (const [cidade, c] of Object.entries(CIDADES)) {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FCairo&forecast_days=16`);
    const j = await r.json(); out[cidade] = {};
    j.daily.time.forEach((d, i) => { out[cidade][d] = { max: Math.round(j.daily.temperature_2m_max[i]), min: Math.round(j.daily.temperature_2m_min[i]) }; });
  }
  Store.set('clima16', out); Store.set('clima16em', Date.now());
}
async function guardarCotacao() {
  const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
  Rates.set({ USD_EGP: j.rates.EGP, USD_BRL: j.rates.BRL, em: new Date().toLocaleDateString('pt-BR') });
}
async function permissaoLocalizacao() { const p = await Pos.agora(15000); return !!p; }
async function permissaoCameraMic() {
  try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); s.getTracks().forEach(t => t.stop()); Store.set('camMicOk', true); return true; } catch { return false; }
}

async function estadoOffline() {
  const instalado = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const audios = await audiosGuardados();
  const clima = Store.get('clima16em', 0), rates = Rates.get();
  let geo = 'prompt'; try { geo = (await navigator.permissions.query({ name: 'geolocation' })).state; } catch {}
  return [
    { id: 'instalar', ok: instalado, t: 'App instalado na tela de início', d: instalado ? 'Abre como aplicativo e funciona sem internet.' : 'No Safari: compartilhar → Adicionar à Tela de Início. Depois abra pelo ícone.' },
    { id: 'audios', ok: audios >= AUDIOS.length, t: `Áudios das histórias e frases (${audios} de ${AUDIOS.length})`, d: 'Cerca de 7 MB.', acao: 'Baixar' },
    { id: 'ocr', ok: Store.get('ocrPronto', false), t: 'Leitura de texto da câmera', d: 'Cerca de 12 MB. Permite ler placas e cardápios sem internet.', acao: 'Preparar' },
    { id: 'clima', ok: Date.now() - clima < 3 * 864e5, t: 'Previsão do tempo da viagem', d: clima ? 'Guardada em ' + new Date(clima).toLocaleDateString('pt-BR') + '.' : 'Guarda 16 dias de previsão de todas as cidades.', acao: 'Guardar' },
    { id: 'cotacao', ok: !!rates.em, t: 'Cotação do dólar e da libra', d: rates.em ? 'Atualizada em ' + rates.em + '.' : 'Usando valor de referência.', acao: 'Atualizar' },
    { id: 'geo', ok: geo === 'granted', t: 'Localização liberada (para o SOS)', d: 'O iPhone vai perguntar: toque em Permitir.', acao: 'Liberar' },
    { id: 'cam', ok: Store.get('camMicOk', false), t: 'Câmera e microfone liberados (para o SOS)', d: 'O iPhone vai perguntar: toque em Permitir.', acao: 'Liberar' },
  ];
}
const ACOES_OFFLINE = {
  audios: () => baixarAudios(false), ocr: () => ocrWorker(ocrProgresso), clima: guardarPrevisao, cotacao: guardarCotacao, geo: permissaoLocalizacao, cam: permissaoCameraMic,
};
async function acaoOffline(id, btn) {
  if (!navigator.onLine && id !== 'geo' && id !== 'cam') return toast('Precisa de internet para preparar');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try { await ACOES_OFFLINE[id](); } catch { toast('Não deu certo agora. Tente de novo no wi-fi.'); }
  render(true);
}
async function prepararTudo(btn) {
  if (!navigator.onLine) return toast('Conecte no wi-fi para preparar');
  btn.disabled = true; btn.textContent = 'Preparando… mantenha o app aberto';
  for (const id of ['cotacao', 'clima', 'audios', 'ocr']) { try { await ACOES_OFFLINE[id](); } catch {} }
  toast('Pronto para usar sem internet'); render(true);
}

Views.offline = async () => {
  const itens = await estadoOffline();
  const feitos = Store.get('offlineManual', {});
  const manuais = [
    ['mapas', 'Mapas sem internet no Google Maps', 'No Google Maps: toque na sua foto → Mapas off-line → Selecionar seu mapa. Baixe Cairo, Aswan, Luxor e Sharm El Sheikh.'],
    ['tradutor', 'Idiomas do Google Tradutor', 'No app Google Tradutor: toque na sua foto → Idiomas baixados → baixe Árabe e Português.'],
    ['local', 'Compartilhamento de local com a família', 'Veja o passo a passo em Localização ao vivo.'],
    ['bateria', 'Carregador portátil na bolsa', 'Câmera, GPS e mapa gastam bateria.'],
  ];
  const html = `<div class="card nile small">O app já funciona sem internet: roteiro, guia, frases, remédios, documentos, ficha médica e SOS por SMS. Toque em <b>Preparar tudo</b> no wi-fi do hotel para guardar o resto.</div>
  <button class="btn" onclick="prepararTudo(this)">⬇️ Preparar tudo agora</button>
  <h2>No app</h2><div class="card">${itens.map(i => `<div class="check ${i.ok ? 'done' : ''}" style="cursor:default"><div class="box">${i.ok ? '✓' : ''}</div><div class="label"><b>${esc(i.t)}</b><div class="muted small">${esc(i.d)}</div></div>${!i.ok && i.acao ? `<button class="btn secondary sm" onclick="acaoOffline('${i.id}', this)">${i.acao}</button>` : ''}</div>`).join('')}</div>
  <h2>Em outros apps</h2><div class="card">${manuais.map(([k, t, d]) => `<div class="check ${feitos[k] ? 'done' : ''}" onclick="marcarOfflineManual('${k}')"><div class="box">${feitos[k] ? '✓' : ''}</div><div class="label"><b>${esc(t)}</b><div class="muted small">${esc(d)}</div></div></div>`).join('')}</div>
  <div class="card sand small"><b>Sem internet, continua funcionando:</b> o botão de SOS manda SMS (precisa só de sinal de celular), a localização pelo GPS, a câmera do SOS, o álbum e a leitura de texto. Precisa de internet: WhatsApp, tradução de frases inteiras, mapa e previsão nova.</div>`;
  return { title: 'Usar sem internet', html, nav: 'mais' };
};
function marcarOfflineManual(k) { const f = Store.get('offlineManual', {}); f[k] = !f[k]; Store.set('offlineManual', f); render(true); }

// Aviso de conexão no topo
function avisoConexao() {
  let b = document.getElementById('offline-aviso');
  if (!navigator.onLine) {
    if (!b) { b = document.createElement('div'); b.id = 'offline-aviso'; b.textContent = 'Sem internet. O app continua funcionando.'; document.body.prepend(b); }
  } else if (b) b.remove();
}
window.addEventListener('online', () => { avisoConexao(); setTimeout(() => baixarAudios(true), 2000); });
window.addEventListener('offline', avisoConexao);
window.addEventListener('load', () => {
  avisoConexao();
  // Atualiza previsão e cotação sozinho, uma vez por dia, quando tiver internet
  setTimeout(async () => {
    if (!navigator.onLine) return;
    try { if (Date.now() - Store.get('clima16em', 0) > 864e5) await guardarPrevisao(); } catch {}
    try { const r = Rates.get(); if (r.em !== new Date().toLocaleDateString('pt-BR')) await guardarCotacao(); } catch {}
  }, 6000);
});
