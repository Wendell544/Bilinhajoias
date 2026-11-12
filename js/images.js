/* Imagens: compressão WebP, upload para Edge Function (GitHub) e geração de <img>. */
const IMG = (() => {
  const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
  const MB = 1024 * 1024;
  const UPLOAD_URL = `${SB_URL}/functions/v1/upload-image`;

  /* Cache de URLs públicas por hash (evita recriar <img>) */
  const URLS = new Map();

  const dec = (f) =>
    'createImageBitmap' in window
      ? createImageBitmap(f)
      : new Promise((ok, no) => {
          const i = new Image(),
            u = URL.createObjectURL(f);
          i.onload = () => {
            URL.revokeObjectURL(u);
            ok(i);
          };
          i.onerror = () => no(new Error('x'));
          i.src = u;
        });

  const cv = (s, max, type, q) => {
    const k = Math.min(1, max / Math.max(s.width, s.height)),
      c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(s.width * k));
    c.height = Math.max(1, Math.round(s.height * k));
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(s, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, type, q));
  };

  const enc = async (s, max, q = 0.85) => {
    let b = await cv(s, max, 'image/webp', q);
    if (!b || b.type !== 'image/webp') b = await cv(s, max, 'image/jpeg', q);
    return b;
  };

  /* ------------------------------------------------------------------
     one(file) → { ref: { u, k }, dup }
     ------------------------------------------------------------------ */
  async function one(f) {
    const mb = DB.set.mb || 8;
    if (f.size > mb * MB) {
      throw new Error(`${f.name}: passa de ${mb} MB.`);
    }
    if (!TYPES.includes(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(f.name)) {
      throw new Error(`${f.name}: formato não permitido (use JPG, PNG ou WebP).`);
    }

    let s;
    try {
      s = await dec(f);
    } catch (e) {
      throw new Error(`${f.name}: imagem inválida ou corrompida.`);
    }

    const full = await enc(s, 2000, 0.85);
    if (!full) throw new Error(`${f.name}: não foi possível processar a imagem.`);

    /* Hash local (não é o mesmo hash do servidor, mas serve para deduplicar no cliente) */
    const k = 'i:' + (await hash(full));
    if (URLS.has(k)) {
      return { ref: { u: URLS.get(k), k }, dup: true };
    }

    /* Enviar para a Edge Function */
    const session = await SB.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      throw new Error('Faça login para enviar imagens.');
    }

    const form = new FormData();
    form.append('file', new File([full], 'upload.webp', { type: 'image/webp' }));

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    let body;
    try {
      body = await res.json();
    } catch (e) {
      throw new Error(`Resposta inválida da Edge Function (${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(body.error || `Falha no upload (${res.status}).`);
    }

    const ref = { u: body.url, k };
    URLS.set(k, body.url);
    return { ref, dup: !!body.dup };
  }

  /* Hash local (SHA-256 ou fallback simples) */
  async function hash(blob) {
    const u = new Uint8Array(await blob.arrayBuffer());
    if (window.crypto && crypto.subtle) {
      try {
        const h = await crypto.subtle.digest('SHA-256', u);
        return [...new Uint8Array(h)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let h = 5381;
    for (let i = 0; i < u.length; i += 7) h = ((h << 5) + h + u[i]) | 0;
    return (h >>> 0).toString(16) + u.length.toString(16);
  }

  /* Upload de múltiplos arquivos */
  async function upload(files, onProgress) {
    const refs = [],
      errs = [];
    let n = 0,
      dups = 0;

    for (const f of files) {
      try {
        const o = await one(f);
        if (o.dup) dups++;
        refs.push(o.ref);
      } catch (e) {
        errs.push(e.message || String(e));
      }
      onProgress && onProgress(++n, files.length);
    }

    return { refs, errs, dups };
  }

  /* ------------------------------------------------------------------
     html(ref, opts) → <img src="..." loading="lazy" decoding="async" alt="...">
     ------------------------------------------------------------------ */
  const PX = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  const html = (r, o = {}) => {
    r = R(r);
    const alt = esc(o.alt || '');
    const eager = o.eager ? ' fetchpriority="high"' : '';
    if (!r || (!r.u && !r.p)) {
      return `<img src="${art(40)}" alt="${alt}" decoding="async"${eager}${o.eager ? '' : ' loading="lazy"'}>`;
    }
    const src = r.u || '';
    return `<img src="${esc(src)}" alt="${alt}" decoding="async"${eager}${o.eager ? '' : ' loading="lazy"'}>`;
  };

  /* ------------------------------------------------------------------
     migrateLegacy() → reenvia imagens antigas do IndexedDB
     ------------------------------------------------------------------ */
  async function migrateLegacy() {
    if (!('indexedDB' in window)) return;
    let db;
    try {
      db = await new Promise((ok, no) => {
        const r = indexedDB.open('bilinha_img', 1);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => no(r.error);
      });
    } catch (e) {
      return;
    }

    const t = db.transaction('b', 'readonly');
    const store = t.objectStore('b');
    const all = await new Promise((ok) => {
      const q = store.getAll();
      q.onsuccess = () => ok(q.result || []);
    });

    const session = await SB.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    for (const item of all) {
      if (!item.full) continue;
      try {
        const form = new FormData();
        form.append('file', new File([item.full], 'legacy.webp', { type: 'image/webp' }));
        const res = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (res.ok) {
          const body = await res.json();
          /* Atualizar referências no DB local (rascunho e produtos) */
          const oldRef = item.k;
          const newRef = body.url;
          if (A.imgs) {
            A.imgs = A.imgs.map((r) => (R(r)?.k === oldRef ? newRef : r));
          }
          /* Idealmente, também atualizar no Supabase se o produto já foi salvo */
        }
      } catch (e) {}
    }
  }

  return { upload, html, migrateLegacy };
})();