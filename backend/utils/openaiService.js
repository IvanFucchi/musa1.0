import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Genera spot artistici utilizzando OpenAI
 * @param {string} query - Query di ricerca
 * @param {Object} options - Opzioni aggiuntive (lat, lng, distance, mood, musicGenre)
 * @returns {Array} Array di spot generati da AI
 */
export const aiGeneratedSpots = async (query, options = {}) => {
  console.log('openaai request')
  // try {
  // console.log('aiGeneratedSpots chiamata con query:', query, 'e opzioni:', options);

  // Costruisci il prompt per OpenAI
  const { lat, lng, distance, mood, musicGenre } = options;

  let prompt = `Genera 3-5 spot artistici a Roma basati sulla query: "${query}".`;


  
  if (lat && lng && distance) {
    prompt += ` Gli spot devono essere entro ${distance}km dalle coordinate [${lng}, ${lat}].`;
  }
  
  if (mood) {
    prompt += ` L'atmosfera degli spot dovrebbe essere: ${mood}.`;
  }
  
  if (musicGenre) {
    prompt += ` Gli spot dovrebbero essere associati al genere musicale: ${musicGenre}.`;
  }
  

  prompt += ` Formatta i risultati come un array JSON con i seguenti campi per ogni spot: 
      name (nome dello spot), 
      description (descrizione dettagliata), 
      type (artwork, venue, o event), 
      coordinates (array [longitudine, latitudine]), 
      address (indirizzo completo), 
      city (città), 
      country (paese), 
      category (categoria dell'opera o del luogo), 
      tags (array di tag pertinenti).
      Ogni spot deve avere il campo source impostato a "openai".`;

  console.log('Sending prompt to OpenAI:', prompt);
  console.log(process.env.OPENAI_API_KEY)


  // Chiamata reale all'API OpenAI

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Sei un esperto d\'arte e cultura che conosce Roma in dettaglio.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });




  const data = await response.json();



  if (!response.ok) {
    console.error('Errore nella chiamata a OpenAI:', data);
    return [];
  }

  // console.log('Risposta da OpenAI:', data.choices[0].message.content);

  const rispostaTestuale = data.choices[0].message.content;
  const jsonPulito = rispostaTestuale.replace(/```json|```/g, '').trim();

  // Poi puoi fare il parsing:
  try {
    const datiJson = JSON.parse(jsonPulito);
    console.log('JSON parsato:', datiJson);
    return datiJson;
  } catch (errore) {
    console.error('Errore nel parsing del JSON:', errore);
  }
};



export default {
  aiGeneratedSpots
};
