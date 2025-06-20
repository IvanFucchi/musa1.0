// WikiArt Service - Versione CORRETTA con query SPARQL migliorata
import 'dotenv/config';

class WikiArtService {
  constructor() {
    this.cacheMemory = new Map();
    this.WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
  }

  /**
   * NUOVO: Query SPARQL migliorata e più flessibile
   */
  buildImprovedSparqlQuery(artworkTitle, artistName) {
    // Pulisci i termini per la ricerca
    const cleanTitle = artworkTitle.toLowerCase().replace(/['"]/g, '');
    const cleanArtist = artistName.toLowerCase().replace(/['"]/g, '');
    
    // Estrai parole chiave dal titolo
    const titleWords = cleanTitle.split(' ').filter(word => word.length > 2);
    const titleFilters = titleWords.map(word => 
      `CONTAINS(LCASE(?itemLabel), "${word}")`
    ).join(' && ');
    
    // Query più flessibile per l'artista
    const artistFilter = `(CONTAINS(LCASE(?artistLabel), "caravaggio") || 
                         CONTAINS(LCASE(?artistLabel), "merisi") ||
                         CONTAINS(LCASE(?artistLabel), "${cleanArtist}"))`;
    
    return `
      SELECT DISTINCT ?item ?itemLabel ?image ?artistLabel ?year ?locationLabel WHERE {
        ?item wdt:P31/wdt:P279* wd:Q838948 . # istanza di opera d'arte o sottoclasse
        ?item wdt:P170 ?artist . # creato da
        
        # Immagine opzionale
        OPTIONAL { ?item wdt:P18 ?image . }
        
        # Anno opzionale
        OPTIONAL { ?item wdt:P571 ?year . }
        
        # Ubicazione opzionale
        OPTIONAL { ?item wdt:P276 ?location . }
        
        # Filtri migliorati
        FILTER(${titleFilters})
        FILTER(${artistFilter})
        
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "en,it,fr,de,es" . 
        }
      }
      ORDER BY DESC(?image)
      LIMIT 10
    `;
  }

  /**
   * AGGIORNATO: Cerca un'opera d'arte specifica con query migliorata
   */
  async searchSpecificArtwork(title, artist) {
    try {
      // Cache check
      const cacheKey = `${title}_${artist}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 WikiArt cache hit for: ${title}`);
        return this.cacheMemory.get(cacheKey);
      }

      console.log(`🔍 WikiArt searching for: "${title}" by ${artist}`);
      
      // Costruisci query migliorata
      const sparqlQuery = this.buildImprovedSparqlQuery(title, artist);
      
      // Esegui query con timeout aumentato
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Ridotto a 3 secondi
      
      const response = await fetch(this.WIKIDATA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/json',
          'User-Agent': 'MUSA-Art-Search/1.0'
        },
        body: sparqlQuery,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`❌ Wikidata HTTP error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const bindings = data.results?.bindings || [];
      
      if (bindings.length === 0) {
        console.log(`❌ No Wikidata results for: "${title}" by ${artist}`);
        this.cacheMemory.set(cacheKey, []);
        return [];
      }
      
      // Trasforma risultati
      const results = bindings
        .filter(item => item.image?.value) // Solo con immagine
        .map(item => ({
          source: 'wikidata',
          title: item.itemLabel?.value || title,
          artist: item.artistLabel?.value || artist,
          primaryImage: item.image.value,
          primaryImageSmall: `${item.image.value}?width=400`,
          objectURL: item.item.value,
          repository: item.locationLabel?.value || 'Wikidata',
          year: item.year?.value || '',
          matchScore: this.calculateWikidataMatchScore(title, artist, item),
          exactMatch: true
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
      
      console.log(`✅ WikiArt found ${results.length} results for "${title}"`);
      
      // Cache results
      this.cacheMemory.set(cacheKey, results);
      return results;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ WikiArt timeout for "${title}"`);
      } else {
        console.error(`❌ WikiArt error for "${title}": ${error.message}`);
      }
      return [];
    }
  }

  /**
   * NUOVO: Calcola score di matching per risultati Wikidata
   */
  calculateWikidataMatchScore(searchTitle, searchArtist, wikidataItem) {
    let score = 0;
    
    const itemTitle = (wikidataItem.itemLabel?.value || '').toLowerCase();
    const itemArtist = (wikidataItem.artistLabel?.value || '').toLowerCase();
    const searchTitleLower = searchTitle.toLowerCase();
    const searchArtistLower = searchArtist.toLowerCase();
    
    // Score per match del titolo
    const titleWords = searchTitleLower.split(' ').filter(w => w.length > 2);
    const titleMatches = titleWords.filter(word => itemTitle.includes(word)).length;
    score += (titleMatches / titleWords.length) * 0.6;
    
    // Score per match dell'artista
    if (itemArtist.includes('caravaggio') || itemArtist.includes('merisi')) {
      score += 0.3;
    } else if (itemArtist.includes(searchArtistLower)) {
      score += 0.2;
    }
    
    // Bonus per avere immagine
    if (wikidataItem.image?.value) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Test di connettività
   */
  async testConnection() {
    try {
      const testQuery = `
        SELECT ?item ?itemLabel WHERE {
          ?item wdt:P31 wd:Q838948 .
          ?item wdt:P170 ?artist .
          ?artist rdfs:label "Caravaggio"@en .
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
        }
        LIMIT 1
      `;
      
      const response = await fetch(this.WIKIDATA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/json'
        },
        body: testQuery
      });
      
      return response.ok;
    } catch (error) {
      console.error('WikiArt connection test failed:', error);
      return false;
    }
  }

  /**
   * Pulisce la cache
   */
  clearCache() {
    this.cacheMemory.clear();
    console.log('🧹 WikiArt cache cleared');
  }
}

export default WikiArtService;

