// Google Places Service - Servizio per ricerca luoghi e monumenti con foto reali
import axios from 'axios';

class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.cacheMemory = new Map();
  }

  /**
   * Cerca luoghi specifici con Google Places API
   * @param {string} query - Nome del luogo da cercare
   * @param {string} location - Località (città)
   * @param {string} type - Tipo di luogo (default: 'tourist_attraction')
   * @returns {Promise<Array>} - Array di luoghi con foto
   */
  async searchPlaces(query, location, type = 'tourist_attraction') {
    try {
      // Usa la cache in memoria se disponibile
      const cacheKey = `${query}_${location}_${type}`.toLowerCase();
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`💾 Places cache hit for: ${query}`);
        return this.cacheMemory.get(cacheKey);
      }

      console.log(`🌍 Searching Google Places for: "${query}" in ${location}`);
      
      // Verifica che la chiave API sia configurata
      if (!this.apiKey) {
        console.error('❌ Google Places API key not configured');
        return [];
      }
      
      // 1. Prima trova il Place ID con una ricerca testuale
      const findResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `${query} ${location}`,
          type: type,
          key: this.apiKey
        },
        timeout: 3000
      });
      
      if (!findResponse.data.results || findResponse.data.results.length === 0) {
        console.log(`ℹ️ No Places found for: ${query}`);
        this.cacheMemory.set(cacheKey, []);
        return [];
      }
      
      // Prendi i primi 3 risultati
      const places = findResponse.data.results.slice(0, 3);
      
      // 2. Per ogni luogo, ottieni i dettagli completi con le foto
      const detailedPlaces = await Promise.all(places.map(async place => {
        try {
          // Ottieni dettagli completi incluse le foto
          const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
              place_id: place.place_id,
              fields: 'name,photos,formatted_address,url,website',
              key: this.apiKey
            },
            timeout: 3000
          });
          
          const details = detailsResponse.data.result;
          
          // Se ci sono foto, ottieni le URL delle foto
          let photoUrls = [];
          if (details.photos && details.photos.length > 0) {
            // Prendi fino a 3 foto
            photoUrls = details.photos.slice(0, 3).map(photo => {
              return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
            });
          }
          
          return {
            name: place.name,
            address: place.formatted_address,
            location: place.geometry.location,
            photos: photoUrls,
            url: details.url || '',
            website: details.website || ''
          };
        } catch (error) {
          console.error(`Error getting details for place ${place.name}: ${error.message}`);
          return {
            name: place.name,
            address: place.formatted_address,
            location: place.geometry.location,
            photos: [],
            url: '',
            website: ''
          };
        }
      }));
      
      // Filtra i luoghi senza foto
      const placesWithPhotos = detailedPlaces.filter(place => place.photos.length > 0);
      
      console.log(`✅ Found ${placesWithPhotos.length} places with photos for "${query}"`);
      
      // Salva in cache
      this.cacheMemory.set(cacheKey, placesWithPhotos);
      return placesWithPhotos;
    } catch (error) {
      console.error(`❌ Google Places error for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Converte i risultati di Google Places nel formato compatibile con le API museali
   * @param {Array} places - Array di luoghi con foto
   * @returns {Array} - Array di risultati nel formato museale
   */
  convertToMuseumFormat(places) {
    return places.flatMap(place => {
      // Crea un elemento per ogni foto
      return place.photos.map((photoUrl, index) => ({
        source: 'google_places',
        title: place.name,
        artist: '',
        primaryImage: photoUrl,
        primaryImageSmall: photoUrl,
        objectURL: place.url || place.website || '',
        repository: 'Google Places',
        matchScore: 0.9,
        exactMatch: true,
        isExternalLocation: true,
        address: place.address
      }));
    });
  }

  /**
   * Pulisce la cache in memoria
   */
  clearCache() {
    this.cacheMemory.clear();
    console.log('🧹 Places cache cleared');
  }

  /**
   * Verifica lo stato dell'API
   * @returns {Promise<Object>} - Stato dell'API
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return {
          status: 'not_configured',
          message: 'API key not configured'
        };
      }
      
      // Esegui una ricerca di test
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'Colosseum Rome',
          key: this.apiKey
        },
        timeout: 2000
      });
      
      if (response.status === 200 && response.data.status === 'OK') {
        return {
          status: 'healthy',
          message: 'API is responding correctly'
        };
      } else {
        return {
          status: 'degraded',
          message: `API returned status ${response.data.status}`
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

export default GooglePlacesService;

