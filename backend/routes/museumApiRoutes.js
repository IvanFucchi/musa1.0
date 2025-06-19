// Routes per l'integrazione delle API museali - AGGIORNATO
// Versione migliorata con Google Places e matching per tipo

import express from 'express';
import spotController from '../controllers/spotController.js';
import MuseumApiService from '../utils/museumApiService.js';
import ImageMatchingService from '../utils/imageMatchingService.js';
import GooglePlacesService from '../utils/googlePlacesService.js';

const router = express.Router();

// Inizializza i servizi
const museumApiService = new MuseumApiService();
const imageMatchingService = new ImageMatchingService();
const googlePlacesService = new GooglePlacesService();

// Configurazione ottimizzazioni
const OPTIMIZATION_CONFIG = {
  enableCache: true,
  maxSpotsToProcess: 8,
  maxImagesPerSpot: 4,
  apiTimeoutMs: 3000,
  totalTimeoutMs: 8000,
  parallelBatchSize: 4,
  rateLimitDelayMs: 50
};

/**
 * Estrae termini di ricerca consistenti per il cache
 * @param {Object} spot - Spot da cui estrarre i termini
 * @param {string} originalQuery - Query originale dell'utente
 * @param {string} place - Luogo della ricerca
 * @returns {Array} - Array di termini di ricerca consistenti
 */
const extractSearchTermsConsistent = (spot, originalQuery, place) => {
  console.log(`🔧 Extracting consistent terms for: ${spot.name || spot.title}`);
  
  const terms = [];
  
  // 1. SEMPRE il nome del posto (stabile)
  if (spot.name) {
    terms.push(spot.name);
  }
  if (spot.title && spot.title !== spot.name) {
    terms.push(spot.title);
  }
  
  // 2. SEMPRE la query originale dell'utente (stabile)
  if (originalQuery) {
    terms.push(originalQuery);
  }
  
  // 3. SEMPRE il luogo (stabile)
  if (place) {
    terms.push(place);
  }
  
  // 4. Artisti associati (se disponibili)
  if (spot.artists && Array.isArray(spot.artists) && spot.artists.length > 0) {
    terms.push(...spot.artists.slice(0, 2));
  }
  
  // 5. Parole chiave FISSE dal nome (non dalla descrizione variabile)
  if (spot.name || spot.title) {
    const nameStr = (spot.name || spot.title).toLowerCase();
    const nameKeywords = nameStr
      .split(' ')
      .filter(word => 
        word.length > 3 && 
        !['della', 'degli', 'delle', 'chiesa', 'palazzo', 'museo', 'galleria', 'santa', 'maria', 'san'].includes(word.toLowerCase())
      )
      .slice(0, 2); // Max 2 parole chiave dal nome
    
    terms.push(...nameKeywords);
  }
  
  // Pulisci e normalizza per consistenza
  const cleanTerms = [...new Set(terms)]
    .filter(term => term && term.trim().length > 2)
    .map(term => term.trim().toLowerCase()) // Lowercase per consistenza
    .slice(0, 5); // Max 5 termini totali
  
  console.log(`🔧 Consistent terms: [${cleanTerms.join(', ')}]`);
  return cleanTerms;
};

/**
 * Arricchisce uno spot con immagini dai musei e Google Places
 * @param {Object} spot - Spot da arricchire
 * @param {string} originalQuery - Query originale dell'utente
 * @param {string} place - Luogo della ricerca
 * @returns {Promise<Object>} - Spot arricchito
 */
const enrichSpot = async (spot, originalQuery, place) => {
  try {
    console.log(`🔍 Enriching spot: ${spot.title || spot.name}`);
    
    // Determina il tipo di luogo
    const spotType = imageMatchingService.determineLocationType({
      name: spot.title || spot.name,
      description: spot.description,
      type: spot.type // Campo dal prompt migliorato
    });
    console.log(`🏛️ Spot type: ${spotType}`);
    
    // Estrai termini di ricerca consistenti
    const searchTerms = extractSearchTermsConsistent(
      { name: spot.title || spot.name, title: spot.title },
      originalQuery,
      place
    );
    
    console.log(`🔎 Search terms: ${searchTerms.join(', ')}`);
    
    // Cerca immagini correlate con timeout
    let museumImages = [];
    try {
      // Usa Promise.race per implementare timeout
      museumImages = await Promise.race([
        museumApiService.searchAllMuseums(searchTerms.join(' '), {
          maxResults: OPTIMIZATION_CONFIG.maxImagesPerSpot,
          includeMuseums: ['met', 'aic']
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), OPTIMIZATION_CONFIG.apiTimeoutMs)
        )
      ]);
    } catch (apiError) {
      console.log(`⏰ API timeout for ${spot.title} - trying Google Places`);
      museumImages = []; // Fallback a array vuoto
    }
    
    // Se abbiamo trovato immagini dai musei
    if (museumImages && museumImages.length > 0) {
      // Filtra per tipo di luogo
      const filteredImages = imageMatchingService.filterResultsByType(museumImages, spotType);
      spot.museumImages = filteredImages;
      spot.imageEnrichmentStatus = 'success';
      console.log(`✅ Found ${filteredImages.length} relevant images for ${spot.title}`);
      return spot;
    }
    
    // Se non ci sono risultati dai musei, prova con Google Places per monumenti esterni
    if (spotType === 'monument' || spotType === 'archaeological' || spotType === 'palace' || spotType === 'church') {
      console.log(`🌍 Trying Google Places for external location: ${spot.title}`);
      
      // Coordinate per la ricerca
      const location = spot.position 
        ? `${spot.position.lat},${spot.position.lng}`
        : place; // Usa il luogo come fallback
      
      try {
        const placesResults = await Promise.race([
          googlePlacesService.searchPlaces(spot.title, location),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Places API timeout')), OPTIMIZATION_CONFIG.apiTimeoutMs)
          )
        ]);
        
        if (placesResults && placesResults.length > 0) {
          // Converti risultati Google Places nel formato museumImages
          const googleImages = googlePlacesService.convertToMuseumFormat(placesResults);
          
          spot.museumImages = googleImages.slice(0, OPTIMIZATION_CONFIG.maxImagesPerSpot);
          spot.imageEnrichmentStatus = 'success_places';
          console.log(`🌍 Found ${spot.museumImages.length} Google Places images for ${spot.title}`);
          return spot;
        }
      } catch (placesError) {
        console.log(`⏰ Google Places timeout for ${spot.title}`);
      }
    }
    
    // Nessun risultato trovato
    spot.museumImages = [];
    spot.imageEnrichmentStatus = 'no_results';
    return spot;
    
  } catch (error) {
    console.error(`❌ Error enriching spot ${spot.title || spot.name}:`, error.message);
    spot.museumImages = [];
    spot.imageEnrichmentStatus = 'error';
    return spot;
  }
};

// Route principale per ottenere spots arricchiti con immagini
router.post('/enhanced', async (req, res) => {
  const startTime = Date.now();
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
      processedSpots: 0,
      enrichedSpots: 0,
      totalImages: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      errors: 0,
      processingTime: 0,
      cacheFixApplied: true,
      totalRequestTime: 0
    };
    
    console.log(`📍 Base spots found: ${enrichedSpots.length}`);
    
    // Arricchisci con immagini museo se richiesto
    if (enrichWithImages && enrichedSpots.length > 0) {
      console.log(`🏛️ Starting museum enrichment for ${Math.min(enrichedSpots.length, OPTIMIZATION_CONFIG.maxSpotsToProcess)} spots...`);
      
      try {
        // Limita il numero di spot da processare
        const spotsToProcess = enrichedSpots.slice(0, OPTIMIZATION_CONFIG.maxSpotsToProcess);
        enrichmentStats.processedSpots = spotsToProcess.length;
        
        // Dividi in batch per processamento parallelo
        const batchSize = OPTIMIZATION_CONFIG.parallelBatchSize;
        const batches = [];
        for (let i = 0; i < spotsToProcess.length; i += batchSize) {
          batches.push(spotsToProcess.slice(i, i + batchSize));
        }
        
        console.log(`📦 Processing ${batches.length} batches of ${batchSize} spots each`);
        
        // Processa ogni batch in parallelo con timeout globale
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);
          
          try {
            // Usa Promise.race per implementare timeout globale per il batch
            const batchResults = await Promise.race([
              // Processa tutti gli spot nel batch in parallelo
              Promise.all(batch.map(spot => enrichSpot(spot, query, place))),
              
              // Timeout globale per il batch
              new Promise((_, reject) => 
                setTimeout(() => {
                  console.log(`⏰ Batch ${batchIndex + 1} timeout - proceeding with partial results`);
                  reject(new Error('Batch timeout'));
                }, OPTIMIZATION_CONFIG.totalTimeoutMs)
              )
            ]);
            
            // Aggiorna statistiche
            batchResults.forEach(spot => {
              if (spot.museumImages && spot.museumImages.length > 0) {
                enrichmentStats.enrichedSpots++;
                enrichmentStats.totalImages += spot.museumImages.length;
              }
            });
            
          } catch (batchError) {
            // Continua con il prossimo batch anche se questo fallisce
            console.log(`⚠️ Batch ${batchIndex + 1} error: ${batchError.message}`);
          }
          
          // Piccola pausa tra batch
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.rateLimitDelayMs));
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
      id: spot.id || `spot_${index + 1}`,
      title: spot.title || spot.name,
      description: spot.description,
      imageUrl: spot.imageUrl,
      position: spot.position || {
        lat: spot.coordinates?.[1] || 0,
        lng: spot.coordinates?.[0] || 0
      },
      url: spot.url,
      type: spot.type || 'venue',
      artists: spot.artists || [],
      period: spot.period || '',
      museumImages: spot.museumImages || [],
      imageEnrichmentStatus: spot.imageEnrichmentStatus || 'none',
      source: spot.source || 'openai'
    }));
    
    // Calcola statistiche finali
    enrichmentStats.totalRequestTime = Date.now() - startTime;
    const cacheHitRate = enrichmentStats.processedSpots > 0 
      ? (enrichmentStats.cacheHits / enrichmentStats.processedSpots * 100).toFixed(1) 
      : '0.0';
    
    console.log(`⚡ Total request time: ${enrichmentStats.totalRequestTime}ms`);
    console.log(`💨 Cache hit rate: ${cacheHitRate}%`);
    console.log(`🔧 Cache fix active: Consistent search terms`);
    
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
    
    // Determina il tipo di luogo
    const spotType = imageMatchingService.determineLocationType({
      name: spot.title,
      description: spot.description,
      type: spot.type
    });
    
    console.log(`🏛️ Spot type: ${spotType}`);
    
    // Estrai termini di ricerca
    const searchTerms = extractSearchTermsConsistent(
      spot,
      req.body.query || '',
      req.body.place || ''
    );
    
    // Cerca immagini correlate
    const museumImages = await museumApiService.searchAllMuseums(searchTerms.join(' '), {
      maxResults: 6,
      includeMuseums: ['met', 'aic']
    });
    
    // Filtra per tipo
    const filteredImages = imageMatchingService.filterResultsByType(museumImages, spotType);
    
    // Se non ci sono risultati dai musei e il tipo è monumento, prova Google Places
    let googleImages = [];
    if ((filteredImages.length === 0 || spotType === 'monument') && req.body.place) {
      console.log(`🌍 Trying Google Places for: ${spot.title}`);
      const placesResults = await googlePlacesService.searchPlaces(spot.title, req.body.place);
      if (placesResults && placesResults.length > 0) {
        googleImages = googlePlacesService.convertToMuseumFormat(placesResults);
      }
    }
    
    // Combina i risultati
    const allImages = [...filteredImages];
    if (googleImages.length > 0) {
      allImages.push(...googleImages);
    }
    
    res.json({
      success: true,
      spot: {
        ...spot,
        type: spotType,
        museumImages: allImages,
        imageEnrichmentStatus: allImages.length > 0 ? 'success' : 'no_results'
      },
      searchTerms,
      resultsCount: {
        museum: filteredImages.length,
        googlePlaces: googleImages.length,
        total: allImages.length
      },
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

// Health check API musei e Google Places
router.get('/museum-apis-health', async (req, res) => {
  try {
    console.log('🏥 Checking APIs health...');
    
    const [museumHealth, placesHealth] = await Promise.all([
      museumApiService.checkHealth(),
      googlePlacesService.healthCheck()
    ]);
    
    res.json({
      success: true,
      health: {
        museums: museumHealth,
        googlePlaces: placesHealth,
        overall: museumHealth.status === 'healthy' && placesHealth.status === 'healthy' 
          ? 'healthy' 
          : 'degraded'
      },
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
    
    const results = await museumApiService.searchAllMuseums(query, {
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

// Route per ricerca diretta in Google Places (per testing/debug)
router.post('/places-search', async (req, res) => {
  try {
    const { query, location, type = 'tourist_attraction' } = req.body;
    
    if (!query || !location) {
      return res.status(400).json({
        success: false,
        error: 'Query and location parameters required'
      });
    }
    
    console.log(`🌍 Direct Google Places search: ${query} in ${location}`);
    
    const results = await googlePlacesService.searchPlaces(query, location, type);
    const formattedResults = googlePlacesService.convertToMuseumFormat(results);
    
    res.json({
      success: true,
      query,
      location,
      results: formattedResults,
      rawResults: results,
      count: formattedResults.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🌍 Places search error:', error);
    res.status(500).json({
      success: false,
      error: 'Google Places search failed',
      details: error.message
    });
  }
});

// Route per configurazione arricchimento
router.get('/enrichment-config', async (req, res) => {
  try {
    res.json({
      success: true,
      config: OPTIMIZATION_CONFIG,
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
    
    // Aggiorna solo i campi forniti
    Object.keys(config).forEach(key => {
      if (OPTIMIZATION_CONFIG.hasOwnProperty(key)) {
        OPTIMIZATION_CONFIG[key] = config[key];
      }
    });
    
    res.json({
      success: true,
      message: 'Configuration updated',
      config: OPTIMIZATION_CONFIG,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

// Pulisci cache
router.post('/clear-cache', async (req, res) => {
  try {
    imageMatchingService.clearCache();
    googlePlacesService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

export default router;

