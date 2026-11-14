import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const ALLOWED_ORIGINS = ['https://wendell544.github.io'];
const MAX_BYTES = 5 * 1024 * 1024;
const GITHUB_API = 'https://api.github.com';

function corsFor(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonFor(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsFor(req) });
  }
  const origin = req.headers.get('Origin') ?? '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return jsonFor(req, { error: 'Origem não permitida.' }, 403);
  }
  if (req.method !== 'POST') {
    return jsonFor(req, { error: 'Método não permitido. Use POST.' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return jsonFor(req, { error: 'Token de autenticação ausente.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonFor(req, { error: 'Token inválido ou expirado.' }, 401);
    }
    if (userData.user.app_metadata?.role !== 'admin') {
      return jsonFor(req, { error: 'Acesso negado. Apenas administradores podem enviar imagens.' }, 403);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return jsonFor(req, { error: 'Campo "file" ausente ou inválido.' }, 400);
    }
    if (file.type !== 'image/webp') {
      return jsonFor(req, { error: 'Formato inválido. Envie apenas WebP.' }, 415);
    }
    if (file.size > MAX_BYTES) {
      return jsonFor(req, { error: 'Arquivo muito grande. O limite é 5 MB.' }, 413);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer).slice(0, 8));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const fileName = `i_${hashHex}.webp`;
    const path = `img/${fileName}`;

    const ghToken = Deno.env.get('GITHUB_TOKEN');
    const owner = Deno.env.get('GITHUB_OWNER') ?? 'Wendell544';
    const repo = Deno.env.get('GITHUB_REPO') ?? 'Bilinhajoias';
    const branch = Deno.env.get('GITHUB_BRANCH') ?? 'main';

    if (!ghToken) {
      return jsonFor(req, { error: 'GITHUB_TOKEN não configurado nos secrets.' }, 500);
    }

    const ghHeaders = {
      Authorization: `Bearer ${ghToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Bilinha-Upload-Image',
    };

    const checkUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const checkRes = await fetch(checkUrl, { headers: ghHeaders });
    const publicUrl = `https://${owner}.github.io/${repo}/img/${fileName}`;

    if (checkRes.ok) {
      return jsonFor(req, { url: publicUrl, name: fileName, dup: true });
    }
    if (checkRes.status !== 404) {
      const errText = await checkRes.text();
      return jsonFor(req, { error: `Erro ao verificar arquivo no GitHub: ${checkRes.status} ${errText}` }, 502);
    }

    const base64 = toBase64(bytes);

    const putRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `upload: ${fileName}`,
        content: base64,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return jsonFor(req, { error: `Erro ao comitar no GitHub: ${putRes.status} ${errText}` }, 502);
    }

    return jsonFor(req, { url: publicUrl, name: fileName, dup: false });
  } catch (e) {
    console.error('upload-image:', e);
    return jsonFor(req, { error: `Erro inesperado: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
});

function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    bin += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return btoa(bin);
}