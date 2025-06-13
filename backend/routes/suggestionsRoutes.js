import express from 'express';
import openaiService from '../utils/openaiService.js';

const router = express.Router();

/**
 * @route   POST /api/suggestions
 * @desc    Ottiene suggerimenti di ricerca da OpenAI
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query troppo breve'
      });
    }

    // Usa la funzione esistente ma con parametri minimi
    // Modifichiamo leggermente il prompt per ottenere suggerimenti invece di spot completi
    const customPrompt = `Fornisci 5-8 suggerimenti di ricerca relativi a "${query}" nel contesto di arte e cultura a Roma. Restituisci solo un array JSON di stringhe, senza spiegazioni.`;
    
    // Chiamiamo aiGeneratedSpots con un oggetto options personalizzato
    const spots = await openaiService.aiGeneratedSpots(customPrompt, { 
      isForSuggestions: true // flag opzionale che puoi usare per modificare il comportamento
    });
    
    // Estrai i nomi come suggerimenti
    let suggestions = [];
    
    if (Array.isArray(spots)) {
      suggestions = spots.map(spot => spot.name);
    } else if (typeof spots === 'string') {
      // Nel caso in cui la risposta sia una stringa JSON
      try {
        const parsedSpots = JSON.parse(spots);
        if (Array.isArray(parsedSpots)) {
          suggestions = parsedSpots;
        }
      } catch (e) {
        console.error('Errore nel parsing della risposta:', e);
      }
    }

    return res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Errore nel recupero dei suggerimenti:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei suggerimenti'
    });
  }
});

export default router;
