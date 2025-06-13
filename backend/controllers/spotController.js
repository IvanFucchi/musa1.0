import Spot from '../models/Spot.js';
import { aiGeneratedSpots } from '../utils/openaiService.js';
import { buildSpotQuery, buildPaginationOptions } from '../utils/queryBuilder.js';

// @desc    Ottieni spot in base ai parametri di ricerca
// @route   GET /api/spots
// @access  Public
export const getSpots = async (req, res, next) => {
  // console.log('getSpots called with query:', req.query);
  try {
    // Estrai parametri di ricerca
    const { search, lat, lng, distance, mood, musicGenre, source } = req.query;
    
    // Array per i risultati combinati
    let combinedResults = [];
    
    // Step 1: Ottieni risultati da OpenAI (fonte primaria)
    // if (!source || source === 'all' || source === 'openai') {
      const openaiResults = await aiGeneratedSpots(search, {
        lat, lng, distance, mood, musicGenre
      });
      combinedResults = [...openaiResults]; // Ogni risultato ha source: 'openai'
    // }
    
    /*
    // Step 2: Ottieni risultati dal database (contenuti UGC)
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

    // Restituisci i risultati combinati
    res.json({
      success: true,
      count: combinedResults.length,
      data: combinedResults
    });
  } catch (error) {
    next(error);
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

// @desc    Ottieni spot vicini a una posizione
// @route   GET /api/spots/nearby
// @access  Public
export const getNearbySpots = async (req, res, next) => {
  try {
    const { lat, lng, distance = 5 } = req.query;
    
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
    const openaiResults = await aiGeneratedSpots('', {
      lat, lng, distance
    });
    
    // Combina i risultati
    const combinedResults = [...openaiResults, ...spotsWithSource];
    
    res.json({
      success: true,
      count: combinedResults.length,
      data: combinedResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scopri spot in base a mood e genere musicale
// @route   GET /api/spots/discover
// @access  Public
export const discoverSpots = async (req, res, next) => {
  try {
    const { mood, musicGenre } = req.query;
    
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
    const openaiResults = await aiGeneratedSpots('', {
      mood, musicGenre
    });
    
    // Combina i risultati
    const combinedResults = [...openaiResults, ...spotsWithSource];
    
    res.json({
      success: true,
      count: combinedResults.length,
      data: combinedResults
    });
  } catch (error) {
    next(error);
  }
};



export default {
  getSpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  approveSpot,
  getNearbySpots,
  discoverSpots
};
