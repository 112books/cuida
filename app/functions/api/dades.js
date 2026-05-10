export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method === 'GET') {
    try {
      const val = await env.CUIDA_DADES.get('dades');
      if (!val) return new Response(JSON.stringify({ buit: true }), { headers });
      return new Response(val, { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error llegint KV' }), { status: 500, headers });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.password || body.password !== env.CUIDA_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Contrasenya incorrecta' }), { status: 401, headers });
      }
      if (!body.dades || typeof body.dades !== 'object') {
        return new Response(JSON.stringify({ error: 'Dades invàlides' }), { status: 400, headers });
      }
      await env.CUIDA_DADES.put('dades', JSON.stringify(body.dades));
      return new Response(JSON.stringify({ ok: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error desant dades' }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
