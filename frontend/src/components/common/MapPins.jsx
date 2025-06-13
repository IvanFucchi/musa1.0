import React, {useState, useRef, useEffect} from 'react';
import {GoogleMap, useJsApiLoader, InfoWindow} from '@react-google-maps/api';

const mapContainerStyle = {width: '100%', height: '100%'};
const defaultCenter = {lat: 41.8925, lng: 12.4853};

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const CUSTOM_MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID;

const MapPins = ({pinsData}) => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  const {isLoaded, loadError} = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    mapIds: [CUSTOM_MAP_ID],
  });

  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (pinsData.length === 0) {
      map.setCenter(defaultCenter);
      map.setZoom(13);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    pinsData.forEach(pin => {
      const {position, title, imageUrl} = pin;
      const marker = new window.google.maps.Marker({
        position,
        map,
        title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: pin.backgroundColor || '#1976D2',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
          scale: 12,
        },
      });

      marker.addListener('click', () => setSelectedPin(pin));
      markersRef.current.push(marker);

      bounds.extend(position);
    });

    map.fitBounds(bounds);
  }, [map, pinsData]);

  if (loadError) return <div>Errore caricamento Google Maps</div>;
  if (!isLoaded) return <div>Caricamento mappa…</div>;

  const options = {
    mapId: CUSTOM_MAP_ID,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: window.google.maps.ControlPosition.LEFT_BOTTOM,
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google.maps.ControlPosition.BOTTOM_RIGHT,
    },
    scrollwheel: true,
    gestureHandling: 'greedy',
  };

  return (
    <div className="h-full w-full border rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        options={options}
        onLoad={handleMapLoad}
      >
        {selectedPin && (
          <InfoWindow
            position={selectedPin.position}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div style={{maxWidth: 200}}>
              {/*
              <img
                src={selectedPin.imageUrl}
                alt={selectedPin.title}
                style={{width: '100%', height: 'auto', marginBottom: 8}}
              />
              */}
              <h3 className='font-bold mb-1'>{selectedPin.title}</h3>
              <p className='m-0 text-zinc-800'>{selectedPin.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapPins;
