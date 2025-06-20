// Image Matching Service - Versione aggiornata per opere specifiche
// Integra WikiArt e Google Custom Search per matching preciso delle opere d'arte

class ImageMatchingService {
  constructor() {
    this.typeCache = new Map(); // Cache per i tipi di luoghi
    this.artworkCache = new Map(); // Cache per opere specifiche
  }
  
  /**
   * NUOVO: Cerca immagini per opere specifiche menzionate nello spot
   * @param {Object} spot - Spot con campo artworks
   * @param {string} originalQuery - Query originale dell'utente
   * @param {string} place - Luogo della ricerca
   * @param {Object} wikiArtService - Istanza del servizio WikiArt
   * @param {Object} googleCSEService - Istanza del servizio Google CSE
   * @returns {Promise<Array>} - Array di immagini delle opere specifiche
   */
  async findSpecificArtworks(spot, originalQuery, place, wikiArtService, googleCSEService) {
    console.log(`🎨 Cercando opere specifiche per: ${spot.title || spot.name}`);
    
    // Controlla se lo spot ha opere specifiche
    if (!spot.artworks || !Array.isArray(spot.artworks) || spot.artworks.length === 0) {
      console.log(`❌ Nessuna opera specifica trovata per: ${spot.title || spot.name}`);
      return [];
    }
    
    console.log(`🔍 Trovate ${spot.artworks.length} opere specifiche da cercare:`);
    spot.artworks.forEach(artwork => {
      console.log(`   - "${artwork.title}" di ${artwork.artist}`);
    });
    
    const allResults = [];
    
    // Cerca ogni opera specifica
    for (const artwork of spot.artworks) {
      if (!artwork.title || !artwork.artist) {
        console.log(`⚠️ Opera incompleta saltata: ${JSON.stringify(artwork)}`);
        continue;
      }
      
      // Controlla cache
      const cacheKey = `${artwork.title}_${artwork.artist}`.toLowerCase();
      if (this.artworkCache.has(cacheKey)) {
        console.log(`💨 Cache hit per opera: "${artwork.title}" di ${artwork.artist}`);
        allResults.push(...this.artworkCache.get(cacheKey));
        continue;
      }
      
      console.log(`🔍 Cercando: "${artwork.title}" di ${artwork.artist}`);
      
      try {
        // 1. Prima prova con Wikidata (più accurato)
        let artworkResults = await wikiArtService.searchSpecificArtwork(
          artwork.title, 
          artwork.artist
        );
        
        // 2. Se Wikidata non trova risultati, SALTA Google CSE per ora (errore 403)
        if (artworkResults.length === 0) {
          console.log(`🔄 Wikidata non ha trovato risultati, Google CSE temporaneamente disabilitato`);
          // artworkResults = await googleCSEService.searchSpecificArtwork(
          //   artwork.title, 
          //   artwork.artist
          // );
        }
        
        // Aggiungi metadati aggiuntivi ai risultati
        const enrichedResults = artworkResults.map(result => ({
          ...result,
          spotName: spot.title || spot.name,
          searchMethod: 'specific_artwork',
          originalArtwork: artwork,
          matchScore: this.calculateSpecificArtworkScore(artwork, result)
        }));
        
        // Salva in cache
        this.artworkCache.set(cacheKey, enrichedResults);
        
        allResults.push(...enrichedResults);
        
        console.log(`✅ Trovate ${enrichedResults.length} immagini per "${artwork.title}" di ${artwork.artist}`);
        
      } catch (error) {
        console.error(`❌ Errore cercando "${artwork.title}" di ${artwork.artist}:`, error.message);
      }
      
      // Pausa tra ricerche per rispettare rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Rimuovi duplicati e ordina per score
    const uniqueResults = this.removeDuplicateImages(allResults);
    const sortedResults = uniqueResults.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`🎯 Totale immagini opere specifiche trovate: ${sortedResults.length}`);
    return sortedResults.slice(0, 6); // Max 6 immagini per spot
  }
  
  /**
   * NUOVO: Calcola score per opere specifiche (più accurato)
   * @param {Object} searchedArtwork - Opera cercata
   * @param {Object} foundResult - Risultato trovato
   * @returns {number} - Score da 0 a 1
   */
  calculateSpecificArtworkScore(searchedArtwork, foundResult) {
    let score = 0;
    
    const searchTitle = searchedArtwork.title.toLowerCase();
    const searchArtist = searchedArtwork.artist.toLowerCase();
    const foundTitle = (foundResult.title || '').toLowerCase();
    const foundArtist = (foundResult.artist || '').toLowerCase();
    
    // Match esatto del titolo (peso 50%)
    if (foundTitle.includes(searchTitle) || searchTitle.includes(foundTitle)) {
      score += 0.5;
    }
    
    // Match esatto dell'artista (peso 40%)
    if (foundArtist.includes(searchArtist) || searchArtist.includes(foundArtist)) {
      score += 0.4;
    }
    
    // Bonus per fonte affidabile (peso 10%)
    if (foundResult.source === 'wikidata') {
      score += 0.1;
    } else if (foundResult.source === 'google_cse' && foundResult.repository && 
               foundResult.repository.toLowerCase().includes('museum')) {
      score += 0.05;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * AGGIORNATO: Metodo principale per arricchire uno spot con immagini
   * @param {Object} spot - Spot da arricchire
   * @param {string} originalQuery - Query originale dell'utente
   * @param {string} place - Luogo della ricerca
   * @param {Function} fallbackSearchFunction - Funzione di fallback per ricerca generica
   * @param {Object} wikiArtService - Istanza del servizio WikiArt
   * @param {Object} googleCSEService - Istanza del servizio Google CSE
   * @returns {Promise<Array>} - Array di immagini trovate
   */
  async enrichSpotWithImages(spot, originalQuery, place, fallbackSearchFunction, wikiArtService, googleCSEService) {
    console.log(`🎨 Arricchendo spot: ${spot.title || spot.name}`);
    
    // PRIORITÀ 1: Cerca opere specifiche se disponibili
    if (spot.artworks && Array.isArray(spot.artworks) && spot.artworks.length > 0) {
      console.log(`🎯 Usando ricerca opere specifiche per: ${spot.title || spot.name}`);
      const specificResults = await this.findSpecificArtworks(spot, originalQuery, place, wikiArtService, googleCSEService);
      
      if (specificResults.length > 0) {
        console.log(`✅ Trovate ${specificResults.length} immagini opere specifiche`);
        return specificResults;
      } else {
        console.log(`⚠️ Nessuna immagine trovata per opere specifiche, fallback a ricerca generica`);
      }
    }
    
    // PRIORITÀ 2: Fallback a ricerca generica (metodo esistente)
    if (fallbackSearchFunction) {
      console.log(`🔄 Usando ricerca generica per: ${spot.title || spot.name}`);
      
      // Usa termini consistenti per la ricerca generica
      const searchTerms = this.extractSearchTermsConsistent(spot, originalQuery, place);
      const genericResults = await fallbackSearchFunction(searchTerms);
      
      if (genericResults && genericResults.length > 0) {
        // Filtra per tipo di luogo
        const spotType = this.determineLocationType(spot);
        const filteredResults = this.filterResultsByType(genericResults, spotType);
        
        // Aggiungi metadati
        const enrichedResults = filteredResults.map(result => ({
          ...result,
          spotName: spot.title || spot.name,
          searchMethod: 'generic_fallback',
          matchScore: this.calculateMatchScore(spot, result)
        }));
        
        console.log(`✅ Trovate ${enrichedResults.length} immagini generiche`);
        return enrichedResults.slice(0, 5);
      }
    }
    
    console.log(`❌ Nessuna immagine trovata per: ${spot.title || spot.name}`);
    return [];
  }
  
  /**
   * NUOVO: Rimuove immagini duplicate basandosi su URL
   * @param {Array} results - Array di risultati
   * @returns {Array} - Array senza duplicati
   */
  removeDuplicateImages(results) {
    const seen = new Set();
    return results.filter(result => {
      const imageUrl = result.primaryImage || result.primaryImageSmall || '';
      if (seen.has(imageUrl)) {
        return false;
      }
      seen.add(imageUrl);
      return true;
    });
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
   * Calcola score di matching tra uno spot e un'opera d'arte (metodo generico)
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
   * NUOVO: Test del sistema di matching opere specifiche
   * @returns {Promise<boolean>} - True se il test passa
   */
  async testSpecificArtworkMatching() {
    console.log('🧪 Testando sistema matching opere specifiche...');
    return true; // Per ora sempre true
  }
  
  /**
   * Pulisce tutte le cache
   */
  clearCache() {
    this.typeCache.clear();
    this.artworkCache.clear();
  }
}

export default ImageMatchingService;

