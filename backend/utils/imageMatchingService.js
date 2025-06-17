// Image Matching Service - Algoritmi per il matching tra risultati OpenAI e opere museali
import MuseumApiService from '../utils/museumApiService.js';

class ImageMatchingService {
  constructor() {
    this.museumApi = new MuseumApiService();
    
    // Configurazione algoritmi di matching
    this.matchingConfig = {
      titleWeight: 0.4,
      artistWeight: 0.3,
      periodWeight: 0.15,
      mediumWeight: 0.1,
      keywordWeight: 0.05,
      minimumScore: 0.3 // Soglia minima per considerare un match valido
    };
  }

  // METODO MANCANTE: Estrae termini di ricerca da uno spot (richiesto dalle route)
  extractSearchTerms(spot) {
    const terms = [];
    
    // Aggiungi il nome dello spot
    if (spot.name) {
      terms.push(spot.name);
    }
    
    // Aggiungi il titolo se diverso dal nome
    if (spot.title && spot.title !== spot.name) {
      terms.push(spot.title);
    }
    
    // Estrai informazioni dall'artista se presente nella descrizione
    if (spot.description) {
      const artistInfo = this.extractArtistInfo(spot.description);
      if (artistInfo.artist) {
        terms.push(artistInfo.artist);
        
        // Combina artista + opera se disponibile
        if (artistInfo.artwork) {
          terms.push(`${artistInfo.artist} ${artistInfo.artwork}`);
        }
      }
      
      // Estrai periodo storico/movimento artistico
      const periodInfo = this.extractPeriodInfo(spot.description);
      if (periodInfo) {
        terms.push(periodInfo);
      }
      
      // Estrai parole chiave dalla descrizione
      const keywords = this.extractKeywords(spot.description);
      terms.push(...keywords.slice(0, 3)); // Prendi solo le prime 3 parole chiave
    }
    
    // Aggiungi la location se disponibile
    if (spot.location) {
      terms.push(spot.location);
    }
    
    // Filtra termini vuoti e duplicati
    const uniqueTerms = [...new Set(terms)]
      .filter(term => term && term.trim().length > 2)
      .slice(0, 5); // Limita a 5 termini per evitare troppe chiamate API
    
    console.log(`🔎 Extracted search terms for "${spot.name || spot.title}":`, uniqueTerms);
    
    return uniqueTerms;
  }

  // Funzione principale per arricchire gli spots OpenAI con immagini
  async enrichSpotsWithImages(aiGeneratedSpots, options = {}) {
    const { maxImagesPerSpot = 3, includeMuseums = ['met', 'aic'] } = options;
    
    const enrichedSpots = [];
    
    for (const spot of aiGeneratedSpots) {
      try {
        const enrichedSpot = await this.enrichSingleSpot(
          spot, 
          maxImagesPerSpot, 
          includeMuseums
        );
        enrichedSpots.push(enrichedSpot);
      } catch (error) {
        console.error(`Error enriching spot ${spot.name}:`, error);
        // Fallback: restituisce lo spot originale senza immagini
        enrichedSpots.push({
          ...spot,
          museumImages: [],
          imageEnrichmentStatus: 'failed',
          imageEnrichmentError: error.message
        });
      }
    }
    
    return enrichedSpots;
  }

  async enrichSingleSpot(spot, maxImages, includeMuseums) {
    // Estrai informazioni chiave dallo spot OpenAI
    const searchQueries = this.generateSearchQueries(spot);
    
    let allMatches = [];
    
    // Esegui ricerche per ogni query generata
    for (const query of searchQueries) {
      const museumResults = await this.museumApi.searchAllMuseums(query, {
        maxResults: 10,
        includeMuseums
      });
      
      // Calcola score di matching per ogni risultato
      const scoredResults = museumResults.map(artwork => ({
        ...artwork,
        matchScore: this.calculateMatchScore(spot, artwork),
        searchQuery: query
      }));
      
      allMatches = allMatches.concat(scoredResults);
    }
    
    // Filtra e ordina i risultati
    const validMatches = allMatches
      .filter(match => match.matchScore >= this.matchingConfig.minimumScore)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    // Rimuovi duplicati (stesso ID da stesso museo)
    const uniqueMatches = this.removeDuplicates(validMatches);
    
    // Seleziona le migliori immagini
    const selectedImages = uniqueMatches.slice(0, maxImages);
    
    return {
      ...spot,
      museumImages: selectedImages,
      imageEnrichmentStatus: selectedImages.length > 0 ? 'success' : 'no_matches',
      totalMatchesFound: uniqueMatches.length,
      searchQueriesUsed: searchQueries
    };
  }

  // Genera query di ricerca basate sui dati dello spot
  generateSearchQueries(spot) {
    const queries = [];
    
    // Query principale basata sul nome
    if (spot.name) {
      queries.push(spot.name);
    }
    
    // Estrai informazioni dall'artista se presente nella descrizione
    const artistInfo = this.extractArtistInfo(spot.description);
    if (artistInfo.artist) {
      queries.push(artistInfo.artist);
      
      // Combina artista + opera se disponibile
      if (artistInfo.artwork) {
        queries.push(`${artistInfo.artist} ${artistInfo.artwork}`);
      }
    }
    
    // Estrai periodo storico/movimento artistico
    const periodInfo = this.extractPeriodInfo(spot.description);
    if (periodInfo) {
      queries.push(periodInfo);
    }
    
    // Query basate su parole chiave nella descrizione
    const keywords = this.extractKeywords(spot.description);
    keywords.forEach(keyword => {
      if (keyword.length > 3) { // Evita parole troppo corte
        queries.push(keyword);
      }
    });
    
    // Limita il numero di query per evitare troppe chiamate API
    return queries.slice(0, 5);
  }

  // Estrae informazioni sull'artista dalla descrizione
  extractArtistInfo(description) {
    if (!description) return { artist: null, artwork: null };
    
    const artistPatterns = [
      /(?:di|by|opera di|work by|painted by|created by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:\([\d-]+\))?/g
    ];
    
    const artworkPatterns = [
      /"([^"]+)"/g, // Titoli tra virgolette
      /(?:opera|painting|sculpture|work)\s+"([^"]+)"/gi
    ];
    
    let artist = null;
    let artwork = null;
    
    // Cerca artista
    for (const pattern of artistPatterns) {
      const match = pattern.exec(description);
      if (match && match[1]) {
        artist = match[1].trim();
        break;
      }
    }
    
    // Cerca titolo opera
    for (const pattern of artworkPatterns) {
      const match = pattern.exec(description);
      if (match && match[1]) {
        artwork = match[1].trim();
        break;
      }
    }
    
    return { artist, artwork };
  }

  // Estrae informazioni sul periodo/movimento artistico
  extractPeriodInfo(description) {
    if (!description) return null;
    
    const periodPatterns = [
      /(?:rinascimento|renaissance)/gi,
      /(?:barocco|baroque)/gi,
      /(?:impressionism|impressionismo)/gi,
      /(?:post-impressionism|post-impressionismo)/gi,
      /(?:cubism|cubismo)/gi,
      /(?:surrealism|surrealismo)/gi,
      /(?:romanticism|romanticismo)/gi,
      /(?:neoclassicism|neoclassicismo)/gi,
      /(?:medieval|medievale)/gi,
      /(?:modern art|arte moderna)/gi,
      /(?:contemporary art|arte contemporanea)/gi
    ];
    
    for (const pattern of periodPatterns) {
      const match = pattern.exec(description);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  // Estrae parole chiave rilevanti
  extractKeywords(description) {
    if (!description) return [];
    
    // Rimuovi parole comuni e estrai sostantivi significativi
    const stopWords = new Set([
      'il', 'la', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
      'the', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'è', 'sono', 'was', 'were', 'is', 'are', 'this', 'that', 'these', 'those',
      'una', 'uno', 'del', 'della', 'dei', 'delle', 'nel', 'nella', 'nei', 'nelle'
    ]);
    
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Restituisce le parole più frequenti
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  // Calcola score di matching tra spot e artwork
  calculateMatchScore(spot, artwork) {
    let score = 0;
    const config = this.matchingConfig;
    
    // Score basato sul titolo
    if (spot.name && artwork.title) {
      const titleSimilarity = this.calculateStringSimilarity(
        spot.name.toLowerCase(),
        artwork.title.toLowerCase()
      );
      score += titleSimilarity * config.titleWeight;
    }
    
    // Score basato sull'artista
    const spotArtist = this.extractArtistInfo(spot.description || '').artist;
    if (spotArtist && artwork.artist) {
      const artistSimilarity = this.calculateStringSimilarity(
        spotArtist.toLowerCase(),
        artwork.artist.toLowerCase()
      );
      score += artistSimilarity * config.artistWeight;
    }
    
    // Score basato sul periodo
    const spotPeriod = this.extractPeriodInfo(spot.description || '');
    if (spotPeriod && (artwork.period || artwork.style)) {
      const periodText = (artwork.period || artwork.style || '').toLowerCase();
      if (periodText.includes(spotPeriod.toLowerCase())) {
        score += config.periodWeight;
      }
    }
    
    // Score basato sul medium/tecnica
    if (artwork.medium && spot.description) {
      const mediumKeywords = ['painting', 'sculpture', 'drawing', 'print', 'photograph'];
      const mediumLower = artwork.medium.toLowerCase();
      const descriptionLower = spot.description.toLowerCase();
      
      for (const keyword of mediumKeywords) {
        if (mediumLower.includes(keyword) && descriptionLower.includes(keyword)) {
          score += config.mediumWeight;
          break;
        }
      }
    }
    
    // Score basato su parole chiave
    const spotKeywords = this.extractKeywords(spot.description || '');
    const artworkText = `${artwork.title} ${artwork.artist} ${artwork.medium || ''} ${(artwork.tags || []).join(' ')}`.toLowerCase();
    
    let keywordMatches = 0;
    spotKeywords.forEach(keyword => {
      if (artworkText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
    
    if (spotKeywords.length > 0) {
      score += (keywordMatches / spotKeywords.length) * config.keywordWeight;
    }
    
    // Bonus per immagini di alta qualità
    if (artwork.primaryImage && artwork.isPublicDomain) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Normalizza tra 0 e 1
  }

  // Calcola similarità tra stringhe usando algoritmo di Levenshtein semplificato
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Calcola distanza di edit semplificata
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Rimuove duplicati basati su source + id
  removeDuplicates(matches) {
    const seen = new Set();
    return matches.filter(match => {
      const key = `${match.source}-${match.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Metodo per testare il matching su un singolo spot
  async testMatching(spot, options = {}) {
    console.log('Testing image matching for spot:', spot.name);
    
    const result = await this.enrichSingleSpot(spot, 5, ['met', 'aic']);
    
    console.log('Search queries used:', result.searchQueriesUsed);
    console.log('Total matches found:', result.totalMatchesFound);
    console.log('Selected images:', result.museumImages.length);
    
    result.museumImages.forEach((image, index) => {
      console.log(`Image ${index + 1}:`, {
        source: image.source,
        title: image.title,
        artist: image.artist,
        score: image.matchScore,
        query: image.searchQuery
      });
    });
    
    return result;
  }
}

export default ImageMatchingService;

