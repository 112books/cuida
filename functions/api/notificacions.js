const REPO = '112books/cuida-avi-joan';
const SUBS_FILE = 'data/subs.json';
const DADES_FILE = 'app/dades.json';
const GH = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'cuida-app',
  };
}

async function llegirJSON(token, file) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${file}`, { headers: ghHeaders(token) });
  if (!r.ok) return null;
  const data = await r.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function escriureSubs(token, llista, sha) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(llista, null, 2))));
  const body = { message: 'netejar subscripcions expirades', content };
  if (sha) body.sha = sha;
  return fetch(`${GH}/repos/${REPO}/contents/${SUBS_FILE}`, {
    method: 'PUT', headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function llegirSubsAmbSHA(token) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${SUBS_FILE}`, { headers: ghHeaders(token) });
  if (!r.ok) return { llista: [], sha: null };
  const data = await r.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  return { llista: JSON.parse(new TextDecoder().decode(bytes)), sha: data.sha };
}

async function signVAPIDJWT(endpoint, privateKeyJWK, subject) {
  const audience = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 43200;
  const toB64url = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const unsigned = toB64url({ typ: 'JWT', alg: 'ES256' }) + '.' + toB64url({ aud: audience, exp, sub: subject });

  const key = await crypto.subtle.importKey(
    'jwk', privateKeyJWK,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return unsigned + '.' + sig;
}

async function enviarPush(sub, privateKeyJWK, publicKey, subject) {
  try {
    const jwt = await signVAPIDJWT(sub.endpoint, privateKeyJWK, subject);
    const r = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${publicKey}`,
        'TTL': '3600',
        'Urgency': 'normal',
      },
    });
    return r.status;
  } catch (e) {
    return 500;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const cronSecret = (request.headers.get('X-Cron-Secret') || '').trim();
  if (!cronSecret || cronSecret !== (env.CRON_SECRET || '').trim()) {
    return new Response('Unauthorized', { status: 401 });
  }

  const privateKeyJWK = JSON.parse(env.VAPID_PRIVATE_KEY);
  const publicKey = env.VAPID_PUBLIC_KEY;
  const subject = env.VAPID_SUBJECT || 'mailto:linuxbcn@gmail.com';

  const { llista: subs, sha } = await llegirSubsAmbSHA(env.GITHUB_TOKEN);
  if (!subs.length) return new Response(JSON.stringify({ ok: true, enviades: 0 }), { headers: { 'Content-Type': 'application/json' } });

  const expirades = [];
  let enviades = 0;
  for (const sub of subs) {
    const status = await enviarPush(sub.subscription, privateKeyJWK, publicKey, subject);
    if (status === 410 || status === 404) expirades.push(sub.subscription.endpoint);
    else if (status < 300) enviades++;
  }

  if (expirades.length && sha) {
    const netes = subs.filter(s => !expirades.includes(s.subscription.endpoint));
    await escriureSubs(env.GITHUB_TOKEN, netes, sha);
  }

  return new Response(JSON.stringify({ ok: true, enviades, expirades: expirades.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
