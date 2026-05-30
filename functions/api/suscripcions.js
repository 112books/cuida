const REPO = '112books/cuida';
const SUBS_FILE = 'data/subs.json';
const GH = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'cuida-app',
    'Content-Type': 'application/json',
  };
}

const ALLOWED_ORIGINS = [
  'https://cuida.pages.dev',
  'https://cuida.linuxbcn.cat',
];

async function llegirSubs(token) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${SUBS_FILE}`, { headers: ghHeaders(token) });
  if (!r.ok) return { llista: [], sha: null };
  const data = await r.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  return { llista: JSON.parse(new TextDecoder().decode(bytes)), sha: data.sha };
}

async function escriureSubs(token, llista, sha) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(llista, null, 2))));
  const body = { message: 'actualitzar subscripcions push', content };
  if (sha) body.sha = sha;
  return fetch(`${GH}/repos/${REPO}/contents/${SUBS_FILE}`, {
    method: 'PUT',
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
}

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

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  if (request.method === 'GET') {
    const { llista } = await llegirSubs(env.GITHUB_TOKEN);
    const resum = llista.map(s => ({ nom: s.nom, activa: true }));
    return new Response(JSON.stringify(resum), { headers });
  }

  if (request.method === 'POST') {
    const cl = parseInt(request.headers.get('Content-Length') || '0');
    if (cl > 20000) return new Response(JSON.stringify({ error: 'Payload massa gran' }), { status: 413, headers });
    const body = await request.json();
    if (!body.subscription || !body.nom) return new Response(JSON.stringify({ error: 'Falten dades' }), { status: 400, headers });

    const { llista, sha } = await llegirSubs(env.GITHUB_TOKEN);
    const filtrada = llista.filter(s => s.subscription.endpoint !== body.subscription.endpoint);
    filtrada.push({ nom: body.nom, subscription: body.subscription });

    const put = await escriureSubs(env.GITHUB_TOKEN, filtrada, sha);
    if (!put.ok) return new Response(JSON.stringify({ error: 'Error guardant' }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  if (request.method === 'DELETE') {
    const body = await request.json();
    if (!body.endpoint) return new Response(JSON.stringify({ error: 'Falta endpoint' }), { status: 400, headers });

    const { llista, sha } = await llegirSubs(env.GITHUB_TOKEN);
    const filtrada = llista.filter(s => s.subscription.endpoint !== body.endpoint);

    const put = await escriureSubs(env.GITHUB_TOKEN, filtrada, sha);
    if (!put.ok) return new Response(JSON.stringify({ error: 'Error guardant' }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response('Method not allowed', { status: 405 });
}
