const EMERGENCIA = {
  locais: [
    { nome: 'Ambulância', tel: '123', desc: 'Emergência médica em todo o Egito.' },
    { nome: 'Polícia Turística', tel: '126', desc: 'Para problemas com turistas: roubo, golpe, assédio. Costumam falar inglês.' },
    { nome: 'Polícia', tel: '122', desc: 'Polícia geral (do celular também funciona 112).' },
    { nome: 'Bombeiros', tel: '180', desc: 'Incêndio.' },
  ],
  brasil: [
    { nome: 'Plantão consular do Itamaraty (24h)', tel: '+5561982600610', desc: 'Para emergências graves de brasileiros no exterior: acidente, hospitalização, prisão, falecimento. Funciona por WhatsApp.' },
    { nome: 'Embaixada do Brasil no Cairo', tel: '+20224619837', desc: 'Nile City Towers, Torre Norte, Corniche El Nil, Cairo. Horário comercial. Confirme o número antes de precisar.' },
  ],
  oqueFazer: [
    { t: 'Passei mal (enjoo, diarreia, tontura)', d: 'Pare, sente à sombra, beba água em goles pequenos. Tome o soro de hidratação se tiver. Avise a Iracema e o guia. Se houver febre, vômito repetido ou a tontura não passar em 1 hora, peça ao guia para chamar médico. O seguro-viagem (veja Ficha Médica) deve ser acionado ANTES de ir ao hospital, quando possível.' },
    { t: 'Insolação / muito calor', d: 'Sinais: dor de cabeça, pele quente e seca, confusão. Ir para lugar fresco, molhar nuca e pulsos, beber água com um pouco de sal ou soro. Se não melhorar em 30 minutos, ambulância 123 ou guia.' },
    { t: 'Esqueci de tomar um remédio', d: 'Se lembrou em até algumas horas, tome. Se já está perto da próxima dose, pule e siga o horário normal. Nunca tome dose dupla. Em dúvida, ligue para o Rodrigo ou mande mensagem.' },
    { t: 'Perdi o grupo / o guia', d: 'Fique onde está, de preferência na entrada principal do local. Ligue para o telefone de emergência da Corsini (fala português). Mostre o cartão do hotel em árabe a um funcionário do local.' },
    { t: 'Perdi o passaporte', d: '1) Avise o guia e a Corsini. 2) Faça o boletim na Polícia Turística (126). 3) Ligue para o plantão do Itamaraty. 4) Use a foto do passaporte guardada em Documentos para agilizar. A Embaixada emite documento de viagem para voltar.' },
    { t: 'Roubaram minha bolsa / celular', d: 'Não reaja. Depois: Polícia Turística 126 para o boletim (necessário para o seguro). Ligue para o Rodrigo para bloquear cartões. Troque senhas quando puder.' },
    { t: 'Assédio de vendedor ou "guia" insistente', d: 'Diga "la shukran" firme, não pare de andar, não aceite "presentes" (depois cobram). Em caso de insistência, procure o guia ou um policial turístico (uniforme branco).' },
    { t: 'Água e comida', d: 'Só água de garrafa lacrada, inclusive para escovar os dentes. Sem gelo fora do hotel e do barco. Frutas: só as que você descasca. Salada crua: só em hotel e barco. Comida de rua: só se bem quente e recém-feita.' },
  ],
  farmacia: 'Farmácias (صيدلية) são muitas, abertas até tarde, e vendem a maioria dos remédios sem receita. Mostre a caixa ou o nome do princípio ativo. Cadeias confiáveis: El Ezaby, Seif, 19011.',
  hospitais: 'Para turistas no Cairo, hospitais privados com bom padrão: As-Salam International (Maadi), Cleopatra Hospital (Heliopolis, perto do Citystars), Dar Al Fouad (6 de Outubro). Em Sharm: Sharm International Hospital. Em Luxor e Aswan: pergunte ao guia o hospital internacional. Sempre acione o seguro primeiro.',
};

const CONDICOES = [
  { id: 'has', pt: 'Pressão alta (hipertensão)', en: 'High blood pressure (hypertension)', ar: 'ارتفاع ضغط الدم' },
  { id: 'tireoide', pt: 'Histórico de câncer de tireoide (tratado)', en: 'History of thyroid cancer (treated)', ar: 'تاريخ إصابة بسرطان الغدة الدرقية (تم علاجه)' },
  { id: 'mama', pt: 'Histórico de câncer de mama (tratado)', en: 'History of breast cancer (treated)', ar: 'تاريخ إصابة بسرطان الثدي (تم علاجه)' },
  { id: 'semtireoide', pt: 'Sem glândula tireoide / uso de levotiroxina', en: 'No thyroid gland / takes levothyroxine', ar: 'بدون غدة درقية / تتناول ليفوثيروكسين' },
  { id: 'diabetes', pt: 'Diabetes', en: 'Diabetes', ar: 'السكري' },
  { id: 'cardio', pt: 'Problema cardíaco', en: 'Heart condition', ar: 'مرض في القلب' },
  { id: 'colesterol', pt: 'Colesterol alto', en: 'High cholesterol', ar: 'ارتفاع الكوليسترول' },
  { id: 'anticoag', pt: 'Uso de anticoagulante', en: 'Takes blood thinners (anticoagulant)', ar: 'تتناول مميعات الدم' },
  { id: 'asma', pt: 'Asma / bronquite', en: 'Asthma / bronchitis', ar: 'ربو / التهاب شعبي' },
  { id: 'osteo', pt: 'Osteoporose', en: 'Osteoporosis', ar: 'هشاشة العظام' },
  { id: 'marcapasso', pt: 'Marca-passo', en: 'Pacemaker', ar: 'جهاز تنظيم ضربات القلب' },
  { id: 'protese', pt: 'Prótese metálica', en: 'Metal implant / prosthesis', ar: 'غرسة معدنية' },
];
const ALERGIAS = [
  { id: 'penicilina', pt: 'Penicilina', en: 'Penicillin', ar: 'البنسلين' },
  { id: 'dipirona', pt: 'Dipirona', en: 'Metamizole (dipyrone)', ar: 'ميتاميزول' },
  { id: 'aas', pt: 'Aspirina / AAS', en: 'Aspirin', ar: 'الأسبرين' },
  { id: 'aine', pt: 'Anti-inflamatórios (ibuprofeno etc.)', en: 'NSAIDs (ibuprofen etc.)', ar: 'مضادات الالتهاب غير الستيرويدية' },
  { id: 'iodo', pt: 'Contraste iodado', en: 'Iodine contrast', ar: 'صبغة اليود' },
  { id: 'latex', pt: 'Látex', en: 'Latex', ar: 'اللاتكس' },
  { id: 'frutosmar', pt: 'Frutos do mar', en: 'Seafood / shellfish', ar: 'المأكولات البحرية' },
  { id: 'amendoim', pt: 'Amendoim / nozes', en: 'Peanuts / nuts', ar: 'الفول السوداني / المكسرات' },
  { id: 'lactose', pt: 'Lactose', en: 'Lactose', ar: 'اللاكتوز' },
  { id: 'gluten', pt: 'Glúten', en: 'Gluten', ar: 'الغلوتين' },
];

const DINHEIRO = {
  cotacaoPadrao: { USD_EGP: 48, USD_BRL: 5.05 },
  notas: 'Libra egípcia (EGP, LE ou "guinê"). Notas de 5, 10, 20, 50, 100, 200. Dólar é aceito em quase todo lugar turístico, mas o troco vem em libra. Leve notas de US$ 1 e US$ 5 para gorjetas.',
  gorjetas: [
    { q: 'Guia e motorista (sugestão da agência)', v: 'US$ 8 por pessoa por dia. Pode entregar no fim de cada trecho (Cairo, cruzeiro, Sharm).' },
    { q: 'Tripulação do cruzeiro', v: 'Já pago (US$ 50). Não precisa dar mais, exceto a alguém que ajudou muito.' },
    { q: 'Banheiro público / de templo', v: '5 a 10 libras (sempre tem um "zelador" na porta). Leve papel higiênico na bolsa.' },
    { q: 'Carregador de mala no hotel', v: '20 a 50 libras ou US$ 1.' },
    { q: 'Camareira', v: '20 a 50 libras por dia, deixadas no quarto.' },
    { q: 'Garçom', v: '10% se não estiver na conta.' },
    { q: 'Cocheiro em Edfu, barqueiro da feluca', v: '20 a 50 libras.' },
    { q: 'Guarda de tumba que "mostra algo especial"', v: 'Não é obrigatório. Se aceitar, 10 a 20 libras. Melhor recusar com "la shukran".' },
    { q: 'Foto com camelo / com pessoa fantasiada', v: 'Sempre cobram depois. Combine antes (20 a 50 libras) ou não tire.' },
  ],
  pechincha: [
    { item: 'Papiro (pequeno, verdadeiro)', faixa: '100 a 300 libras. Papiro de verdade não rasga ao dobrar; o de bananeira racha.' },
    { item: 'Lenço / xale de algodão', faixa: '100 a 250 libras.' },
    { item: 'Galabeya (túnica)', faixa: '200 a 500 libras.' },
    { item: 'Caixinha de alabastro pequena', faixa: '100 a 300 libras.' },
    { item: 'Estatueta de resina (gato, pirâmide)', faixa: '50 a 150 libras.' },
    { item: 'Cartucho de prata com nome em hieróglifos', faixa: '800 a 2.000 libras, dependendo do peso. Peça o carimbo de prata.' },
    { item: 'Perfume / óleo essencial (vidro pequeno)', faixa: '150 a 400 libras. Cuidado: diluem muito.' },
    { item: 'Especiarias (100 g)', faixa: '50 a 150 libras.' },
    { item: 'Ímã de geladeira', faixa: '20 a 50 libras.' },
  ],
  comoPechinchar: ['O primeiro preço é sempre 3 a 5 vezes o real. Ofereça um terço e suba devagar.', 'Decida antes quanto vale para você e pare ali. Sorria, agradeça e saia: o preço cai quando você vai embora.', 'Nunca diga quanto pagou em outra loja. Nunca aceite chá se não for comprar.', 'Nas lojas estatais e dentro dos museus, o preço é fixo e não se pechincha.', 'Pague em libras: em dólar o "troco" sempre some.'],
  golpes: [
    { t: '"O templo / museu está fechado hoje"', d: 'Mentira para levar você à loja do "primo". Ignore e vá até a bilheteria.' },
    { t: 'Camelo "de graça"', d: 'Subir é grátis, descer custa. Combine tudo antes ou não suba.' },
    { t: '"Presente" na mão', d: 'Alguém coloca um lenço ou pulseira na sua mão e depois cobra. Devolva na hora.' },
    { t: 'Nota trocada', d: 'A nota de 50 e a de 200 parecem; ao pagar, confira duas vezes. Em dólar, dão troco em libra numa cotação ruim.' },
    { t: '"Guia" espontâneo', d: 'Pessoa que começa a explicar sem você pedir e cobra depois. Diga "la shukran" e vá até o seu guia.' },
    { t: 'Táxi sem taxímetro', d: 'Use Uber ou Careem. Em táxi comum, combine o preço antes de entrar.' },
    { t: 'Papiro de bananeira', d: 'Vendido como verdadeiro. O verdadeiro é translúcido contra a luz e não quebra ao dobrar.' },
  ],
};

const COMIDA = {
  pratos: [
    { nome: 'Koshari', desc: 'O prato nacional: arroz, macarrão, lentilha, grão-de-bico, molho de tomate e cebola frita. Barato, vegetariano e delicioso.' },
    { nome: 'Ful medames', desc: 'Favas cozidas com azeite, limão e cominho. O café da manhã do Egito há 5 mil anos.' },
    { nome: 'Ta\'ameya', desc: 'O falafel egípcio, feito de fava em vez de grão-de-bico. Verde por dentro.' },
    { nome: 'Molokhia', desc: 'Sopa verde espessa de folha de juta com alho e coentro, servida com arroz e frango. Gosto se ama ou odeia.' },
    { nome: 'Kofta e kebab', desc: 'Carne moída temperada na brasa, ou cubos de carne. Sempre seguros quando bem assados.' },
    { nome: 'Hawawshi', desc: 'Pão pita recheado de carne temperada e assado. O "lanche" egípcio.' },
    { nome: 'Mahshi', desc: 'Folhas de uva, abobrinha ou pimentão recheados de arroz com ervas.' },
    { nome: 'Shawarma', desc: 'Carne no espeto giratório, no pão com molho tahine.' },
    { nome: 'Fatteh', desc: 'Camadas de pão, arroz e carne com molho de alho e vinagre.' },
    { nome: 'Baba ganoush e hummus', desc: 'Pastas de berinjela e grão-de-bico, sempre na mesa com pão.' },
    { nome: 'Om Ali', desc: 'A sobremesa: massa folhada com leite, nozes, passas e coco, quente. Imperdível.' },
    { nome: 'Basbousa e kunafa', desc: 'Doces de semolina com calda e de massa fina com queijo. Muito doces.' },
    { nome: 'Karkadê', desc: 'Chá de hibisco, quente ou gelado. Vermelho e azedinho. Atenção: baixa a pressão; quem toma remédio de pressão deve ir com calma.' },
    { nome: 'Sahlab', desc: 'Bebida quente cremosa com canela e coco, ótima para a noite.' },
    { nome: 'Suco de cana (asab)', desc: 'Vendido na rua; só tome em lugar que o guia indicar.' },
  ],
  regras: ['Água só de garrafa lacrada (compre no hotel ou mercadinho, 10 a 20 libras). Também para escovar os dentes.', 'Sem gelo fora do hotel e do barco.', 'Frutas: só as que você mesma descasca (banana, laranja, manga).', 'Salada crua: só no hotel, no barco e nos restaurantes do roteiro.', 'Comida de rua: só se estiver bem quente e saindo na hora.', 'Carne de porco praticamente não existe (país muçulmano). Álcool só em hotéis, barco e alguns restaurantes.', 'Café da manhã do hotel: aproveite as frutas, pães, ovos. É a refeição mais segura do dia.', 'Lanchinho na bolsa (barrinha, castanha) para os dias longos.'],
};

const CULTURA = {
  roupa: [
    { onde: 'Templos, pirâmides e museus', como: 'Calça leve ou saia longa, blusa de manga (curta ou 3/4), tênis fechado, chapéu, óculos. Pode ser colorido. Lenço leve no pescoço serve para cobrir ombros e cabeça quando precisar.' },
    { onde: 'Mesquitas', como: 'Ombros e joelhos cobertos, lenço na cabeça para mulheres, tirar os sapatos (leve meia). Algumas emprestam capa.' },
    { onde: 'Igrejas coptas', como: 'Roupa discreta; lenço não é obrigatório.' },
    { onde: 'Bazar e ruas', como: 'Discreto: nada de decote, regata ou short. Menos atenção, menos assédio de vendedor.' },
    { onde: 'Barco e resort', como: 'Liberado: vestido, biquíni na piscina e praia. Na festa Galabeya vão de túnica.' },
    { onde: 'Avião e ônibus', como: 'Casaco leve: ar-condicionado forte.' },
  ],
  etiqueta: ['Cumprimente com "salâm alêkum" e sorria: abre portas.', 'Mão direita para comer, dar e receber coisas. A esquerda é considerada suja.', 'Não fotografe pessoas sem pedir. Peça com um gesto e "múmkin?" (posso?). Policiais, militares e prédios do governo: nunca.', 'Casais não se beijam em público. Entre mulheres, andar de braço dado é normal.', 'Pechinchar no bazar é educado e esperado. Discutir preço com raiva, não.', 'O egípcio é caloroso e curioso: vão perguntar de onde você é e falar do Brasil e de futebol. "Brazil! Neymar!" é quase inevitável.', 'Sexta-feira é o dia santo: oração ao meio-dia, muita coisa fecha de manhã. Fim de semana é sexta e sábado.', 'Chamada para a oração 5 vezes ao dia pelos alto-falantes. É normal e bonito de ouvir.', 'Gorjeta (baksheesh) faz parte da economia, não é esmola. Veja o guia em Dinheiro.'],
  fuso: 'O Egito está 6 horas à frente de Brasília até 29/10. Nesse dia, de madrugada, o horário de verão egípcio termina e a diferença passa a ser de 5 horas. O iPhone ajusta sozinho.',
  curiosidades: ['O Cairo tem 22 milhões de habitantes, mais que o estado de Minas Gerais.', 'O Nilo corre de sul para norte: "subir o Nilo" é ir para o sul.', '95% do Egito é deserto; quase todo mundo vive na faixa verde do rio.', 'Os egípcios antigos tinham dentistas, cirurgiões, contratos de casamento e greves (a primeira greve registrada da história foi em Deir el-Medina, perto de Luxor).', 'A palavra "química" vem de "Kemet", o nome antigo do Egito, "terra negra" (pelo barro fértil do rio).', 'O gato foi domesticado no Egito, e matar um era crime grave.'],
};

const MALA = [
  { cat: 'Bagagem de mão (sempre com você)', itens: ['Passaporte e cartão de febre amarela', 'Remédios de toda a viagem, nas caixas, com receitas', 'Carregador e bateria externa', 'Óculos e óculos de sol', 'Casaco leve', 'Lanche e garrafinha vazia', 'Dinheiro: dólares em notas pequenas e cartão', 'Lenço grande', 'Papel higiênico / lenço umedecido', 'Álcool em gel'] },
  { cat: 'Mala grande', itens: ['Tênis confortável já usado', 'Sandália para o resort', 'Calças leves e blusas de manga', 'Saída de praia, biquíni, chapéu', 'Protetor solar fator alto e repelente', 'Máscara descartável (tumbas)', 'Lanterna pequena', 'Adaptador de tomada (pinos redondos, 220 V)', 'Caderninho e caneta', 'Barrinhas de cereal', 'Soro oral, remédio para enjoo e para intestino', 'Band-aid, pomada para picada', 'Sapatilha de água para o Mar Vermelho'] },
];

const FOTOGRAFIA = ['Ligue o "Modo Retrato" para fotos de pessoas com templos desfocados ao fundo.', 'Para fotos de templo, toque na parte mais clara da tela antes de fotografar: evita céu estourado.', 'Hora de ouro: até 1 hora depois do nascer e 1 hora antes do pôr do sol. Kom Ombo e Luxor costumam cair nesse horário.', 'Dentro de tumbas e museus: sem flash, fique parada, deixe o celular fazer a foto. Se tremer, apoie o cotovelo no corpo.', 'Fotografe as placas explicativas: ajudam a lembrar depois.', 'Faça um vídeo de 10 segundos em cada lugar girando devagar: vale mais que 20 fotos.', 'Todo dia à noite no wi-fi do hotel: deixe o iPhone fazer backup no iCloud ou mande as melhores para a família.', 'Pessoas: peça antes. Crianças e mulheres do campo muitas vezes não querem.', 'Limpe a lente: o pó do deserto embaça tudo.'];
