// Modello MongoDB per Cache Ricerche Museo - VERSIONE CORRETTA
// Risolve tutti i problemi di casting con le API reali
import mongoose from 'mongoose';

// Schema per i tag complessi del Met Museum
const TagSchema = new mongoose.Schema({
  term: String,
  AAT_URL: String,
  Wikidata_URL: String
}, { _id: false });

// Schema principale per i risultati museo
const MuseumResultSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['met', 'aic', 'rijks'],
    required: true
  },
  id: {
    type: mongoose.Schema.Types.Mixed, // Può essere String o Number
    required: true
  },
  title: String,
  artist: String,
  date: String,
  medium: String,
  culture: String,
  period: String,
  department: String,
  primaryImage: String,
  primaryImageSmall: String,
  additionalImages: [String],
  isPublicDomain: Boolean,
  objectURL: String,
  repository: String,
  dimensions: String,
  creditLine: String,
  
  // Tags flessibili per gestire sia stringhe che oggetti
  tags: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  
  // Campi specifici Art Institute of Chicago
  style: String,
  classification: String,
  subjects: [String],
  materials: [String],
  techniques: [String],
  themes: [String],
  imageId: String,
  thumbnail: mongoose.Schema.Types.Mixed,
  
  // Metadati aggiuntivi
  matchScore: Number,
  searchQuery: String
}, { _id: false });

const MuseumCacheSchema = new mongoose.Schema({
  // Chiave univoca per la ricerca (hash dei termini)
  searchKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Termini di ricerca originali
  searchTerms: [{
    type: String,
    required: true
  }],
  
  // Query string originale
  originalQuery: {
    type: String,
    required: true
  },
  
  // Risultati delle API museo (schema flessibile)
  results: [MuseumResultSchema],
  
  // Metadati della ricerca
  metadata: {
    totalResults: {
      type: Number,
      default: 0
    },
    sources: [{
      type: String,
      enum: ['met', 'aic', 'rijks']
    }],
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    processingTimeMs: Number,
    apiCallsCount: Number,
    errors: [String],
    searchTerms: [String],
    cachedAt: Date
  },
  
  // Tracking utilizzo
  hitCount: {
    type: Number,
    default: 0
  },
  
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  
  // TTL automatico (30 giorni)
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 giorni in secondi
  }
}, {
  timestamps: true,
  collection: 'museum_cache'
});

// Indici per performance
MuseumCacheSchema.index({ searchKey: 1 });
MuseumCacheSchema.index({ searchTerms: 1 });
MuseumCacheSchema.index({ originalQuery: 1 });
MuseumCacheSchema.index({ createdAt: -1 });
MuseumCacheSchema.index({ lastAccessed: -1 });
MuseumCacheSchema.index({ 'metadata.qualityScore': -1 });

// Metodi del modello
MuseumCacheSchema.statics.findBySearchTerms = function(searchTerms) {
  const searchKey = this.generateSearchKey(searchTerms);
  return this.findOne({ searchKey });
};

MuseumCacheSchema.statics.generateSearchKey = function(searchTerms) {
  // Crea hash consistente dai termini di ricerca
  const normalizedTerms = searchTerms
    .map(term => term.toLowerCase().trim())
    .filter(term => term.length > 0)
    .sort()
    .join('|');
  
  // Semplice hash (in produzione usare crypto)
  let hash = 0;
  for (let i = 0; i < normalizedTerms.length; i++) {
    const char = normalizedTerms.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

MuseumCacheSchema.statics.createCacheEntry = function(searchTerms, originalQuery, results, metadata) {
  const searchKey = this.generateSearchKey(searchTerms);
  
  // Pulisci e normalizza i risultati per evitare errori di casting
  const cleanResults = results.map(result => {
    const cleanResult = { ...result };
    
    // Gestisci tags in modo sicuro
    if (cleanResult.tags) {
      if (Array.isArray(cleanResult.tags)) {
        // Se è un array di oggetti, mantienilo così
        cleanResult.tags = cleanResult.tags;
      } else {
        // Se è altro, convertilo in array
        cleanResult.tags = [];
      }
    } else {
      cleanResult.tags = [];
    }
    
    // Gestisci thumbnail in modo sicuro
    if (cleanResult.thumbnail && typeof cleanResult.thumbnail === 'object') {
      cleanResult.thumbnail = cleanResult.thumbnail;
    }
    
    // Assicurati che additionalImages sia un array
    if (!Array.isArray(cleanResult.additionalImages)) {
      cleanResult.additionalImages = [];
    }
    
    // Converti ID in stringa se necessario
    if (typeof cleanResult.id === 'number') {
      cleanResult.id = cleanResult.id.toString();
    }
    
    return cleanResult;
  });
  
  return this.findOneAndUpdate(
    { searchKey },
    {
      searchKey,
      searchTerms,
      originalQuery,
      results: cleanResults,
      metadata: {
        ...metadata,
        cachedAt: new Date()
      },
      lastAccessed: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

MuseumCacheSchema.methods.incrementHit = function() {
  this.hitCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

MuseumCacheSchema.methods.updateQualityScore = function() {
  const totalResults = this.results.length;
  const resultsWithImages = this.results.filter(r => r.primaryImage).length;
  const publicDomainResults = this.results.filter(r => r.isPublicDomain).length;
  
  // Calcola score qualità basato su completezza dati
  let qualityScore = 0;
  
  if (totalResults > 0) {
    qualityScore += 0.3; // Base score per avere risultati
    qualityScore += (resultsWithImages / totalResults) * 0.4; // Bonus immagini
    qualityScore += (publicDomainResults / totalResults) * 0.2; // Bonus public domain
    qualityScore += Math.min(totalResults / 5, 1) * 0.1; // Bonus quantità (max 5)
  }
  
  this.metadata.qualityScore = Math.min(qualityScore, 1);
  return this.save();
};

// Middleware pre-save
MuseumCacheSchema.pre('save', function(next) {
  if (this.isNew) {
    this.updateQualityScore();
  }
  next();
});

// Metodi statici per statistiche
MuseumCacheSchema.statics.getCacheStats = async function() {
  const totalEntries = await this.countDocuments();
  const recentEntries = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  const topHits = await this.find()
    .sort({ hitCount: -1 })
    .limit(10)
    .select('originalQuery hitCount lastAccessed');
  
  const avgQuality = await this.aggregate([
    { $group: { _id: null, avgQuality: { $avg: '$metadata.qualityScore' } } }
  ]);
  
  return {
    totalEntries,
    recentEntries,
    topHits,
    averageQuality: avgQuality[0]?.avgQuality || 0,
    cacheHitRate: await this.calculateHitRate()
  };
};

MuseumCacheSchema.statics.calculateHitRate = async function() {
  // Implementazione semplificata - in produzione tracciare meglio
  const totalHits = await this.aggregate([
    { $group: { _id: null, totalHits: { $sum: '$hitCount' } } }
  ]);
  
  const totalEntries = await this.countDocuments();
  
  if (totalEntries === 0) return 0;
  
  return (totalHits[0]?.totalHits || 0) / totalEntries;
};

// Cleanup automatico per cache vecchie
MuseumCacheSchema.statics.cleanupOldEntries = async function() {
  const result = await this.deleteMany({
    lastAccessed: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // 60 giorni
    hitCount: { $lt: 2 } // Meno di 2 hit
  });
  
  console.log(`🧹 Cleaned up ${result.deletedCount} old cache entries`);
  return result;
};

const MuseumCache = mongoose.model('MuseumCache', MuseumCacheSchema);

export default MuseumCache;

