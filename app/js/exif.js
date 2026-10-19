// Leitor mínimo de EXIF em JPEG: data da foto, GPS e modelo da câmera.
async function lerExif(file) {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return {};
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off); const len = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
      if ((marker & 0xFF00) !== 0xFF00) break;
      off += 2 + len;
    }
  } catch {}
  return {};
}
function parseTiff(v, base) {
  const le = v.getUint16(base) === 0x4949;
  const u16 = o => v.getUint16(base + o, le), u32 = o => v.getUint32(base + o, le);
  const lerIFD = o => {
    const tags = {}; if (o <= 0 || base + o + 2 > v.byteLength) return tags;
    const n = u16(o);
    for (let i = 0; i < n; i++) {
      const e = o + 2 + i * 12; if (base + e + 12 > v.byteLength) break;
      const tag = u16(e), tipo = u16(e + 2), cnt = u32(e + 4);
      const tam = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[tipo] || 1;
      const dOff = cnt * tam > 4 ? u32(e + 8) : e + 8;
      try {
        if (tipo === 2) { let s = ''; for (let k = 0; k < cnt - 1 && base + dOff + k < v.byteLength; k++) s += String.fromCharCode(v.getUint8(base + dOff + k)); tags[tag] = s.trim(); }
        else if (tipo === 5) { const a = []; for (let k = 0; k < cnt; k++) { const num = u32(dOff + k * 8), den = u32(dOff + k * 8 + 4); a.push(den ? num / den : 0); } tags[tag] = a; }
        else if (tipo === 3) tags[tag] = u16(dOff);
        else if (tipo === 4) tags[tag] = u32(dOff);
        else if (tipo === 1 || tipo === 7) tags[tag] = v.getUint8(base + dOff);
      } catch {}
    }
    return tags;
  };
  const ifd0 = lerIFD(u32(4));
  const exif = ifd0[0x8769] ? lerIFD(ifd0[0x8769]) : {};
  const gps = ifd0[0x8825] ? lerIFD(ifd0[0x8825]) : {};
  const out = {};
  if (ifd0[0x010F] || ifd0[0x0110]) out.camera = [ifd0[0x010F], ifd0[0x0110]].filter(Boolean).join(' ').replace(/^Apple /, '');
  const dt = exif[0x9003] || ifd0[0x0132];
  if (dt && /^\d{4}:\d\d:\d\d \d\d:\d\d/.test(dt)) { const [d, h] = dt.split(' '); out.dataLocal = d.replace(/:/g, '-') + 'T' + h.slice(0, 5); }
  if (exif[0x9011]) out.fuso = exif[0x9011];
  const dms = a => Array.isArray(a) && a.length >= 3 ? a[0] + a[1] / 60 + a[2] / 3600 : null;
  const lat = dms(gps[2]), lon = dms(gps[4]);
  if (lat != null && lon != null && (lat || lon)) { out.lat = gps[1] === 'S' ? -lat : lat; out.lon = gps[3] === 'W' ? -lon : lon; }
  return out;
}
