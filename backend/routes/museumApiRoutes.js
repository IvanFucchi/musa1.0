// Routes per l'integrazione delle API museali - VERSIONE CON CACHE FIX
// Fix per termini di ricerca consistenti - risolve il problema delle descrizioni variabili

import express from 'express';
import spotController from '../controllers/spotController.js';
import MuseumApiService from '../utils/museumApiService.js';
import ImageMatchingService from '../utils/imageMatchingService.js';
import MuseumCacheService from '../utils/MuseumCacheService.js';

const router = express.Router();

// Inizializza i servizi
const museumApiService = new MuseumApiService();
const imageMatchingService = new ImageMatchingService();
const cacheService = new MuseumCacheService();

// Avvia cleanup periodico cache
cacheService.startPeriodicCleanup();

// Configurazione ottimizzazioni
const OPTIMIZATION_CONFIG = {
  enableCache: true,
  maxSpotsToProcess: 5,
  maxImagesPerSpot: 1,
  apiTimeoutMs: 2000,
  totalTimeoutMs: 3000,
  parallelBatchSize: 4,
  rateLimitDelayMs: 75
};

// FUNZIONE FISSA: Termini di ricerca consistenti (NON usa descrizioni variabili)
const extractSearchTermsConsistent = (spot, originalQuery, place) => {
  const terms = [];
  
  console.log(`🔧 Extracting consistent terms for: ${spot.name}`);
  
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
  
  // 4. Parole chiave FISSE dal nome (non dalla descrizione variabile)
  if (spot.name) {
    const nameKeywords = spot.name
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

// Funzione per arricchimento singolo spot con cache FISSO
const enrichSpotWithCache = async (spot, originalQuery, place) => {
  try {
    console.log(`🔍 Enriching spot: ${spot.title || spot.name}`);
    
    // Estrai termini di ricerca CONSISTENTI
    const searchTerms = extractSearchTermsConsistent(
      { name: spot.title || spot.name, title: spot.title },
      originalQuery,
      place
    );
    
    console.log(`🔎 Search terms: ${searchTerms.join(', ')}`);
    
    if (searchTerms.length === 0) {
      spot.museumImages = [];
      spot.imageEnrichmentStatus = 'no_terms';
      return spot;
    }
    
    const searchQuery = searchTerms.join(' ');
    
    // 1. PROVA CACHE PRIMA
    if (OPTIMIZATION_CONFIG.enableCache) {
      const cachedResult = await cacheService.getCachedResults(searchTerms, searchQuery);
      if (cachedResult) {
        spot.museumImages = cachedResult.results;
        spot.imageEnrichmentStatus = 'success_cached';
        spot.cacheInfo = {
          type: cachedResult.cacheType,
          age: cachedResult.age,
          hitCount: cachedResult.hitCount
        };
        
        console.log(`⚡ Cache hit (${cachedResult.cacheType}) for ${spot.title}: ${cachedResult.results.length} images`);
        return spot;
      }
    }
    
    // 2. CACHE MISS - CHIAMA API CON TIMEOUT
    console.log(`🌐 Cache miss - calling APIs for: ${spot.title}`);
    
    const apiStartTime = Date.now();
    let museumImages = [];
    
    try {
      // Chiamata API con timeout
      museumImages = await Promise.race([
        museumApiService.searchAllMuseums(searchQuery, {
          maxResults: OPTIMIZATION_CONFIG.maxImagesPerSpot,
          includeMuseums: ['met', 'aic']
        }),
        new Promise((resolve) => 
          setTimeout(() => {
            console.log(`⏰ API timeout for ${spot.title} - returning empty results`);
            resolve([]);
          }, OPTIMIZATION_CONFIG.apiTimeoutMs)
        )
      ]);
      
      const apiTime = Date.now() - apiStartTime;
      console.log(`🌐 API call completed in ${apiTime}ms for ${spot.title}`);
      
    } catch (apiError) {
      console.error(`❌ API error for ${spot.title}:`, apiError.message);
      museumImages = [];
    }
    
    // 3. SALVA IN CACHE (anche se vuoto)
    if (OPTIMIZATION_CONFIG.enableCache) {
      const metadata = {
        totalResults: museumImages.length,
        sources: ['met', 'aic'],
        processingTimeMs: Date.now() - apiStartTime,
        apiCallsCount: 1,
        searchTerms: searchTerms,
        spotName: spot.title || spot.name,
        originalQuery,
        place
      };
      
      await cacheService.cacheResults(searchTerms, searchQuery, museumImages, metadata);
    }
    
    // 4. AGGIORNA SPOT
    if (museumImages && museumImages.length > 0) {
      spot.museumImages = museumImages;
      spot.imageEnrichmentStatus = 'success';
      console.log(`✅ Found ${museumImages.length} images for ${spot.title}`);
    } else {
      spot.museumImages = [];
      spot.imageEnrichmentStatus = 'no_results';
      console.log(`ℹ️ No images found for ${spot.title}`);
    }
    
    // Piccola pausa per rate limiting
    await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.rateLimitDelayMs));
    
    return spot;
    
  } catch (error) {
    console.error(`❌ Error enriching spot ${spot.title}:`, error.message);
    spot.museumImages = [];
    spot.imageEnrichmentStatus = 'error';
    spot.enrichmentError = error.message;
    return spot;
  }
};

// Route principale ottimizzata con cache FISSO
router.post('/enhanced', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query, coordinates, place, enrichWithImages = false, filters = {} } = req.body;
    
    console.log('🎨 Enhanced spots request:', { query, place, enrichWithImages });
    console.log('🔧 Using consistent search terms (fixed cache)');
    
    // Ottieni i risultati base usando il tuo spotController esistente
    let baseResults;
    try {
      baseResults = await new Promise((resolve, reject) => {
        const mockReq = {
          query: {
            place: place || '',
            activity: query || ''
          }
        };
        
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
      cacheFixApplied: true // Indica che il fix è attivo
    };
    
    console.log(`📍 Base spots found: ${enrichedSpots.length}`);
    
    // Limita il numero di spots processati per performance
    const spotsToProcess = enrichedSpots.slice(0, OPTIMIZATION_CONFIG.maxSpotsToProcess);
    enrichmentStats.processedSpots = spotsToProcess.length;
    
    // Arricchisci con immagini museo se richiesto
    if (enrichWithImages && spotsToProcess.length > 0) {
      const enrichmentStartTime = Date.now();
      console.log(`🏛️ Starting museum enrichment for ${spotsToProcess.length} spots...`);
      
      try {
        // PROCESSAMENTO PARALLELO A BATCH
        const batchSize = OPTIMIZATION_CONFIG.parallelBatchSize;
        const batches = [];
        
        for (let i = 0; i < spotsToProcess.length; i += batchSize) {
          batches.push(spotsToProcess.slice(i, i + batchSize));
        }
        
        console.log(`📦 Processing ${batches.length} batches of ${batchSize} spots each`);
        
        // Processa batch sequenzialmente, spots in parallelo dentro ogni batch
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);
          
          // PASSA query e place per termini consistenti
          const batchPromise = Promise.allSettled(
            batch.map(spot => enrichSpotWithCache(spot, query, place))
          );
          
          const batchResults = await Promise.race([
            batchPromise,
            new Promise((resolve) => 
              setTimeout(() => {
                console.log(`⏰ Batch ${batchIndex + 1} timeout - proceeding with partial results`);
                resolve(batch.map(() => ({ status: 'rejected', reason: new Error('Batch timeout') })));
              }, OPTIMIZATION_CONFIG.totalTimeoutMs / batches.length)
            )
          ]);
          
          // Processa risultati del batch
          batchResults.forEach((result, spotIndex) => {
            const globalIndex = batchIndex * batchSize + spotIndex;
            
            if (result.status === 'fulfilled') {
              const enrichedSpot = result.value;
              enrichedSpots[globalIndex] = enrichedSpot;
              
              if (enrichedSpot.imageEnrichmentStatus === 'success_cached') {
                enrichmentStats.cacheHits++;
              } else if (enrichedSpot.imageEnrichmentStatus === 'success') {
                enrichmentStats.cacheMisses++;
                enrichmentStats.apiCalls++;
              }
              
              if (enrichedSpot.museumImages && enrichedSpot.museumImages.length > 0) {
                enrichmentStats.enrichedSpots++;
                enrichmentStats.totalImages += enrichedSpot.museumImages.length;
              }
            } else {
              console.error(`❌ Spot enrichment failed:`, result.reason?.message);
              enrichmentStats.errors++;
              
              // Fallback per spot falliti
              enrichedSpots[globalIndex].museumImages = [];
              enrichedSpots[globalIndex].imageEnrichmentStatus = 'timeout';
            }
          });
          
          // Pausa tra batch per rate limiting
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        enrichmentStats.processingTime = Date.now() - enrichmentStartTime;
        console.log(`🎨 Enrichment completed in ${enrichmentStats.processingTime}ms`);
        
      } catch (enrichmentError) {
        console.error('💥 Museum enrichment error:', enrichmentError);
        enrichmentStats.errors = spotsToProcess.length;
        enrichmentStats.processingTime = Date.now() - enrichmentStartTime;
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
      cacheInfo: spot.cacheInfo,
      source: spot.source || 'openai'
    }));
    
    const totalTime = Date.now() - startTime;
    enrichmentStats.totalRequestTime = totalTime;
    
    // Calcola cache hit rate
    const totalCacheRequests = enrichmentStats.cacheHits + enrichmentStats.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? 
      ((enrichmentStats.cacheHits / totalCacheRequests) * 100).toFixed(1) : 0;
    
    console.log(`📊 Final stats:`, enrichmentStats);
    console.log(`⚡ Total request time: ${totalTime}ms`);
    console.log(`💨 Cache hit rate: ${cacheHitRate}%`);
    console.log(`🔧 Cache fix active: Consistent search terms`);
    
    res.json({
      success: true,
      spots: transformedSpots,
      metadata: {
        enrichmentEnabled: enrichWithImages,
        enrichmentStats,
        performance: {
          totalTimeMs: totalTime,
          cacheHitRate: `${cacheHitRate}%`,
          optimized: true,
          cacheFixApplied: true,
          version: 'cache-fix-v1'
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Enhanced spots error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      performance: {
        totalTimeMs: totalTime,
        failed: true
      },
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route per testare l'arricchimento su un singolo spot (con cache fisso)
router.post('/test-enrichment', async (req, res) => {
  try {
    const { spot, query = 'art', place = 'rome' } = req.body;
    
    if (!spot || !spot.title) {
      return res.status(400).json({
        success: false,
        error: 'Spot with title required'
      });
    }
    
    console.log(`🧪 Testing enrichment for: ${spot.title}`);
    
    const enrichedSpot = await enrichSpotWithCache(spot, query, place);
    
    res.json({
      success: true,
      spot: enrichedSpot,
      performance: {
        optimized: true,
        cacheEnabled: OPTIMIZATION_CONFIG.enableCache,
        cacheFixApplied: true
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

// Health check API musei
router.get('/museum-apis-health', async (req, res) => {
  try {
    console.log('🏥 Checking museum APIs health...');
    
    const health = await museumApiService.healthCheck();
    
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

// Route per ricerca diretta nelle API museali
router.post('/museum-search', async (req, res) => {
  try {
    const { query, museums = ['met', 'aic'], maxResults = 5 } = req.body;
    
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

// Route per statistiche cache
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      stats,
      config: OPTIMIZATION_CONFIG,
      cacheFixApplied: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('📊 Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route per invalidare cache
router.delete('/cache/:searchKey', async (req, res) => {
  try {
    const { searchKey } = req.params;
    
    // Decodifica i termini di ricerca dal searchKey
    const searchTerms = searchKey.split('|');
    await cacheService.invalidateCache(searchTerms);
    
    res.json({
      success: true,
      message: `Cache invalidated for: ${searchTerms.join(', ')}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🗑️ Cache invalidation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route per configurazione arricchimento
router.get('/enrichment-config', async (req, res) => {
  try {
    res.json({
      success: true,
      config: OPTIMIZATION_CONFIG,
      cacheFixApplied: true,
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
    
    // Aggiorna configurazione runtime
    Object.assign(OPTIMIZATION_CONFIG, config);
    
    console.log('⚙️ Config updated:', OPTIMIZATION_CONFIG);
    
    res.json({
      success: true,
      message: 'Configuration updated',
      config: OPTIMIZATION_CONFIG,
      cacheFixApplied: true,
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

