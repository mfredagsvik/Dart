module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const expectedKey = process.env.DART_SYNC_KEY;
  const suppliedKey = req.headers['x-dart-sync-key'];
  if (!expectedKey || suppliedKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables are missing' });
  }

  const endpoint = `${supabaseUrl}/rest/v1/dart_state`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${endpoint}?id=eq.main&select=state,updated_at`, {
        headers,
        cache: 'no-store',
      });
      const rows = await r.json();
      if (!r.ok) return res.status(r.status).json(rows);
      return res.status(200).json(rows[0] || { state: null, updated_at: null });
    }

    if (req.method === 'PUT') {
      const state = req.body?.state;
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'state must be a JSON object' });
      }

      const r = await fetch(`${endpoint}?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify([{ id: 'main', state, updated_at: new Date().toISOString() }]),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json(data[0] || { ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
};
