import 'dotenv/config';
import fetch from 'node-fetch';
import https from 'https';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// agente HTTPS connessioni keep-alive
const httpsAgent = new https.Agent({keepAlive: true});

const SYSTEM_MESSAGE = {
  role: 'system',
  content: "Sei un esperto d'arte e cultura che conosce il luogo in dettaglio."
};

const PROMPT_TEMPLATE = `
Genera 5 spot artistici a {PLACE} basati sulla query: "{ACTIVITY}". 
Formatta i risultati come un array JSON con i seguenti campi per ogni spot:
  - title (nome dello spot)
  - description (descrizione dettagliata)
  - type (artwork, venue o event)
  - coordinates (array [longitudine, latitudine])
  - address (indirizzo completo)
  - city (città)
  - country (paese)
Imposta sempre source a "openai".
`;

export const aiGeneratedSpots = async ({place, activity}) => {
  const userPrompt = PROMPT_TEMPLATE
    .replace('{PLACE}', place)
    .replace('{ACTIVITY}', activity);

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [SYSTEM_MESSAGE, {role: 'user', content: userPrompt}],
        temperature: 0.7
      })
    });
  } catch (err) {
    console.error('Errore di rete:', err);
    return [];
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    console.error('Errore OpenAI:', errText);
    return [];
  }

  const {choices} = await res.json();
  const raw = choices?.[0]?.message?.content?.trim() ?? '';
  const clean = raw.replace(/```json|```/g, '');

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error('JSON parsing error:', err, '\nRaw content:', clean);
    return [];
  }
};

export default {aiGeneratedSpots};
