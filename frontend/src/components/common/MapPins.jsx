import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 41.8925, lng: 12.4853 };

// Componente per l'immagine nell'InfoWindow
const InfoWindowImage = ({ artwork, spotTitle }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!artwork || imageError) {
    return null;
  }

  return (
    <div className="mb-2">
      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className="w-full h-24 bg-gray-200 animate-pulse rounded" />
      )}
      
      {/* Immagine principale */}
      <img
        src={artwork.primaryImageSmall || artwork.primaryImage}
        alt={artwork.title}
        className={`w-full h-24 object-cover rounded transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{ maxWidth: '200px' }}
      />
      
      {/* Info opera */}
      {imageLoaded && (
        <div className="mt-2 text-xs text-gray-600">
          <p className="font-medium">{artwork.title}</p>
          <p>{artwork.artist}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              {artwork.source === 'met' && '🏛️ Met Museum'}
              {artwork.source === 'aic' && '🎨 Art Institute'}
              {artwork.source === 'rijks' && '🇳🇱 Rijksmuseum'}
            </span>
            {artwork.objectURL && (
              <a
                href={artwork.objectURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Vedi →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente InfoWindow personalizzato
const CustomInfoWindow = ({ pin, onClose }) => {
  // Seleziona la prima immagine disponibile come immagine principale
  const primaryArtwork = pin.museumImages && pin.museumImages.length > 0 
    ? pin.museumImages[0] 
    : null;

  const hasMultipleImages = pin.museumImages && pin.museumImages.length > 1;

  return (
    <InfoWindow
      position={pin.position}
      onCloseClick={onClose}
    >
      <div style={{ maxWidth: 220, minWidth: 200 }}>
        {/* Immagine principale dell'opera */}
        {primaryArtwork && (
          <InfoWindowImage 
            artwork={primaryArtwork} 
            spotTitle={pin.title}
          />
        )}
        
        {/* Contenuto esistente */}
        <h3 className="font-bold mb-1 text-base">{pin.title}</h3>
        <p className="m-0 text-zinc-800 text-sm mb-2">{pin.description}</p>
        
        {/* Indicatore immagini multiple */}
        {hasMultipleImages && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              +{pin.museumImages.length - 1} altre opere
            </span>
          </div>
        )}
        
        {/* Link indicazioni */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${pin.position.lat},${pin.position.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Indicazioni →
          </a>
        </div>
      </div>
    </InfoWindow>
  );
};

const MapPins = ({ pinsData, selectedPinId, onSelectPin }) => {
  const [map, setMap] = useState(null);
  const [currentPin, setCurrentPin] = useState(null);
  const markersRef = useRef({});
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    mapIds: [process.env.REACT_APP_GOOGLE_MAP_ID],
  });

  useEffect(() => {
    if (!map) return;
    Object.values(markersRef.current).forEach(m => m.setMap(null));
    markersRef.current = {};
    if (!pinsData.length) {
      map.setCenter(defaultCenter);
      map.setZoom(13);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    pinsData.forEach(pin => {
      // Personalizza l'icona del marker se ha immagini museo
      const hasMuseumImages = pin.museumImages && pin.museumImages.length > 0;
      
      const marker = new window.google.maps.Marker({
        position: pin.position,
        map,
        title: pin.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: hasMuseumImages ? '#f97316' : '#1976D2', // Arancione se ha immagini
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
          scale: hasMuseumImages ? 14 : 12, // Leggermente più grande se ha immagini
        },
      });
      
      marker.addListener('click', () => onSelectPin(pin.id));
      markersRef.current[pin.id] = marker;
      bounds.extend(pin.position);
    });
    map.fitBounds(bounds);
  }, [map, pinsData, onSelectPin]);

  useEffect(() => {
    setCurrentPin(null);
    if (map && selectedPinId != null) {
      const pin = pinsData.find(p => p.id === selectedPinId) || null;
      setCurrentPin(pin);
      if (pin) {
        const marker = markersRef.current[pin.id];
        if (marker) map.panTo(marker.getPosition());
      }
    }
  }, [selectedPinId, map, pinsData]);

  if (loadError) return <div>Errore caricamento Google Maps</div>;
  if (!isLoaded) return <div>Caricamento mappa…</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={13}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.LEFT_BOTTOM },
        fullscreenControl: true,
        fullscreenControlOptions: { position: window.google.maps.ControlPosition.BOTTOM_RIGHT },
        gestureHandling: 'greedy',
      }}
      onLoad={mapInstance => setMap(mapInstance)}
    >
      {/* InfoWindow personalizzato con immagine */}
      {currentPin && (
        <CustomInfoWindow
          pin={currentPin}
          onClose={() => onSelectPin(null)}
        />
      )}
    </GoogleMap>
  );
};

export default MapPins;

