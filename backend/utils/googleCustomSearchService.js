// Google Custom Search Service - Servizio per ricerca immagini precise di opere d'arte
import axios from 'axios';

class GoogleCustomSearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_CSE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_CSE_ID;
    this.cacheMemory = new Map();
  }
  
  /**
   * Cerca un'opera d'arte specifica per titolo e artista
   * @param {string} title - Titolo dell'opera
   * @param {string} artist - Nome dell'artista
   * @returns {Promise<Array>} - Array di risultati
   */
  async searchSpecificArtwork(title, artist) {
    try {
      // Usa la cache in memoria se disponibile
      const cacheKey = `${title}_${artist}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 Google CSE cache hit for: ${title}`);
        return this.cacheMemory.get(cacheKey);
      }
      
      // Verifica che le chiavi API siano configurate
      if (!this.apiKey || !this.searchEngineId) {
        console.error('❌ Google CSE API key or Search Engine ID not configured');
        return [];
      }
      
      console.log(`🔍 Google CSE searching for: "${title}" by ${artist}`);
      
      // Costruisci la query di ricerca
      const query = `${title} ${artist} painting artwork`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          searchType: 'image',
          imgSize: 'large',
          imgType: 'photo',
          num: 3,
          safe: 'active'
        },
        timeout: 3000
      });
      
      if (response.data && response.data.items) {
        const results = response.data.items.map(item => ({
          source: 'google_cse',
          title: title,
          artist: artist,
          primaryImage: item.link,
          primaryImageSmall: item.image.thumbnailLink,
          objectURL: item.image.contextLink,
          repository: 'Google Images',
          matchScore: 0.9,
          exactMatch: true
        }));
        
        console.log(`✅ Google CSE found ${results.length} results for "${title}"`);
        
        // Salva in cache
        this.cacheMemory.set(cacheKey, results);
        return results;
      }
      
      console.log(`ℹ️ Google CSE no results for "${title}"`);
      this.cacheMemory.set(cacheKey, []);
      return [];
    } catch (error) {
      console.error(`❌ Google CSE error for "${title}": ${error.message}`);
      return [];
    }
  }
  
  /**
   * Cerca immagini di un luogo specifico
   * @param {string} placeName - Nome del luogo
   * @param {string} location - Località (città)
   * @returns {Promise<Array>} - Array di risultati
   */
  async searchPlace(placeName, location) {
    try {
      // Usa la cache in memoria se disponibile
      const cacheKey = `place_${placeName}_${location}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 Google CSE cache hit for place: ${placeName}`);
        return this.cacheMemory.get(cacheKey);
      }
      
      // Verifica che le chiavi API siano configurate
      if (!this.apiKey || !this.searchEngineId) {
        console.error('❌ Google CSE API key or Search Engine ID not configured');
        return [];
      }
      
      console.log(`🔍 Google CSE searching for place: "${placeName}" in ${location}`);
      
      // Costruisci la query di ricerca
      const query = `${placeName} ${location} architecture building`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          searchType: 'image',
          imgSize: 'large',
          imgType: 'photo',
          num: 3,
          safe: 'active'
        },
        timeout: 3000
      });
      
      if (response.data && response.data.items) {
        const results = response.data.items.map(item => ({
          source: 'google_cse',
          title: placeName,
          artist: '',
          primaryImage: item.link,
          primaryImageSmall: item.image.thumbnailLink,
          objectURL: item.image.contextLink,
          repository: 'Google Images',
          matchScore: 0.85,
          exactMatch: true
        }));
        
        console.log(`✅ Google CSE found ${results.length} results for place "${placeName}"`);
        
        // Salva in cache
        this.cacheMemory.set(cacheKey, results);
        return results;
      }
      
      console.log(`ℹ️ Google CSE no results for place "${placeName}"`);
      this.cacheMemory.set(cacheKey, []);
      return [];
    } catch (error) {
      console.error(`❌ Google CSE error for place "${placeName}": ${error.message}`);
      return [];
    }
  }
  
  /**
   * Pulisce la cache in memoria
   */
  clearCache() {
    this.cacheMemory.clear();
    console.log('🧹 Google CSE cache cleared');
  }
  
  /**
   * Verifica lo stato dell'API
   * @returns {Promise<Object>} - Stato dell'API
   */
  async healthCheck() {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        return {
          status: 'not_configured',
          message: 'API key or Search Engine ID not configured'
        };
      }
      
      // Esegui una ricerca di test
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: 'test',
          num: 1
        },
        timeout: 2000
      });
      
      if (response.status === 200) {
        return {
          status: 'healthy',
          message: 'API is responding correctly'
        };
      } else {
        return {
          status: 'degraded',
          message: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

export default GoogleCustomSearchService;

