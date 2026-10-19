// Gera os arquivos de áudio do app a partir dos textos em app/js/data.
// Uso: node tools/gerar-audios.js   (precisa de macOS com as vozes Luciana e Majed, e ffmpeg)
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', 'app');
const ctx = {}; vm.createContext(ctx);
for (const f of ['roteiro.js', 'lugares.js', 'frases.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data', f), 'utf8') + '\n;this.LUGARES = typeof LUGARES !== "undefined" ? LUGARES : this.LUGARES; this.FARAOS = typeof FARAOS !== "undefined" ? FARAOS : this.FARAOS; this.FRASES = typeof FRASES !== "undefined" ? FRASES : this.FRASES;', ctx);
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'audios-'));
const jobs = [];
for (const [id, l] of Object.entries(ctx.LUGARES)) jobs.push({ out: `audio/lugares/${id}.m4a`, voz: 'Luciana', rate: 165, text: `${l.nome}. ${l.epoca}. ${l.historia}` });
ctx.FARAOS.forEach((f, i) => jobs.push({ out: `audio/faraos/${i}.m4a`, voz: 'Luciana', rate: 165, text: `${f.nome}. ${f.texto}` }));
ctx.FRASES.forEach((c, ci) => c.itens.forEach((f, ii) => jobs.push({ out: `audio/frases/${ci}_${ii}.m4a`, voz: 'Majed', rate: 140, text: f.ar })));
const lista = [];
for (const j of jobs) {
  const dest = path.join(ROOT, j.out); fs.mkdirSync(path.dirname(dest), { recursive: true });
  const txt = path.join(tmp, 't.txt'), aiff = path.join(tmp, 'a.aiff');
  fs.writeFileSync(txt, j.text);
  execFileSync('say', ['-v', j.voz, '-r', String(j.rate), '-f', txt, '-o', aiff]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', '22050', '-c:a', 'aac', '-b:a', '40k', '-movflags', '+faststart', dest]);
  lista.push('./' + j.out);
  process.stdout.write('.');
}
// audios.js agora é gerado por tools/indexar-audios.js
  0 && fs.writeFileSync(path.join(ROOT, 'js/data/audios.js'), '// Gerado por tools/gerar-audios.js\nconst AUDIOS = ' + JSON.stringify(lista) + ';\n');
console.log(`\n${jobs.length} áudios gerados.`);
