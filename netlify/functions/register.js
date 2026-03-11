const { blobGet, blobSet } = require('./blobs-helper');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { login, firstName, displayName, photo, campus } = JSON.parse(event.body);
    if (!login) return { statusCode: 400, headers, body: JSON.stringify({ error: 'login em falta' }) };

    const existing = await blobGet(login);
    if (existing) return { statusCode: 200, headers, body: JSON.stringify({ status: existing.status }) };

    await blobSet(login, {
      login, firstName, displayName, photo, campus,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'pending' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
