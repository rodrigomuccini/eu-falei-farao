// Glossário offline: palavras comuns de placas, cardápios e lojas (árabe e inglês → português).
const GLOSSARIO = [
  ['مخرج', 'saída'], ['دخول', 'entrada'], ['مدخل', 'entrada'], ['خروج', 'saída'], ['ممنوع', 'proibido'], ['ممنوع التصوير', 'proibido fotografar'], ['ممنوع التدخين', 'proibido fumar'],
  ['حمام', 'banheiro'], ['دورة مياه', 'banheiro'], ['رجال', 'homens'], ['سيدات', 'mulheres'], ['نساء', 'mulheres'], ['مغلق', 'fechado'], ['مفتوح', 'aberto'],
  ['اسحب', 'puxe'], ['ادفع', 'empurre'], ['خطر', 'perigo'], ['احذر', 'cuidado'], ['تذاكر', 'ingressos'], ['شباك التذاكر', 'bilheteria'], ['استعلامات', 'informações'],
  ['صيدلية', 'farmácia'], ['مستشفى', 'hospital'], ['إسعاف', 'ambulância'], ['شرطة', 'polícia'], ['شرطة السياحة', 'polícia turística'], ['طوارئ', 'emergência'],
  ['مطار', 'aeroporto'], ['محطة', 'estação'], ['شارع', 'rua'], ['ميدان', 'praça'], ['متحف', 'museu'], ['معبد', 'templo'], ['مسجد', 'mesquita'], ['كنيسة', 'igreja'], ['سوق', 'mercado'], ['فندق', 'hotel'], ['مطعم', 'restaurante'], ['مقهى', 'café'], ['قهوة', 'café'],
  ['ماء', 'água'], ['مياه', 'água'], ['مية', 'água'], ['شاي', 'chá'], ['عصير', 'suco'], ['لبن', 'leite'], ['حليب', 'leite'], ['سكر', 'açúcar'], ['ملح', 'sal'],
  ['خبز', 'pão'], ['عيش', 'pão'], ['أرز', 'arroz'], ['رز', 'arroz'], ['فراخ', 'frango'], ['دجاج', 'frango'], ['لحم', 'carne'], ['لحمة', 'carne'], ['بقري', 'boi'], ['ضاني', 'carneiro'], ['سمك', 'peixe'], ['جمبري', 'camarão'],
  ['سلطة', 'salada'], ['شوربة', 'sopa'], ['خضار', 'legumes'], ['فول', 'fava'], ['طعمية', 'falafel'], ['كشري', 'koshari'], ['جبنة', 'queijo'], ['بيض', 'ovo'], ['حلويات', 'doces'], ['فاكهة', 'fruta'], ['بطاطس', 'batata'], ['مشوي', 'grelhado'], ['مقلي', 'frito'], ['حار', 'picante'],
  ['السعر', 'preço'], ['سعر', 'preço'], ['جنيه', 'libra egípcia'], ['ج.م', 'libras egípcias'], ['مجانا', 'grátis'], ['مجاني', 'grátis'], ['خصم', 'desconto'], ['كاش', 'dinheiro'], ['الحساب', 'a conta'],
  ['exit', 'saída'], ['entrance', 'entrada'], ['toilet', 'banheiro'], ['toilets', 'banheiros'], ['wc', 'banheiro'], ['men', 'homens'], ['women', 'mulheres'], ['ladies', 'mulheres'], ['closed', 'fechado'], ['open', 'aberto'], ['push', 'empurre'], ['pull', 'puxe'],
  ['no photography', 'proibido fotografar'], ['no photos', 'proibido fotografar'], ['no smoking', 'proibido fumar'], ['tickets', 'ingressos'], ['ticket office', 'bilheteria'], ['information', 'informações'], ['danger', 'perigo'], ['caution', 'cuidado'],
  ['chicken', 'frango'], ['beef', 'carne de boi'], ['lamb', 'cordeiro'], ['fish', 'peixe'], ['shrimp', 'camarão'], ['rice', 'arroz'], ['bread', 'pão'], ['salad', 'salada'], ['soup', 'sopa'], ['grilled', 'grelhado'], ['fried', 'frito'], ['spicy', 'picante'],
  ['juice', 'suco'], ['water', 'água'], ['tea', 'chá'], ['coffee', 'café'], ['milk', 'leite'], ['dessert', 'sobremesa'], ['price', 'preço'], ['free', 'grátis'], ['pharmacy', 'farmácia'], ['hospital', 'hospital'], ['police', 'polícia'],
];
