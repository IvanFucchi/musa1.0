import Spot from '../models/Spot.js';
import { aiGeneratedSpots } from '../utils/openaiService.js';
import { buildSpotQuery, buildPaginationOptions } from '../utils/queryBuilder.js';
import ImageMatchingService from '../utils/imageMatchingService.js';

// Istanza del servizio di arricchimento immagini
const imageMatchingService = new ImageMatchingService();

// Configurazione per l'arricchimento immagini
const enrichmentConfig = {
  enabled: true,
  maxImagesPerSpot: 3,
  includeMuseums: ['met', 'aic'],
  timeout: 10000, // 10 secondi timeout
  fallbackOnError: true
};

// Funzione helper per arricchire spots con immagini museo
const enrichSpotsWithMuseumImages = async (spots, options = {}) => {
  if (!enrichmentConfig.enabled || !spots || spots.length === 0) {
    return spots;
  }

  const {
    force = false,
    timeout = enrichmentConfig.timeout,
    maxImagesPerSpot = enrichmentConfig.maxImagesPerSpot,
    includeMuseums = enrichmentConfig.includeMuseums
  } = options;

  try {
    // Filtra solo spots AI-generated che necessitano arricchimento
    const spotsToEnrich = spots.filter(spot => {
      if (spot.source !== 'openai') return false;
      if (!force && spot.museumImages && spot.museumImages.length > 0) return false;
      return true;
    });

    if (spotsToEnrich.length === 0) {
      return spots;
    }

    console.log(`Enriching ${spotsToEnrich.length} spots with museum images...`);

    // Usa Promise.race per implementare timeout
    const enrichmentPromise = imageMatchingService.enrichSpotsWithImages(
      spotsToEnrich,
      {
        maxImagesPerSpot,
        includeMuseums
      }
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Museum enrichment timeout')), timeout);
    });

    const enrichedSpots = await Promise.race([enrichmentPromise, timeoutPromise]);

    // Merge risultati arricchiti con spots originali
    const finalSpots = spots.map(originalSpot => {
      const enrichedSpot = enrichedSpots.find(s => s.id === originalSpot.id);
      return enrichedSpot || originalSpot;
    });

    console.log(`Successfully enriched ${enrichedSpots.filter(s => s.museumImages?.length > 0).length} spots`);
    return finalSpots;

  } catch (error) {
    console.error('Museum enrichment error:', error);
    
    if (enrichmentConfig.fallbackOnError) {
      // Fallback: restituisce spots originali con flag di errore
      return spots.map(spot => ({
        ...spot,
        museumImages: spot.museumImages || [],
        imageEnrichmentStatus: 'failed',
        imageEnrichmentError: error.message
      }));
    } else {
      throw error;
    }
  }
};

// Funzione helper per calcolare statistiche di arricchimento
const calculateEnrichmentStats = (spots) => {
  const stats = {
    totalSpots: spots.length,
    spotsWithImages: 0,
    spotsWithoutImages: 0,
    totalImages: 0,
    averageImagesPerSpot: 0,
    sourceBreakdown: {},
    enrichmentErrors: 0
  };

  spots.forEach(spot => {
    if (spot.museumImages && spot.museumImages.length > 0) {
      stats.spotsWithImages++;
      stats.totalImages += spot.museumImages.length;
      
      // Conta per fonte
      spot.museumImages.forEach(image => {
        stats.sourceBreakdown[image.source] = 
          (stats.sourceBreakdown[image.source] || 0) + 1;
      });
    } else {
      stats.spotsWithoutImages++;
    }
    
    if (spot.imageEnrichmentStatus === 'failed') {
      stats.enrichmentErrors++;
    }
  });

  if (stats.spotsWithImages > 0) {
    stats.averageImagesPerSpot = stats.totalImages / stats.spotsWithImages;
  }

  return stats;
};

// @desc    Ottieni spot in base ai parametri di ricerca (AGGIORNATO con arricchimento immagini)
// @route   GET /api/spots
// @access  Public
export const getSpots = async (req, res, next) => {
  try {
    // Estrai parametri di ricerca (incluso enrichWithImages)
    const { search, lat, lng, distance, mood, musicGenre, source, enrichWithImages } = req.query;

    // Array per i risultati combinati
    let combinedResults = [];

    // Step 1: Ottieni risultati da OpenAI (fonte primaria)
    const openaiResults = await aiGeneratedSpots(req.query);
    combinedResults = [...openaiResults]; // Ogni risultato ha source: 'openai'

    // Step 2: NUOVO - Arricchimento con immagini museo se richiesto
    if (enrichWithImages === 'true' || enrichWithImages === true) {
      try {
        combinedResults = await enrichSpotsWithMuseumImages(combinedResults, {
          maxImagesPerSpot: enrichmentConfig.maxImagesPerSpot,
          includeMuseums: enrichmentConfig.includeMuseums
        });
      } catch (enrichmentError) {
        console.error('Enrichment failed in getSpots:', enrichmentError);
        // Continua con risultati non arricchiti
      }
    }

    /*
    // Step 3: Ottieni risultati dal database (contenuti UGC) - commentato come nell'originale
    if (!source || source === 'all' || source === 'database') {
      // Costruisci la query utilizzando il builder
      const query = buildSpotQuery(req.query, req.user);

      // Costruisci opzioni di paginazione
      const options = buildPaginationOptions(req.query);

      // Esegui la query
      const dbSpots = await Spot.find(query)
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort);

      // Assicura che ogni risultato abbia il campo source
      const dbSpotsWithSource = dbSpots.map(spot => {
        const spotObj = spot.toObject();
        if (!spotObj.source) {
          spotObj.source = 'database';
        }
        return spotObj;
      });

      combinedResults = [...combinedResults, ...dbSpotsWithSource];
    }
    */

    // Calcola statistiche di arricchimento se presente
    const enrichmentStats = enrichWithImages ? calculateEnrichmentStats(combinedResults) : null;

    // Restituisci i risultati combinati con metadati
    const response = {
      success: true,
      count: combinedResults.length,
      data: combinedResults
    };

    // Aggiungi statistiche di arricchimento se disponibili
    if (enrichmentStats) {
      response.enrichmentStats = enrichmentStats;
      response.imageEnrichmentEnabled = enrichmentConfig.enabled;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni spot arricchiti (nuovo endpoint dedicato)
// @route   POST /api/spots/enhanced
// @access  Public
export const getEnhancedSpots = async (req, res, next) => {
  try {
    const { query, coordinates, filters = {}, enrichWithImages = true } = req.body;

    // 1. Ottieni spots da OpenAI usando la logica esistente
    const queryParams = {
      search: query,
      lat: coordinates?.lat,
      lng: coordinates?.lng,
      ...filters
    };

    const aiSpots = await aiGeneratedSpots(queryParams);

    // 2. Arricchisci con immagini se abilitato
    let enrichedSpots = aiSpots;
    
    if (enrichWithImages && enrichmentConfig.enabled) {
      try {
        enrichedSpots = await enrichSpotsWithMuseumImages(aiSpots, {
          maxImagesPerSpot: enrichmentConfig.maxImagesPerSpot,
          includeMuseums: enrichmentConfig.includeMuseums
        });
      } catch (enrichmentError) {
        console.error('Image enrichment failed:', enrichmentError);
        
        if (enrichmentConfig.fallbackOnError) {
          // Fallback: restituisce spots originali con flag di errore
          enrichedSpots = aiSpots.map(spot => ({
            ...spot,
            museumImages: [],
            imageEnrichmentStatus: 'failed',
            imageEnrichmentError: enrichmentError.message
          }));
        } else {
          throw enrichmentError;
        }
      }
    }

    // 3. Combina con UGC dal database locale (se necessario)
    // Per ora usiamo solo AI-generated spots come nell'implementazione originale
    const ugcSpots = []; // Placeholder per UGC spots

    // 4. Unifica e ordina i risultati
    const allSpots = [...enrichedSpots, ...ugcSpots];

    // Ordinamento: prima spots con immagini, poi per rilevanza
    allSpots.sort((a, b) => {
      // Priorità per spots con immagini museali
      const aHasImages = a.museumImages && a.museumImages.length > 0;
      const bHasImages = b.museumImages && b.museumImages.length > 0;
      
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      
      // Ordinamento secondario per fonte (AI prima di UGC)
      if (a.source === 'openai' && b.source !== 'openai') return -1;
      if (a.source !== 'openai' && b.source === 'openai') return 1;
      
      return 0;
    });

    res.json({
      success: true,
      spots: allSpots,
      metadata: {
        aiGenerated: enrichedSpots.length,
        ugc: ugcSpots.length,
        total: allSpots.length,
        imageEnrichmentEnabled: enrichmentConfig.enabled,
        enrichmentStats: calculateEnrichmentStats(enrichedSpots)
      }
    });
    
  } catch (error) {
    console.error('Enhanced spots retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve enhanced spots',
      details: error.message
    });
  }
};

// @desc    Testa arricchimento su un singolo spot
// @route   POST /api/spots/test-enrichment
// @access  Public
export const testSpotEnrichment = async (req, res, next) => {
  try {
    const { spot } = req.body;
    
    if (!spot) {
      return res.status(400).json({
        success: false,
        error: 'Spot data required'
      });
    }
    
    const result = await imageMatchingService.testMatching(spot);
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Test enrichment error:', error);
    res.status(500).json({
      success: false,
      error: 'Test enrichment failed',
      details: error.message
    });
  }
};

// @desc    Aggiorna configurazione arricchimento
// @route   PUT /api/spots/enrichment-config
// @access  Public
export const updateEnrichmentConfig = async (req, res, next) => {
  try {
    const { config } = req.body;
    
    // Valida e aggiorna configurazione
    if (typeof config.enabled !== 'undefined') {
      enrichmentConfig.enabled = Boolean(config.enabled);
    }
    
    if (config.maxImagesPerSpot && config.maxImagesPerSpot > 0) {
      enrichmentConfig.maxImagesPerSpot = Math.min(config.maxImagesPerSpot, 10);
    }
    
    if (config.includeMuseums && Array.isArray(config.includeMuseums)) {
      const validMuseums = ['met', 'aic', 'rijks'];
      enrichmentConfig.includeMuseums = config.includeMuseums.filter(
        museum => validMuseums.includes(museum)
      );
    }
    
    if (config.timeout && config.timeout > 0) {
      enrichmentConfig.timeout = Math.min(config.timeout, 30000); // Max 30 secondi
    }
    
    res.json({
      success: true,
      config: enrichmentConfig
    });
    
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      details: error.message
    });
  }
};

// @desc    Ottieni configurazione arricchimento
// @route   GET /api/spots/enrichment-config
// @access  Public
export const getEnrichmentConfig = async (req, res, next) => {
  try {
    res.json({
      success: true,
      config: enrichmentConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
};

// @desc    Health check delle API museali
// @route   GET /api/spots/museum-apis-health
// @access  Public
export const checkMuseumApiHealth = async (req, res, next) => {
  try {
    const healthStatus = await imageMatchingService.museumApi.healthCheck();
    
    res.json({
      success: true,
      healthStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
};

// @desc    Ottieni uno spot specifico per ID
// @route   GET /api/spots/:id
// @access  Public
export const getSpotById = async (req, res, next) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Verifica che lo spot sia approvato o che l'utente sia admin
    if (!spot.isApproved && (!req.user || req.user.role !== 'admin')) {
      res.status(403);
      throw new Error('Non autorizzato ad accedere a questo spot');
    }

    // Assicura che il campo source sia presente
    const spotObj = spot.toObject();
    if (!spotObj.source) {
      spotObj.source = 'database';
    }

    res.json({
      success: true,
      data: spotObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crea un nuovo spot
// @route   POST /api/spots
// @access  Private
export const createSpot = async (req, res, next) => {
  try {
    // Aggiungi l'utente e imposta source su 'database'
    req.body.user = req.user._id;
    req.body.source = 'database';

    // Se l'utente è admin, approva automaticamente lo spot
    if (req.user.role === 'admin') {
      req.body.isApproved = true;
    }

    const spot = await Spot.create(req.body);

    res.status(201).json({
      success: true,
      data: spot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggiorna uno spot
// @route   PUT /api/spots/:id
// @access  Private
export const updateSpot = async (req, res, next) => {
  try {
    let spot = await Spot.findById(req.params.id);

    if (!spot) {
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Verifica che l'utente sia il creatore o un admin
    if (spot.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Non autorizzato ad aggiornare questo spot');
    }

    // Aggiorna lo spot
    spot = await Spot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: spot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Elimina uno spot
// @route   DELETE /api/spots/:id
// @access  Private
export const deleteSpot = async (req, res, next) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Verifica che l'utente sia il creatore o un admin
    if (spot.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Non autorizzato ad eliminare questo spot');
    }

    await spot.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approva uno spot (solo admin)
// @route   PUT /api/spots/:id/approve
// @access  Private/Admin
export const approveSpot = async (req, res, next) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Aggiorna lo stato di approvazione
    spot.isApproved = true;
    await spot.save();

    res.json({
      success: true,
      data: spot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni spot vicini a una posizione (AGGIORNATO con arricchimento immagini)
// @route   GET /api/spots/nearby
// @access  Public
export const getNearbySpots = async (req, res, next) => {
  try {
    const { lat, lng, distance = 5, enrichWithImages } = req.query;

    if (!lat || !lng) {
      res.status(400);
      throw new Error('Fornisci latitudine e longitudine');
    }

    // Costruisci la query utilizzando il builder con parametri specifici per la ricerca geografica
    const query = buildSpotQuery({
      lat,
      lng,
      distance
    }, req.user);

    // Costruisci opzioni di paginazione
    const options = buildPaginationOptions(req.query);

    // Esegui la query
    const spots = await Spot.find(query)
      .skip(options.skip)
      .limit(options.limit)
      .sort(options.sort);

    // Assicura che ogni risultato abbia il campo source
    const spotsWithSource = spots.map(spot => {
      const spotObj = spot.toObject();
      if (!spotObj.source) {
        spotObj.source = 'database';
      }
      return spotObj;
    });

    // Ottieni anche risultati da OpenAI per la stessa posizione
    let openaiResults = await aiGeneratedSpots('', {
      lat, lng, distance
    });

    // NUOVO: Arricchimento con immagini museo se richiesto
    if (enrichWithImages === 'true' || enrichWithImages === true) {
      try {
        openaiResults = await enrichSpotsWithMuseumImages(openaiResults);
      } catch (enrichmentError) {
        console.error('Enrichment failed in getNearbySpots:', enrichmentError);
        // Continua con risultati non arricchiti
      }
    }

    // Combina i risultati
    const combinedResults = [...openaiResults, ...spotsWithSource];

    res.json({
      success: true,
      count: combinedResults.length,
      data: combinedResults,
      ...(enrichWithImages && { enrichmentStats: calculateEnrichmentStats(openaiResults) })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scopri spot in base a mood e genere musicale (AGGIORNATO con arricchimento immagini)
// @route   GET /api/spots/discover
// @access  Public
export const discoverSpots = async (req, res, next) => {
  try {
    const { mood, musicGenre, enrichWithImages } = req.query;

    if (!mood && !musicGenre) {
      res.status(400);
      throw new Error('Fornisci almeno un mood o un genere musicale');
    }

    // Costruisci la query utilizzando il builder con parametri specifici per la scoperta
    const query = buildSpotQuery({
      mood,
      musicGenre
    }, req.user);

    // Costruisci opzioni di paginazione
    const options = buildPaginationOptions(req.query);

    // Esegui la query
    const spots = await Spot.find(query)
      .skip(options.skip)
      .limit(options.limit)
      .sort(options.sort);

    // Assicura che ogni risultato abbia il campo source
    const spotsWithSource = spots.map(spot => {
      const spotObj = spot.toObject();
      if (!spotObj.source) {
        spotObj.source = 'database';
      }
      return spotObj;
    });

    // Ottieni anche risultati da OpenAI per lo stesso mood/genere
    let openaiResults = await aiGeneratedSpots('', {
      mood, musicGenre
    });

    // NUOVO: Arricchimento con immagini museo se richiesto
    if (enrichWithImages === 'true' || enrichWithImages === true) {
      try {
        openaiResults = await enrichSpotsWithMuseumImages(openaiResults);
      } catch (enrichmentError) {
        console.error('Enrichment failed in discoverSpots:', enrichmentError);
        // Continua con risultati non arricchiti
      }
    }

    // Combina i risultati
    const combinedResults = [...openaiResults, ...spotsWithSource];

    res.json({
      success: true,
      count: combinedResults.length,
      data: combinedResults,
      ...(enrichWithImages && { enrichmentStats: calculateEnrichmentStats(openaiResults) })
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getSpots,
  getEnhancedSpots,
  testSpotEnrichment,
  updateEnrichmentConfig,
  getEnrichmentConfig,
  checkMuseumApiHealth,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  approveSpot,
  getNearbySpots,
  discoverSpots
};

