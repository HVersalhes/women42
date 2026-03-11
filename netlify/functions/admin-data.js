const { getDeployStore } = require('@netlify/blobs');

const ADMIN_LOGIN = 'hcosta';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const adminLogin = new URLSearchParams(event.rawQuery || '').get('admin');
    if (adminLogin !== ADMIN_LOGIN) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acesso negado' }) };
    }

    const store = getDeployStore('cadetes');
    const { blobs } = await store.list();

    const cadetes = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: 'json' }).catch(() => null);
      if (data) cadetes.push(data);
    }

    cadetes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { statusCode: 200, headers, body: JSON.stringify({ cadetes }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
