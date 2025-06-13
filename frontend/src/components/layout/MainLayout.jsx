import {useState} from 'react';
import {Outlet} from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import api from 'lib/api';

const MainLayout = () => {
  const [center, setCenter] = useState([12.4964, 41.9028]);
  const [zoom, setZoom] = useState(10);
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTextSearch = async (query) => {
    setSearchQuery(query);

    try {
      // Chiamata API per ricerca globale
      const response = await api.get(`/api/spots?search=${query}`);
      if (response.data.success) {
        setMarkers(response.data.data);
      }
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      // Fallback con dati simulati in caso di errore
      setMarkers([
        {
          name: 'Risultato simulato per: ' + query,
          coordinates: [12.4964, 41.9028], // Roma
          type: 'artwork',
          source: 'openai'
        }
      ]);
    }
  };

  const handleLocationSearch = ({center, zoom}) => {
    if (!center || !Array.isArray(center) || center.length !== 2) {
      console.error('Coordinate non valide:', center);
      return;
    }

    setCenter(center);
    setZoom(zoom);

    // Se c'è già una query testuale, combina con le coordinate
    if (searchQuery) {
      fetchSpotsWithLocation(searchQuery, center);
    } else {
      // Altrimenti, cerca solo per posizione
      fetchMarkersNear(center);
    }
  };

  const fetchSpotsWithLocation = async (query, [lng, lat]) => {
    try {
      const response = await api.get(`/api/spots?search=${query}&lat=${lat}&lng=${lng}&distance=10`);
      if (response.data.success) {
        setMarkers(response.data.data);
      }
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      setMarkers([
        {
          name: 'Risultato filtrato per: ' + query,
          coordinates: [lng, lat],
          type: 'artwork',
          source: 'openai'
        }
      ]);
    }
  };

  const fetchMarkersNear = async ([lng, lat]) => {
    if (!lng || !lat) return;

    try {
      // Chiamata API solo con coordinate
      const response = await api.get(`/api/spots?lat=${lat}&lng=${lng}&distance=10`);
      if (response.data.success) {
        setMarkers(response.data.data);
      }
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      // Fallback con dati simulati in caso di errore
      setMarkers([
        {
          name: 'Spot vicino alla posizione',
          coordinates: [lng + 0.01, lat + 0.01],
          type: 'event',
          source: 'database'
        },
        {
          name: 'Altro spot vicino',
          coordinates: [lng - 0.01, lat - 0.01],
          type: 'artwork',
          source: 'openai'
        }
      ]);
    }
  };

  return (
    <>
      <Header
        handleTextSearch={handleTextSearch}
        handleLocationSearch={handleLocationSearch}
      />
      <main className='bg-zinc-100 flex flex-col'>
        <Outlet context={{
          center,
          zoom,
          markers,
          handleTextSearch,
          handleLocationSearch,
          searchQuery
        }}/>
      </main>
      <Footer/>
    </>
  );
};

export default MainLayout;
