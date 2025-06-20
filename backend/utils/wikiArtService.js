// WikiArt Service - Servizio per ricerca opere d'arte specifiche su Wikidata
import axios from 'axios';

class WikiArtService {
  constructor() {
    this.cacheMemory = new Map();
  }

  /**
   * Cerca un'opera d'arte specifica per titolo e artista
   * @param {string} title - Titolo esatto dell'opera
   * @param {string} artist - Nome dell'artista
   * @returns {Promise<Array>} - Array di risultati
   */
  async searchSpecificArtwork(title, artist) {
    try {
      // Usa la cache in memoria se disponibile
      const cacheKey = `${title}_${artist}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 WikiArt cache hit for: ${title}`);
        return this.cacheMemory.get(cacheKey);
      }

      console.log(`🔍 WikiArt searching for: "${title}" by ${artist}`);
      
      // Pulisci i termini di ricerca
      const cleanTitle = title.replace(/"/g, '').trim();
      const cleanArtist = artist.replace(/"/g, '').trim();
      
      // Query SPARQL per Wikidata
      const query = `
        SELECT ?item ?itemLabel ?image ?artistLabel WHERE {
          ?item wdt:P31 wd:Q838948 . # istanza di "opera d'arte"
          ?item rdfs:label ?itemLabel .
          ?item wdt:P170 ?artist . # creato da
          ?artist rdfs:label ?artistLabel .
          OPTIONAL { ?item wdt:P18 ?image . } # immagine
          
          FILTER(CONTAINS(LCASE(?itemLabel), LCASE("${cleanTitle}")))
          FILTER(CONTAINS(LCASE(?artistLabel), LCASE("${cleanArtist}")))
          FILTER(LANG(?itemLabel) = "it" || LANG(?itemLabel) = "en")
          FILTER(LANG(?artistLabel) = "it" || LANG(?artistLabel) = "en")
        }
        LIMIT 5
      `;
      
      const response = await axios.get('https://query.wikidata.org/sparql', {
        params: {
          query,
          format: 'json'
        },
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'MUSA-ArtApp/1.0'
        },
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.bindings) {
        const results = response.data.results.bindings
          .filter(item => item.image) // Solo risultati con immagine
          .map(item => ({
            source: 'wikidata',
            title: item.itemLabel?.value || title,
            artist: item.artistLabel?.value || artist,
            primaryImage: item.image.value,
            primaryImageSmall: item.image.value,
            objectURL: item.item.value,
            repository: 'Wikidata',
            matchScore: 0.95,
            exactMatch: true
          }));
        
        console.log(`✅ WikiArt found ${results.length} results for "${title}"`);
        
        // Salva in cache
        this.cacheMemory.set(cacheKey, results);
        return results;
      }
      
      console.log(`ℹ️ WikiArt no results for "${title}"`);
      this.cacheMemory.set(cacheKey, []);
      return [];
    } catch (error) {
      console.error(`❌ WikiArt error for "${title}": ${error.message}`);
      return [];
    }
  }

  /**
   * Cerca opere d'arte per artista
   * @param {string} artist - Nome dell'artista
   * @returns {Promise<Array>} - Array di risultati
   */
  async searchArtistWorks(artist) {
    try {
      // Usa la cache in memoria se disponibile
      const cacheKey = `artist_${artist}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 WikiArt cache hit for artist: ${artist}`);
        return this.cacheMemory.get(cacheKey);
      }

      console.log(`🔍 WikiArt searching works by artist: ${artist}`);
      
      // Pulisci i termini di ricerca
      const cleanArtist = artist.replace(/"/g, '').trim();
      
      // Query SPARQL per Wikidata
      const query = `
        SELECT ?item ?itemLabel ?image ?artistLabel WHERE {
          ?item wdt:P31 wd:Q838948 . # istanza di "opera d'arte"
          ?item rdfs:label ?itemLabel .
          ?item wdt:P170 ?artist . # creato da
          ?artist rdfs:label ?artistLabel .
          ?item wdt:P18 ?image . # immagine (solo opere con immagine)
          
          FILTER(CONTAINS(LCASE(?artistLabel), LCASE("${cleanArtist}")))
          FILTER(LANG(?itemLabel) = "it" || LANG(?itemLabel) = "en")
          FILTER(LANG(?artistLabel) = "it" || LANG(?artistLabel) = "en")
        }
        LIMIT 10
      `;
      
      const response = await axios.get('https://query.wikidata.org/sparql', {
        params: {
          query,
          format: 'json'
        },
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'MUSA-ArtApp/1.0'
        },
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.bindings) {
        const results = response.data.results.bindings
          .filter(item => item.image) // Solo risultati con immagine
          .map(item => ({
            source: 'wikidata',
            title: item.itemLabel?.value || '',
            artist: item.artistLabel?.value || artist,
            primaryImage: item.image.value,
            primaryImageSmall: item.image.value,
            objectURL: item.item.value,
            repository: 'Wikidata',
            matchScore: 0.9,
            exactMatch: false
          }));
        
        console.log(`✅ WikiArt found ${results.length} works by artist "${artist}"`);
        
        // Salva in cache
        this.cacheMemory.set(cacheKey, results);
        return results;
      }
      
      console.log(`ℹ️ WikiArt no results for artist "${artist}"`);
      this.cacheMemory.set(cacheKey, []);
      return [];
    } catch (error) {
      console.error(`❌ WikiArt error for artist "${artist}": ${error.message}`);
      return [];
    }
  }

  /**
   * Pulisce la cache in memoria
   */
  clearCache() {
    this.cacheMemory.clear();
    console.log('🧹 WikiArt cache cleared');
  }
}

export default WikiArtService;

