const { getDeployStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const store = getDeployStore('murais');

  // GET — carregar mural existente
  if (event.httpMethod === 'GET') {
    try {
      const login = new URLSearchParams(event.rawQuery || '').get('login');
      if (!login) return { statusCode: 400, headers, body: JSON.stringify({ error: 'login em falta' }) };
      const data = await store.get(login, { type: 'json' }).catch(() => null);
      if (!data) return { statusCode: 404, headers, body: JSON.stringify({ error: 'nao encontrado' }) };
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST — gerar conteudo e guardar (so uma vez por login)
  if (event.httpMethod === 'POST') {
    try {
      const { firstName, login } = JSON.parse(event.body);
      if (!firstName || !login) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dados em falta' }) };

      const existing = await store.get(login, { type: 'json' }).catch(() => null);
      if (existing) return { statusCode: 200, headers, body: JSON.stringify({ content: existing.content, cached: true }) };

      const prompt = "Es um poeta e escritor carinhoso, criativo e amoroso.\nEscreve para " + firstName + ", uma cadete feminina da escola de programacao 42.\nE o Mes Internacional da Mulher (Marco).\n\nCria exatamente dois elementos separados por ---DIVISOR---:\n\n1. FRASE: Uma frase motivacional unica (maximo 2 linhas), pessoal e calorosa, que use o nome " + firstName + ", que celebre a sua coragem como mulher na tecnologia, que a faca sentir especial, necessaria e amada.\n\n2. POEMA: 4 estrofes de 4 versos cada. Amoroso, criativo, carinhoso. Celebra-a como mulher, como programadora corajosa, como princesa que merece ser cuidada. Transmite que ela e especial, amada, necessaria e bem-vinda. Usa o nome " + firstName + " pelo menos uma vez. Escreve em portugues de Portugal.\n\nResponde APENAS neste formato exato:\nFRASE: [a frase]\n---DIVISOR---\nPOEMA:\n[o poema]";

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
        const err = await claudeRes.json();
        return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
      }

      const claudeData = await claudeRes.json();
      const raw = claudeData.content[0].text;
      const parts = raw.split('---DIVISOR---');
      const content = {
        frase: parts[0].replace('FRASE:', '').trim(),
        poema: parts[1] ? parts[1].replace('POEMA:', '').trim() : raw
      };

      await store.setJSON(login, { content, createdAt: new Date().toISOString() });

      return { statusCode: 200, headers, body: JSON.stringify({ content, cached: false }) };

    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo nao permitido' }) };
};
