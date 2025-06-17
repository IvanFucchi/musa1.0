// useMuseumImages.js - Hook personalizzato per gestire le immagini museo
import { useState, useEffect, useCallback, useRef } from 'react';

const useMuseumImages = (initialSpots = []) => {
  const [spots, setSpots] = useState(initialSpots);
  const [enrichmentStatus, setEnrichmentStatus] = useState('idle'); // idle, loading, success, error
  const [enrichmentStats, setEnrichmentStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Cache per evitare richieste duplicate
  const enrichmentCache = useRef(new Map());
  const abortController = useRef(null);

  // Aggiorna spots quando cambiano quelli iniziali
  useEffect(() => {
    setSpots(initialSpots);
  }, [initialSpots]);

  // Funzione per arricchire spots con immagini museo
  const enrichSpotsWithImages = useCallback(async (spotsToEnrich, options = {}) => {
    const {
      force = false, // Forza ri-arricchimento anche se già presente
      timeout = 10000,
      maxConcurrent = 3 // Max richieste parallele
    } = options;

    // Annulla richiesta precedente se in corso
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    
    setEnrichmentStatus('loading');
    setError(null);

    try {
      // Filtra spots che necessitano arricchimento
      const spotsNeedingEnrichment = spotsToEnrich.filter(spot => {
        if (!force && spot.museumImages && spot.museumImages.length > 0) {
          return false; // Già arricchito
        }
        
        if (spot.source !== 'openai') {
          return false; // Solo spots AI-generated
        }

        // Controlla cache
        const cacheKey = `${spot.id}-${spot.name}`;
        if (enrichmentCache.current.has(cacheKey) && !force) {
          return false;
        }

        return true;
      });

      if (spotsNeedingEnrichment.length === 0) {
        setEnrichmentStatus('success');
        return spotsToEnrich;
      }

      // Chiamata al backend per arricchimento
      const response = await fetch('/api/spots/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spots: spotsNeedingEnrichment,
          enrichWithImages: true,
          timeout
        }),
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Enrichment failed');
      }

      // Aggiorna cache
      data.spots.forEach(spot => {
        const cacheKey = `${spot.id}-${spot.name}`;
        enrichmentCache.current.set(cacheKey, {
          timestamp: Date.now(),
          data: spot
        });
      });

      // Merge risultati arricchiti con spots originali
      const enrichedSpots = spotsToEnrich.map(originalSpot => {
        const enrichedSpot = data.spots.find(s => s.id === originalSpot.id);
        return enrichedSpot || originalSpot;
      });

      setSpots(enrichedSpots);
      setEnrichmentStats(data.metadata?.enrichmentStats);
      setEnrichmentStatus('success');

      return enrichedSpots;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Enrichment request aborted');
        return spotsToEnrich;
      }

      console.error('Enrichment error:', err);
      setError(err.message);
      setEnrichmentStatus('error');
      
      // Fallback: restituisce spots originali
      return spotsToEnrich;
    }
  }, []);

  // Funzione per testare arricchimento su singolo spot
  const testSpotEnrichment = useCallback(async (spot) => {
    try {
      const response = await fetch('/api/spots/test-enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spot })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result;

    } catch (err) {
      console.error('Test enrichment error:', err);
      throw err;
    }
  }, []);

  // Funzione per pulire cache
  const clearCache = useCallback(() => {
    enrichmentCache.current.clear();
  }, []);

  // Funzione per ottenere statistiche cache
  const getCacheStats = useCallback(() => {
    const cache = enrichmentCache.current;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    let validEntries = 0;
    let expiredEntries = 0;

    cache.forEach((value) => {
      if (now - value.timestamp < oneHour) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      total: cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }, []);

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    spots,
    enrichmentStatus,
    enrichmentStats,
    error,
    enrichSpotsWithImages,
    testSpotEnrichment,
    clearCache,
    getCacheStats,
    isLoading: enrichmentStatus === 'loading'
  };
};

export default useMuseumImages;

