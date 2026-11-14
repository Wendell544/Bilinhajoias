/* Imagens: compressão WebP extrema, upload para Edge Function e geração de <img>. */
const IMG = (() => {
  const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
  const MB = 1024 * 1024;
  const UPLOAD_URL = `${SB_URL}/functions/v1/upload-image`;

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

  const enc = async (s, max, q = 0.8) => {
    let b = await cv(s, max, 'image/webp', q);
    if (!b || b.type !== 'image/webp') b = await cv(s, max, 'image/jpeg', q);
    return b;
  };

  const optimize = async (s, isBanner) => {
    // Banner: começa com 1920px e tenta ficar < 250kb
    // Produto: começa com 1200px e tenta ficar < 150kb
    let max = isBanner ? 1920 : 1200;
    let q = 0.82;
    let targetSize = isBanner ? 250 * 1024 : 150 * 1024;
    
    let b = await enc(s, max, q);
    
    // Loop agressivo reduzindo qualidade
    while (b && b.size > targetSize && q > 0.5) {
      q -= 0.1;
      b = await enc(s, max, q);
    }

    // Se mesmo assim estiver muito grande, reduz a resolução drasticamente
    if (b && b.size > targetSize * 1.5) {
      max = isBanner ? 1200 : 800;
      q = 0.6;
      b = await enc(s, max, q);
    }
    
    return b;
  };

  async function one(f, isBanner) {
    const mb = DB.set.mb || 5;
    if (f.size > mb * MB) throw new Error(`${f.name}: passa de ${mb} MB.`);
    if (!TYPES.includes(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(f.name)) {
      throw new Error(`${f.name}: formato não permitido (use JPG, PNG ou WebP).`);
    }

    let s;
    try {
      s = await dec(f);
    } catch (e) {
      throw new Error(`${f.name}: imagem inválida ou corrompida.`);
    }

    const full = await optimize(s, isBanner);
    if (!full) throw new Error(`${f.name}: não foi possível processar a imagem.`);

    const k = 'i:' + (await hash(full));
    if (URLS.has(k)) return { ref: { u: URLS.get(k), k }, dup: true };

    const session = await SB.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Faça login para enviar imagens.');

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

    if (!res.ok) throw new Error(body.error || `Falha no upload (${res.status}).`);

    const ref = { u: body.url, k };
    URLS.set(k, body.url);
    return { ref, dup: !!body.dup };
  }

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

  async function upload(files, onProgress, isBanner = false) {
    const refs = [], errs = [];
    let n = 0, dups = 0;
    for (const f of files) {
      try {
        const o = await one(f, isBanner);
        if (o.dup) dups++;
        refs.push(o.ref);
      } catch (e) {
        errs.push(e.message || String(e));
      }
      onProgress && onProgress(++n, files.length);
    }
    return { refs, errs, dups };
  }

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

  const hydrate = (root) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('img').forEach((img) => {
      const clean = () => {
        const parent = img.closest('.sk, .cd-i, .bn-s, .ac-i, .ct-i, .ci-i, .th, .phi, .pm-main, .pm-th');
        if (parent) parent.classList.remove('sk');
      };
      if (img.complete) clean();
      else {
        img.addEventListener('load', clean, { once: true });
        img.addEventListener('error', clean, { once: true });
      }
    });
  };

  async function migrateLegacy() {}

  return { upload, html, hydrate, migrateLegacy };
})();