import React, {useState, useRef, useEffect} from 'react';
import {GoogleMap, useJsApiLoader, InfoWindow} from '@react-google-maps/api';

const containerStyle = {width: '100%', height: '100%'};
const defaultCenter = {lat: 41.8925, lng: 12.4853};

const MapPins = ({pinsData, selectedPinId, onSelectPin}) => {
  const [map, setMap] = useState(null);
  const [currentPin, setCurrentPin] = useState(null);
  const markersRef = useRef({});
  const {isLoaded, loadError} = useJsApiLoader({
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
      const marker = new window.google.maps.Marker({
        position: pin.position,
        map,
        title: pin.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#1976D2',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
          scale: 12,
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
        zoomControlOptions: {position: window.google.maps.ControlPosition.LEFT_BOTTOM},
        fullscreenControl: true,
        fullscreenControlOptions: {position: window.google.maps.ControlPosition.BOTTOM_RIGHT},
        gestureHandling: 'greedy',
      }}
      onLoad={mapInstance => setMap(mapInstance)}
    >
      {currentPin && (
        <InfoWindow
          position={currentPin.position}
          onCloseClick={() => onSelectPin(null)}
        >
          <div style={{maxWidth: 200}}>
            <h3 className="font-bold mb-1">{currentPin.title}</h3>
            <p className="m-0 text-zinc-800">{currentPin.description}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default MapPins;
