import mongoose from 'mongoose';
import UGContent from '../models/UGContent.js';
import Spot from '../models/Spot.js';
import User from '../models/User.js';

// @desc    Crea un nuovo contenuto UGC (recensione o commento)
// @route   POST /api/ugc
// @access  Private
export const createUGContent = async (req, res, next) => {
  try {
    const { type, content, rating, spot } = req.body;

    // Validazione input
    if (!type || !content || !spot) {
      res.status(400);
      throw new Error('Inserisci tutti i campi obbligatori');
    }

    // Validazione tipo
    if (type !== 'review' && type !== 'comment') {
      res.status(400);
      throw new Error('Tipo non valido. Deve essere "review" o "comment"');
    }

    // Validazione rating per recensioni
    if (type === 'review' && (rating < 1 || rating > 5)) {
      res.status(400);
      throw new Error('Il rating deve essere compreso tra 1 e 5');
    }

    // Converti l'ID dello spot in ObjectId
    let spotId;
    try {
      spotId = new mongoose.Types.ObjectId(spot);
      console.log('ID spot convertito:', spotId);
    } catch (error) {
      console.error('Errore nella conversione dell\'ID spot:', error);
      res.status(400);
      throw new Error('ID spot non valido');
    }

    // Cerca lo spot nel database
    console.log('Cercando spot con ID:', spotId);
    const spotExists = await Spot.findById(spotId);
    console.log('Spot trovato:', spotExists ? 'Sì' : 'No');

    if (!spotExists) {
      // Log aggiuntivo per debug
      const spotCount = await Spot.countDocuments({});
      console.log(`Totale spot nel database: ${spotCount}`);
      
      // Prova a cercare alcuni spot per verificare che il database funzioni
      const someSpots = await Spot.find().limit(3);
      console.log('Alcuni spot nel database:', 
        someSpots.map(s => ({ id: s._id.toString(), name: s.name }))
      );
      
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Crea il contenuto UGC
    const ugContent = await UGContent.create({
      type,
      content,
      rating: type === 'review' ? rating : undefined,
      user: req.user._id,
      spot: spotId
    });

    // Popola i dati dell'utente
    const populatedContent = await UGContent.findById(ugContent._id)
      .populate('user', 'name avatar');

    // Se è una recensione, aggiorna il rating medio dello spot
    if (type === 'review') {
      // Ottieni tutte le recensioni per lo spot
      const reviews = await UGContent.find({
        spot: spotId,
        type: 'review'
      });

      // Calcola il rating medio
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Aggiorna lo spot
      await Spot.findByIdAndUpdate(spotId, {
        'rating.average': averageRating,
        'rating.count': reviews.length
      });
    }

    res.status(201).json({
      success: true,
      data: populatedContent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni tutti i contenuti UGC per uno spot
// @route   GET /api/ugc/spot/:spotId
// @access  Public
export const getUGCBySpot = async (req, res, next) => {
  try {
    // Converti l'ID dello spot in ObjectId
    let spotId;
    try {
      spotId = new mongoose.Types.ObjectId(req.params.spotId);
    } catch (error) {
      res.status(400);
      throw new Error('ID spot non valido');
    }

    // Verifica che lo spot esista
    const spot = await Spot.findById(spotId);
    if (!spot) {
      res.status(404);
      throw new Error('Spot non trovato');
    }

    // Ottieni tutti i contenuti UGC per lo spot
    const ugContents = await UGContent.find({ spot: spotId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ugContents.length,
      data: ugContents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni tutti i contenuti UGC creati dall'utente
// @route   GET /api/ugc/user
// @access  Private
export const getUGCByUser = async (req, res, next) => {
  try {
    const ugContents = await UGContent.find({ user: req.user._id })
      .populate('spot', 'name type category images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ugContents.length,
      data: ugContents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni tutti i contenuti UGC in attesa di approvazione (solo admin)
// @route   GET /api/ugc/pending
// @access  Private/Admin
export const getPendingUGContent = async (req, res, next) => {
  try {
    const pendingContents = await UGContent.find({ isApproved: false })
      .populate('user', 'name avatar')
      .populate('spot', 'name type category images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingContents.length,
      data: pendingContents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Elimina un contenuto UGC
// @route   DELETE /api/ugc/:id
// @access  Private
export const deleteUGContent = async (req, res, next) => {
  try {
    // Converti l'ID del contenuto in ObjectId
    let contentId;
    try {
      contentId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      res.status(400);
      throw new Error('ID contenuto non valido');
    }

    const ugContent = await UGContent.findById(contentId);

    if (!ugContent) {
      res.status(404);
      throw new Error('Contenuto non trovato');
    }



    // Verifica che l'utente sia il creatore o un admin
    if (ugContent.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Non autorizzato a eliminare questo contenuto');
    }

    await ugContent.deleteOne();

    // Se era una recensione, aggiorna il rating medio dello spot
    if (ugContent.type === 'review') {
      // Ottieni tutte le recensioni rimanenti per lo spot
      const reviews = await UGContent.find({
        spot: ugContent.spot,
        type: 'review'
      });

      // Calcola il nuovo rating medio
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      // Aggiorna lo spot
      await Spot.findByIdAndUpdate(ugContent.spot, {
        'rating.average': averageRating,
        'rating.count': reviews.length
      });
    }

    res.json({
      success: true,
      message: 'Contenuto eliminato con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modera un contenuto UGC (solo admin)
// @route   PUT /api/ugc/:id/moderate
// @access  Private/Admin
export const moderateUGContent = async (req, res, next) => {
  try {
    // Converti l'ID del contenuto in ObjectId
    let contentId;
    try {
      contentId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      res.status(400);
      throw new Error('ID contenuto non valido');
    }

    const ugContent = await UGContent.findById(contentId);

    if (!ugContent) {
      res.status(404);
      throw new Error('Contenuto non trovato');
    }

    // Aggiorna lo stato di approvazione
    ugContent.isApproved = req.body.isApproved;
    await ugContent.save();

    res.json({
      success: true,
      data: ugContent
    });
  } catch (error) {
    next(error);
  }
};

export const updateUGContent = async (req, res, next) => {
  try {
    // Converti l'ID del contenuto in ObjectId
    let contentId;
    try {
      contentId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      res.status(400);
      throw new Error('ID contenuto non valido');
    }

    const ugContent = await UGContent.findById(contentId);

    if (!ugContent) {
      res.status(404);
      throw new Error('Contenuto non trovato');
    }

    // Verifica che l'utente sia il creatore
    if (ugContent.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Non autorizzato ad aggiornare questo contenuto');
    }

    // Aggiorna i campi consentiti
    if (req.body.content) {
      ugContent.content = req.body.content;
    }
    
    if (ugContent.type === 'review' && req.body.rating) {
      ugContent.rating = req.body.rating;
    }

    await ugContent.save();

    // Se è una recensione, aggiorna il rating medio dello spot
    if (ugContent.type === 'review') {
      // Ottieni tutte le recensioni per lo spot
      const reviews = await UGContent.find({
        spot: ugContent.spot,
        type: 'review'
      });

      // Calcola il rating medio
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      // Aggiorna lo spot
      await Spot.findByIdAndUpdate(ugContent.spot, {
        'rating.average': averageRating,
        'rating.count': reviews.length
      });
    }

    res.json({
      success: true,
      data: ugContent
    });
  } catch (error) {
    next(error);
  }
};

// Per compatibilità con il vecchio nome della funzione
export const approveUGContent = moderateUGContent;

// Esporta tutte le funzioni
export default {
  createUGContent,
  getUGCBySpot,
  getUGCByUser,
  getPendingUGContent,
  deleteUGContent,
  moderateUGContent,
  approveUGContent,
  updateUGContent
};
