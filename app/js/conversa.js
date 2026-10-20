/* ===== Conversar com alguém: tradução simultânea pelo app Traduzir do iPhone ===== */
Views.conversa = () => {
  const feito = Store.get('offlineManual', {});
  const html = `
  <div class="card nile"><b>Tradução simultânea</b><p class="small">Você fala em português e o iPhone fala em árabe. A outra pessoa responde em árabe e o iPhone fala em português. Quem faz isso é o app <b>Traduzir</b>, que já vem no iPhone e funciona <b>sem internet</b>.</p></div>

  <div class="card"><div class="row" style="align-items:center;gap:14px">
    <div style="flex:0 0 64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#1a73e8,#0b57d0);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem">A文</div>
    <div><b>Abra o app Traduzir</b><div class="small">Ícone azul com as letras A e 文. Para achar rápido: arraste o dedo para baixo no meio da tela inicial e escreva <b>Traduzir</b>.</div></div>
  </div></div>

  <h2>Na hora de conversar</h2>
  <div class="card"><ol class="dots" style="padding-left:22px">
    <li>No app Traduzir, toque em <b>Conversa</b>, na parte de baixo.</li>
    <li>Em cima, escolha <b>Português (Brasil)</b> e <b>Árabe</b>.</li>
    <li>Toque no <b>microfone</b> e fale normalmente. O iPhone traduz e fala em voz alta.</li>
    <li>Toque no microfone de novo para a outra pessoa responder.</li>
  </ol>
  <p class="small"><b>Para ninguém precisar tocar em nada:</b> toque nos <b>três pontinhos (···)</b> e ligue <b>Tradução Automática</b> e <b>Detectar Idioma</b>. Aí o iPhone escuta, percebe quem está falando e traduz sozinho.</p>
  <p class="small"><b>Celular na mesa, entre as duas pessoas:</b> nos três pontinhos, escolha <b>Frente a Frente</b>. A tela se divide, com uma metade virada para cada pessoa.</p></div>

  <h2>Antes de viajar, no wi-fi</h2>
  <div class="card">
    <div class="check ${feito.traduzir ? 'done' : ''}" onclick="marcarConversa('traduzir')"><div class="box">${feito.traduzir ? '✓' : ''}</div><div class="label"><b>Baixar árabe e português</b><div class="muted small">No app Traduzir: toque no nome de um idioma, em cima → role até <b>Idiomas Disponíveis Offline</b> → toque na nuvem ao lado de <b>Árabe</b> e de <b>Português (Brasil)</b>.</div></div></div>
    <div class="check ${feito.traduzirLocal ? 'done' : ''}" onclick="marcarConversa('traduzirLocal')"><div class="box">${feito.traduzirLocal ? '✓' : ''}</div><div class="label"><b>Ligar o modo sem internet</b><div class="muted small">Ajustes do iPhone → Apps → <b>Traduzir</b> → ligue <b>Modo no Dispositivo</b>.</div></div></div>
    <div class="check ${feito.traduzirIcone ? 'done' : ''}" onclick="marcarConversa('traduzirIcone')"><div class="box">${feito.traduzirIcone ? '✓' : ''}</div><div class="label"><b>Deixar o ícone ao lado do Eu falei Faraó</b><div class="muted small">Arraste a tela inicial toda para a esquerda até a <b>Biblioteca de Apps</b>, ache o Traduzir, segure o ícone e arraste para a tela inicial.</div></div></div>
    <div class="check ${feito.traduzirTeste ? 'done' : ''}" onclick="marcarConversa('traduzirTeste')"><div class="box">${feito.traduzirTeste ? '✓' : ''}</div><div class="label"><b>Testar no modo avião</b><div class="muted small">Ligue o modo avião, abra o Conversa e fale "Bom dia, quanto custa?". Se o iPhone falar em árabe, está pronto.</div></div></div>
  </div>

  <div class="card sand small"><b>Dicas</b><ul class="dots">
    <li>Fale frases curtas e simples, uma de cada vez.</li>
    <li>O árabe do iPhone é o árabe padrão. Os egípcios entendem, mas respondem com sotaque, e às vezes o iPhone erra. Se não entender, peça para repetir mais devagar: <b>"shuáia shuáia"</b>.</li>
    <li>Em lugar barulhento, como bazar ou rua, aproxime o celular da boca de quem fala.</li>
    <li>Para placas e cardápios, use <a href="#camera">Traduzir com câmera</a>.</li>
    <li>Os nomes dos botões podem mudar um pouco conforme a versão do iPhone.</li>
  </ul></div>

  <div class="row"><a class="btn secondary sm" href="https://apps.apple.com/br/app/id1514844618" target="_blank">Não tenho o app Traduzir</a><a class="btn secondary sm" href="https://apps.apple.com/app/id414706506" target="_blank">Alternativa: Google Tradutor</a></div>`;
  return { title: 'Conversar com alguém', html, nav: 'frases' };
};
function marcarConversa(k) { const f = Store.get('offlineManual', {}); f[k] = !f[k]; Store.set('offlineManual', f); render(true); }
