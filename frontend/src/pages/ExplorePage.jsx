import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MapPins from '@/components/common/MapPins';
import MapPinList from '@/components/common/MapPinList';
import { useGlobalState, useGlobalDispatch } from '@/context/GlobalState';

const DEFAULT_PLACE = 'roma';
const DEFAULT_ACTIVITY = 'caravaggio';

let lastFetchParams = { place: null, activity: null };

// Funzione per chiamare l'API arricchita con immagini museo
const fetchEnhancedSpots = async (place, activity, backendUrl) => {
  try {
    const response = await fetch(`${backendUrl}/api/spots/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: activity || '',
        coordinates: null, // Verrà gestito dal backend basandosi su 'place'
        place: place,
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
        id: spot.id || (index + 1),
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
    throw error;
  }
};

// Funzione fallback (la chiamata originale)
const fetchSpotsOriginal = async (place, activity, backendUrl) => {
  try {
    const res = await fetch(
      `${backendUrl}/api/spots?place=${encodeURIComponent(place)}&activity=${encodeURIComponent(activity)}`
    );
    const json = await res.json();
    
    if (json.success) {
      const transformedSpots = json.data.map((spot, i) => ({
        id: i + 1,
        title: spot.title,
        description: spot.description,
        imageUrl: spot.imageUrl,
        position: {
          lat: spot.coordinates[1],
          lng: spot.coordinates[0],
        },
        url: spot.url,
        // Nessuna immagine museo nel fallback
        museumImages: [],
        imageEnrichmentStatus: 'disabled',
        source: 'openai'
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
    throw error;
  }
};

const ExplorePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useGlobalDispatch();
  const { place, activity } = useGlobalState();

  const [pinsData, setPinsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('none'); // 'none', 'loading', 'success', 'fallback', 'error'
  const backendUrl = process.env.REACT_APP_BACKEND_PATH || 'http://localhost:5000';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('place');
    const a = params.get('activity');

    if (!p || !a) {
      navigate(
        `/explore?place=${DEFAULT_PLACE}&activity=${DEFAULT_ACTIVITY}`,
        { replace: true }
      );
      return;
    }

    if (p !== place) {
      dispatch({ type: 'SET_PLACE', payload: p });
    }
    if (a !== activity) {
      dispatch({ type: 'SET_ACTIVITY', payload: a });
    }
  }, [location.search, navigate, dispatch, place, activity]);

  useEffect(() => {
    if (!place.trim() || !activity.trim()) return;

    const fetchSpots = async () => {
      setIsLoading(true);
      setEnrichmentStatus('loading');
      console.log('>>> Fetching spots for place:', place, 'activity:', activity);

      try {
        // Prova prima l'API arricchita
        let result;
        try {
          result = await fetchEnhancedSpots(place, activity, backendUrl);
          setEnrichmentStatus('success');
          console.log('✅ Enhanced API successful');
          
          // Log statistiche arricchimento se disponibili
          if (result.metadata?.enrichmentStats) {
            console.log('📊 Enrichment stats:', result.metadata.enrichmentStats);
          }
        } catch (enhancedError) {
          console.warn('⚠️ Enhanced API failed, falling back to original:', enhancedError.message);
          
          // Fallback all'API originale
          result = await fetchSpotsOriginal(place, activity, backendUrl);
          setEnrichmentStatus('fallback');
          console.log('✅ Fallback API successful');
        }

        if (result.success) {
          setPinsData(result.spots);
          
          // Log informazioni sui risultati
          const spotsWithImages = result.spots.filter(spot => 
            spot.museumImages && spot.museumImages.length > 0
          );
          const totalImages = result.spots.reduce((sum, spot) => 
            sum + (spot.museumImages?.length || 0), 0
          );
          
          console.log(`📍 Found ${result.spots.length} spots`);
          console.log(`🎨 ${spotsWithImages.length} spots with museum images`);
          console.log(`🖼️ Total ${totalImages} museum images`);
        } else {
          console.error('❌ Both APIs failed');
          setPinsData([]);
          setEnrichmentStatus('error');
        }
      } catch (error) {
        console.error('💥 Critical fetch error:', error);
        setPinsData([]);
        setEnrichmentStatus('error');
      } finally {
        setIsLoading(false);
        lastFetchParams = { place, activity };
      }
    };

    fetchSpots();
  }, [place, activity, backendUrl]);

  // Componente per indicatori di stato arricchimento (solo in development)
  const EnrichmentStatusIndicator = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    const spotsWithImages = pinsData.filter(spot => 
      spot.museumImages && spot.museumImages.length > 0
    );
    const totalImages = pinsData.reduce((sum, spot) => 
      sum + (spot.museumImages?.length || 0), 0
    );

    const statusConfig = {
      none: { color: 'bg-gray-500', text: 'No enrichment' },
      loading: { color: 'bg-blue-500 animate-pulse', text: 'Loading images...' },
      success: { color: 'bg-green-500', text: 'Images loaded' },
      fallback: { color: 'bg-yellow-500', text: 'Fallback mode' },
      error: { color: 'bg-red-500', text: 'Error loading' }
    };

    const config = statusConfig[enrichmentStatus] || statusConfig.none;

    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
          <span className="font-medium">{config.text}</span>
        </div>
        <div className="space-y-1 text-xs">
          <div>Spots: {pinsData.length}</div>
          <div>With images: {spotsWithImages.length}</div>
          <div>Total images: {totalImages}</div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex w-full lg:h-[calc(100vh-82px)] min-h-[50vh]">
      {isLoading ? (
        <div className="container mx-auto flex items-center justify-center h-full">
          <div className="flex flex-col items-center my-20">
            <video
              src="/loading/matrona.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-40 h-40 object-contain rounded-full mb-4 bg-white"
            />
            
            <p className="mt-4 text-zinc-600 text-sm text-center">
              Caricamento in corso…
              <br />
              {enrichmentStatus === 'loading' && (
                <span className="text-xs text-orange-600 mt-1 block">
                  🎨 Ricerca opere d'arte correlate
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto flex flex-wrap h-full">
          <div className="flex w-full h-full lg:w-1/2">
            <MapPinList
              pinsData={pinsData}
              selectedPinId={selectedPinId}
              onSelectPin={setSelectedPinId}
            />
          </div>
          <div className="flex w-full lg:w-1/2 rounded-lg overflow-hidden min-h-[50vh] my-4">
            <MapPins
              pinsData={pinsData}
              selectedPinId={selectedPinId}
              onSelectPin={setSelectedPinId}
            />
          </div>
        </div>
      )}
      
      {/* Indicatore stato arricchimento (solo in development) */}
      <EnrichmentStatusIndicator />
    </section>
  );
};

export default ExplorePage;

