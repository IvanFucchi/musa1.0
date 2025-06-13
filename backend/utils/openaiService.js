import dotenv from 'dotenv';

dotenv.config();

export const aiGeneratedSpots = async (query) => {

  const {place, activity} = query
  console.log('-------------> OAI: ', place, activity)

  let prompt = `Genera 5 spot artistici a ${place} basati sulla query: "${activity}". `;

  prompt += ` 
    Formatta i risultati come un array JSON con i seguenti campi per ogni spot: 
    title (nome dello spot), 
    description (descrizione dettagliata), 
    imageUrl (url di un immagine dello spot), 
    url (url dello spot)
    type (artwork, venue, o event), 
    coordinates (array [longitudine, latitudine]), 
    address (indirizzo completo), 
    city (città), 
    country (paese), 
    category (categoria dell'opera o del luogo), 
    tags (array di tag pertinenti).
    Ogni spot deve avere il campo source impostato a "openai".
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {role: 'system', content: 'Sei un esperto d\'arte e cultura che conosce Roma in dettaglio.'},
        {role: 'user', content: prompt}
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Errore nella chiamata a OpenAI:', data);
    return [];
  }

  const rispostaTestuale = data.choices[0].message.content;
  const jsonPulito = rispostaTestuale.replace(/```json|```/g, '').trim();

  try {
    const datiJson = JSON.parse(jsonPulito);
    // console.log('JSON parsato:', datiJson);
    console.log('JSON risposta');
    return datiJson;
  } catch (errore) {
    console.error('Errore nel parsing del JSON:', errore);
  }
};

export default {
  aiGeneratedSpots
};
