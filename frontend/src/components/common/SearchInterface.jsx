import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import MapView from './MapView';
import SearchBar from '../search/SearchBar';
import FilterDrawer from '../search/FilterDrawer';

const SearchInterface = () => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    type: '',
    category: '',
    mood: '',
    musicGenre: '',
    distance: 10,
    lat: 41.87893221758316, 
    lng: 12.479620747531385
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Ottieni la posizione dell'utente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Errore nella geolocalizzazione:', error);
        }
      );
    }
  }, []);

  const handleSearchBarQuery = ({ query }) => {
    if (query) {
      setSearchParams(prev => ({
        ...prev,
        query
      }));
      
      // Esegui la ricerca automaticamente quando l'utente seleziona un suggerimento
      handleSearch();
    }
  };

  const handleFiltersChange = (newFilters) => {
    setSearchParams(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleLocationChange = ({ center, zoom }) => {
    if (center && center.length === 2) {
      setSearchParams(prev => ({
        ...prev,
        lng: center[0],
        lat: center[1]
      }));
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Costruisci i parametri di query
      const queryParams = new URLSearchParams();

      if (searchParams.query) queryParams.append('search', searchParams.query);
      if (searchParams.type) queryParams.append('type', searchParams.type);
      if (searchParams.category) queryParams.append('category', searchParams.category);
      if (searchParams.mood) queryParams.append('mood', searchParams.mood);
      if (searchParams.musicGenre) queryParams.append('musicGenre', searchParams.musicGenre);

      // Aggiungi parametri di posizione se disponibili
      if (searchParams.lat && searchParams.lng) {
        queryParams.append('lat', searchParams.lat);
        queryParams.append('lng', searchParams.lng);
        queryParams.append('distance', searchParams.distance);
      }

      // Esegui la ricerca
      const { data } = await api.get(`http://localhost:5000/api/spots?${queryParams.toString()}`);

      if (data.success) {
        setResults(data.data);
      } else {
        setError('Errore durante la ricerca');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchParams({
      query: '',
      type: '',
      category: '',
      mood: '',
      musicGenre: '',
      distance: 10,
      lat: null,
      lng: null
    });
    setResults([]);
  };

  const handleSpotClick = (spotId) => {
    navigate(`/spots/${spotId}`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Explore Art Spots</h2>
          <div className="flex items-center space-x-4">
            <SearchBar 
              onSearch={handleSearchBarQuery} 
              onOpenFilters={() => setIsFilterDrawerOpen(true)}
            />
          </div>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
      </Card>

      {/* Filtri laterali */}
      <FilterDrawer 
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={searchParams}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleSearch}
        userLocation={userLocation}
      />

      <div className="flex">
        <div className="w-1/2">
          {/* Risultati */}
          {results.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((spot, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleSpotClick(spot._id)}
                  >
                    <div className="h-48 bg-gray-200 relative">
                      {spot.images && spot.images.length > 0 ? (
                        <img
                          src={spot.images[0]}
                          alt={spot.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-500">No image</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex space-x-2">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          {spot.type === 'artwork' ? 'Artwork' : spot.type === 'venue' ? 'Venue' : 'Collection'}
                        </span>
                        {spot.category && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                            {spot.category}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-white text-xs font-medium rounded-full ${spot.source === 'openai' ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}>
                          {spot.source === 'openai' ? 'AI' : 'UGC'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{spot.name}</h3>
                      {spot.location && (
                        <p className="text-gray-500 text-sm mb-2">
                          {spot.location.city}, {spot.location.country}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                        {spot.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {spot.mood && spot.mood.slice(0, 2).map((m, i) => (
                          <span key={`mood-${i}`} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {m}
                          </span>
                        ))}
                        {spot.musicGenres && spot.musicGenres.slice(0, 2).map((genre, i) => (
                          <span key={`genre-${i}`} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !loading && searchParams.query && (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found</p>
              <p className="mt-2">Try modifying your search parameters</p>
            </div>
          )}
        </div>

        <div className="w-1/2">
          <MapView 
            markers={results} 
            center={[searchParams.lng, searchParams.lat]} 
            onMapMove={handleLocationChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;
