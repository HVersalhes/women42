exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código em falta' }) };

    // 1. Trocar código pelo token
    const tokenRes = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     process.env.FT_CLIENT_ID,
        client_secret: process.env.FT_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return { statusCode: 400, headers, body: JSON.stringify({ error: tokenData }) };

    // 2. Buscar perfil do utilizador (evita CORS no browser)
    const userRes = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const user = await userRes.json();
    if (!userRes.ok) return { statusCode: 400, headers, body: JSON.stringify({ error: user }) };

    // 3. Devolver perfil completo ao browser
    return { statusCode: 200, headers, body: JSON.stringify({ user }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
