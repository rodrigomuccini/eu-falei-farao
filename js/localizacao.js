/* ===== Localização ao vivo para a família ===== */
Views.localizacao = () => {
  const cfg = Cfg.get(); const nome = esc(cfg.familiaNome || 'Rodrigo');
  const ult = Pos.ultima();
  const html = `
  <div class="card green"><b>✓ Vocês já usam o app Buscar</b><p class="small">O ${nome} vê você em tempo real no app <b>Buscar</b> do iPhone dele, mesmo com o seu celular bloqueado no bolso. Para continuar funcionando na viagem:</p>
  <ol class="dots small" style="padding-left:22px">
    <li>Deixe o iPhone com <b>Ajustes → [seu nome] → Buscar → Compartilhar Localização</b> ligado.</li>
    <li>Em <b>Ajustes → Privacidade e Segurança → Serviços de Localização</b>, deixe ligado.</li>
    <li>Não use o <b>Modo de Pouca Energia</b> o dia todo: ele atrasa a atualização. Leve carregador portátil.</li>
    <li>O Buscar precisa de internet para atualizar. Com o chip da agência (só WhatsApp, Instagram e Facebook), ele pode não atualizar fora do wi-fi. Nesse caso, use o botão abaixo ou o SOS por SMS.</li>
  </ol>
  <a class="btn secondary sm" href="findmy://">Abrir o app Buscar</a></div>

  <details><summary>Alternativa: Google Maps (para ver também no computador)</summary>
  <ol class="dots small" style="padding-left:22px">
    <li>Instale o <b>Google Maps</b> e entre com o seu Gmail.</li>
    <li>Toque na sua foto → <b>Compartilhamento de local</b> → <b>Novo compartilhamento</b> → <b>Até você desativar</b> → escolha o ${nome}.</li>
    <li>Em <b>Ajustes → Google Maps → Localização</b>, marque <b>Sempre</b>.</li>
  </ol>
  <div class="row"><a class="btn nile sm" href="comgooglemaps://">Abrir Google Maps</a><a class="btn secondary sm" href="https://apps.apple.com/app/id585027354" target="_blank">Baixar Google Maps</a></div></details>

  <button class="btn green" onclick="enviarLocalizacao()">📍 Mandar minha localização agora pelo WhatsApp</button>
  ${ult ? `<p class="muted small">Última localização guardada no app: ${esc((descreverLocal(ult.lat, ult.lon) || {}).nome || '')}, ${new Date(ult.t).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} (hora do Egito).</p>` : ''}

  <h2>Para o ${nome} (no celular dele)</h2>
  <div class="card small"><ol class="dots" style="padding-left:22px">
    <li>Abra o app <b>Buscar</b> → aba <b>Pessoas</b> → toque no nome dela para ver no mapa e traçar o caminho.</li>
    <li>Em <b>Notificar</b>, dá para receber aviso quando ela chegar ou sair de um lugar (por exemplo, do hotel).</li>
    <li>No computador, a localização das pessoas não aparece em icloud.com. Use o iPhone ou o iPad.</li>
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
