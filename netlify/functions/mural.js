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

  if (!process.env.GEMINI_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GEMINI_KEY nao configurada' }) };
  }

  try {
    const prompt = "Es um poeta carinhoso e amoroso.\nEscreve para " + firstName + ", uma cadete da escola de programacao 42, no Mes da Mulher.\n\nResponde APENAS neste formato:\nFRASE: [uma frase motivacional unica de 1-2 linhas com o nome " + firstName + "]\n---DIVISOR---\nPOEMA:\n[um poema de 4 estrofes de 4 versos, amoroso, que use o nome " + firstName + ", em portugues de Portugal]";

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1000 }
        })
      }
    );

    const geminiText = await geminiRes.text();

    if (!geminiRes.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Gemini: ' + geminiText }) };
    }

    const geminiData = JSON.parse(geminiText);
    const raw = geminiData.candidates[0].content.parts[0].text;
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
