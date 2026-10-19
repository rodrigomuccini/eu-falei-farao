# Egito com a Mãe

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
3. Abrir pelo ícone "Egito" uma vez com internet; depois funciona offline.

## Configurar remédios e ficha pelo computador

Abrir o app no computador, preencher Remédios, Ficha médica e Configurações (WhatsApp da família), depois Configurações → "Gerar link de configuração". Mandar o link pelo WhatsApp; ao abrir no iPhone, tudo é importado. Documentos com foto ficam só no celular.
