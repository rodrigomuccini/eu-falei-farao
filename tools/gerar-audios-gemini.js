// Gera os áudios do app com a voz Sulafat do Gemini TTS.
// Uso:
//   node tools/gerar-audios-gemini.js            -> grava o que falta (ou o que mudou)
//   node tools/gerar-audios-gemini.js --melhorar -> regrava no melhor modelo o que saiu num modelo inferior
//   node tools/gerar-audios-gemini.js --amostra  -> 2 amostras em amostras/
// Chave: GEMINI_API_KEY ou Keychain do macOS (serviço GEMINI_API_KEY).
// O plano gratuito limita poucas gravações por dia e por modelo. Quando a cota de um modelo acaba,
// o gerador passa para o próximo da lista. O registro (tools/audios-gemini.json) guarda o modelo de cada arquivo.
const fs = require('fs'), path = require('path'), vm = require('vm'), os = require('os'), crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const MODELOS = (process.env.GEMINI_TTS_MODELOS || 'gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts,gemini-2.5-pro-preview-tts').split(',');
const SEM_ESTILO = new Set(); // modelos que não aceitam a instrução de estilo
const VOZ = process.env.GEMINI_TTS_VOZ || 'Sulafat';
const ESTILO_PT = 'warm, gentle Brazilian Portuguese storyteller with a natural Brazilian accent, like a passionate tour guide telling a story to a friend, calm unhurried pace, expressive but never theatrical';
const ESTILO_AR = 'native Egyptian Arabic speaker from Cairo, friendly and clear, speaking slightly slowly so a tourist can repeat';
const SEP = ' <long pause> <long pause> ';

const RAIZ = path.join(__dirname, '..'), APP = path.join(RAIZ, 'app');
const REGISTRO = path.join(__dirname, 'audios-gemini.json');
const ARGS = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CotaEsgotada extends Error {}

function chave() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try { return execFileSync('security', ['find-generic-password', '-s', 'GEMINI_API_KEY', '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}

// Unidades de gravação: cada história sozinha; faraós juntos; frases juntas por categoria.
function unidades() {
  const ctx = {}; vm.createContext(ctx);
  for (const f of ['lugares.js', 'frases.js']) vm.runInContext(fs.readFileSync(path.join(APP, 'js/data', f), 'utf8') + '\n;this.LUGARES = typeof LUGARES !== "undefined" ? LUGARES : this.LUGARES; this.FARAOS = typeof FARAOS !== "undefined" ? FARAOS : this.FARAOS; this.FRASES = typeof FRASES !== "undefined" ? FRASES : this.FRASES;', ctx);
  const u = [];
  for (const [id, l] of Object.entries(ctx.LUGARES)) u.push({ estilo: ESTILO_PT, itens: [{ out: `audio/lugares/${id}.m4a`, text: `${l.nome}. <short pause> ${l.epoca}. <short pause> ${l.historia}` }] });
  u.push({ estilo: ESTILO_PT, itens: ctx.FARAOS.map((f, i) => ({ out: `audio/faraos/${i}.m4a`, text: `${f.nome}. <short pause> ${f.texto}` })) });
  ctx.FRASES.forEach((c, ci) => u.push({ estilo: ESTILO_AR, itens: c.itens.map((f, ii) => ({ out: `audio/frases/${ci}_${ii}.m4a`, text: f.ar })) }));
  return u;
}
const assinatura = (estilo, text) => crypto.createHash('sha1').update([VOZ, estilo, text].join('|')).digest('hex').slice(0, 16);

async function sintetizar(modelo, texto, estilo, key) {
  const conteudo = { type: 'text', text: texto }; if (!SEM_ESTILO.has(modelo)) conteudo.annotations = [{ type: 'speech_metadata', style: estilo }];
  const body = { model: modelo, input: [{ type: 'user_input', content: [conteudo] }], response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice: VOZ }] } };
  for (let t = 1; t <= 5; t++) {
    let r;
    try { r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) }); }
    catch { await sleep(2000 * t); continue; }
    const txt = await r.text();
    if (r.ok) {
      const j = JSON.parse(txt);
      const a = (j.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(c => c.type === 'audio' && c.data);
      if (!a.length) { await sleep(1000); continue; }
      return garantirWav(Buffer.from(a[a.length - 1].data, 'base64'));
    }
    if (r.status === 401 || r.status === 403 || /API_KEY_INVALID|API key not valid/i.test(txt)) throw new Error(`Chave recusada (${r.status})`);
    if (/Speech metadata is not supported/i.test(txt) && !SEM_ESTILO.has(modelo)) { SEM_ESTILO.add(modelo); return sintetizar(modelo, texto, estilo, key); }
    if (r.status === 404 || /not found|not supported for/i.test(txt)) throw new CotaEsgotada(modelo);
    if (r.status === 402) throw new Error('Créditos pré-pagos esgotados (402)');
    if (r.status === 429) { if (/per.?day|PerDay|daily/i.test(txt)) throw new CotaEsgotada(modelo); await sleep(20000 * t); continue; }
    if (r.status >= 500 || /tried to generate text/i.test(txt)) { await sleep(3000 * t); continue; }
    throw new Error(`Erro ${r.status}: ${txt.slice(0, 200)}`);
  }
  throw new Error('Falhou depois de 5 tentativas');
}

function garantirWav(buf) {
  if (buf.slice(0, 4).toString() === 'RIFF') return buf;
  const h = Buffer.alloc(44); const rate = 24000;
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  return Buffer.concat([h, buf]);
}

function codificar(wavPath, destino, ini, fim) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  // O corte vem antes do -i para o silenceremove agir em cada trecho, não no áudio inteiro.
  const corte = ini != null ? ['-ss', ini.toFixed(3), '-to', fim.toFixed(3)] : [];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...corte, '-i', wavPath, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=120,apad=pad_dur=0.25', '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', destino]);
}

// Acha os pontos de corte: os (n-1) maiores silêncios do áudio.
function cortes(wavPath, n) {
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wavPath]).toString();
  const out = spawnSync('ffmpeg', ['-i', wavPath, '-af', 'silencedetect=noise=-40dB:d=0.35', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const sil = []; let ini = null;
  for (const l of out.split('\n')) {
    let m = l.match(/silence_start: ([\d.]+)/); if (m) ini = +m[1];
    m = l.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/); if (m && ini != null) { sil.push({ ini, fim: +m[1], d: +m[2] }); ini = null; }
  }
  const internos = sil.filter(s => s.ini > 0.2 && s.fim < dur - 0.2);
  if (internos.length < n - 1) return null;
  const escolhidos = internos.sort((a, b) => b.d - a.d).slice(0, n - 1).sort((a, b) => a.ini - b.ini);
  const menorSeparador = escolhidos.length ? Math.min(...escolhidos.map(s => s.d)) : 0;
  const proximo = internos.sort((a, b) => b.d - a.d)[n - 1];
  if (proximo && escolhidos.length && proximo.d > menorSeparador * 0.8) return null; // separadores não se distinguem das pausas normais
  const pts = [0, ...escolhidos.map(s => (s.ini + s.fim) / 2), dur];
  const seg = []; for (let i = 0; i < n; i++) seg.push([pts[i], pts[i + 1]]);
  return seg.every(([a, b]) => b - a > 0.3) ? seg : null;
}

let modeloIdx = 0;
async function comFallback(fn) {
  for (;;) {
    if (modeloIdx >= MODELOS.length) throw new CotaEsgotada('todos');
    try { return { res: await fn(MODELOS[modeloIdx]), modelo: MODELOS[modeloIdx] }; }
    catch (e) { if (e instanceof CotaEsgotada && !ARGS.includes('--melhorar')) { console.log(`\n  cota diária de ${MODELOS[modeloIdx]} esgotada, passando para o próximo modelo`); modeloIdx++; continue; } throw e; }
  }
}

(async () => {
  const key = chave();
  if (!key) { console.error('Sem chave. Guarde no Keychain: security add-generic-password -a "$USER" -s GEMINI_API_KEY -w'); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-tts-'));
  const wav = path.join(tmp, 'a.wav');
  let reg = fs.existsSync(REGISTRO) ? JSON.parse(fs.readFileSync(REGISTRO, 'utf8')) : {};
  for (const k of Object.keys(reg)) if (typeof reg[k] === 'string') reg[k] = { a: 'legado', m: 'gemini-3.8-flash-tts' };
  const salvar = () => fs.writeFileSync(REGISTRO, JSON.stringify(reg, null, 1));
  const melhorar = ARGS.includes('--melhorar');
  if (melhorar) MODELOS.splice(1);
  const pendente = (it, estilo) => {
    const r = reg[it.out]; if (!fs.existsSync(path.join(APP, it.out)) || !r) return true;
    if (r.a !== 'legado' && r.a !== assinatura(estilo, it.text)) return true;
    return melhorar && r.m !== MODELOS[0];
  };
  let feitos = 0;
  try {
    for (const u of unidades()) {
      const itens = u.itens.filter(it => pendente(it, u.estilo));
      if (!itens.length) continue;
      if (itens.length > 1) {
        const { modelo } = await comFallback(async m => { fs.writeFileSync(wav, await sintetizar(m, itens.map(i => i.text).join(SEP), u.estilo, key)); });
        const seg = cortes(wav, itens.length);
        if (seg) {
          itens.forEach((it, i) => { codificar(wav, path.join(APP, it.out), seg[i][0], seg[i][1]); reg[it.out] = { a: assinatura(u.estilo, it.text), m: modelo }; feitos++; });
          salvar(); console.log(`ok ${itens.length} itens juntos (${path.dirname(itens[0].out)}) com ${modelo}`); continue;
        }
        console.log(`  não deu para separar ${path.dirname(itens[0].out)} pelas pausas; gravando um por um`);
      }
      for (const it of itens) {
        const { modelo } = await comFallback(async m => { fs.writeFileSync(wav, await sintetizar(m, it.text, u.estilo, key)); });
        codificar(wav, path.join(APP, it.out)); reg[it.out] = { a: assinatura(u.estilo, it.text), m: modelo }; salvar(); feitos++;
        console.log(`ok ${it.out} com ${modelo}`);
      }
    }
  } catch (e) {
    if (e instanceof CotaEsgotada) { console.log(`\nCota diária esgotada em todos os modelos. ${feitos} gravados agora. Rode de novo amanhã que ele continua daqui.`); process.exit(3); }
    console.log('\nErro: ' + e.message); process.exit(1);
  }
  const porModelo = {}; Object.values(reg).forEach(r => porModelo[r.m] = (porModelo[r.m] || 0) + 1);
  console.log(`\nPronto. ${feitos} gravados agora. Por modelo: ${JSON.stringify(porModelo)}`);
})();
