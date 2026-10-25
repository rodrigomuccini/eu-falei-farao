const VERSION = 'farao-v17';
const VENDOR_CACHE = 'farao-vendor-v1';
const AUDIO_CACHE = 'farao-audio-v2';
const SHELL = ['./', './index.html', './css/app.css', './js/db.js', './js/app.js', './js/data/roteiro.js', './js/data/lugares.js', './js/data/frases.js', './js/data/guias.js', './js/data/audios.js', './js/data/glossario.js', './js/diagnostico.js', './js/geo.js', './js/exif.js', './js/sos.js', './js/localizacao.js', './js/album.js', './js/tradutor-camera.js', './js/offline.js', './js/conversa.js', './js/interprete.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== AUDIO_CACHE && k !== VENDOR_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// O Safari pede áudio em pedaços (Range). Monta a resposta 206 a partir do arquivo inteiro guardado.
async function responderComRange(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let ini = m[1] ? parseInt(m[1], 10) : 0;
  let fim = m[2] ? parseInt(m[2], 10) : total - 1;
  if (!m[1] && m[2]) { ini = Math.max(0, total - parseInt(m[2], 10)); fim = total - 1; }
  fim = Math.min(fim, total - 1);
  if (ini > fim || ini >= total) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  return new Response(buf.slice(ini, fim + 1), {
    status: 206,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mp4', 'Content-Range': `bytes ${ini}-${fim}/${total}`, 'Content-Length': String(fim - ini + 1), 'Accept-Ranges': 'bytes' },
  });
}

async function audio(req) {
  const url = req.url.split('#')[0];
  const guardado = await (await caches.open(AUDIO_CACHE)).match(url);
  if (guardado) return responderComRange(req, guardado);
  try {
    const inteiro = await fetch(url, { cache: 'reload' });
    if (inteiro.ok) {
      const c = await caches.open(AUDIO_CACHE);
      await c.put(url, inteiro.clone());
      return responderComRange(req, inteiro);
    }
    return inteiro;
  } catch {
    return new Response('', { status: 504, statusText: 'Sem internet e audio nao guardado' });
  }
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.includes('/audio/')) { e.respondWith(audio(e.request)); return; }
  // Biblioteca de leitura de texto: guarda na primeira vez e depois usa do celular
  if (url.pathname.includes('/vendor/')) {
    e.respondWith(caches.open(VENDOR_CACHE).then(async c => {
      const g = await c.match(e.request.url); if (g) return g;
      const r = await fetch(e.request); if (r.status === 200) c.put(e.request.url, r.clone()); return r;
    }));
    return;
  }
  e.respondWith(rede(e));
});

// Internet primeiro, mas com limite de espera: redes que bloqueiam sem recusar (como chips de
// viagem que só liberam alguns apps) deixam o pedido parado. Nesse caso abre a cópia guardada.
let redeLentaAte = 0;
const ESPERA_MS = 2500;
async function guardado(req) {
  const c = await caches.open(VERSION);
  return (await c.match(req)) || (req.mode === 'navigate' ? (await c.match(req, { ignoreSearch: true })) || (await c.match('./index.html')) || (await c.match('./')) : null);
}
function buscarEGuardar(req) {
  return fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(r => {
    if (r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  });
}
async function rede(e) {
  const req = e.request;
  const copia = await guardado(req);
  const daRede = buscarEGuardar(req);
  if (copia && Date.now() < redeLentaAte) { e.waitUntil(daRede.catch(() => {})); return copia; }
  if (!copia) return daRede.catch(() => guardado(req).then(r => r || new Response('Sem internet', { status: 504 })));
  let limite;
  const tempo = new Promise(ok => { limite = setTimeout(() => ok('tempo'), ESPERA_MS); });
  const r = await Promise.race([daRede.catch(() => 'erro'), tempo]);
  clearTimeout(limite);
  if (r === 'tempo' || r === 'erro') {
    if (r === 'tempo') redeLentaAte = Date.now() + 60000;
    e.waitUntil(daRede.catch(() => {}));
    return copia;
  }
  return r;
}
