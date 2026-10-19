/* ===== Álbum de fotos da viagem ===== */
let ALBUM_URLS = [];
function egitoLocal(ms) { const p = partsIn(TZ, new Date(ms)); return p.iso + 'T' + p.hm; }
function fotoInfo(f) {
  const data = f.dataLocal ? f.dataLocal.slice(0, 10) : null;
  const dia = data ? diaPorData(data) : null;
  const local = f.lat != null ? descreverLocal(f.lat, f.lon) : null;
  return { data, hora: f.dataLocal ? f.dataLocal.slice(11, 16) : '', dia, local };
}

Views.album = async () => {
  ALBUM_URLS.forEach(u => URL.revokeObjectURL(u)); ALBUM_URLS = [];
  let fotos = []; try { fotos = await IDB.all('fotos'); } catch {}
  const grupos = {};
  fotos.forEach(f => { const k = (f.dataLocal || '0000-00-00').slice(0, 10); (grupos[k] = grupos[k] || []).push(f); });
  const datas = Object.keys(grupos).sort().reverse();
  const comGps = fotos.filter(f => f.lat != null).length;
  let html = `<div class="grid2">
    <label class="btn"><input type="file" accept="image/*" capture="environment" hidden onchange="albumAdicionar(this, 'camera')"><span class="ico">📷</span>Tirar foto</label>
    <label class="btn nile"><input type="file" accept="image/*" multiple hidden onchange="albumAdicionar(this, 'iphone')"><span class="ico">🖼️</span>Adicionar fotos do iPhone</label>
    <button class="btn secondary" onclick="albumKML()"><span class="ico">🌍</span>Mapa no Google Earth</button>
    <a class="btn secondary" href="photos-redirect://"><span class="ico">🌅</span>Abrir app Fotos</a></div>
  <div class="card sand small"><b>Como usar:</b> no fim de cada dia, toque em <b>Adicionar fotos do iPhone</b> e selecione as fotos do dia. O app organiza por dia do roteiro, lugar e horário. Fotos tiradas pelo botão <b>Tirar foto</b> já guardam o lugar exato pelo GPS.<br><span class="muted">Dica: na tela de escolher fotos, toque em <b>Opções</b> e deixe <b>Localização</b> ligada.</span></div>
  <p class="muted small" id="album-status">${fotos.length} foto${fotos.length === 1 ? '' : 's'} no álbum · ${comGps} com localização</p>`;
  if (!fotos.length) html += `<div class="card"><p>Nenhuma foto ainda.</p></div>`;
  for (const d of datas) {
    const dia = diaPorData(d);
    html += `<h2>${dia ? `Dia ${dia.n} · ${esc(dia.titulo)}` : (d === '0000-00-00' ? 'Sem data' : fmtData(d))}</h2>${dia ? `<p class="muted small" style="margin-top:-6px">${fmtData(d)} · ${esc(dia.cidade)}</p>` : ''}<div class="fotogrid">`;
    for (const f of grupos[d].sort((a, b) => (a.dataLocal || '').localeCompare(b.dataLocal || ''))) {
      const u = URL.createObjectURL(f.thumb || f.blob); ALBUM_URLS.push(u);
      const i = fotoInfo(f);
      html += `<button class="foto" onclick="albumVer('${f.id}')"><img src="${u}" alt="" loading="lazy"><span>${esc(i.hora)}${i.local ? ' · ' + esc(i.local.nome) : ''}</span></button>`;
    }
    html += `</div>`;
  }
  return { title: 'Fotos da viagem', html, nav: 'mais' };
};

async function reduzirPara(file, max, q = 0.86) {
  return new Promise(res => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(url); res({ blob: b, w: c.width, h: c.height }); }, 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}

async function albumAdicionar(input, fonte) {
  const files = [...(input.files || [])]; input.value = '';
  if (!files.length) return;
  const st = $('#album-status');
  let posAgora = null;
  if (fonte === 'camera') posAgora = await Pos.agora(8000);
  let ok = 0;
  for (const [n, file] of files.entries()) {
    if (st) st.textContent = `Guardando ${n + 1} de ${files.length}…`;
    const ex = await lerExif(file);
    const grande = await reduzirPara(file, fonte === 'camera' ? 2400 : 1600);
    if (!grande) continue;
    const mini = await reduzirPara(grande.blob, 360, 0.8);
    const quando = fonte === 'camera' ? Date.now() : (file.lastModified || Date.now());
    let lat = ex.lat, lon = ex.lon, gpsFonte = ex.lat != null ? 'foto' : null;
    if (lat == null && posAgora) { lat = posAgora.lat; lon = posAgora.lon; gpsFonte = 'gps do app'; }
    if (lat == null) { const p = Pos.perto(quando); if (p) { lat = p.lat; lon = p.lon; gpsFonte = 'aproximada'; } }
    await IDB.put('fotos', {
      id: 'f' + Date.now() + '_' + n, criado: Date.now(), fonte, nomeArquivo: file.name || '',
      blob: grande.blob, thumb: mini ? mini.blob : grande.blob, w: grande.w, h: grande.h,
      dataLocal: ex.dataLocal || egitoLocal(quando), camera: ex.camera || '', lat, lon, gpsFonte, nota: '',
    });
    ok++;
  }
  toast(`${ok} foto${ok === 1 ? '' : 's'} no álbum`);
  if (fonte === 'camera' && ok) toast('Foto guardada no álbum. Para ter no app Fotos, abra a foto e toque em Salvar no iPhone.');
  render(true);
}

async function albumVer(id) {
  const f = await IDB.get('fotos', id); if (!f) return;
  const i = fotoInfo(f); const u = URL.createObjectURL(f.blob);
  const lugarId = i.local && i.local.lugar;
  const o = overlay(`<div class="docview" style="text-align:center"><img src="${u}" alt=""></div>
    <div class="card" style="margin-top:12px">
      <div class="kv"><span>Data e hora (Egito)</span><b>${i.data ? fmtDataCurta(i.data) : '—'} ${esc(i.hora)}</b></div>
      ${i.dia ? `<div class="kv"><span>Dia da viagem</span><b>Dia ${i.dia.n} · ${esc(i.dia.titulo)}</b></div>` : ''}
      <div class="kv"><span>Lugar</span><b>${i.local ? esc(i.local.nome) : (i.dia ? esc(i.dia.cidade) + ' (pelo roteiro)' : '—')}</b></div>
      ${f.lat != null ? `<div class="kv"><span>Coordenadas${f.gpsFonte === 'aproximada' ? ' (aproximadas)' : ''}</span><b><a href="${mapsLink(f.lat, f.lon)}" target="_blank">${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}</a></b></div>` : ''}
      ${f.camera ? `<div class="kv"><span>Câmera</span><b>${esc(f.camera)}</b></div>` : ''}
      <div class="kv"><span>Tamanho guardado</span><b>${f.w} × ${f.h}</b></div>
      <label class="f">Anotação</label><textarea id="foto-nota" placeholder="Ex.: com a Iracema na frente do templo">${esc(f.nota || '')}</textarea>
    </div>
    ${lugarId ? `<a class="btn nile" href="#lugar/${lugarId}" onclick="this.closest('.overlay').remove()">📖 Ouvir a história deste lugar</a>` : ''}
    <div class="row"><button class="btn secondary" id="foto-share">📤 ${f.fonte === 'camera' ? 'Salvar no iPhone / enviar' : 'Enviar'}</button><button class="btn outline" id="foto-del">Excluir</button></div>`);
  $('#foto-nota', o).onchange = async e => { f.nota = e.target.value; await IDB.put('fotos', f); };
  $('#foto-share', o).onclick = async () => {
    const file = new File([f.blob], (f.nomeArquivo || 'foto-egito').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    const texto = [i.local ? i.local.nome : '', i.dia ? `Dia ${i.dia.n} no Egito` : '', f.nota].filter(Boolean).join(' · ');
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text: texto }); } catch {} }
    else toast('Este aparelho não permite compartilhar arquivos daqui');
  };
  $('#foto-del', o).onclick = async () => { if (confirm('Tirar esta foto do álbum do app? (A foto no app Fotos do iPhone não é apagada.)')) { await IDB.del('fotos', id); o.remove(); render(true); } };
}

// Exporta um KML para abrir no Google Earth: roteiro + fotos com localização.
async function albumKML() {
  let fotos = []; try { fotos = await IDB.all('fotos'); } catch {}
  const x = s => String(s ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
  const ordem = []; ROTEIRO.forEach(d => d.lugares.forEach(id => { if (COORD[id] && !ordem.find(o => o.id === id)) ordem.push({ id, dia: d }); }));
  const roteiro = ordem.map(({ id, dia }) => `<Placemark><name>${x(LUGARES[id].nome)}</name><description>${x(`Dia ${dia.n} (${fmtDataCurta(dia.data)}) · ${LUGARES[id].epoca}`)}</description><styleUrl>#lugar</styleUrl><Point><coordinates>${COORD[id][1]},${COORD[id][0]},0</coordinates></Point></Placemark>`).join('');
  const pts = fotos.filter(f => f.lat != null).map(f => { const i = fotoInfo(f); return `<Placemark><name>${x((i.local && i.local.nome) || 'Foto')}</name><description>${x([i.data ? fmtDataCurta(i.data) + ' ' + i.hora : '', i.dia ? `Dia ${i.dia.n}: ${i.dia.titulo}` : '', f.nota].filter(Boolean).join(' · '))}</description><styleUrl>#foto</styleUrl>${f.dataLocal ? `<TimeStamp><when>${f.dataLocal}:00</when></TimeStamp>` : ''}<Point><coordinates>${f.lon},${f.lat},0</coordinates></Point></Placemark>`; }).join('');
  const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Viagem ao Egito</name>
<Style id="lugar"><IconStyle><color>ff2e96c8</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png</href></Icon></IconStyle></Style>
<Style id="foto"><IconStyle><color>ff8b6f1f</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/camera.png</href></Icon></IconStyle></Style>
<Folder><name>Roteiro</name>${roteiro}</Folder><Folder><name>Fotos (${fotos.filter(f => f.lat != null).length})</name>${pts}</Folder></Document></kml>`;
  const file = new File([kml], 'viagem-egito.kml', { type: 'application/vnd.google-earth.kml+xml' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Viagem ao Egito' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  toast('Abra o arquivo viagem-egito.kml no Google Earth');
}
