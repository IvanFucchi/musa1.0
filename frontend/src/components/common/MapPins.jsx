import React, {useState} from 'react';
import {GoogleMap, useJsApiLoader, InfoWindow} from '@react-google-maps/api';


const mapContainerStyle = {width: '100%', height: '100%'};
const defaultCenter = {lat: 41.8925, lng: 12.4853};
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const CUSTOM_MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID;

const MapPins = ({pinsData}) => {
  const [selectedPin, setSelectedPin] = useState(null);
  const {isLoaded, loadError} = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    mapIds: [CUSTOM_MAP_ID],
  });

  const onMapLoad = map => {
    pinsData.forEach(pin => {
      const marker = new window.google.maps.Marker({
        position: pin.position,
        map,
        title: pin.title,
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
    });
  };

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
    <div style={{width: '100%', height: '100%'}}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        options={options}
        onLoad={onMapLoad}
      >
        {selectedPin && (
          <InfoWindow
            position={selectedPin.position}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div style={{maxWidth: '200px'}}>
              <img
                src={selectedPin.imageUrl}
                alt={selectedPin.title}
                style={{width: '100%', height: 'auto', marginBottom: '8px'}}
              />
              <h3 style={{margin: '0 0 4px'}}>{selectedPin.title}</h3>
              <p style={{margin: 0}}>{selectedPin.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapPins;
