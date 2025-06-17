// Enhanced Spot Controller - Integrazione con il sistema di arricchimento immagini
// Questo file estende il controller esistente senza breaking changes

import ImageMatchingService from './imageMatchingService.js';

class EnhancedSpotController {
  constructor() {
    this.imageMatchingService = new ImageMatchingService();
    
    // Configurazione per l'arricchimento immagini
    this.enrichmentConfig = {
      enabled: true,
      maxImagesPerSpot: 3,
      includeMuseums: ['met', 'aic'],
      timeout: 10000, // 10 secondi timeout
      fallbackOnError: true
    };
  }

  // Metodo principale che estende la funzionalità esistente
  async getEnrichedSpots(req, res) {
    try {
      const { query, coordinates, filters = {} } = req.body;
      
      // 1. Ottieni spots da OpenAI (usando la logica esistente)
      const aiGeneratedSpots = await this.getAiGeneratedSpots(query, coordinates, filters);
      
      // 2. Arricchisci con immagini se abilitato
      let enrichedSpots = aiGeneratedSpots;
      
      if (this.enrichmentConfig.enabled) {
        try {
          enrichedSpots = await this.enrichSpotsWithMuseumImages(
            aiGeneratedSpots,
            this.enrichmentConfig
          );
        } catch (enrichmentError) {
          console.error('Image enrichment failed:', enrichmentError);
          
          if (this.enrichmentConfig.fallbackOnError) {
            // Fallback: restituisce spots originali con flag di errore
            enrichedSpots = aiGeneratedSpots.map(spot => ({
              ...spot,
              museumImages: [],
              imageEnrichmentStatus: 'failed',
              imageEnrichmentError: enrichmentError.message
            }));
          } else {
            throw enrichmentError;
          }
        }
      }
      
      // 3. Combina con UGC dal database locale (logica esistente)
      const ugcSpots = await this.getUgcSpots(query, coordinates, filters);
      
      // 4. Unifica e ordina i risultati
      const allSpots = this.combineAndRankSpots(enrichedSpots, ugcSpots);
      
      res.json({
        success: true,
        spots: allSpots,
        metadata: {
          aiGenerated: enrichedSpots.length,
          ugc: ugcSpots.length,
          total: allSpots.length,
          imageEnrichmentEnabled: this.enrichmentConfig.enabled,
          enrichmentStats: this.calculateEnrichmentStats(enrichedSpots)
        }
      });
      
    } catch (error) {
      console.error('Enhanced spots retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve enhanced spots',
        details: error.message
      });
    }
  }

  // Arricchisce gli spots con immagini dai musei
  async enrichSpotsWithMuseumImages(aiGeneratedSpots, config) {
    const startTime = Date.now();
    
    try {
      // Usa Promise.race per implementare timeout
      const enrichmentPromise = this.imageMatchingService.enrichSpotsWithImages(
        aiGeneratedSpots,
        {
          maxImagesPerSpot: config.maxImagesPerSpot,
          includeMuseums: config.includeMuseums
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Image enrichment timeout')), config.timeout);
      });
      
      const enrichedSpots = await Promise.race([enrichmentPromise, timeoutPromise]);
      
      const endTime = Date.now();
      console.log(`Image enrichment completed in ${endTime - startTime}ms`);
      
      return enrichedSpots;
      
    } catch (error) {
      console.error('Image enrichment error:', error);
      throw error;
    }
  }

  // Placeholder per la logica OpenAI esistente
  async getAiGeneratedSpots(query, coordinates, filters) {
    // Questa funzione dovrebbe chiamare la logica OpenAI esistente
    // Per ora restituisce un esempio di struttura
    
    // NOTA: Sostituire con la chiamata reale al servizio OpenAI esistente
    console.log('Calling OpenAI service with:', { query, coordinates, filters });
    
    // Esempio di struttura spot OpenAI
    return [
      {
        id: 'ai_1',
        name: 'Museo del Louvre - Gioconda',
        description: 'La famosa Gioconda di Leonardo da Vinci, capolavoro del Rinascimento italiano conservato al Louvre di Parigi.',
        coordinates: { lat: 48.8606, lng: 2.3376 },
        category: 'museum',
        mood: 'contemplativo',
        source: 'openai',
        address: 'Rue de Rivoli, 75001 Paris, France',
        openingHours: '9:00-18:00',
        price: '€17',
        website: 'https://www.louvre.fr'
      },
      {
        id: 'ai_2',
        name: 'Galleria degli Uffizi - Nascita di Venere',
        description: 'La Nascita di Venere di Sandro Botticelli, uno dei dipinti più celebri del Rinascimento fiorentino.',
        coordinates: { lat: 43.7687, lng: 11.2569 },
        category: 'museum',
        mood: 'romantico',
        source: 'openai',
        address: 'Piazzale degli Uffizi, 6, 50122 Firenze FI, Italy',
        openingHours: '8:15-18:50',
        price: '€20',
        website: 'https://www.uffizi.it'
      }
    ];
  }

  // Placeholder per la logica UGC esistente
  async getUgcSpots(query, coordinates, filters) {
    // Questa funzione dovrebbe chiamare la logica database esistente
    console.log('Retrieving UGC spots with:', { query, coordinates, filters });
    
    // Per ora restituisce array vuoto
    return [];
  }

  // Combina e ordina spots AI e UGC
  combineAndRankSpots(aiSpots, ugcSpots) {
    const allSpots = [...aiSpots, ...ugcSpots];
    
    // Ordinamento semplice: prima spots con immagini, poi per rilevanza
    return allSpots.sort((a, b) => {
      // Priorità per spots con immagini museali
      const aHasImages = a.museumImages && a.museumImages.length > 0;
      const bHasImages = b.museumImages && b.museumImages.length > 0;
      
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      
      // Ordinamento secondario per fonte (AI prima di UGC)
      if (a.source === 'openai' && b.source !== 'openai') return -1;
      if (a.source !== 'openai' && b.source === 'openai') return 1;
      
      return 0;
    });
  }

  // Calcola statistiche di arricchimento
  calculateEnrichmentStats(enrichedSpots) {
    const stats = {
      totalSpots: enrichedSpots.length,
      spotsWithImages: 0,
      spotsWithoutImages: 0,
      totalImages: 0,
      averageImagesPerSpot: 0,
      sourceBreakdown: {},
      enrichmentErrors: 0
    };
    
    enrichedSpots.forEach(spot => {
      if (spot.museumImages && spot.museumImages.length > 0) {
        stats.spotsWithImages++;
        stats.totalImages += spot.museumImages.length;
        
        // Conta per fonte
        spot.museumImages.forEach(image => {
          stats.sourceBreakdown[image.source] = 
            (stats.sourceBreakdown[image.source] || 0) + 1;
        });
      } else {
        stats.spotsWithoutImages++;
      }
      
      if (spot.imageEnrichmentStatus === 'failed') {
        stats.enrichmentErrors++;
      }
    });
    
    if (stats.spotsWithImages > 0) {
      stats.averageImagesPerSpot = stats.totalImages / stats.spotsWithImages;
    }
    
    return stats;
  }

  // Endpoint per testare l'arricchimento su un singolo spot
  async testSpotEnrichment(req, res) {
    try {
      const { spot } = req.body;
      
      if (!spot) {
        return res.status(400).json({
          success: false,
          error: 'Spot data required'
        });
      }
      
      const result = await this.imageMatchingService.testMatching(spot);
      
      res.json({
        success: true,
        result
      });
      
    } catch (error) {
      console.error('Test enrichment error:', error);
      res.status(500).json({
        success: false,
        error: 'Test enrichment failed',
        details: error.message
      });
    }
  }

  // Endpoint per configurare l'arricchimento
  async updateEnrichmentConfig(req, res) {
    try {
      const { config } = req.body;
      
      // Valida configurazione
      if (typeof config.enabled !== 'undefined') {
        this.enrichmentConfig.enabled = Boolean(config.enabled);
      }
      
      if (config.maxImagesPerSpot && config.maxImagesPerSpot > 0) {
        this.enrichmentConfig.maxImagesPerSpot = Math.min(config.maxImagesPerSpot, 10);
      }
      
      if (config.includeMuseums && Array.isArray(config.includeMuseums)) {
        const validMuseums = ['met', 'aic', 'rijks'];
        this.enrichmentConfig.includeMuseums = config.includeMuseums.filter(
          museum => validMuseums.includes(museum)
        );
      }
      
      if (config.timeout && config.timeout > 0) {
        this.enrichmentConfig.timeout = Math.min(config.timeout, 30000); // Max 30 secondi
      }
      
      res.json({
        success: true,
        config: this.enrichmentConfig
      });
      
    } catch (error) {
      console.error('Config update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
        details: error.message
      });
    }
  }

  // Endpoint per health check delle API museali
  async checkMuseumApiHealth(req, res) {
    try {
      const healthStatus = await this.imageMatchingService.museumApi.healthCheck();
      
      res.json({
        success: true,
        healthStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        details: error.message
      });
    }
  }
}

export default EnhancedSpotController;

