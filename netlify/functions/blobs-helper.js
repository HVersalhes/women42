// Helper para Netlify Blobs via REST API
const STORE = 'cadetes';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

function baseUrl() {
  return `https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/${STORE}`;
}

async function blobGet(key) {
  const res = await fetch(`${baseUrl()}/${key}`, { headers: getHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`blobGet failed: ${res.status}`);
  return await res.json();
}

async function blobSet(key, value) {
  const res = await fetch(`${baseUrl()}/${key}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(value)
  });
  if (!res.ok) throw new Error(`blobSet failed: ${res.status}`);
  return true;
}

async function blobList() {
  const res = await fetch(`${baseUrl()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`blobList failed: ${res.status}`);
  const data = await res.json();
  return data.blobs || [];
}

module.exports = { blobGet, blobSet, blobList };
