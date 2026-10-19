// Coordenadas aproximadas dos lugares do roteiro e utilidades de localização.
const COORD = {
  piramides: [29.9792, 31.1342, 1.2], esfinge: [29.9753, 31.1376, 0.4], saqqara: [29.8713, 31.2165, 2.5], gem: [29.9947, 31.1196, 0.8],
  cidadela: [30.0287, 31.2599, 0.8], khan: [30.0477, 31.2622, 0.7], copta: [30.0060, 31.2302, 0.6], represa: [23.9707, 32.8780, 2.5],
  feluca: [24.0889, 32.8890, 2.0], philae: [24.0254, 32.8844, 0.8], abusimbel: [22.3372, 31.6258, 1.5], komombo: [24.4521, 32.9284, 0.6],
  edfu: [24.9779, 32.8734, 0.8], luxor: [25.6995, 32.6391, 0.5], karnak: [25.7188, 32.6573, 0.9], memnon: [25.7206, 32.6105, 0.5],
  valedosreis: [25.7402, 32.6014, 1.2], hatshepsut: [25.7380, 32.6065, 0.6], alexandria: [31.2089, 29.9092, 12], fayoum: [29.2713, 30.4100, 25],
  sharm: [27.9654, 34.3617, 25],
};
const HOTEL_COORD = { hi: [30.0731, 31.3456, 0.6], aurora: [28.0423, 34.4316, 0.8] };
function distKm(a, b, c, d) { const R = 6371, r = x => x * Math.PI / 180; const dl = r(c - a), dg = r(d - b); const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
// Descreve um ponto: lugar do roteiro, hotel ou cidade mais próxima.
function descreverLocal(lat, lon) {
  if (lat == null || lon == null) return null;
  let melhor = null;
  for (const [id, [a, b, raio]] of Object.entries(COORD)) { const d = distKm(lat, lon, a, b); if (d <= raio && (!melhor || d < melhor.d)) melhor = { d, nome: LUGARES[id].nome, lugar: id }; }
  for (const [id, [a, b, raio]] of Object.entries(HOTEL_COORD)) { const d = distKm(lat, lon, a, b); if (d <= raio && (!melhor || d < melhor.d)) melhor = { d, nome: HOTEIS[id].nome }; }
  if (melhor) return melhor;
  let cid = null;
  for (const [nome, c] of Object.entries(CIDADES)) { const d = distKm(lat, lon, c.lat, c.lon); if (!cid || d < cid.d) cid = { d, nome }; }
  if (cid && cid.d < 40) return { d: cid.d, nome: cid.nome };
  if (lat > 21.5 && lat < 31.8 && lon > 24.5 && lon < 37) return { nome: 'Egito' };
  return { nome: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
}
const mapsLink = (lat, lon) => `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

// Última posição conhecida (fica guardada para emergências sem GPS).
const Pos = {
  ultima() { return Store.get('ultimaPos', null); },
  guardar(p) {
    const v = { lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0), t: Date.now() };
    Store.set('ultimaPos', v);
    const log = Store.get('posLog', []); const u = log[log.length - 1];
    if (!u || v.t - u.t > 5 * 60000 || distKm(u.lat, u.lon, v.lat, v.lon) > 0.3) { log.push(v); Store.set('posLog', log.slice(-800)); }
    return v;
  },
  // Posição registrada mais perto de um horário (para fotos sem GPS)
  perto(t, janelaMin = 45) { let m = null; for (const p of Store.get('posLog', [])) { const d = Math.abs(p.t - t); if (d <= janelaMin * 60000 && (!m || d < m.d)) m = { d, p }; } return m ? m.p : null; },
  agora(timeout = 15000) {
    return new Promise(res => {
      if (!navigator.geolocation) return res(Pos.ultima());
      navigator.geolocation.getCurrentPosition(p => res(Pos.guardar(p)), () => res(Pos.ultima()), { enableHighAccuracy: true, timeout, maximumAge: 30000 });
    });
  },
};

// Registra a posição ao abrir o app, se ela já autorizou a localização antes.
window.addEventListener('load', () => { try { navigator.permissions && navigator.permissions.query({ name: 'geolocation' }).then(r => { if (r.state === 'granted') Pos.agora(20000); }).catch(() => {}); } catch {} });
