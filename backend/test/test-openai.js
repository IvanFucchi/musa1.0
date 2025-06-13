import { aiGeneratedSpots } from './utils/openaiService.js';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

const testOpenAI = async () => {
  try {
    console.log('Testando aiGeneratedSpots...');
    console.log('OPENAI_API_KEY presente:', process.env.OPENAI_API_KEY ? 'Sì' : 'No');
    
    const spots = await aiGeneratedSpots('arte roma', {});
    console.log('Risultati:', spots);
  } catch (error) {
    console.error('Errore nel test:', error);
  }
};

testOpenAI();
