const { getDeployStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const store = getDeployStore('cadetes');
    const login = new URLSearchParams(event.rawQuery || '').get('login');
    if (!login) return { statusCode: 400, headers, body: JSON.stringify({ error: 'login em falta' }) };

    const data = await store.get(login, { type: 'json' }).catch(() => null);
    if (!data) return { statusCode: 200, headers, body: JSON.stringify({ status: 'unknown' }) };

    return { statusCode: 200, headers, body: JSON.stringify({ status: data.status }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
