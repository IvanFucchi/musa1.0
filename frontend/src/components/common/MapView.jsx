import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Marker } from 'react-map-gl';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaXZhbi1mdWNjaGkiLCJhIjoiY21iY2tjaWt4MHJjdzJzc2F1em5scXI5aiJ9.eV_JXLtKNGzFIvsvXBV8FQ';

const MapView = ({
  center = [-74.5, 40],
  zoom = 9,
  markers = [],
  onMarkerClick,
  interactive = true,
  style = { width: '100%', height: '100%' },
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom
  });

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (map) {
      map.flyTo({
        center,
        zoom,
        speed: 1.2,
        curve: 1.42,
        easing: t => t
      });
    }
  }, [center, zoom]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => interactive && setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      style={style}
    >
      {markers.map(marker => {
        let backgroundColor;
        let borderColor = 'transparent';
        let borderWidth = '0';

        if (marker.type === 'artwork') {
          backgroundColor = '#3B82F6';
        } else if (marker.type === 'venue') {
          backgroundColor = '#8B5CF6';
        } else if (marker.type === 'event') {
          backgroundColor = '#EC4899';
        } else {
          backgroundColor = '#10B981';
        }

        if (marker.source === 'openai') {
          borderColor = '#F59E0B';
          borderWidth = '3px';
        } else if (marker.source === 'database') {
          borderColor = '#06B6D4';
          borderWidth = '3px';
        }

        return (
          <Marker
            key={marker.name}
            longitude={marker.coordinates[0]}
            latitude={marker.coordinates[1]}
            anchor="center"
            onClick={() => onMarkerClick && onMarkerClick(marker)}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor,
                borderRadius: '50%',
                borderColor,
                borderStyle: 'solid',
                borderWidth,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title={`${marker.title || marker.name} (${marker.source === 'openai' ? 'AI' : 'UGC'})`}
            >
              {marker.type === 'artwork' ? 'A' : marker.type === 'venue' ? 'V' : marker.type === 'event' ? 'E' : 'C'}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

MapView.propTypes = {
  center: PropTypes.array,
  zoom: PropTypes.number,
  markers: PropTypes.arrayOf(
    PropTypes.shape({
      coordinates: PropTypes.array.isRequired,
      title: PropTypes.string,
      type: PropTypes.string,
      source: PropTypes.string,
      name: PropTypes.string
    })
  ),
  onMarkerClick: PropTypes.func,
  interactive: PropTypes.bool,
  style: PropTypes.object
};

export default MapView;
