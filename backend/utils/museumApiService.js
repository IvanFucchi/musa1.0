// Museum API Service - Servizio unificato per gestire le API dei musei
import axios from 'axios';

class MuseumApiService {
  constructor() {
    this.apis = {
      met: {
        baseUrl: 'https://collectionapi.metmuseum.org/public/collection/v1',
        rateLimit: 80, // requests per second
        name: 'Metropolitan Museum'
      },
      aic: {
        baseUrl: 'https://api.artic.edu/api/v1',
        rateLimit: 50, // conservative estimate
        name: 'Art Institute of Chicago'
      },
      rijks: {
        baseUrl: 'https://data.rijksmuseum.nl/oai',
        rateLimit: 30, // conservative estimate
        name: 'Rijksmuseum'
      }
    };

    // Rate limiting tracking
    this.rateLimiters = {};
    this.initializeRateLimiters();
  }

  initializeRateLimiters() {
    Object.keys(this.apis).forEach(apiKey => {
      this.rateLimiters[apiKey] = {
        requests: [],
        maxRequests: this.apis[apiKey].rateLimit,
        timeWindow: 1000 // 1 second
      };
    });
  }

  async checkRateLimit(apiKey) {
    const limiter = this.rateLimiters[apiKey];
    const now = Date.now();
    
    // Remove old requests outside time window
    limiter.requests = limiter.requests.filter(
      timestamp => now - timestamp < limiter.timeWindow
    );

    if (limiter.requests.length >= limiter.maxRequests) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limiter.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    limiter.requests.push(now);
  }

  // Metropolitan Museum API methods
  async searchMetMuseum(query) {
    await this.checkRateLimit('met');
    
    try {
      const searchUrl = `${this.apis.met.baseUrl}/search`;
      const params = {
        q: query,
        hasImages: true,
        isPublicDomain: true
      };

      const response = await axios.get(searchUrl, { 
        params,
        timeout: 5000 
      });

      if (response.data.objectIDs && response.data.objectIDs.length > 0) {
        // Get details for first few results
        const objectIds = response.data.objectIDs.slice(0, 5);
        const artworks = await Promise.all(
          objectIds.map(id => this.getMetMuseumObject(id))
        );
        
        return artworks.filter(artwork => artwork !== null);
      }

      return [];
    } catch (error) {
      console.error('Met Museum API error:', error.message);
      return [];
    }
  }

  async getMetMuseumObject(objectId) {
    await this.checkRateLimit('met');
    
    try {
      const objectUrl = `${this.apis.met.baseUrl}/objects/${objectId}`;
      const response = await axios.get(objectUrl, { timeout: 5000 });
      
      const artwork = response.data;
      
      // Return normalized artwork data
      return {
        source: 'met',
        id: artwork.objectID,
        title: artwork.title,
        artist: artwork.artistDisplayName,
        date: artwork.objectDate,
        medium: artwork.medium,
        culture: artwork.culture,
        period: artwork.period,
        department: artwork.department,
        primaryImage: artwork.primaryImage,
        primaryImageSmall: artwork.primaryImageSmall,
        additionalImages: artwork.additionalImages || [],
        isPublicDomain: artwork.isPublicDomain,
        objectURL: artwork.objectURL,
        repository: artwork.repository,
        dimensions: artwork.dimensions,
        creditLine: artwork.creditLine,
        tags: artwork.tags || []
      };
    } catch (error) {
      console.error(`Met Museum object ${objectId} error:`, error.message);
      return null;
    }
  }

  // Art Institute of Chicago API methods
  async searchArtInstituteChicago(query) {
    await this.checkRateLimit('aic');
    
    try {
      const searchUrl = `${this.apis.aic.baseUrl}/artworks/search`;
      const params = {
        q: query,
        limit: 5,
        fields: 'id,title,artist_display,date_display,medium_display,image_id,thumbnail,main_reference_number,artist_title,style_title,classification_title,subject_titles,material_titles,technique_titles,theme_titles,department_title,dimensions,credit_line,publication_history,exhibition_history,provenance_text,is_public_domain'
      };

      const response = await axios.get(searchUrl, { 
        params,
        timeout: 5000 
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data.map(artwork => ({
          source: 'aic',
          id: artwork.id,
          title: artwork.title,
          artist: artwork.artist_display,
          date: artwork.date_display,
          medium: artwork.medium_display,
          style: artwork.style_title,
          classification: artwork.classification_title,
          department: artwork.department_title,
          dimensions: artwork.dimensions,
          creditLine: artwork.credit_line,
          imageId: artwork.image_id,
          thumbnail: artwork.thumbnail,
          primaryImage: artwork.image_id ? 
            `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg` : null,
          primaryImageSmall: artwork.thumbnail?.lqip || null,
          isPublicDomain: artwork.is_public_domain,
          objectURL: `https://www.artic.edu/artworks/${artwork.id}`,
          repository: 'Art Institute of Chicago',
          subjects: artwork.subject_titles || [],
          materials: artwork.material_titles || [],
          techniques: artwork.technique_titles || [],
          themes: artwork.theme_titles || []
        }));
      }

      return [];
    } catch (error) {
      console.error('Art Institute Chicago API error:', error.message);
      return [];
    }
  }

  // Unified search across all museums
  async searchAllMuseums(query, options = {}) {
    const { maxResults = 10, includeMuseums = ['met', 'aic'] } = options;
    
    const searchPromises = [];
    
    if (includeMuseums.includes('met')) {
      searchPromises.push(
        this.searchMetMuseum(query).catch(error => {
          console.error('Met Museum search failed:', error);
          return [];
        })
      );
    }
    
    if (includeMuseums.includes('aic')) {
      searchPromises.push(
        this.searchArtInstituteChicago(query).catch(error => {
          console.error('AIC search failed:', error);
          return [];
        })
      );
    }

    try {
      const results = await Promise.all(searchPromises);
      const allArtworks = results.flat();
      
      // Sort by relevance (basic implementation)
      const sortedArtworks = this.sortByRelevance(allArtworks, query);
      
      return sortedArtworks.slice(0, maxResults);
    } catch (error) {
      console.error('Museum search error:', error);
      return [];
    }
  }

  // Basic relevance scoring
  sortByRelevance(artworks, query) {
    const queryLower = query.toLowerCase();
    
    return artworks.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Title match
      if (a.title && a.title.toLowerCase().includes(queryLower)) scoreA += 10;
      if (b.title && b.title.toLowerCase().includes(queryLower)) scoreB += 10;
      
      // Artist match
      if (a.artist && a.artist.toLowerCase().includes(queryLower)) scoreA += 8;
      if (b.artist && b.artist.toLowerCase().includes(queryLower)) scoreB += 8;
      
      // Has image bonus
      if (a.primaryImage) scoreA += 5;
      if (b.primaryImage) scoreB += 5;
      
      // Public domain bonus
      if (a.isPublicDomain) scoreA += 3;
      if (b.isPublicDomain) scoreB += 3;
      
      return scoreB - scoreA;
    });
  }

  // Health check for all APIs
  async healthCheck() {
    const results = {};
    
    for (const [key, api] of Object.entries(this.apis)) {
      try {
        const startTime = Date.now();
        await axios.get(api.baseUrl, { timeout: 3000 });
        const responseTime = Date.now() - startTime;
        
        results[key] = {
          status: 'healthy',
          responseTime,
          name: api.name
        };
      } catch (error) {
        results[key] = {
          status: 'unhealthy',
          error: error.message,
          name: api.name
        };
      }
    }
    
    return results;
  }
}

export default MuseumApiService;

