const VERSION = 'farao-v5';
const AUDIO_CACHE = 'farao-audio-v2';
const SHELL = ['./', './index.html', './css/app.css', './js/db.js', './js/app.js', './js/data/roteiro.js', './js/data/lugares.js', './js/data/frases.js', './js/data/guias.js', './js/data/audios.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== AUDIO_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  e.respondWith(
    fetch(e.request).then(r => { if (r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
