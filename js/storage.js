/* Persistência: dados agora vêm do Supabase (Postgres).
   O carrinho e preferências permanecem locais (localStorage). */

const Store = {
  get(k, d = null) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v === null || v === undefined ? d : v;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      if (e && e.name === 'QuotaExceededError') {
        toast('Sem espaço local. Remova itens para continuar.');
      } else {
        toast('Falha ao salvar dados localmente.');
      }
      return false;
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  },
  info() {
    let used = 0,
      items = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PFX)) {
        used += (localStorage.getItem(k) || '').length;
        items++;
      }
    }
    return { used, items };
  }
};

const DB = { prod: [], cart: [], banners: [], ads: [], categories: [], set: {} };

const okP = (p) =>
  p &&
  typeof p.title === 'string' &&
  p.title.trim() &&
  p.price >= 0 &&
  typeof p.category === 'string';

const wa = (t) =>
  'https://wa.me/' + (DB.set.wa || WAD) + '?text=' + encodeURIComponent(t);

const lk = (o) =>
  okUrl(o.link)
    ? o.link
    : wa('Olá! Vi “' + (o.title || 'o anúncio') + '” no site e gostaria de saber mais.');

/* ---------- Carregamento principal (assíncrono) ---------- */
async function loadFromSupabase() {
  const [prodRes, banRes, adsRes, catsRes, setRes] = await Promise.all([
    SB.from('products').select('*').order('sort_order', { ascending: true }),
    SB.from('banners').select('*').order('sort_order', { ascending: true }),
    SB.from('ads').select('*').order('sort_order', { ascending: true }),
    SB.from('categories').select('*').order('sort_order', { ascending: true }),
    SB.from('settings').select('data').eq('id', 1).maybeSingle()
  ]);

  if (prodRes.error) console.error('load products:', prodRes.error);
  if (banRes.error) console.error('load banners:', banRes.error);
  if (adsRes.error) console.error('load ads:', adsRes.error);
  if (catsRes.error) console.error('load categories:', catsRes.error);
  if (setRes.error) console.error('load settings:', setRes.error);

  DB.prod = (prodRes.data ?? []).filter(okP).map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    available: p.available !== false
  }));

  DB.banners = banRes.data ?? [];
  DB.ads = adsRes.data ?? [];
  DB.categories = catsRes.data ?? [];

  const s = setRes.data?.data ?? {};
  DB.set = { ...SET0, ...s };
  DB.set.show = { ...SET0.show, ...(s.show || {}) };

  /* Carrinho local: manter apenas itens que ainda existem */
  DB.cart = (Store.get(KEY.cart, []) || []).filter(
    (c) => c && c.qty > 0 && DB.prod.some((p) => p.id === c.id)
  );

  /* Se não houver nenhum produto, usar seed apenas em modo demonstração */
  if (!DB.prod.length) {
    DB.prod = seed();
  }
}

/* ---------- Preferências (tema, categoria, ordenação) ---------- */
const Prefs = {
  get: () => Store.get(KEY.pref, {}),
  set: (o) => Store.set(KEY.pref, { ...Prefs.get(), ...o })
};

/* ---------- Rascunho de produto ---------- */
const Draft = {
  get: () => Store.get(KEY.draft),
  set: (v) => Store.set(KEY.draft, v),
  clear: () => Store.del(KEY.draft)
};

/* ---------- Log de erros ---------- */
const Log = {
  get: () => Store.get(KEY.log, []),
  add(m) {
    const l = Log.get();
    l.unshift({ t: Date.now(), m: String(m).slice(0, 160) });
    Store.set(KEY.log, l.slice(0, 20));
  }
};

/* ---------- Histórico de interesse (populares) ---------- */
const Hist = {
  get: () => Store.get(KEY.hist, {}),
  bump: (id) => {
    const h = Store.get(KEY.hist, {});
    h[id] = (h[id] || 0) + 1;
    Store.set(KEY.hist, h);
  },
  top: (n) => {
    const h = Store.get(KEY.hist, {});
    return Object.entries(h)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => +id);
  }
};

/* ---------- Backup / Restore (agora exporta o estado atual do DB) ---------- */
const Backup = {
  dump: () => ({
    v: V,
    at: Date.now(),
    prod: DB.prod,
    banners: DB.banners,
    ads: DB.ads,
    categories: DB.categories,
    set: DB.set
  }),
  download() {
    const b = new Blob([JSON.stringify(Backup.dump(), null, 2)], {
      type: 'application/json'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'bilinha-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async load(file) {
    const d = JSON.parse(await file.text());
    if (!d || typeof d !== 'object') throw new Error('inválido');
    /* Restaurar via Supabase (upsert em massa) */
    if (Array.isArray(d.prod)) {
      const rows = d.prod.filter(okP).map((p) => ({
        ...p,
        available: p.available !== false,
        images: Array.isArray(p.images) ? p.images : []
      }));
      if (rows.length) await SB.from('products').upsert(rows);
    }
    /* Aceita formato novo (banners/categories) e backup antigo (ban/cats) */
    const banners = d.banners ?? d.ban;
    if (Array.isArray(banners)) await SB.from('banners').upsert(banners);
    if (Array.isArray(d.ads)) await SB.from('ads').upsert(d.ads);
    const categories = d.categories ?? d.cats;
    if (Array.isArray(categories)) await SB.from('categories').upsert(categories);
    if (d.set && typeof d.set === 'object') {
      await SB.from('settings').upsert({ id: 1, data: d.set });
    }
    await loadFromSupabase();
    return true;
  }
};