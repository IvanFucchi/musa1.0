// Cache Service - Gestione intelligente cache museo con MongoDB
import MuseumCache from '../models/MuseumCache.js';

class MuseumCacheService {
  constructor() {
    this.memoryCache = new Map(); // Cache in memoria per hit ultra-rapidi
    this.maxMemorySize = 100;     // Max 100 entries in memoria
    this.memoryTTL = 300000;      // 5 minuti TTL memoria
    
    // Statistiche runtime
    this.stats = {
      memoryHits: 0,
      dbHits: 0,
      misses: 0,
      saves: 0,
      errors: 0
    };
  }

  // Cerca nei cache (memoria → database → null)
  async getCachedResults(searchTerms, originalQuery) {
    try {
      const searchKey = MuseumCache.generateSearchKey(searchTerms);
      
      // 1. Check cache memoria (ultra-veloce)
      const memoryResult = this.getFromMemory(searchKey);
      if (memoryResult) {
        this.stats.memoryHits++;
        console.log(`💨 Memory cache hit for: ${originalQuery}`);
        return {
          results: memoryResult.results,
          metadata: memoryResult.metadata,
          cacheType: 'memory',
          age: Date.now() - memoryResult.timestamp
        };
      }
      
      // 2. Check cache database
      const dbResult = await MuseumCache.findBySearchTerms(searchTerms);
      if (dbResult) {
        // Incrementa hit counter
        await dbResult.incrementHit();
        
        // Salva in memoria per prossimi accessi
        this.setInMemory(searchKey, {
          results: dbResult.results,
          metadata: dbResult.metadata,
          timestamp: Date.now()
        });
        
        this.stats.dbHits++;
        console.log(`🗄️ Database cache hit for: ${originalQuery} (${dbResult.hitCount} hits)`);
        
        return {
          results: dbResult.results,
          metadata: dbResult.metadata,
          cacheType: 'database',
          age: Date.now() - dbResult.createdAt.getTime(),
          hitCount: dbResult.hitCount
        };
      }
      
      // 3. Cache miss
      this.stats.misses++;
      console.log(`❌ Cache miss for: ${originalQuery}`);
      return null;
      
    } catch (error) {
      this.stats.errors++;
      console.error('Cache lookup error:', error);
      return null;
    }
  }

  // Salva risultati in cache (memoria + database)
  async cacheResults(searchTerms, originalQuery, results, metadata) {
    try {
      const searchKey = MuseumCache.generateSearchKey(searchTerms);
      
      // 1. Salva in database
      const cacheEntry = await MuseumCache.createCacheEntry(
        searchTerms,
        originalQuery,
        results,
        {
          ...metadata,
          cachedAt: new Date()
        }
      );
      
      // 2. Salva in memoria
      this.setInMemory(searchKey, {
        results,
        metadata,
        timestamp: Date.now()
      });
      
      this.stats.saves++;
      console.log(`💾 Cached ${results.length} results for: ${originalQuery}`);
      
      return cacheEntry;
      
    } catch (error) {
      this.stats.errors++;
      console.error('Cache save error:', error);
      return null;
    }
  }

  // Gestione cache memoria
  getFromMemory(searchKey) {
    const entry = this.memoryCache.get(searchKey);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.memoryTTL) {
      this.memoryCache.delete(searchKey);
      return null;
    }
    
    return entry;
  }

  setInMemory(searchKey, data) {
    // Cleanup se troppi elementi
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(searchKey, data);
  }

  // Invalida cache per termini specifici
  async invalidateCache(searchTerms) {
    try {
      const searchKey = MuseumCache.generateSearchKey(searchTerms);
      
      // Rimuovi da memoria
      this.memoryCache.delete(searchKey);
      
      // Rimuovi da database
      await MuseumCache.deleteOne({ searchKey });
      
      console.log(`🗑️ Invalidated cache for terms: ${searchTerms.join(', ')}`);
      
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Pulizia cache memoria
  cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.memoryTTL) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired memory cache entries`);
    }
  }

  // Statistiche cache
  async getStats() {
    const dbStats = await MuseumCache.getCacheStats();
    
    return {
      runtime: this.stats,
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize,
        ttlMs: this.memoryTTL
      },
      database: dbStats,
      performance: {
        totalRequests: this.stats.memoryHits + this.stats.dbHits + this.stats.misses,
        hitRate: this.calculateHitRate(),
        avgResponseTime: this.calculateAvgResponseTime()
      }
    };
  }

  calculateHitRate() {
    const total = this.stats.memoryHits + this.stats.dbHits + this.stats.misses;
    if (total === 0) return 0;
    return ((this.stats.memoryHits + this.stats.dbHits) / total * 100).toFixed(2);
  }

  calculateAvgResponseTime() {
    // Stima basata sui tipi di cache
    const memoryTime = 1;    // 1ms per memoria
    const dbTime = 50;       // 50ms per database
    const apiTime = 3000;    // 3s per API
    
    const total = this.stats.memoryHits + this.stats.dbHits + this.stats.misses;
    if (total === 0) return 0;
    
    const avgTime = (
      (this.stats.memoryHits * memoryTime) +
      (this.stats.dbHits * dbTime) +
      (this.stats.misses * apiTime)
    ) / total;
    
    return Math.round(avgTime);
  }

  // Preload cache per termini comuni
  async preloadCommonTerms() {
    const commonTerms = [
      ['picasso', 'painting'],
      ['van gogh', 'sunflowers'],
      ['monet', 'impressionism'],
      ['renaissance', 'art'],
      ['sculpture', 'marble'],
      ['portrait', 'oil painting']
    ];
    
    console.log('🔄 Preloading common search terms...');
    
    for (const terms of commonTerms) {
      const cached = await this.getCachedResults(terms, terms.join(' '));
      if (!cached) {
        console.log(`📝 Need to cache: ${terms.join(' ')}`);
        // Qui potresti triggerare una ricerca API per pre-popolare
      }
    }
  }

  // Cleanup periodico
  startPeriodicCleanup() {
    // Cleanup memoria ogni 5 minuti
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
    
    // Cleanup database ogni giorno
    setInterval(async () => {
      await MuseumCache.cleanupOldEntries();
    }, 24 * 60 * 60 * 1000);
    
    console.log('🔄 Started periodic cache cleanup');
  }

  // Reset statistiche
  resetStats() {
    this.stats = {
      memoryHits: 0,
      dbHits: 0,
      misses: 0,
      saves: 0,
      errors: 0
    };
  }
}

export default MuseumCacheService;

