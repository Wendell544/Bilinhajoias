// supabase/functions/upload-image/index.ts
// Edge Function: recebe WebP, comita no GitHub via Contents API e devolve a URL pública.
// Segurança: exige JWT de admin (app_metadata.role = 'admin').

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const CORS = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja para 'https://wendell544.github.io'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const GITHUB_API = 'https://api.github.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido. Use POST.' }, 405);
  }

  try {
    // 1) Verificar JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return json({ error: 'Token de autenticação ausente.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: 'Token inválido ou expirado.' }, 401);
    }

    const user = userData.user;
    if (user.app_metadata?.role !== 'admin') {
      return json({ error: 'Acesso negado. Apenas administradores podem enviar imagens.' }, 403);
    }

    // 2) Ler multipart
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return json({ error: 'Campo "file" ausente ou inválido.' }, 400);
    }

    if (file.type !== 'image/webp') {
      return json({ error: 'Formato inválido. Envie apenas WebP.' }, 415);
    }

    if (file.size > MAX_BYTES) {
      return json({ error: 'Arquivo muito grande. O limite é 5 MB.' }, 413);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 3) SHA-256 → primeiros 8 bytes → hex
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer).slice(0, 8));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const fileName = `i_${hashHex}.webp`;
    const path = `img/${fileName}`;

    // 4) Credenciais do GitHub
    const ghToken = Deno.env.get('GITHUB_TOKEN');
    const owner = Deno.env.get('GITHUB_OWNER') ?? 'Wendell544';
    const repo = Deno.env.get('GITHUB_REPO') ?? 'Bilinhajoias';
    const branch = Deno.env.get('GITHUB_BRANCH') ?? 'main';

    if (!ghToken) {
      return json({ error: 'GITHUB_TOKEN não configurado nos secrets.' }, 500);
    }

    const ghHeaders = {
      Authorization: `Bearer ${ghToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Bilinha-Upload-Image',
    };

    // 5) Verificar se já existe
    const checkUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const checkRes = await fetch(checkUrl, { headers: ghHeaders });

    const publicUrl = `https://${owner}.github.io/${repo}/img/${fileName}`;

    if (checkRes.ok) {
      // Já existe → idempotente
      return json({ url: publicUrl, name: fileName, dup: true });
    }

    if (checkRes.status !== 404) {
      const errText = await checkRes.text();
      return json({ error: `Erro ao verificar arquivo no GitHub: ${checkRes.status} ${errText}` }, 502);
    }

    // 6) Criar arquivo via PUT (base64)
    const base64 = btoa(String.fromCharCode(...bytes));

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
      return json({ error: `Erro ao comitar no GitHub: ${putRes.status} ${errText}` }, 502);
    }

    return json({ url: publicUrl, name: fileName, dup: false });
  } catch (e) {
    console.error('upload-image:', e);
    return json({ error: `Erro inesperado: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}