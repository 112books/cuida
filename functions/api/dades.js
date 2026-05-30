const REPO = '112books/cuida';
const FILE = 'app/dades.json';
const GH = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'cuida-app',
    'Content-Type': 'application/json',
  };
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ta = enc.encode(a.padEnd(128));
  const tb = enc.encode(b.padEnd(128));
  let diff = ta.length !== tb.length ? 1 : 0;
  for (let i = 0; i < ta.length; i++) diff |= ta[i] ^ tb[i];
  return diff === 0;
}

const ALLOWED_ORIGINS = [
  'https://cuida.pages.dev',
  'https://cuida.linuxbcn.cat',
];

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method === 'GET') {
    try {
      const r = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, { headers: ghHeaders(env.GITHUB_TOKEN) });
      if (!r.ok) return new Response(JSON.stringify({ buit: true }), { headers });
      const data = await r.json();
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
      const content = new TextDecoder().decode(bytes);
      return new Response(content, { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error llegint GitHub' }), { status: 500, headers });
    }
  }

  if (request.method === 'POST') {
    try {
      const cl = parseInt(request.headers.get('Content-Length') || '0');
      if (cl > 100000) return new Response(JSON.stringify({ error: 'Payload massa gran' }), { status: 413, headers });
      if (!request.headers.get('Content-Type')?.includes('application/json'))
        return new Response(JSON.stringify({ error: 'Content-Type invàlid' }), { status: 415, headers });
      const body = await request.json();
      if (!body.password || !timingSafeEqual(body.password, env.CUIDA_PASSWORD)) {
        return new Response(JSON.stringify({ error: 'Contrasenya incorrecta' }), { status: 401, headers });
      }

      // Obtenir SHA actual del fitxer
      const shaRes = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, { headers: ghHeaders(env.GITHUB_TOKEN) });
      const sha = shaRes.ok ? (await shaRes.json()).sha : null;

      // Escriure nou contingut
      const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(body.dades, null, 2))));
      const putBody = { message: 'actualitzar dades via app Cuida', content: newContent };
      if (sha) putBody.sha = sha;

      const putRes = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, {
        method: 'PUT',
        headers: ghHeaders(env.GITHUB_TOKEN),
        body: JSON.stringify(putBody),
      });

      if (!putRes.ok) {
        console.error('GitHub PUT error:', await putRes.text());
        return new Response(JSON.stringify({ error: 'Error escrivint a GitHub' }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ ok: true }), { headers });
    } catch (e) {
      console.error('POST error:', e);
      return new Response(JSON.stringify({ error: 'Error intern del servidor' }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
