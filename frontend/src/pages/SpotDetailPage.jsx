import React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import MapView from '../components/common/MapView';

const SpotDetailPage = () => {
  const { id } = useParams();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchSpot = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:5000/api/spots/${id}`);
        
        if (data.success) {
          setSpot(data.data);
        } else {
          setError('Errore nel caricamento dello spot');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Errore nel caricamento dello spot');
      } finally {
        setLoading(false);
      }
    };

    fetchSpot();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!spot) {
    return <Alert type="warning" message="Spot non trovato" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
        {spot.images && spot.images.length > 0 ? (
          <img 
            src={spot.images[0]} 
            alt={spot.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Nessuna immagine disponibile</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-blue-600 text-xs font-medium rounded-full">
                {spot.type === 'artwork' ? 'Opera' : spot.type === 'venue' ? 'Luogo' : 'Collezione'}
              </span>
              <span className="px-2 py-1 bg-purple-600 text-xs font-medium rounded-full">
                {spot.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold">{spot.name}</h1>
            {spot.location && (
              <p className="text-gray-200 mt-1">
                {spot.location.address}, {spot.location.city}, {spot.location.country}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informazioni
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'map'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mappa
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recensioni
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Descrizione</h2>
                <p className="text-gray-700">{spot.description}</p>
              </div>

              {spot.mood && spot.mood.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Mood</h2>
                  <div className="flex flex-wrap gap-2">
                    {spot.mood.map((m, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {spot.musicGenres && spot.musicGenres.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Generi Musicali</h2>
                  <div className="flex flex-wrap gap-2">
                    {spot.musicGenres.map((genre, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {spot.tags && spot.tags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {spot.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">Informazioni</h3>
                
                {spot.dateRange && (spot.dateRange.start || spot.dateRange.end) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Periodo</h4>
                    <p>
                      {spot.dateRange.start && spot.dateRange.end 
                        ? `${spot.dateRange.start} - ${spot.dateRange.end}`
                        : spot.dateRange.start || spot.dateRange.end}
                    </p>
                  </div>
                )}
                
                {spot.contactInfo && Object.keys(spot.contactInfo).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Contatti</h4>
                    {spot.contactInfo.phone && (
                      <p className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {spot.contactInfo.phone}
                      </p>
                    )}
                    {spot.contactInfo.email && (
                      <p className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {spot.contactInfo.email}
                      </p>
                    )}
                    {spot.contactInfo.website && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a href={spot.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Sito web
                        </a>
                      </p>
                    )}
                  </div>
                )}
                
                {spot.rating && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Valutazione</h4>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-5 h-5 ${i < Math.round(spot.rating.average) ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600">
                        {spot.rating.average.toFixed(1)} ({spot.rating.count} recensioni)
                      </span>
                    </div>
                  </div>
                )}
                
                {spot.creator && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Aggiunto da</h4>
                    <div className="flex items-center">
                      {spot.creator.avatar ? (
                        <img src={spot.creator.avatar} alt={spot.creator.name} className="w-8 h-8 rounded-full mr-2" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                          {spot.creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{spot.creator.name}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-96">
            {spot.location && spot.location.coordinates && (
              <MapView 
                center={spot.location.coordinates} 
                zoom={15}
                markers={[{
                  id: spot._id,
                  coordinates: spot.location.coordinates,
                  title: spot.name,
                  type: spot.type
                }]}
              />
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recensioni</h2>
              <Button variant="primary">Scrivi una recensione</Button>
            </div>
            
            {spot.reviews && spot.reviews.length > 0 ? (
              <div className="space-y-4">
                {spot.reviews.map((review) => (
                  <Card key={review._id} className="p-4">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {review.user.avatar ? (
                          <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full mr-3" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                            {review.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{review.user.name}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-gray-700">{review.content}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nessuna recensione disponibile</p>
                <p className="mt-2">Sii il primo a recensire questo spot!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotDetailPage;
