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

  if (!process.env.GROQ_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_KEY nao configurada' }) };
  }

  try {
    const prompt = "Es um poeta carinhoso e amoroso.\nEscreve para " + firstName + ", uma cadete da escola de programacao 42, no Mes da Mulher.\n\nResponde APENAS neste formato:\nFRASE: [uma frase motivacional unica de 1-2 linhas com o nome " + firstName + "]\n---DIVISOR---\nPOEMA:\n[um poema de 4 estrofes de 4 versos, amoroso, que use o nome " + firstName + ", em portugues de Portugal]";

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const groqText = await groqRes.text();

    if (!groqRes.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Groq: ' + groqText }) };
    }

    const groqData = JSON.parse(groqText);
    const raw = groqData.choices[0].message.content;
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
