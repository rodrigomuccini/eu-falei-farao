// Gera os áudios do app com o Gemini 3.8 Flash TTS (voz humanizada).
// Uso:
//   node tools/gerar-audios-gemini.js --amostra   -> grava 2 amostras em amostras/ para ouvir antes
//   node tools/gerar-audios-gemini.js             -> grava todos os áudios em app/audio/
// A chave vem de GEMINI_API_KEY ou do Keychain do macOS (serviço GEMINI_API_KEY).
// Retoma de onde parou: só regrava o que mudou (tools/audios-gemini.json guarda o que já foi feito).
const fs = require('fs'), path = require('path'), vm = require('vm'), os = require('os'), crypto = require('crypto');
const { execFileSync } = require('child_process');

const MODELO = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
const VOZ = process.env.GEMINI_TTS_VOZ || 'Sulafat';          // "Warm"
const VOZ_ARABE = process.env.GEMINI_TTS_VOZ_AR || 'Sulafat';
const ESTILO_PT = 'warm, gentle Brazilian Portuguese storyteller with a natural Brazilian accent, like a passionate tour guide telling a story to a friend, calm unhurried pace, expressive but never theatrical';
const ESTILO_AR = 'native Egyptian Arabic speaker from Cairo, friendly and clear, speaking slightly slowly so a tourist can repeat';

const RAIZ = path.join(__dirname, '..');
const APP = path.join(RAIZ, 'app');
const REGISTRO = path.join(__dirname, 'audios-gemini.json');
const amostra = process.argv.includes('--amostra');

function chave() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try { return execFileSync('security', ['find-generic-password', '-s', 'GEMINI_API_KEY', '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}

function carregarDados() {
  const ctx = {}; vm.createContext(ctx);
  for (const f of ['roteiro.js', 'lugares.js', 'frases.js']) vm.runInContext(fs.readFileSync(path.join(APP, 'js/data', f), 'utf8') + '\n;this.LUGARES = typeof LUGARES !== "undefined" ? LUGARES : this.LUGARES; this.FARAOS = typeof FARAOS !== "undefined" ? FARAOS : this.FARAOS; this.FRASES = typeof FRASES !== "undefined" ? FRASES : this.FRASES;', ctx);
  const jobs = [];
  for (const [id, l] of Object.entries(ctx.LUGARES)) jobs.push({ out: `audio/lugares/${id}.m4a`, voz: VOZ, estilo: ESTILO_PT, text: `${l.nome}. <short pause> ${l.epoca}. <short pause> ${l.historia}` });
  ctx.FARAOS.forEach((f, i) => jobs.push({ out: `audio/faraos/${i}.m4a`, voz: VOZ, estilo: ESTILO_PT, text: `${f.nome}. <short pause> ${f.texto}` }));
  ctx.FRASES.forEach((c, ci) => c.itens.forEach((f, ii) => jobs.push({ out: `audio/frases/${ci}_${ii}.m4a`, voz: VOZ_ARABE, estilo: ESTILO_AR, text: f.ar })));
  return jobs;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
class CotaEsgotada extends Error {}

async function sintetizar(texto, voz, estilo, key) {
  const body = {
    model: MODELO,
    input: [{ type: 'user_input', content: [{ type: 'text', text: texto, annotations: [{ type: 'speech_metadata', style: estilo }] }] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: voz }] },
  };
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    let r;
    try {
      r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
    } catch (e) { await sleep(2000 * tentativa); continue; }
    if (r.ok) {
      const j = await r.json();
      const audios = (j.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(c => c.type === 'audio' && c.data);
      if (!audios.length) throw new Error('Resposta sem áudio: ' + JSON.stringify(j).slice(0, 300));
      return { data: Buffer.from(audios[audios.length - 1].data, 'base64'), mime: audios[audios.length - 1].mime_type || '' };
    }
    const txt = await r.text();
    if (r.status === 401 || r.status === 403 || /API_KEY_INVALID|API key not valid/i.test(txt)) throw new Error(`Chave recusada (${r.status}): ${txt.slice(0, 200)}`);
    if (r.status === 429) {
      if (/per.?day|PerDay|daily/i.test(txt)) throw new CotaEsgotada(txt.slice(0, 300));
      await sleep(15000 * tentativa); continue;
    }
    if (r.status >= 500) { await sleep(3000 * tentativa); continue; }
    throw new Error(`Erro ${r.status}: ${txt.slice(0, 300)}`);
  }
  throw new Error('Falhou depois de 6 tentativas');
}

// Divide textos longos em blocos por frase, caso o modelo recuse o texto inteiro.
function dividir(texto, max = 600) {
  const frases = texto.match(/[^.!?]+[.!?]+["”]?\s*/g) || [texto];
  const blocos = []; let atual = '';
  for (const f of frases) { if ((atual + f).length > max && atual) { blocos.push(atual.trim()); atual = ''; } atual += f; }
  if (atual.trim()) blocos.push(atual.trim());
  return blocos;
}

function paraM4a(wavs, destino, tmp) {
  const lista = path.join(tmp, 'lista.txt');
  const arquivos = wavs.map((buf, i) => { const f = path.join(tmp, `p${i}.wav`); fs.writeFileSync(f, buf); return f; });
  fs.writeFileSync(lista, arquivos.map(f => `file '${f}'`).join('\n'));
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', destino]);
}

// O retorno pode vir como WAV ou como PCM puro (24 kHz, mono, 16 bits). Garante WAV.
function garantirWav(buf) {
  if (buf.slice(0, 4).toString() === 'RIFF') return buf;
  const h = Buffer.alloc(44); const rate = 24000, ch = 1, bits = 16;
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * ch * bits / 8, 28); h.writeUInt16LE(ch * bits / 8, 32); h.writeUInt16LE(bits, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  return Buffer.concat([h, buf]);
}

async function gravar(job, destino, key, tmp) {
  try {
    const { data } = await sintetizar(job.text, job.voz, job.estilo, key);
    paraM4a([garantirWav(data)], destino, tmp);
  } catch (e) {
    if (e instanceof CotaEsgotada || /Chave recusada/.test(e.message) || job.text.length < 300) throw e;
    const partes = [];
    for (const bloco of dividir(job.text)) partes.push(garantirWav((await sintetizar(bloco, job.voz, job.estilo, key)).data));
    paraM4a(partes, destino, tmp);
  }
}

(async () => {
  const key = chave();
  if (!key) { console.error('Sem chave. Defina GEMINI_API_KEY ou guarde no Keychain com:\n  security add-generic-password -a "$USER" -s GEMINI_API_KEY -w'); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-tts-'));
  let jobs = carregarDados();
  if (amostra) {
    jobs = [jobs.find(j => j.out.endsWith('/piramides.m4a')), jobs.find(j => j.out.endsWith('frases/2_0.m4a'))];
    for (const j of jobs) { const d = path.join(RAIZ, 'amostras', path.basename(path.dirname(j.out)) + '-' + path.basename(j.out)); await gravar(j, d, key, tmp); console.log('amostra:', path.relative(RAIZ, d)); }
    return;
  }
  const reg = fs.existsSync(REGISTRO) ? JSON.parse(fs.readFileSync(REGISTRO, 'utf8')) : {};
  let feitos = 0, pulados = 0, falhas = 0;
  for (const j of jobs) {
    const assinatura = crypto.createHash('sha1').update([MODELO, j.voz, j.estilo, j.text].join('|')).digest('hex').slice(0, 16);
    const destino = path.join(APP, j.out);
    if (reg[j.out] === assinatura && fs.existsSync(destino)) { pulados++; continue; }
    try {
      await gravar(j, destino, key, tmp);
      reg[j.out] = assinatura; fs.writeFileSync(REGISTRO, JSON.stringify(reg, null, 1));
      feitos++; process.stdout.write(`\r${feitos + pulados}/${jobs.length} ${j.out}                    `);
    } catch (e) {
      if (e instanceof CotaEsgotada) { console.log(`\nCota diária do Gemini esgotada. ${feitos + pulados} de ${jobs.length} prontos. Rode de novo amanhã (ou ative o faturamento) que ele continua daqui.`); process.exit(3); }
      if (/Chave recusada/.test(e.message)) { console.log('\n' + e.message); process.exit(2); }
      falhas++; console.log(`\nFalhou ${j.out}: ${e.message}`);
    }
  }
  console.log(`\nPronto: ${feitos} gravados agora, ${pulados} já estavam prontos, ${falhas} falhas.`);
  if (falhas) process.exit(1);
})().catch(e => { console.error('Erro: ' + e.message.split('\n')[0].slice(0, 160)); process.exit(1); });
