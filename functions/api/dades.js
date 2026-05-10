const REPO = '112books/cuida-avi-joan';
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

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
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
      const body = await request.json();
      if (!body.password || body.password !== env.CUIDA_PASSWORD) {
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
        const err = await putRes.json();
        return new Response(JSON.stringify({ error: err.message || 'Error escrivint a GitHub' }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ ok: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
