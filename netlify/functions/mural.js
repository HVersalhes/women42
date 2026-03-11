exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  let firstName, login;
  try {
    const body = JSON.parse(event.body);
    firstName = body.firstName;
    login = body.login;
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'body invalido' }) };
  }

  if (!firstName || !login) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'firstName e login obrigatorios' }) };
  }

  if (!process.env.ANTHROPIC_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_KEY nao configurada' }) };
  }

  try {
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
        messages: [{
          role: 'user',
          content: "Es um poeta carinhoso e amoroso.\nEscreve para " + firstName + ", uma cadete da escola 42, no Mes da Mulher.\n\nResponde APENAS neste formato:\nFRASE: [uma frase motivacional unica de 1-2 linhas com o nome " + firstName + "]\n---DIVISOR---\nPOEMA:\n[um poema de 4 estrofes de 4 versos, amoroso, que use o nome " + firstName + ", em portugues de Portugal]"
        }]
      })
    });

    const claudeText = await claudeRes.text();

    if (!claudeRes.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Claude: ' + claudeText }) };
    }

    const claudeData = JSON.parse(claudeText);
    const raw = claudeData.content[0].text;
    const parts = raw.split('---DIVISOR---');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: {
          frase: parts[0].replace('FRASE:', '').trim(),
          poema: parts[1] ? parts[1].replace('POEMA:', '').trim() : raw
        }
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
