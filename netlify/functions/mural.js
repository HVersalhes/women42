const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getStore('murais');

    // GET — carregar mural
    if (event.httpMethod === 'GET') {
      const login = new URLSearchParams(event.rawQuery || '').get('login');
      if (!login) return { statusCode: 400, headers, body: JSON.stringify({ error: 'login em falta' }) };

      const data = await store.get(login, { type: 'json' });
      if (!data) return { statusCode: 404, headers, body: JSON.stringify({ error: 'não encontrado' }) };

      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // POST — guardar mural (só uma vez)
    if (event.httpMethod === 'POST') {
      const { login, data } = JSON.parse(event.body);
      if (!login || !data) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dados em falta' }) };

      // Verificar se já existe — se sim, não sobrescreve
      const existing = await store.get(login, { type: 'json' });
      if (existing) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, existing: true }) };

      await store.setJSON(login, data);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

