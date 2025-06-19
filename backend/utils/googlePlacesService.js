// Google Places Service - Servizio per ottenere immagini di monumenti esterni
import axios from 'axios';

class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.cacheMemory = new Map(); // Cache in memoria per richieste frequenti
  }
  
  /**
   * Cerca luoghi con Google Places API
   * @param {string} query - Query di ricerca (es. "Colosseo")
   * @param {string} location - Coordinate "lat,lng" o nome luogo
   * @param {string} type - Tipo di luogo (default: 'tourist_attraction')
   * @returns {Promise<Array>} - Array di luoghi con dettagli e foto
   */
  async searchPlaces(query, location, type = 'tourist_attraction') {
    try {
      console.log(`🌍 Google Places: cercando "${query}" vicino a ${location}`);
      
      // Controlla cache
      const cacheKey = `${query}_${location}_${type}`;
      if (this.cacheMemory.has(cacheKey)) {
        console.log(`🌍 Google Places: risultati in cache per "${query}"`);
        return this.cacheMemory.get(cacheKey);
      }
      
      // Cerca luoghi con Google Places API
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: query,
          location: location, // "lat,lng" o nome luogo
          radius: 5000,
          type: type,
          key: this.apiKey
        },
        timeout: 3000 // Timeout di 3 secondi
      });
      
      if (response.data.status !== 'OK') {
        console.error(`🌍 Google Places API error: ${response.data.status}`);
        return [];
      }
      
      // Ottieni dettagli e foto per ogni luogo
      const places = response.data.results;
      console.log(`🌍 Google Places: trovati ${places.length} luoghi per "${query}"`);
      
      // Limita a 3 luoghi per performance
      const detailedPlaces = await Promise.all(
        places.slice(0, 3).map(place => this.getPlaceDetails(place.place_id))
      );
      
      const validPlaces = detailedPlaces.filter(place => place !== null);
      
      // Salva in cache
      this.cacheMemory.set(cacheKey, validPlaces);
      
      return validPlaces;
    } catch (error) {
      console.error('🌍 Google Places API error:', error.message);
      return [];
    }
  }
  
  /**
   * Ottiene dettagli di un luogo specifico
   * @param {string} placeId - ID del luogo Google Places
   * @returns {Promise<Object|null>} - Dettagli del luogo con foto
   */
  async getPlaceDetails(placeId) {
    try {
      // Controlla cache
      const cacheKey = `place_${placeId}`;
      if (this.cacheMemory.has(cacheKey)) {
        return this.cacheMemory.get(cacheKey);
      }
      
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,photos,types,rating,url',
          key: this.apiKey
        },
        timeout: 2000 // Timeout di 2 secondi
      });
      
      if (response.data.status !== 'OK') {
        return null;
      }
      
      const place = response.data.result;
      
      // Ottieni URL foto
      const photoUrls = place.photos 
        ? place.photos.slice(0, 3).map(photo => this.getPhotoUrl(photo.photo_reference))
        : [];
      
      const placeDetails = {
        name: place.name,
        address: place.formatted_address,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        types: place.types,
        rating: place.rating,
        url: place.url,
        photos: photoUrls
      };
      
      // Salva in cache
      this.cacheMemory.set(cacheKey, placeDetails);
      
      return placeDetails;
    } catch (error) {
      console.error('🌍 Error getting place details:', error.message);
      return null;
    }
  }
  
  /**
   * Genera URL per foto di un luogo
   * @param {string} photoReference - Riferimento foto Google Places
   * @param {number} maxWidth - Larghezza massima immagine
   * @returns {string} - URL della foto
   */
  getPhotoUrl(photoReference, maxWidth = 800) {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
  
  /**
   * Converte risultati Google Places nel formato museumImages
   * @param {Array} placesResults - Risultati da Google Places
   * @returns {Array} - Array formattato per museumImages
   */
  convertToMuseumFormat(placesResults) {
    return placesResults.flatMap(place => 
      place.photos.map(photoUrl => ({
        source: 'google_places',
        id: `gp_${Math.random().toString(36).substring(2, 10)}`,
        title: place.name,
        artist: '',
        date: '',
        medium: 'photograph',
        primaryImage: photoUrl,
        primaryImageSmall: photoUrl,
        objectURL: place.url,
        repository: 'Google Places',
        matchScore: 0.9,
        location: place.location
      }))
    );
  }
  
  /**
   * Verifica lo stato dell'API
   * @returns {Promise<Object>} - Stato dell'API
   */
  async healthCheck() {
    try {
      // Test semplice con una query nota
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: 'Colosseum Rome',
          key: this.apiKey
        },
        timeout: 2000
      });
      
      return {
        status: response.data.status === 'OK' ? 'healthy' : 'degraded',
        message: response.data.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Pulisce la cache in memoria
   */
  clearCache() {
    this.cacheMemory.clear();
    console.log('🌍 Google Places: cache pulita');
  }
}

export default GooglePlacesService;

