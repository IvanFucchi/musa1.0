// Routes per l'integrazione delle API museali - AGGIORNATO
// Integrato con spotController esistente e path corretti

import express from 'express';
import spotController from '../controllers/spotController.js';
import MuseumApiService from '../utils/museumApiService.js';
import ImageMatchingService from '../utils/imageMatchingService.js';



// Funzione temporanea per estrarre termini di ricerca
const extractSearchTermsTemp = (spot) => {
  const terms = [];
  
  if (spot.name) terms.push(spot.name);
  if (spot.title && spot.title !== spot.name) terms.push(spot.title);
  if (spot.description) {
    const keywords = spot.description.split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3);
    terms.push(...keywords);
  }
  if (spot.location) terms.push(spot.location);
  
  return [...new Set(terms)].filter(term => term && term.trim().length > 2).slice(0, 5);
};





const router = express.Router();

// Inizializza i servizi
const museumApiService = new MuseumApiService();
const imageMatchingService = new ImageMatchingService();

// Route principale per ottenere spots arricchiti con immagini
router.post('/enhanced', async (req, res) => {
  try {
    const { query, coordinates, place, enrichWithImages = false, filters = {} } = req.body;
    
    console.log('🎨 Enhanced spots request:', { query, place, enrichWithImages });
    
    // Crea una richiesta mock per il spotController esistente
    const mockReq = {
      query: {
        place: place || '',
        activity: query || ''
      }
    };
    
    // Ottieni i risultati base usando il tuo spotController esistente
    let baseResults;
    try {
      baseResults = await new Promise((resolve, reject) => {
        const mockRes = {
          json: (data) => resolve(data),
          status: (code) => ({
            json: (data) => {
              if (code >= 400) {
                reject(new Error(`Status ${code}: ${JSON.stringify(data)}`));
              } else {
                resolve(data);
              }
            }
          })
        };
        
        // Chiama il metodo getSpots del tuo controller esistente
        spotController.getSpots(mockReq, mockRes);
      });
    } catch (controllerError) {
      console.error('❌ SpotController error:', controllerError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch base spots',
        details: controllerError.message
      });
    }
    
    if (!baseResults || !baseResults.success) {
      return res.status(500).json({
        success: false,
        error: 'SpotController returned unsuccessful result',
        baseResults
      });
    }
    
    let enrichedSpots = baseResults.data || [];
    let enrichmentStats = {
      totalSpots: enrichedSpots.length,
      enrichedSpots: 0,
      totalImages: 0,
      apiCalls: 0,
      errors: 0,
      processingTime: 0
    };
    
    console.log(`📍 Base spots found: ${enrichedSpots.length}`);
    
    // Arricchisci con immagini museo se richiesto
    if (enrichWithImages && enrichedSpots.length > 0) {
      const startTime = Date.now();
      console.log('🏛️ Starting museum enrichment...');
      
      try {
        // Processa ogni spot per l'arricchimento
        for (let i = 0; i < Math.min(enrichedSpots.length, 10); i++) { // Limita a 10 per performance
          const spot = enrichedSpots[i];
          
          try {
            console.log(`🔍 Enriching spot: ${spot.title || spot.name}`);
            
            // Estrai termini di ricerca dal spot
            const searchTerms = extractSearchTermsTemp({
              name: spot.title || spot.name,
              description: spot.description,
              location: place
            });
            
            console.log(`🔎 Search terms: ${searchTerms.join(', ')}`);
            
            // Cerca immagini correlate
            const museumImages = await museumApiService.searchAllMuseums(searchTerms.join(' '), {
              maxResults: 6,
              includeMuseums: ['met', 'aic']
            });
            
            enrichmentStats.apiCalls++;
            
            if (museumImages && museumImages.length > 0) {
              spot.museumImages = museumImages;
              spot.imageEnrichmentStatus = 'success';
              enrichmentStats.enrichedSpots++;
              enrichmentStats.totalImages += museumImages.length;
              
              console.log(`✅ Found ${museumImages.length} images for ${spot.title}`);
            } else {
              spot.museumImages = [];
              spot.imageEnrichmentStatus = 'no_results';
              console.log(`ℹ️ No images found for ${spot.title}`);
            }
            
            // Piccola pausa per evitare rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (spotError) {
            console.error(`❌ Error enriching spot ${spot.title}:`, spotError);
            spot.museumImages = [];
            spot.imageEnrichmentStatus = 'error';
            enrichmentStats.errors++;
          }
        }
        
        enrichmentStats.processingTime = Date.now() - startTime;
        console.log(`🎨 Enrichment completed in ${enrichmentStats.processingTime}ms`);
        
      } catch (enrichmentError) {
        console.error('💥 Museum enrichment error:', enrichmentError);
        // Continua senza arricchimento invece di fallire
      }
    }
    
    // Trasforma i dati per il formato atteso dal frontend
    const transformedSpots = enrichedSpots.map((spot, index) => ({
      id: spot.id || (index + 1),
      title: spot.title || spot.name,
      description: spot.description,
      imageUrl: spot.imageUrl,
      position: spot.position || {
        lat: spot.coordinates?.[1],
        lng: spot.coordinates?.[0]
      },
      url: spot.url,
      museumImages: spot.museumImages || [],
      imageEnrichmentStatus: spot.imageEnrichmentStatus || 'none',
      source: spot.source || 'openai'
    }));
    
    console.log(`📊 Final stats:`, enrichmentStats);
    
    res.json({
      success: true,
      spots: transformedSpots,
      metadata: {
        enrichmentEnabled: enrichWithImages,
        enrichmentStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 Enhanced spots error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route per testare l'arricchimento su un singolo spot
router.post('/test-enrichment', async (req, res) => {
  try {
    const { spot } = req.body;
    
    if (!spot || !spot.title) {
      return res.status(400).json({
        success: false,
        error: 'Spot with title required'
      });
    }
    
    console.log(`🧪 Testing enrichment for: ${spot.title}`);
    
    const searchTerms = imageMatchingService.extractSearchTerms(spot);
// Cerca immagini correlate
const museumImages = await museumApiService.searchAllMuseums(searchTerms.join(' '), {
  maxResults: 6,
  includeMuseums: ['met', 'aic']
});
    
    res.json({
      success: true,
      spot: {
        ...spot,
        museumImages,
        imageEnrichmentStatus: museumImages.length > 0 ? 'success' : 'no_results'
      },
      searchTerms,
      resultsCount: museumImages.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🧪 Test enrichment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check API musei
router.get('/museum-apis-health', async (req, res) => {
  try {
    console.log('🏥 Checking museum APIs health...');
    
    const health = await museumApiService.checkHealth();
    
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🏥 Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route per ricerca diretta nelle API museali (per testing/debug)
router.post('/museum-search', async (req, res) => {
  try {
    const { query, museums = ['met', 'aic'], maxResults = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required'
      });
    }
    
    console.log(`🔍 Direct museum search: ${query}`);
    
    const results = await museumApiService.searchArtworks([query], {
      maxResults,
      includeMuseums: museums
    });
    
    res.json({
      success: true,
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔍 Museum search error:', error);
    res.status(500).json({
      success: false,
      error: 'Museum search failed',
      details: error.message
    });
  }
});

// Route per configurazione arricchimento
router.get('/enrichment-config', async (req, res) => {
  try {
    const config = {
      enabled: true,
      maxSpotsToEnrich: 10,
      maxImagesPerSpot: 6,
      timeoutMs: 10000,
      includeMuseums: ['met', 'aic'],
      rateLimitDelayMs: 100
    };
    
    res.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

// Route per aggiornare configurazione
router.put('/enrichment-config', async (req, res) => {
  try {
    const { config } = req.body;
    
    // In una implementazione reale, salveresti la config in un database
    console.log('⚙️ Config update requested:', config);
    
    res.json({
      success: true,
      message: 'Configuration updated',
      config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

export default router;

