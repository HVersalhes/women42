const { blobGet, blobSet } = require('./blobs-helper');

const ADMIN_LOGIN = 'hcosta';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { adminLogin, targetLogin, action } = JSON.parse(event.body);

    if (adminLogin !== ADMIN_LOGIN) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acesso negado' }) };
    }
    if (!['approved', 'rejected'].includes(action)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação inválida' }) };
    }

    const existing = await blobGet(targetLogin);
    if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Cadete não encontrada' }) };

    await blobSet(targetLogin, { ...existing, status: action, updatedAt: new Date().toISOString() });

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, status: action }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
