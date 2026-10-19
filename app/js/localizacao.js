/* ===== Localização ao vivo para a família ===== */
Views.localizacao = () => {
  const cfg = Cfg.get(); const nome = esc(cfg.familiaNome || 'Rodrigo');
  const ult = Pos.ultima();
  const html = `
  <div class="card nile"><b>Como funciona</b><p class="small">O ${nome} acompanha você em tempo real pelo <b>Google Maps</b> no celular dele, mesmo com o seu iPhone bloqueado no bolso. Você configura uma vez só, antes de viajar. Gasta um pouco mais de bateria: leve o carregador portátil.</p></div>

  <h2>Para você (no seu iPhone)</h2>
  <div class="card"><ol class="dots" style="padding-left:22px">
    <li>Instale o app <b>Google Maps</b> e entre com a sua conta Google (o seu Gmail).</li>
    <li>No Google Maps, toque na sua <b>foto</b> no canto de cima, à direita.</li>
    <li>Toque em <b>Compartilhamento de local</b> e depois em <b>Novo compartilhamento</b>.</li>
    <li>Escolha <b>Até você desativar</b>.</li>
    <li>Escolha o ${nome} (pelo Gmail dele) e toque em <b>Compartilhar</b>.</li>
    <li>No iPhone, abra <b>Ajustes → Google Maps → Localização</b> e marque <b>Sempre</b>. Deixe <b>Localização Precisa</b> ligada.</li>
    <li>Em <b>Ajustes → Geral → Atualização em 2º Plano</b>, deixe o Google Maps ligado.</li>
  </ol>
  <div class="row"><a class="btn nile sm" href="comgooglemaps://">Abrir Google Maps</a><a class="btn secondary sm" href="https://apps.apple.com/app/id585027354" target="_blank">Baixar Google Maps</a></div></div>

  <div class="card sand small"><b>Se o ${nome} tiver iPhone</b>, também dá para usar o app <b>Buscar</b> da Apple: abra Buscar → Pessoas → <b>+</b> → Compartilhar Localização → escolha o ${nome} → <b>Compartilhar Indefinidamente</b>.</div>

  <button class="btn green" onclick="enviarLocalizacao()">📍 Mandar minha localização agora pelo WhatsApp</button>
  ${ult ? `<p class="muted small">Última localização guardada no app: ${esc((descreverLocal(ult.lat, ult.lon) || {}).nome || '')}, ${new Date(ult.t).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} (hora do Egito).</p>` : ''}

  <h2>Para o ${nome} (no celular dele)</h2>
  <div class="card small"><ol class="dots" style="padding-left:22px">
    <li>Abra o <b>Google Maps</b> e toque na sua foto → <b>Compartilhamento de local</b>.</li>
    <li>A foto dela aparece no mapa, atualizando sozinha. Toque nela para ver o endereço, a bateria do celular dela e o caminho até lá.</li>
    <li>No computador, abra <b>maps.google.com</b> → menu ☰ → <b>Compartilhamento de local</b>.</li>
    <li><b>Google Earth</b> não mostra localização ao vivo. Para ver a viagem no Google Earth, use <b>Fotos da viagem → Mapa no Google Earth</b>, que gera um mapa com os lugares das fotos.</li>
  </ol></div>

  <h3>Aviso automático de SOS no WhatsApp (opcional)</h3>
  <div class="card small"><p>Sem isso, o SOS prepara a mensagem e ela toca em enviar. Com isso, o aviso com a localização chega no WhatsApp do ${nome} <b>sozinho</b>, assim que o SOS é tocado. Usa o serviço gratuito CallMeBot, que só envia texto.</p>
  <ol class="dots" style="padding-left:22px">
    <li>No celular do ${nome}, abra <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank">callmebot.com</a> e veja o número atual do robô.</li>
    <li>Salve esse número nos contatos.</li>
    <li>Do WhatsApp do ${nome}, mande para esse contato: <b>I allow callmebot to send me messages</b></li>
    <li>O robô responde com uma <b>apikey</b>. Coloque em <a href="#config">Configurações → Chave do CallMeBot</a>, no celular dela.</li>
  </ol>
  <button class="btn secondary" onclick="testarAvisoAutomatico()" ${cfg.callmebot ? '' : 'disabled'}>🧪 Testar aviso automático</button></div>`;
  return { title: 'Localização ao vivo', html, nav: 'mais' };
};
function testarAvisoAutomatico() {
  const cfg = Cfg.get(); if (!cfg.callmebot) return toast('Coloque a chave em Configurações');
  const msg = 'Teste do app Eu falei Faraó: o aviso automático de SOS está funcionando.';
  fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cfg.familiaTel)}&text=${encodeURIComponent(msg)}&apikey=${encodeURIComponent(cfg.callmebot)}`, { mode: 'no-cors' })
    .then(() => toast('Teste enviado. Confira o WhatsApp em até 1 minuto.')).catch(() => toast('Sem internet agora'));
}
