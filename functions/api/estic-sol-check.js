const REPO = '112books/cuida-avi-joan'; // v2
const DADES_FILE = 'app/dades.json';
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

async function llegirJSON(token, file) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${file}`, { headers: ghHeaders(token) });
  if (!r.ok) return { data: null, sha: null };
  const meta = await r.json();
  const bytes = Uint8Array.from(atob(meta.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  return { data: JSON.parse(new TextDecoder().decode(bytes)), sha: meta.sha };
}

async function escriureDades(token, dades, sha) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(dades, null, 2))));
  const body = { message: 'alerta estic sol — temps esgotat', content };
  if (sha) body.sha = sha;
  return fetch(`${GH}/repos/${REPO}/contents/${DADES_FILE}`, {
    method: 'PUT', headers: ghHeaders(token), body: JSON.stringify(body),
  });
}

async function signVAPIDJWT(endpoint, privateKeyJWK, subject) {
  const audience = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 43200;
  const toB64url = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const unsigned = toB64url({ typ: 'JWT', alg: 'ES256' }) + '.' + toB64url({ aud: audience, exp, sub: subject });
  const key = await crypto.subtle.importKey('jwk', privateKeyJWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return unsigned + '.' + sig;
}

async function enviarPush(sub, privateKeyJWK, publicKey, subject) {
  try {
    const jwt = await signVAPIDJWT(sub.endpoint, privateKeyJWK, subject);
    const r = await fetch(sub.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `vapid t=${jwt},k=${publicKey}`, 'TTL': '3600', 'Urgency': 'high' },
    });
    return r.status;
  } catch (e) { return 500; }
}

async function autenticat(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const fromB64url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
        const header = JSON.parse(fromB64url(parts[0]));
        const payload = JSON.parse(fromB64url(parts[1]));
        const aud = payload.aud;
        const audOk = aud === 'cuida-cron' || (Array.isArray(aud) && aud.includes('cuida-cron'));
        if (
          audOk &&
          payload.iss === 'https://token.actions.githubusercontent.com' &&
          payload.repository === '112books/cuida-avi-joan' &&
          payload.exp > Math.floor(Date.now() / 1000)
        ) {
          const jwksRes = await fetch('https://token.actions.githubusercontent.com/.well-known/jwks');
          const { keys } = await jwksRes.json();
          const jwk = keys.find(k => k.kid === header.kid);
          if (jwk) {
            const key = await crypto.subtle.importKey(
              'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
            );
            const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
            const sig = Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
            if (await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data)) return true;
          }
        }
      } catch {}
    }
  }
  const cronSecret = (request.headers.get('X-Cron-Secret') || '').trim();
  return !!(cronSecret && env.CRON_SECRET && cronSecret === env.CRON_SECRET.trim());
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (!await autenticat(request, env)) return new Response('Unauthorized', { status: 401 });

  const { data: dades, sha: dadesSHA } = await llegirJSON(env.GITHUB_TOKEN, DADES_FILE);
  if (!dades) return new Response(JSON.stringify({ ok: false, msg: 'no dades' }), { headers: { 'Content-Type': 'application/json' } });

  const es = dades.estic_sol || {};

  // No active or already alerted — nothing to do
  if (!es.actiu || !es.fins) return new Response(JSON.stringify({ ok: true, msg: 'inactiu' }), { headers: { 'Content-Type': 'application/json' } });

  const ara = Date.now();
  const fins = new Date(es.fins).getTime();

  if (ara < fins) {
    const restants = Math.ceil((fins - ara) / 60000);
    return new Response(JSON.stringify({ ok: true, msg: 'actiu', restants }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Timer expired — set alerta and send push
  dades.estic_sol = { actiu: false, fins: null, activat: es.activat, alerta: true };
  await escriureDades(env.GITHUB_TOKEN, dades, dadesSHA);

  // Send push to all subscribers
  const { data: subs } = await llegirJSON(env.GITHUB_TOKEN, SUBS_FILE);
  if (!subs || !subs.length) return new Response(JSON.stringify({ ok: true, msg: 'alerta activada, sense subscriptors' }), { headers: { 'Content-Type': 'application/json' } });

  const privateKeyJWK = JSON.parse(env.VAPID_PRIVATE_KEY);
  const publicKey = env.VAPID_PUBLIC_KEY;
  const subject = env.VAPID_SUBJECT || 'mailto:linuxbcn@gmail.com';

  const expirades = [];
  let enviades = 0;
  for (const sub of subs) {
    const status = await enviarPush(sub.subscription, privateKeyJWK, publicKey, subject);
    if (status === 410 || status === 404) expirades.push(sub.subscription.endpoint);
    else if (status < 300) enviades++;
  }

  return new Response(JSON.stringify({ ok: true, msg: 'alerta enviada', enviades, expirades: expirades.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
