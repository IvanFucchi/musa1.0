// Routes per l'integrazione delle API museali - VERSIONE SENZA CACHE
// Integra tutti i nuovi servizi: opere specifiche, WikiArt, Google Custom Search

import express from 'express';
import { aiGeneratedSpots } from '../utils/openaiService.js';
import MuseumApiService from '../utils/museumApiService.js';
import ImageMatchingService from '../utils/imageMatchingService.js';
import WikiArtService from '../utils/wikiArtService.js';
import GoogleCustomSearchService from '../utils/googleCustomSearchService.js';

const router = express.Router();

// Inizializza i servizi
const museumApiService = new MuseumApiService();
const imageMatchingService = new ImageMatchingService();
const wikiArtService = new WikiArtService();
const googleCSEService = new GoogleCustomSearchService();

// Configurazione ottimizzazioni aggressive ma sicure
const OPTIMIZATION_CONFIG = {
  maxSpotsToProcess: 6,        // Ridotto per velocità
  maxImagesPerSpot: 4,         // Ridotto per velocità
  apiTimeoutMs: 10000,          // Molto più aggressivo
  totalTimeoutMs: 15000,        // Molto più aggressivo
  parallelBatchSize: 3,        // Ridotto per stabilità
  rateLimitDelayMs: 50         // Ridotto per velocità
};

/**
 * NUOVO: Funzione di ricerca generica per fallback
 * Usa le API museali tradizionali quando opere specifiche non sono disponibili
 */
const searchGenericMuseumImages = async (searchTerms) => {
  try {
    console.log(`🔍 Ricerca generica museo per termini: [${searchTerms.join(', ')}]`);
    
    // Usa il servizio museo esistente
    const results = await museumApiService.searchAllMuseums(searchTerms.join(' '));
    
    console.log(`📊 Ricerca generica: trovati ${results.length} risultati`);
    return results;
  } catch (error) {
    console.error('❌ Errore ricerca generica museo:', error.message);
    return [];
  }
};

/**
 * AGGIORNATO: Arricchisce uno spot con immagini usando il nuovo sistema a doppia priorità
 */
const enrichSpotWithImages = async (spot, originalQuery, place) => {
  try {
    console.log(`🎨 Arricchendo spot: ${spot.name || spot.title}`);
    
    // Usa il nuovo imageMatchingService con sistema a doppia priorità
    const images = await imageMatchingService.enrichSpotWithImages(
      spot, 
      originalQuery, 
      place, 
      searchGenericMuseumImages, // Funzione di fallback
      wikiArtService, // Istanza WikiArt
      googleCSEService // Istanza Google CSE
    );
    
    if (images && images.length > 0) {
      console.log(`✅ Trovate ${images.length} immagini per: ${spot.name || spot.title}`);
      console.log(`   Metodo usato: ${images[0]?.searchMethod || 'unknown'}`);
      
      return {
        ...spot,
        museumImages: images.slice(0, OPTIMIZATION_CONFIG.maxImagesPerSpot),
        imageEnrichmentStatus: 'success'
      };
    } else {
      console.log(`❌ Nessuna immagine trovata per: ${spot.name || spot.title}`);
      return {
        ...spot,
        museumImages: [],
        imageEnrichmentStatus: 'no_images'
      };
    }
  } catch (error) {
    console.error(`❌ Errore arricchimento ${spot.name}:`, error.message);
    return {
      ...spot,
      museumImages: [],
      imageEnrichmentStatus: 'error'
    };
  }
};

/**
 * AGGIORNATO: Arricchisce multiple spot in parallelo con timeout
 */
const enrichSpotsWithImages = async (spots, originalQuery, place) => {
  if (!spots || spots.length === 0) {
    return [];
  }

  console.log(`🏛️ Starting museum enrichment for ${spots.length} spots...`);
  const startTime = Date.now();
  
  // Limita il numero di spot da processare
  const spotsToProcess = spots.slice(0, OPTIMIZATION_CONFIG.maxSpotsToProcess);
  console.log(`📦 Processing ${spotsToProcess.length} spots (limited from ${spots.length})`);
  
  // Processa in batch per evitare sovraccarico
  const batchSize = OPTIMIZATION_CONFIG.parallelBatchSize;
  const batches = [];
  
  for (let i = 0; i < spotsToProcess.length; i += batchSize) {
    batches.push(spotsToProcess.slice(i, i + batchSize));
  }
  
  console.log(`📦 Processing ${batches.length} batches of ${batchSize} spots each`);
  
  const enrichedSpots = [];
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);
    
    try {
      // Processa batch con timeout
      const batchPromises = batch.map(spot => 
        Promise.race([
          enrichSpotWithImages(spot, originalQuery, place),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Spot timeout')), OPTIMIZATION_CONFIG.apiTimeoutMs)
          )
        ]).catch(error => {
          console.error(`⚠️ Spot ${spot.name} failed:`, error.message);
          return {
            ...spot,
            museumImages: [],
            imageEnrichmentStatus: 'timeout'
          };
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      enrichedSpots.push(...batchResults);
      
      // Pausa tra batch per rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.rateLimitDelayMs));
      }
      
    } catch (error) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
      // Aggiungi spot originali senza immagini
      enrichedSpots.push(...batch.map(spot => ({
        ...spot,
        museumImages: [],
        imageEnrichmentStatus: 'batch_error'
      })));
    }
  }
  
  // Aggiungi spot non processati (se ce ne sono)
  if (spots.length > OPTIMIZATION_CONFIG.maxSpotsToProcess) {
    const remainingSpots = spots.slice(OPTIMIZATION_CONFIG.maxSpotsToProcess).map(spot => ({
      ...spot,
      museumImages: [],
      imageEnrichmentStatus: 'not_processed'
    }));
    enrichedSpots.push(...remainingSpots);
  }
  
  const totalTime = Date.now() - startTime;
  
  // Statistiche finali
  const stats = {
    totalSpots: spots.length,
    processedSpots: spotsToProcess.length,
    enrichedSpots: enrichedSpots.filter(s => s.museumImages && s.museumImages.length > 0).length,
    totalImages: enrichedSpots.reduce((sum, s) => sum + (s.museumImages?.length || 0), 0),
    totalTime: totalTime
  };
  
  console.log(`📊 Final stats:`, stats);
  console.log(`⚡ Total request time: ${totalTime}ms`);
  
  return enrichedSpots;
};

// ==================== ROUTES ====================

/**
 * PRINCIPALE: Endpoint per ricerca arricchita con immagini museo
 */
router.post('/enhanced', async (req, res) => {
  try {
    const { query, place, coordinates, enrichWithImages = true, filters = {} } = req.body;
    
    console.log(`🎨 Enhanced spots request:`, { query, place, enrichWithImages });
    
    if (!query || !place) {
      return res.status(400).json({
        error: 'Query and place are required',
        spots: []
      });
    }
    
    // Timeout per l'intera richiesta
    const requestTimeout = setTimeout(() => {
      console.error('⏰ Request timeout reached');
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          spots: []
        });
      }
    }, OPTIMIZATION_CONFIG.totalTimeoutMs);
    
    try {
      // 1. Ottieni spot base usando openaiService direttamente (AGGIORNATO con opere specifiche)
      const baseSpots = await aiGeneratedSpots({ place, activity: query });
      console.log(`📍 Base spots found: ${baseSpots.length}`);
      
      if (!baseSpots || baseSpots.length === 0) {
        clearTimeout(requestTimeout);
        return res.json({
          spots: [],
          enrichmentStats: { message: 'No base spots found' }
        });
      }
      
      // 2. Arricchisci con immagini se richiesto
      let finalSpots = baseSpots;
      let enrichmentStats = {};
      
      if (enrichWithImages) {
        finalSpots = await enrichSpotsWithImages(baseSpots, query, place);
        
        enrichmentStats = {
          totalSpots: baseSpots.length,
          enrichedSpots: finalSpots.filter(s => s.museumImages && s.museumImages.length > 0).length,
          totalImages: finalSpots.reduce((sum, s) => sum + (s.museumImages?.length || 0), 0)
        };
      }
      
      clearTimeout(requestTimeout);
      
      res.json({
        success: true,
        spots: finalSpots,
        metadata: { enrichmentStats }
      });
      
    } catch (error) {
      clearTimeout(requestTimeout);
      console.error('❌ Enhanced spots error:', error.message);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error during enrichment',
          spots: []
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Enhanced spots route error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      spots: []
    });
  }
});

/**
 * Test singolo spot con arricchimento
 */
router.post('/test-enrichment', async (req, res) => {
  try {
    const { spot, query, place } = req.body;
    
    if (!spot || !query || !place) {
      return res.status(400).json({
        error: 'Spot, query and place are required'
      });
    }
    
    console.log(`🧪 Testing enrichment for: ${spot.name || spot.title}`);
    
    const enrichedSpot = await enrichSpotWithImages(spot, query, place);
    
    res.json({
      originalSpot: spot,
      enrichedSpot,
      stats: {
        imagesFound: enrichedSpot.museumImages?.length || 0,
        status: enrichedSpot.imageEnrichmentStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Test enrichment error:', error.message);
    res.status(500).json({
      error: 'Test enrichment failed',
      details: error.message
    });
  }
});

/**
 * Health check per tutti i servizi
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 Running health check for all services...');
    
    const healthChecks = await Promise.allSettled([
      museumApiService.testConnectivity(),
      wikiArtService.healthCheck ? wikiArtService.healthCheck() : Promise.resolve(true),
      googleCSEService.healthCheck(),
      imageMatchingService.testSpecificArtworkMatching()
    ]);
    
    const results = {
      museumApi: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : false,
      wikiArt: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : false,
      googleCSE: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : false,
      imageMatching: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : false,
      timestamp: new Date().toISOString()
    };
    
    const allHealthy = Object.values(results).filter(v => v !== results.timestamp).every(v => v === true);
    
    res.status(allHealthy ? 200 : 206).json({
      status: allHealthy ? 'healthy' : 'partial',
      services: results
    });
    
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Configurazione ottimizzazioni (GET/PUT)
 */
router.get('/config', (req, res) => {
  res.json(OPTIMIZATION_CONFIG);
});

router.put('/config', (req, res) => {
  try {
    const updates = req.body;
    
    // Valida e aggiorna configurazione
    Object.keys(updates).forEach(key => {
      if (OPTIMIZATION_CONFIG.hasOwnProperty(key)) {
        OPTIMIZATION_CONFIG[key] = updates[key];
      }
    });
    
    console.log('⚙️ Configuration updated:', OPTIMIZATION_CONFIG);
    
    res.json({
      message: 'Configuration updated',
      config: OPTIMIZATION_CONFIG
    });
  } catch (error) {
    console.error('❌ Config update error:', error.message);
    res.status(500).json({
      error: 'Failed to update configuration'
    });
  }
});

export default router;

