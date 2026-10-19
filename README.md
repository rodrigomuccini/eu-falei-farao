# Eu falei Faraó

Aplicativo de viagem (PWA) para a viagem ao Egito de 20/10 a 01/11/2026, operada pela Corsini / Cativa.
Feito para iPhone, em português, funciona sem internet depois de aberto uma vez.

## Estrutura

- `app/index.html` – página única do app
- `app/css/app.css` – estilos (fonte grande, botões grandes, modo escuro automático)
- `app/js/app.js` – telas e lógica
- `app/js/db.js` – armazenamento local (IndexedDB para documentos, localStorage para o resto)
- `app/js/data/roteiro.js` – os 13 dias do voucher, hotéis, contatos de emergência da Corsini
- `app/js/data/lugares.js` – guia histórico (20 lugares, faraós, deuses), escrito para ser ouvido
- `app/js/data/frases.js` – frases em árabe egípcio com pronúncia e inglês
- `app/js/data/guias.js` – emergência, ficha médica (condições/alergias em PT/EN/AR), dinheiro, comida, cultura, mala, fotografia
- `app/js/sos.js` – SOS: selfie automática, áudio de 30 s, localização, aviso automático (CallMeBot), WhatsApp, SMS
- `app/js/localizacao.js` – guia de localização ao vivo pelo Google Maps
- `app/js/album.js`, `app/js/exif.js` – álbum da viagem por dia e lugar, exportação KML para o Google Earth
- `app/js/tradutor-camera.js`, `app/js/data/glossario.js` – tradução por foto e câmera ao vivo (OCR Tesseract.js no celular, tradução MyMemory, glossário offline)
- `app/js/offline.js` – tela "Usar sem internet", previsão e cotação guardadas, aviso de conexão
- `app/vendor/tesseract/` – Tesseract.js 5.1.1 (Apache 2.0) com dados de árabe e inglês
- `app/audio/` – histórias, faraós e frases gravados em áudio (gerados por `tools/gerar-audios.js`)
- `app/sw.js`, `app/manifest.json`, `app/icons/` – instalação como app e modo offline

## Rodar localmente

```bash
python3 -m http.server 8777 --directory app
```

Abra http://localhost:8777/ no navegador. Em Configurações há um campo "Simular data" para ver a tela Hoje de qualquer dia da viagem.

## Publicar

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Basta publicar a pasta `app/`. O app precisa de HTTPS para instalar e funcionar offline.

## Instalar no iPhone

1. Abrir o endereço publicado no Safari.
2. Botão de compartilhar → "Adicionar à Tela de Início".
3. Abrir pelo ícone "Eu falei Faraó" uma vez com internet; depois funciona offline.

## Configurar remédios e ficha pelo computador

Abrir o app no computador, preencher Remédios, Ficha médica e Configurações (WhatsApp da família), depois Configurações → "Gerar link de configuração". Mandar o link pelo WhatsApp; ao abrir no iPhone, tudo é importado. Documentos com foto ficam só no celular.

## Regenerar os áudios

As vozes são do Gemini TTS, voz Sulafat. A chave fica no Keychain do Mac (serviço `GEMINI_API_KEY`).

```bash
node tools/gerar-audios-gemini.js
```

O plano gratuito do Gemini limita cerca de 10 gravações por dia e por modelo. O gerador passa para o próximo modelo quando a cota acaba e continua no dia seguinte de onde parou. Para regravar no melhor modelo o que saiu num modelo inferior:

```bash
node tools/gerar-audios-gemini.js --melhorar
```

Depois de qualquer gravação, atualize as versões antes de publicar, para o iPhone baixar os arquivos novos:

```bash
node tools/indexar-audios.js
```

O gerador antigo com as vozes do Mac (`tools/gerar-audios.js`) continua como reserva.
