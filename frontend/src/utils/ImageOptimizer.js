// ImageOptimizer.js - Utilità per ottimizzazione immagini
class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.observer = null;
    this.initIntersectionObserver();
  }

  // Inizializza Intersection Observer per lazy loading
  initIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              this.observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Carica immagini 50px prima che diventino visibili
          threshold: 0.1
        }
      );
    }
  }

  // Ottimizza URL immagine basandosi su dimensioni richieste
  optimizeImageUrl(originalUrl, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'auto'
    } = options;

    if (!originalUrl) return null;

    // Per Met Museum API, supporta parametri di ridimensionamento
    if (originalUrl.includes('images.metmuseum.org')) {
      let optimizedUrl = originalUrl;
      
      // Aggiungi parametri di ridimensionamento se supportati
      if (width || height) {
        const params = new URLSearchParams();
        if (width) params.set('w', width);
        if (height) params.set('h', height);
        if (quality < 100) params.set('q', quality);
        
        optimizedUrl += (originalUrl.includes('?') ? '&' : '?') + params.toString();
      }
      
      return optimizedUrl;
    }

    // Per altre API, restituisce URL originale
    return originalUrl;
  }

  // Genera thumbnail ottimizzato
  generateThumbnail(originalUrl, size = 150) {
    return this.optimizeImageUrl(originalUrl, {
      width: size,
      height: size,
      quality: 75
    });
  }

  // Precarica immagine
  preloadImage(url) {
    if (!url || this.cache.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, {
          loaded: true,
          timestamp: Date.now(),
          dimensions: {
            width: img.naturalWidth,
            height: img.naturalHeight
          }
        });
        this.loadingPromises.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.cache.set(url, {
          loaded: false,
          error: true,
          timestamp: Date.now()
        });
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // Carica immagine con lazy loading
  loadImage(imgElement) {
    const src = imgElement.dataset.src || imgElement.src;
    if (!src) return;

    this.preloadImage(src)
      .then(() => {
        imgElement.src = src;
        imgElement.classList.add('loaded');
      })
      .catch(() => {
        imgElement.classList.add('error');
      });
  }

  // Osserva elemento per lazy loading
  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  // Smette di osservare elemento
  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
    }
  }

  // Precarica batch di immagini con priorità
  preloadBatch(urls, priority = 'normal') {
    const promises = urls.map(url => {
      if (priority === 'high') {
        return this.preloadImage(url);
      } else {
        // Ritarda il caricamento per immagini a bassa priorità
        return new Promise(resolve => {
          setTimeout(() => {
            this.preloadImage(url).then(resolve).catch(resolve);
          }, 100);
        });
      }
    });

    return Promise.allSettled(promises);
  }

  // Pulisce cache vecchia
  cleanCache(maxAge = 30 * 60 * 1000) { // 30 minuti default
    const now = Date.now();
    
    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(url);
      }
    }
  }

  // Ottiene statistiche cache
  getCacheStats() {
    const stats = {
      total: this.cache.size,
      loaded: 0,
      failed: 0,
      loading: this.loadingPromises.size
    };

    for (const data of this.cache.values()) {
      if (data.loaded) {
        stats.loaded++;
      } else if (data.error) {
        stats.failed++;
      }
    }

    return stats;
  }

  // Verifica se immagine è in cache
  isImageCached(url) {
    return this.cache.has(url);
  }

  // Ottiene info immagine dalla cache
  getImageInfo(url) {
    return this.cache.get(url) || null;
  }

  // Genera srcSet per immagini responsive
  generateSrcSet(originalUrl, sizes = [150, 300, 600, 1200]) {
    if (!originalUrl) return '';

    return sizes
      .map(size => {
        const optimizedUrl = this.optimizeImageUrl(originalUrl, { width: size });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }

  // Genera sizes attribute per responsive images
  generateSizes(breakpoints = {
    sm: '150px',
    md: '200px',
    lg: '250px',
    xl: '300px'
  }) {
    const sizesArray = [];
    
    Object.entries(breakpoints).forEach(([breakpoint, size]) => {
      switch (breakpoint) {
        case 'sm':
          sizesArray.push(`(max-width: 640px) ${size}`);
          break;
        case 'md':
          sizesArray.push(`(max-width: 768px) ${size}`);
          break;
        case 'lg':
          sizesArray.push(`(max-width: 1024px) ${size}`);
          break;
        case 'xl':
          sizesArray.push(`(max-width: 1280px) ${size}`);
          break;
      }
    });

    // Default size per schermi più grandi
    sizesArray.push(breakpoints.xl || '300px');
    
    return sizesArray.join(', ');
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Istanza singleton
const imageOptimizer = new ImageOptimizer();

// Hook React per utilizzare l'ottimizzatore
export const useImageOptimizer = () => {
  return {
    optimizeImageUrl: imageOptimizer.optimizeImageUrl.bind(imageOptimizer),
    generateThumbnail: imageOptimizer.generateThumbnail.bind(imageOptimizer),
    preloadImage: imageOptimizer.preloadImage.bind(imageOptimizer),
    preloadBatch: imageOptimizer.preloadBatch.bind(imageOptimizer),
    observe: imageOptimizer.observe.bind(imageOptimizer),
    unobserve: imageOptimizer.unobserve.bind(imageOptimizer),
    generateSrcSet: imageOptimizer.generateSrcSet.bind(imageOptimizer),
    generateSizes: imageOptimizer.generateSizes.bind(imageOptimizer),
    getCacheStats: imageOptimizer.getCacheStats.bind(imageOptimizer),
    cleanCache: imageOptimizer.cleanCache.bind(imageOptimizer)
  };
};

export default imageOptimizer;

