// Image Matching Service - Algoritmi intelligenti per il matching tra risultati OpenAI e opere museali
// Versione migliorata con filtri per tipo di luogo

class ImageMatchingService {
  constructor() {
    this.typeCache = new Map(); // Cache per i tipi di luoghi
  }
  
  /**
   * Estrae termini di ricerca da uno spot
   * @param {Object} spot - Spot da cui estrarre i termini
   * @returns {Array} - Array di termini di ricerca
   */
  extractSearchTerms(spot) {
    const terms = [];
    
    // Estrai dal nome
    if (spot.name) {
      terms.push(spot.name);
    }
    
    // Estrai dalla descrizione
    if (spot.description) {
      // Estrai parole chiave dalla descrizione
      const keywords = spot.description.split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3);
      terms.push(...keywords);
    }
    
    // Estrai dalla location
    if (spot.location) {
      terms.push(spot.location);
    }
    
    // Pulisci e normalizza
    return terms
      .filter(term => term && term.trim().length > 0)
      .map(term => term.trim());
  }
  
  /**
   * Estrae termini di ricerca consistenti (versione migliorata)
   * @param {Object} spot - Spot da cui estrarre i termini
   * @param {string} originalQuery - Query originale dell'utente
   * @param {string} place - Luogo della ricerca
   * @returns {Array} - Array di termini di ricerca consistenti
   */
  extractSearchTermsConsistent(spot, originalQuery, place) {
    const terms = [];
    
    console.log(`🔧 Extracting consistent terms for: ${spot.name || spot.title}`);
    
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
    
    // 5. Periodo storico (se disponibile)
    if (spot.period) {
      terms.push(spot.period);
    }
    
    // 6. Parole chiave FISSE dal nome (non dalla descrizione variabile)
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
  }
  
  /**
   * Determina il tipo di luogo
   * @param {Object} spot - Spot da analizzare
   * @returns {string} - Tipo di luogo (museum, church, monument, palace, archaeological, generic)
   */
  determineLocationType(spot) {
    // Controlla cache
    const spotName = spot.name || spot.title || '';
    if (this.typeCache.has(spotName)) {
      return this.typeCache.get(spotName);
    }
    
    // Parole chiave per identificare il tipo
    const typeKeywords = {
      museum: ['museo', 'gallery', 'galleria', 'collection', 'collezione', 'exhibition', 'pinacoteca', 'art gallery'],
      church: ['chiesa', 'basilica', 'cathedral', 'cattedrale', 'chapel', 'cappella', 'duomo', 'abbazia'],
      monument: ['monument', 'monumento', 'statue', 'statua', 'memorial', 'obelisco', 'fontana', 'fountain'],
      palace: ['palazzo', 'palace', 'villa', 'castle', 'castello', 'reggia', 'dimora', 'residenza'],
      archaeological: ['archaeological', 'archeologico', 'ruins', 'rovine', 'ancient', 'antico', 'scavi', 'forum', 'foro']
    };
    
    // Estrai tipo dal campo type se disponibile
    if (spot.type) {
      const lowerType = spot.type.toLowerCase();
      for (const [category, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(keyword => lowerType.includes(keyword))) {
          this.typeCache.set(spotName, category);
          return category;
        }
      }
    }
    
    // Altrimenti analizza il nome e la descrizione
    const text = `${spotName} ${spot.description || ''}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        this.typeCache.set(spotName, category);
        return category;
      }
    }
    
    // Default
    this.typeCache.set(spotName, 'generic');
    return 'generic';
  }
  
  /**
   * Filtra risultati per tipo di luogo
   * @param {Array} results - Risultati da filtrare
   * @param {string} spotType - Tipo di luogo
   * @returns {Array} - Risultati filtrati
   */
  filterResultsByType(results, spotType) {
    // Se non abbiamo un tipo specifico o non ci sono risultati, restituisci tutti i risultati
    if (spotType === 'generic' || !results || results.length === 0) {
      return results;
    }
    
    console.log(`🔍 Filtering results for spot type: ${spotType}`);
    
    // Mapping tra tipi di luoghi e tipi di opere d'arte
    const typeMapping = {
      museum: ['painting', 'drawing', 'print', 'photograph', 'canvas', 'oil', 'watercolor'],
      church: ['religious', 'painting', 'sculpture', 'altar', 'fresco', 'sacred'],
      monument: ['sculpture', 'monument', 'statue', 'bronze', 'marble', 'stone'],
      palace: ['painting', 'furniture', 'decorative', 'portrait', 'interior'],
      archaeological: ['archaeological', 'ancient', 'artifact', 'ruin', 'roman', 'greek']
    };
    
    const preferredTypes = typeMapping[spotType] || [];
    
    // Funzione per calcolare score di rilevanza per tipo
    const getTypeRelevance = (result) => {
      // Controlla department, classification, medium, tags
      const metadata = [
        result.department,
        result.classification,
        result.medium,
        result.culture,
        result.period,
        result.title,
        ...(Array.isArray(result.tags) 
          ? result.tags.map(t => typeof t === 'string' ? t : (t.term || '')) 
          : [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Calcola quanti tipi preferiti sono presenti nei metadati
      return preferredTypes.reduce((score, type) => {
        return score + (metadata.includes(type.toLowerCase()) ? 1 : 0);
      }, 0);
    };
    
    // Ordina per rilevanza di tipo e prendi i migliori
    const scoredResults = [...results]
      .map(result => ({
        ...result,
        typeRelevance: getTypeRelevance(result)
      }))
      .sort((a, b) => b.typeRelevance - a.typeRelevance);
    
    // Prendi almeno 3 risultati se disponibili, ma preferisci quelli con rilevanza > 0
    const filteredResults = scoredResults
      .filter(r => r.typeRelevance > 0)
      .slice(0, Math.min(5, results.length));
    
    // Se non abbiamo abbastanza risultati rilevanti, aggiungi alcuni dei risultati originali
    if (filteredResults.length < 3 && results.length > filteredResults.length) {
      const remainingResults = scoredResults
        .filter(r => r.typeRelevance === 0)
        .slice(0, 3 - filteredResults.length);
      
      filteredResults.push(...remainingResults);
    }
    
    console.log(`🔍 Filtered ${results.length} results to ${filteredResults.length} relevant for type ${spotType}`);
    return filteredResults;
  }
  
  /**
   * Calcola score di matching tra uno spot e un'opera d'arte
   * @param {Object} spot - Spot da matchare
   * @param {Object} artwork - Opera d'arte
   * @returns {number} - Score di matching (0-1)
   */
  calculateMatchScore(spot, artwork) {
    let score = 0;
    
    // Controlla corrispondenza artisti
    if (spot.artists && Array.isArray(spot.artists) && artwork.artist) {
      const artistMatch = spot.artists.some(artist => 
        artwork.artist.toLowerCase().includes(artist.toLowerCase())
      );
      if (artistMatch) score += 0.4;
    }
    
    // Controlla corrispondenza periodo
    if (spot.period && artwork.date) {
      const periodMatch = artwork.date.toLowerCase().includes(spot.period.toLowerCase());
      if (periodMatch) score += 0.3;
    }
    
    // Controlla corrispondenza titolo
    if ((spot.name || spot.title) && artwork.title) {
      const titleWords = (spot.name || spot.title).toLowerCase().split(' ');
      const artworkTitle = artwork.title.toLowerCase();
      
      const titleMatch = titleWords.some(word => 
        word.length > 3 && artworkTitle.includes(word)
      );
      if (titleMatch) score += 0.3;
    }
    
    return Math.min(score, 1); // Max 1.0
  }
  
  /**
   * Pulisce la cache
   */
  clearCache() {
    this.typeCache.clear();
  }
}

export default ImageMatchingService;

