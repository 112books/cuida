const REPO = '112books/cuida-avi-joan'; // v2
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

const ALLOWED_ORIGINS = [
  'https://cuida-avi-joan.pages.dev',
  'https://cuida.linuxbcn.cat',
];

async function llegirDades(token) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${FILE}`, { headers: ghHeaders(token) });
  if (!r.ok) return { dades: null, sha: null };
  const data = await r.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  return { dades: JSON.parse(new TextDecoder().decode(bytes)), sha: data.sha };
}

async function escriureDades(token, dades, sha) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(dades, null, 2))));
  const body = { message: 'estic bé — confirmat per pacient', content };
  if (sha) body.sha = sha;
  return fetch(`${GH}/repos/${REPO}/contents/${FILE}`, {
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
    const { dades } = await llegirDades(env.GITHUB_TOKEN);
    const es = (dades && dades.estic_sol) || { actiu: false };
    return new Response(JSON.stringify({ estic_sol: es }), { headers });
  }

  if (request.method === 'POST') {
    const { dades, sha } = await llegirDades(env.GITHUB_TOKEN);
    if (!dades) return new Response(JSON.stringify({ error: 'Error llegint dades' }), { status: 500, headers });

    dades.estic_sol = { actiu: false, fins: null, activat: null, alerta: false };

    const put = await escriureDades(env.GITHUB_TOKEN, dades, sha);
    if (!put.ok) return new Response(JSON.stringify({ error: 'Error guardant' }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response('Method not allowed', { status: 405 });
}
