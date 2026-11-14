const V = 8, PFX = 'bilinha_joias_', KEY = {
  prod: PFX + 'products',
  cart: PFX + 'cart',
  ban: PFX + 'banners',
  ads: PFX + 'ads',
  cats: PFX + 'cats',
  set: PFX + 'settings',
  meta: PFX + 'meta',
  pref: PFX + 'prefs',
  draft: PFX + 'draft',
  pw: PFX + 'k2',
  lock: PFX + 'lock',
  oban: PFX + 'banner',
  hist: PFX + 'hist',
  adm: PFX + 'adm',
  chg: PFX + 'chg',
  pub: PFX + 'pub',
  log: PFX + 'log'
};

const SB_URL = 'https://ncrsodkpduroulzkpaky.supabase.co';
const SB_KEY = 'sb_publishable_OOejb1xfSYPHVD8Xf4F09g_YT_Sa5lu';

const GH_OWNER = 'Wendell544';
const GH_REPO = 'Bilinhajoias';

const WAD = ['5583', '9990', '74027'].join('');
const CATS0 = ['Pratas', 'Relógios', 'Alianças', 'Colares', 'Óculos', 'Combos'];

const SET0 = {
  kick: 'São Bento · Paraíba',
  title: 'Autenticidade e Tradição que Brilham em Joias',
  text: 'Pratas 925, alianças, relógios e peças selecionadas com cuidado. Escolha o que ama e finalize no WhatsApp.',
  about: '',
  wa: WAD,
  email: '',
  addr: 'São Bento – PB',
  ig: 'bilinha_joias',
  fb: '',
  sec: 6,
  page: 12,
  mb: 5,
  hero_bg: null,
  show: { feat: 1, promo: 1, news: 1, cats: 1, ads: 1, best: 1 }
};

const ACT = {};
const $ = (i) => document.getElementById(i);
const money = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
const nz = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const okUrl = (u) => /^https?:\/\//i.test(u || '');
const R = (r) => !r ? null : typeof r === 'string' ? { u: r } : r;
const uid = () => (uid.n = Math.max(Date.now(), (uid.n || 0) + 1));
const clamp = (n, a, b) => Math.min(b, Math.max(a, +n || 0));
const debounce = (fn, ms = 300) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

const toast = (t) => {
  const e = $('ts');
  if (!e) return;
  e.textContent = t;
  e.classList.remove('hid');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.add('hid'), 2800);
};

const lock = () => {
  document.documentElement.classList.toggle(
    'al',
    ['lg', 'pm', 'adm'].some((i) => !$(i).classList.contains('hid')) ||
      $('drw').classList.contains('on'),
  );
};

const modal = (id, on) => {
  $(id).classList.toggle('hid', !on);
  lock();
  if (on && id === 'lg') setTimeout(() => $('pw')?.focus(), 50);
};

const drawer = (on) => {
  $('drw').classList.toggle('on', !!on);
  $('ov').classList.toggle('hid', !on);
  lock();
};

const IC = {
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  wa: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-1.8-1.2-2.2-2.2l.8-1-1-2z"/>',
  star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.5 5.8 21l1.4-7L2 9.3l7-.8z"/>',
  moon: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  prev: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 4l12 8-12 8z"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 3.9M15.4 6.6 8.6 10.5"/>'
};

const ic = (n, s = 20) =>
  '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  (IC[n] || '') +
  '</svg>';

const art = (h) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="hsl(' +
      h +
      ',28%,26%)"/><stop offset="1" stop-color="hsl(' +
      h +
      ',22%,8%)"/></radialGradient></defs><rect width="400" height="400" fill="url(#g)"/><g fill="none" stroke="#D4AF37" stroke-width="3" stroke-linejoin="round"><path d="M140 150h120l40 50-100 110-100-110z"/><path d="M100 200h200M140 150l60 160 60-160M170 150l30 50 30-50"/></g><text x="200" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="20" letter-spacing="6" fill="#D4AF37" opacity=".7">BILINHA</text></svg>',
  );

const seed = () => [
  ['Colar de Prata 925 com Inicial', 'Colares', 189.9, 159.9, '6x sem juros', 'Prata 925 com banho de ródio, corrente de 45 cm e fecho lagosta.', 1, 215],
  ['Aliança de Ouro 18k', 'Alianças', 1490, 0, '10x sem juros', 'Ouro 18k, acabamento polido, 4 mm. Vendida por unidade.', 1, 42],
  ['Relógio Cronógrafo Luxe', 'Relógios', 899.9, 749.9, '10x sem juros', 'Caixa de aço 42 mm, pulseira metálica e cronógrafo.', 0, 225],
  ['Brinco de Pérola Natural', 'Pratas', 229.9, 0, '6x sem juros', 'Pérola natural de 8 mm com haste em prata 925.', 0, 335],
  ['Óculos de Sol Cat-Eye', 'Óculos', 329.9, 279.9, '5x sem juros', 'Armação cat-eye em acetato, lentes com proteção UV400.', 0, 200],
  ['Pulseira Berloque', 'Pratas', 349.9, 0, '8x sem juros', 'Prata 925 de 18 cm com fecho de segurança para berloques.', 1, 275],
  ['Conjunto Coração Zircônia', 'Combos', 419.9, 369.9, '10x sem juros', 'Colar e brincos de coração com zircônias e banho de ródio.', 0, 350],
  ['Anel Solitário Prata', 'Pratas', 259.9, 0, '6x sem juros', 'Solitário em prata 925 com zircônia de 6 mm. Aro ajustável.', 0, 160]
].map((a, i) => ({
  id: i + 1,
  title: a[0],
  category: a[1],
  price: a[2],
  promo: a[3] || null,
  installment: a[4],
  description: a[5],
  featured: !!a[6],
  available: true,
  images: [art(a[7])],
  created_at: new Date().toISOString()
}));

const ads0 = () => [
  {
    id: 1,
    on: true,
    title: 'Peça pelo WhatsApp',
    text: 'Monte sua sacola e finalize com atendimento direto da loja.',
    btn: 'Começar agora',
    link: '',
    img: null
  },
  {
    id: 2,
    on: true,
    title: 'Combos para presentear',
    text: 'Conjuntos selecionados. Consulte condições no WhatsApp.',
    btn: 'Consultar',
    link: '',
    img: null
  }
];

const SB = supabase.createClient(SB_URL, SB_KEY);