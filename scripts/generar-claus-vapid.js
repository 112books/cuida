#!/usr/bin/env node
// Executa: node scripts/generar-claus-vapid.js
// Genera noves claus VAPID. Fes-ho NOMÉS si cal regen.

const { webcrypto } = require('crypto');

(async () => {
  const kp = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = await webcrypto.subtle.exportKey('raw', kp.publicKey);
  const priv = await webcrypto.subtle.exportKey('jwk', kp.privateKey);
  const pubB64 = Buffer.from(pub).toString('base64url');

  console.log('\n=== CLAUS VAPID ===\n');
  console.log('VAPID_PUBLIC_KEY (posar a app/js/main.js const VAPID_PUBLIC_KEY i a Cloudflare env):');
  console.log(pubB64);
  console.log('\nVAPID_PRIVATE_KEY (NOMÉS a Cloudflare Pages env vars, mai al codi):');
  console.log(JSON.stringify(priv));
  console.log('\n=== PASSOS DE CONFIGURACIÓ ===');
  console.log('1. Cloudflare Pages → Settings → Environment variables:');
  console.log('   VAPID_PUBLIC_KEY  = (clau pública de dalt)');
  console.log('   VAPID_PRIVATE_KEY = (JSON de la clau privada)');
  console.log('   VAPID_SUBJECT     = mailto:linuxbcn@gmail.com');
  console.log('   CRON_SECRET       = (paraula de pas aleatòria)');
  console.log('2. Repo privat GitHub → Settings → Secrets → Actions:');
  console.log('   CRON_SECRET = (la mateixa paraula de pas)');
  console.log('   CUIDA_URL   = https://cuida-avi-joan.pages.dev');
  console.log('3. Actualitza VAPID_PUBLIC_KEY a app/js/main.js');
  console.log('');
})().catch(console.error);
