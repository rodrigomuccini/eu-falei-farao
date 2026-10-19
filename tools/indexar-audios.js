// Gera app/js/data/audios.js com uma marca de versão por arquivo (hash do conteúdo).
// Rode sempre depois de regravar áudios e antes de publicar: node tools/indexar-audios.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const APP = path.join(__dirname, '..', 'app');
const v = {};
for (const pasta of ['lugares', 'faraos', 'frases']) {
  const dir = path.join(APP, 'audio', pasta);
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.m4a')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })))
    v[`audio/${pasta}/${f}`] = crypto.createHash('md5').update(fs.readFileSync(path.join(dir, f))).digest('hex').slice(0, 8);
}
fs.writeFileSync(path.join(APP, 'js/data/audios.js'), '// Gerado por tools/indexar-audios.js\nconst AUDIO_V = ' + JSON.stringify(v) + ';\nconst audioURL = p => \'./\' + p + \'?v=\' + (AUDIO_V[p] || \'0\');\nconst AUDIOS = Object.keys(AUDIO_V).map(audioURL);\n');
console.log(Object.keys(v).length + ' áudios indexados');
