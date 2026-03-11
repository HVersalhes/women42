exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo nao permitido' }) };
  }

  try {
    const { firstName, login } = JSON.parse(event.body);
    if (!firstName || !login) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'dados em falta' }) };
    }

    // Usar Netlify Blobs via REST API diretamente (sem SDK)
    const siteId  = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token   = process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    const blobKey = `mural_${login}`;

    // Tentar carregar mural existente
    if (siteId && token) {
      try {
        const getRes = await fetch(
          `https://api.netlify.com/api/v1/blobs/${siteId}/murais/${blobKey}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (getRes.ok) {
          const existing = await getRes.json();
          if (existing && existing.frase) {
            return { statusCode: 200, headers, body: JSON.stringify({ content: existing, cached: true }) };
          }
        }
      } catch (e) { /* continua para gerar */ }
    }

    // Gerar via Claude
    const prompt = "Es um poeta e escritor carinhoso, criativo e amoroso.\n" +
      "Escreve para " + firstName + ", uma cadete feminina da escola de programacao 42.\n" +
      "E o Mes Internacional da Mulher (Marco).\n\n" +
      "Cria exatamente dois elementos separados por ---DIVISOR---:\n\n" +
      "1. FRASE: Uma frase motivacional unica (maximo 2 linhas), pessoal e calorosa, que use o nome " + firstName + ", que celebre a sua coragem como mulher na tecnologia, que a faca sentir especial, necessaria e amada.\n\n" +
      "2. POEMA: 4 estrofes de 4 versos cada. Amoroso, criativo, carinhoso. Celebra-a como mulher, como programadora corajosa, como princesa que merece ser cuidada. Transmite que ela e especial, amada, necessaria e bem-vinda. Usa o nome " + firstName + " pelo menos uma vez. Escreve em portugues de Portugal.\n\n" +
      "Responde APENAS neste formato exato:\nFRASE: [a frase]\n---DIVISOR---\nPOEMA:\n[o poema]";

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Claude falhou: ' + err }) };
    }

    const claudeData = await claudeRes.json();
    const raw = claudeData.content[0].text;
    const parts = raw.split('---DIVISOR---');
    const content = {
      frase: parts[0].replace('FRASE:', '').trim(),
      poema: parts[1] ? parts[1].replace('POEMA:', '').trim() : raw
    };

    // Guardar no Netlify Blobs se possivel
    if (siteId && token) {
      try {
        await fetch(
          `https://api.netlify.com/api/v1/blobs/${siteId}/murais/${blobKey}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
          }
        );
      } catch (e) { console.error('Blob save error:', e.message); }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ content, cached: false }) };

  } catch (err) {
    console.error('mural error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
