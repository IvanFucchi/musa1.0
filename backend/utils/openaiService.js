import 'dotenv/config';
import fetch from 'node-fetch';
import https from 'https';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// agente HTTPS connessioni keep-alive
const httpsAgent = new https.Agent({keepAlive: true});

// Sistema migliorato con istruzioni più specifiche
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `Sei un esperto d'arte, storia e cultura con conoscenze precise e verificate.
  Il tuo compito è fornire informazioni accurate su luoghi reali e verificabili.
  NON inventare luoghi o dettagli. Se non sei sicuro di un'informazione, omettila.
  Preferisci sempre la qualità alla quantità nelle tue risposte.`
};

// Prompt migliorato per risultati più accurati e strutturati
const PROMPT_TEMPLATE = `
Genera una lista di massimo 5 luoghi reali e verificabili a {PLACE} relativi a "{ACTIVITY}".

IMPORTANTE:
- Genera SOLO luoghi che esistono realmente e sono verificabili
- Se non sei sicuro di un luogo, NON includerlo
- Preferisci qualità a quantità (meglio 3 luoghi accurati che 5 approssimativi)
- NON inventare dettagli o informazioni

Per ogni luogo, fornisci:
- Nome esatto del luogo
- Tipo specifico (museo, chiesa, monumento, scultura, palazzo, sito archeologico)
- Coordinate GPS precise (se le conosci, altrimenti usa [0, 0])
- Indirizzo completo (se lo conosci)
- Breve descrizione fattuale (max 2 frasi)
- Artisti principali associati (se applicabile)
- Periodo storico o anno di creazione (se applicabile)

Formatta i risultati come un array JSON con i seguenti campi per ogni spot:
  - title (nome esatto dello spot)
  - description (descrizione fattuale)
  - type (tipo specifico: museo, chiesa, monumento, scultura, palazzo, sito archeologico)
  - coordinates (array [longitudine, latitudine])
  - address (indirizzo completo)
  - city (città)
  - country (paese)
  - artists (array di artisti principali associati, vuoto se non applicabile)
  - period (periodo storico o anno di creazione, vuoto se non applicabile)
  - source (sempre "openai")
`;

export const aiGeneratedSpots = async ({place, activity}) => {
  console.log(`🔍 Generando spot per: ${activity} a ${place}`);
  
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
        temperature: 0.5, // Ridotto per risultati più deterministici e accurati
        max_tokens: 1000 // Aumentato per permettere risposte più dettagliate
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
    const spots = JSON.parse(clean);
    
    // Validazione e pulizia dei risultati
    const validatedSpots = spots.map(spot => ({
      ...spot,
      // Assicura che tutti i campi richiesti esistano
      title: spot.title || '',
      description: spot.description || '',
      type: spot.type || 'venue',
      coordinates: Array.isArray(spot.coordinates) && spot.coordinates.length === 2 
        ? spot.coordinates 
        : [0, 0],
      address: spot.address || '',
      city: spot.city || place,
      country: spot.country || '',
      artists: Array.isArray(spot.artists) ? spot.artists : [],
      period: spot.period || '',
      source: 'openai'
    }));
    
    console.log(`✅ Generati ${validatedSpots.length} spot verificati per: ${activity} a ${place}`);
    return validatedSpots;
  } catch (err) {
    console.error('JSON parsing error:', err, '\nRaw content:', clean);
    return [];
  }
};

export default {aiGeneratedSpots};

