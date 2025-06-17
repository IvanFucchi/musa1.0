// Servizio API aggiornato per ExplorePage.jsx

// Funzione per chiamare l'API arricchita
const fetchEnhancedSpots = async (place, activity) => {
  try {
    const response = await fetch('/api/spots/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: activity || '',
        coordinates: place ? {
          lat: place.lat || place.position?.lat,
          lng: place.lng || place.position?.lng
        } : null,
        enrichWithImages: true, // Abilita arricchimento immagini
        filters: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Trasforma i dati per compatibilità con il formato esistente
      const transformedSpots = data.spots.map((spot, index) => ({
        id: spot.id || `spot_${index + 1}`,
        title: spot.name || spot.title,
        description: spot.description,
        imageUrl: spot.imageUrl,
        position: {
          lat: spot.coordinates?.[1] || spot.position?.lat,
          lng: spot.coordinates?.[0] || spot.position?.lng
        },
        url: spot.url,
        // NUOVO: Aggiungi immagini museo
        museumImages: spot.museumImages || [],
        imageEnrichmentStatus: spot.imageEnrichmentStatus || 'none',
        source: spot.source || 'openai'
      }));

      return {
        success: true,
        spots: transformedSpots,
        metadata: data.metadata
      };
    } else {
      throw new Error(data.error || 'Failed to fetch enhanced spots');
    }
  } catch (error) {
    console.error('Enhanced spots fetch error:', error);
    
    // Fallback alla chiamata originale se l'arricchimento fallisce
    return await fetchSpotsOriginal(place, activity);
  }
};

// Funzione fallback (la tua chiamata originale)
const fetchSpotsOriginal = async (place, activity) => {
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_PATH || 'http://localhost:5000';
    const response = await fetch(
      `${backendUrl}/api/spots?place=${encodeURIComponent(place)}&activity=${encodeURIComponent(activity)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.success) {
      const transformedSpots = json.data.map((spot, i) => ({
        id: spot.id || `spot_${i + 1}`,
        title: spot.name || spot.title,
        description: spot.description,
        imageUrl: spot.imageUrl,
        position: {
          lat: spot.coordinates?.[1] || spot.position?.lat,
          lng: spot.coordinates?.[0] || spot.position?.lng
        },
        url: spot.url,
        // Nessuna immagine museo nel fallback
        museumImages: [],
        imageEnrichmentStatus: 'disabled',
        source: spot.source || 'openai'
      }));

      return {
        success: true,
        spots: transformedSpots,
        metadata: { fallback: true }
      };
    } else {
      throw new Error('API response not successful');
    }
  } catch (error) {
    console.error('Original spots fetch error:', error);
    return {
      success: false,
      spots: [],
      error: error.message
    };
  }
};

// Funzione principale da usare in ExplorePage
export const fetchSpots = fetchEnhancedSpots;

// Funzione per testare l'arricchimento su un singolo spot
export const testSpotEnrichment = async (spot) => {
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

    return await response.json();
  } catch (error) {
    console.error('Test enrichment error:', error);
    return { success: false, error: error.message };
  }
};

// Funzione per ottenere la configurazione arricchimento
export const getEnrichmentConfig = async () => {
  try {
    const response = await fetch('/api/spots/enrichment-config');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get enrichment config error:', error);
    return { success: false, error: error.message };
  }
};

// Funzione per aggiornare la configurazione arricchimento
export const updateEnrichmentConfig = async (config) => {
  try {
    const response = await fetch('/api/spots/enrichment-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Update enrichment config error:', error);
    return { success: false, error: error.message };
  }
};

// Funzione per verificare lo stato delle API museali
export const checkMuseumApiHealth = async () => {
  try {
    const response = await fetch('/api/spots/museum-apis-health');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Museum API health check error:', error);
    return { success: false, error: error.message };
  }
};

