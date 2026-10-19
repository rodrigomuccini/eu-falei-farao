// Roteiro extraído do voucher Corsini / Cativa (20/10 a 01/11/2026)
const VIAGEM = {
  titulo: 'Egito Clássico, Cruzeiro pelo Nilo & Sharm El Sheikh',
  inicio: '2026-10-20',
  fim: '2026-11-01',
  operadora: 'Corsini Travel & Tourism (operado pela Cativa)',
  voucher: 'CAT00229/20/31102026',
  acomodacao: '1 quarto duplo (DBL)',
  avisoVacina: 'Apresentar o cartão de vacinação contra febre amarela na chegada ao aeroporto do Cairo.',
  emergencia: [
    { nome: 'Corsini – Emergências 24h (WhatsApp)', tel: '+201144141314' },
    { nome: 'Corsini – Emergências 24h (2)', tel: '+201120732992' },
    { nome: 'Corsini – Emergências 24h (3)', tel: '+201012022187' },
    { nome: 'Corsini – Emergências 24h (4)', tel: '+201555374660' },
  ],
  endereco: 'Corsini Travel & Tourism · 14 Dr. Hanem Street, Behind Le Meridien Pyramids, Old Hadaek Al Ahram, Giza – Cairo',
  gorjetas: {
    cruzeiro: 'US$ 50 por pessoa para a equipe do barco (obrigatória, já paga no invoice)',
    guia: 'Sugerido US$ 8 por pessoa, por dia, para guia e motorista',
  },
  chip: 'O pacote inclui chip de internet com 5 GB (WhatsApp, Instagram e Facebook; sem vídeos). Peça ao representante na chegada.',
};

const HOTEIS = {
  hi: {
    nome: 'Holiday Inn Cairo Citystars',
    cidade: 'Cairo',
    endereco: 'Ali Rashid St., Nasr City (complexo Citystars), Cairo',
    enderecoAr: 'فندق هوليداي إن القاهرة سيتي ستارز – شارع علي راشد، مدينة نصر، القاهرة',
    tel: '+20224803000',
    telNota: 'Confirme o telefone com a recepção no check-in.',
    maps: 'https://maps.google.com/?q=Holiday+Inn+Cairo+Citystars',
    regime: 'Café da manhã incluído',
  },
  cruzeiro: {
    nome: 'Helio by Jaz – Corsini Nile Cruise',
    cidade: 'Aswan → Luxor',
    endereco: 'Cruzeiro pelo Nilo (embarque em Aswan, desembarque em Luxor)',
    enderecoAr: 'الباخرة النيلية هيليو باي جاز – أسوان',
    tel: '',
    telNota: 'Use os telefones de emergência da Corsini.',
    maps: '',
    regime: 'Pensão completa (bebidas não incluídas)',
  },
  aurora: {
    nome: 'Aurora Oriental Resort',
    cidade: 'Sharm El Sheikh',
    endereco: 'Nabq Bay, Sharm El Sheikh, Sinai do Sul',
    enderecoAr: 'منتجع أورورا أورينتال – خليج نبق، شرم الشيخ',
    tel: '+20693710061',
    telNota: 'Confirme o telefone com a recepção no check-in.',
    maps: 'https://maps.google.com/?q=Aurora+Oriental+Resort+Sharm+El+Sheikh',
    regime: 'All inclusive (refeições e bebidas das 10h às 24h)',
  },
};

const CIDADES = {
  Cairo: { lat: 30.04, lon: 31.24 },
  Aswan: { lat: 24.09, lon: 32.90 },
  'Kom Ombo': { lat: 24.45, lon: 32.93 },
  Edfu: { lat: 24.98, lon: 32.87 },
  Luxor: { lat: 25.69, lon: 32.64 },
  'Sharm El Sheikh': { lat: 27.92, lon: 34.33 },
};

const ROTEIRO = [
  {
    n: 1, data: '2026-10-20', titulo: 'Brasil → Cairo', cidade: 'Cairo', hotel: 'hi',
    resumo: 'Chegada ao Cairo. A equipe da Corsini espera na área de desembarque com cartaz, ajuda no visto e leva ao hotel.',
    atividades: [
      { t: 'Desembarque no Cairo', d: 'Procure o cartaz com o nome da Corsini / Cativa ou com o seu nome, ainda antes da imigração. Eles cuidam do visto.' },
      { t: 'Cartão de febre amarela', d: 'Tenha o cartão de vacinação na mão junto com o passaporte.' },
      { t: 'Chip de internet', d: 'Peça ao representante o chip de 5 GB incluído no pacote. Peça ajuda para instalar.' },
      { t: 'Traslado ao hotel', d: 'Holiday Inn Citystars. Pernoite.' },
    ],
    opcionais: [],
    dicas: ['Troque pouco dinheiro no aeroporto, só para o primeiro dia. Dólar é bem aceito.', 'Acerte o relógio: Cairo está 5 horas à frente de Brasília (6 horas até o dia 29/10, quando o horário de verão egípcio termina).', 'Beba água e descanse. Amanhã é dia de pirâmides.'],
    lugares: [],
  },
  {
    n: 2, data: '2026-10-21', titulo: 'Pirâmides de Gizé e Esfinge', cidade: 'Cairo', hotel: 'hi',
    resumo: 'O dia mais esperado: as três Grandes Pirâmides, o Templo do Vale de Quéfren e a Esfinge. Almoço incluído.',
    atividades: [
      { t: 'Complexo de Gizé', d: 'Quéops, Quéfren e Miquerinos, a única das Sete Maravilhas do Mundo Antigo que ainda existe.', lugar: 'piramides' },
      { t: 'Templo do Vale de Quéfren', d: 'Templo de granito onde o corpo do faraó era preparado.', lugar: 'piramides' },
      { t: 'Grande Esfinge', d: 'Corpo de leão, cabeça humana, 20 metros de altura.', lugar: 'esfinge' },
      { t: 'Galeria de papiros', d: 'Parada em loja. Não há obrigação de comprar. Veja o guia de pechincha em Dinheiro.' },
      { t: 'Almoço em restaurante local', d: 'Incluído.' },
    ],
    opcionais: [
      { t: 'Pirâmide Vermelha e Saqqara', d: 'Entrada no interior da Pirâmide Vermelha e visita a Saqqara, a primeira pirâmide da história.', lugar: 'saqqara' },
      { t: 'Cairo à noite', d: 'Passeio de barco no Nilo, rua El Moez, mesquitas medievais e show dos Dervixes.' },
    ],
    dicas: ['Entrar dentro da Grande Pirâmide é ingresso extra, limitado e comprado na hora. É apertado, quente e sem nada dentro: a pessoa com problemas de coluna ou claustrofobia pode pular sem perder nada.', 'Passeio de camelo: combine o preço ANTES e inclua a descida. Diga "la shukran" (não, obrigada) com firmeza para vendedores.', 'Chapéu, protetor, água e tênis. Não há sombra.', 'Taxa de câmera: celular é livre; câmera profissional pode exigir bilhete.'],
    lugares: ['piramides', 'esfinge', 'saqqara'],
  },
  {
    n: 3, data: '2026-10-22', titulo: 'Grande Museu Egípcio (GEM)', cidade: 'Cairo', hotel: 'hi',
    resumo: 'O novo museu, o maior do mundo dedicado a uma civilização, com o tesouro completo de Tutancâmon. Almoço incluído.',
    atividades: [
      { t: 'Grande Museu Egípcio', d: 'Grande Escadaria, estátua colossal de Ramsés II, Obelisco Suspenso e as galerias de Tutancâmon com a máscara de ouro.', lugar: 'gem' },
      { t: 'Almoço em restaurante local', d: 'Incluído.' },
    ],
    opcionais: [
      { t: 'Cairo Copta, Cidadela e Khan El Khalili', d: 'Igrejas antigas do bairro copta, Cidadela de Saladino com a Mesquita de Alabastro, e o grande bazar.', lugar: 'cidadela' },
    ],
    dicas: ['O museu é enorme: use sapato confortável e aproveite os bancos. Há cafés dentro.', 'Foto com celular costuma ser permitida, sem flash. Câmera grande pode ter que ficar no guarda-volumes. Pergunte ao guia.', 'Se for ao Khan El Khalili: é o lugar para comprar, mas pechinche. Comece oferecendo um terço do preço pedido.', 'Mesquita: ombros e joelhos cobertos, lenço na cabeça, tirar os sapatos.'],
    lugares: ['gem', 'cidadela', 'khan', 'copta'],
  },
  {
    n: 4, data: '2026-10-23', titulo: 'Voo para Aswan e embarque no cruzeiro', cidade: 'Aswan', hotel: 'cruzeiro',
    resumo: 'Manhã de voo. Em Aswan: Represa Alta, passeio de feluca e Templo de Philae. Embarque no cruzeiro com almoço a bordo.',
    atividades: [
      { t: 'Check-out e voo Cairo → Aswan', d: 'Franquia de 25 kg + 8 kg de mão. Horário do voo com o guia.' },
      { t: 'Represa Alta de Aswan', d: 'A maior obra de engenharia moderna do Egito.', lugar: 'represa' },
      { t: 'Passeio de feluca', d: 'O veleiro tradicional do Nilo. Momento de foto.', lugar: 'feluca' },
      { t: 'Templo de Philae', d: 'O templo de Ísis, o "templo do amor", salvo das águas pedra por pedra.', lugar: 'philae' },
      { t: 'Embarque no cruzeiro', d: 'Almoço a bordo, tarde livre, jantar e pernoite.' },
    ],
    opcionais: [],
    dicas: ['Aswan é a cidade mais quente do roteiro. Água o tempo todo.', 'No barco a bordo as bebidas são pagas à parte.', 'Gorjeta da tripulação (US$ 50) já está paga. Não precisa pagar de novo.', 'Mantenha os remédios na bagagem de mão, nunca na mala despachada.'],
    lugares: ['represa', 'feluca', 'philae'],
  },
  {
    n: 5, data: '2026-10-24', titulo: 'Abu Simbel (opcional), Kom Ombo e festa Galabeya', cidade: 'Kom Ombo', hotel: 'cruzeiro',
    resumo: 'Manhã: Abu Simbel (opcional, de ônibus). Tarde: navegação até Kom Ombo e o templo do deus crocodilo. Noite: festa árabe no barco.',
    atividades: [
      { t: 'Navegação até Kom Ombo', d: 'Aproveite o deck: a paisagem do Nilo é a mesma há 5 mil anos.' },
      { t: 'Templo de Kom Ombo', d: 'Templo duplo dedicado a Sobek (crocodilo) e Hórus. Museu com crocodilos mumificados.', lugar: 'komombo' },
      { t: 'Festa Galabeya (inclusa)', d: 'Depois do jantar, no bar do barco. Vendem galabeyas (túnicas) a bordo e nas paradas; é opcional.' },
      { t: 'Navegação noturna até Edfu', d: 'Pernoite em Edfu.' },
    ],
    opcionais: [
      { t: 'Abu Simbel (de ônibus)', d: 'Saída muito cedo (madrugada), cerca de 3h de estrada cada trecho. Os templos de Ramsés II e Nefertari. Um dos lugares mais impressionantes do Egito.', lugar: 'abusimbel' },
    ],
    dicas: ['Se fizer Abu Simbel: leve lanche, água, casaco leve para o ônibus gelado e remédios da manhã.', 'Kom Ombo costuma ser visitado ao fim da tarde: luz linda para fotos.'],
    lugares: ['abusimbel', 'komombo'],
  },
  {
    n: 6, data: '2026-10-25', titulo: 'Edfu, eclusa de Esna e Templo de Luxor', cidade: 'Luxor', hotel: 'cruzeiro',
    resumo: 'Templo de Hórus em Edfu, o mais bem preservado do Egito. Navegação pela eclusa de Esna. Fim de tarde no Templo de Luxor.',
    atividades: [
      { t: 'Templo de Hórus (Edfu)', d: 'O trajeto do barco até o templo costuma ser de charrete (calèche). Combine com o guia.', lugar: 'edfu' },
      { t: 'Eclusa de Esna', d: 'O barco sobe/desce de nível. Vendedores em barquinhos jogam toalhas e lenços para o deck: só pegue se quiser comprar.' },
      { t: 'Templo de Luxor', d: 'Construído por Amenófis III e Ramsés II. Muito bonito ao entardecer, quando acendem as luzes.', lugar: 'luxor' },
    ],
    opcionais: [],
    dicas: ['Charrete em Edfu: o cocheiro vai pedir gorjeta no fim; 20 a 50 libras egípcias é razoável.', 'Templo de Luxor à noite é um dos pontos altos de foto da viagem.'],
    lugares: ['edfu', 'luxor'],
  },
  {
    n: 7, data: '2026-10-26', titulo: 'Karnak, Vale dos Reis e volta ao Cairo', cidade: 'Luxor', hotel: 'hi',
    resumo: 'Templos de Karnak (incluído). Opcional: Colossos de Mêmnon, Vale dos Reis e Templo de Hatshepsut. Almoço e voo para o Cairo.',
    atividades: [
      { t: 'Desembarque do cruzeiro', d: 'Confira a cabine: carregadores, remédios, óculos.' },
      { t: 'Templos de Karnak', d: 'O maior complexo religioso do mundo antigo: 22 templos, a Sala Hipostila com 134 colunas.', lugar: 'karnak' },
      { t: 'Almoço', d: 'Incluído.' },
      { t: 'Voo Luxor → Cairo', d: 'Traslado ao hotel Holiday Inn Citystars.' },
    ],
    opcionais: [
      { t: 'Colossos de Mêmnon', d: 'Duas estátuas gigantes de Amenófis III, tudo o que restou de seu templo funerário.', lugar: 'memnon' },
      { t: 'Vale dos Reis', d: 'O ingresso dá direito a 3 tumbas. A tumba de Tutancâmon é paga à parte.', lugar: 'valedosreis' },
      { t: 'Templo de Hatshepsut', d: 'O templo em terraços da mulher que foi faraó.', lugar: 'hatshepsut' },
    ],
    dicas: ['Vale dos Reis: tumbas são quentes e abafadas; máscara ajuda quem tem alergia. Lanterna pequena é útil.', 'No Vale dos Reis a foto com celular é liberada no ingresso normal (sem flash). Confirme com o guia.', 'Dia longo e cheio: tome o café reforçado e leve lanche.'],
    lugares: ['karnak', 'memnon', 'valedosreis', 'hatshepsut'],
  },
  {
    n: 8, data: '2026-10-27', titulo: 'Dia livre no Cairo (Alexandria ou Fayoum opcionais)', cidade: 'Cairo', hotel: 'hi',
    resumo: 'Dia livre. Opcionais: Alexandria (220 km, Mediterrâneo, catacumbas, biblioteca) ou Oásis de Fayoum com jipe no deserto.',
    atividades: [
      { t: 'Dia livre', d: 'Ideias sem sair muito: shopping Citystars (ao lado do hotel, com ar-condicionado e restaurantes), Museu Egípcio da praça Tahrir, Cairo Copta, ou simplesmente descansar.' },
    ],
    opcionais: [
      { t: 'Alexandria', d: 'Catacumbas de Kom el Shoqafa, Biblioteca de Alexandria (fechada às sextas; hoje é terça, está aberta), Teatro Romano, Coluna de Pompeu e Cidadela de Qaitbay. Dia longo de ônibus.', lugar: 'alexandria' },
      { t: 'Oásis de Fayoum e safári', d: 'Cachoeiras de Wadi El Rayan, jipe 4x4 nas dunas, lago no deserto, chá beduíno e almoço em acampamento. Mais solavanco, menos história.', lugar: 'fayoum' },
    ],
    dicas: ['Para táxi: use o aplicativo Uber ou Careem (funcionam no Cairo). Mostre o endereço do hotel em árabe pelo app.', 'Dia bom para lavar roupa no hotel, organizar fotos e ligar para a família com calma.'],
    lugares: ['alexandria', 'fayoum', 'copta', 'khan'],
  },
  {
    n: 9, data: '2026-10-28', titulo: 'Voo para Sharm El Sheikh', cidade: 'Sharm El Sheikh', hotel: 'aurora',
    resumo: 'Check-out, voo Cairo → Sharm El Sheikh e traslado ao resort all inclusive Aurora Oriental.',
    atividades: [
      { t: 'Check-out e voo para Sharm', d: 'Horário com o guia.' },
      { t: 'Check-in no Aurora Oriental Resort', d: 'All inclusive: refeições e bebidas das 10h às 24h incluídas.' },
    ],
    opcionais: [],
    dicas: ['No resort, pulseira all inclusive no braço. Guarde o cartão do quarto e o número da recepção.', 'Mar Vermelho: corais cortam. Sapatilha de água ajuda, e não pise nos corais.', 'Protetor solar forte: sol do deserto com reflexo do mar.'],
    lugares: ['sharm'],
  },
  {
    n: 10, data: '2026-10-29', titulo: 'Sharm El Sheikh: dia livre', cidade: 'Sharm El Sheikh', hotel: 'aurora',
    resumo: 'Dia livre no resort: praia, piscinas, restaurantes.',
    atividades: [{ t: 'Dia livre', d: 'Praia, piscina, descanso.' }],
    opcionais: [{ t: 'Quadriciclo no deserto', d: 'Para quem gosta de aventura. Poeira e solavancos; avalie com calma.' }],
    dicas: ['ATENÇÃO: hoje o Egito termina o horário de verão. De madrugada os relógios atrasam 1 hora. O iPhone ajusta sozinho; confira os horários de remédio.', 'Depois do horário mudar, a diferença para o Brasil passa a ser de 5 horas.'],
    lugares: ['sharm'],
  },
  {
    n: 11, data: '2026-10-30', titulo: 'Sharm El Sheikh: dia livre', cidade: 'Sharm El Sheikh', hotel: 'aurora',
    resumo: 'Dia livre no resort.',
    atividades: [{ t: 'Dia livre', d: 'Praia, piscina, descanso.' }],
    opcionais: [{ t: 'Passeio de barco no Mar Vermelho', d: 'Snorkel entre corais e peixes coloridos. Um dos melhores mergulhos rasos do mundo. Barco com fundo de vidro é opção para quem não quer entrar na água.' }],
    dicas: ['Em passeio de barco: protetor, chapéu, camiseta na água para não queimar as costas.'],
    lugares: ['sharm'],
  },
  {
    n: 12, data: '2026-10-31', titulo: 'Sharm El Sheikh: dia livre', cidade: 'Sharm El Sheikh', hotel: 'aurora',
    resumo: 'Último dia inteiro. Aproveite e comece a arrumar as malas.',
    atividades: [{ t: 'Dia livre', d: 'Praia, piscina, descanso.' }, { t: 'Arrumar as malas', d: 'Lembre: 25 kg na mala despachada no voo interno. Líquidos acima de 100 ml não vão na mão.' }],
    opcionais: [],
    dicas: ['Confira o horário do voo de amanhã e o traslado com o guia.', 'Separe para a bagagem de mão: remédios, documentos, carregador, um casaco (o avião é frio).'],
    lugares: ['sharm'],
  },
  {
    n: 13, data: '2026-11-01', titulo: 'Sharm → Cairo → Brasil', cidade: 'Sharm El Sheikh', hotel: null,
    resumo: 'Check-out, voo para o Cairo e conexão para o Brasil. Fim dos serviços da Corsini.',
    atividades: [
      { t: 'Check-out e voo Sharm → Cairo', d: 'Conexão para o voo internacional.' },
      { t: 'Voo para o Brasil', d: 'Boa viagem de volta!' },
    ],
    opcionais: [],
    dicas: ['Na conexão no Cairo: passaporte e cartão de embarque sempre à mão.', 'Gaste as libras egípcias que sobraram no aeroporto; fora do Egito elas não valem.'],
    lugares: [],
  },
];
