// SpotsList.jsx - Lista dei risultati con card arricchite
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SortAsc, Grid, List, Loader2 } from 'lucide-react';
import EnhancedSpotCard from './EnhancedSpotCard';

const SpotsList = ({ 
  spots = [], 
  loading = false,
  onSpotClick,
  onSpotNavigate,
  onSpotFavorite,
  onSpotShare,
  selectedSpotId = null,
  className = "",
  enableEnrichment = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance'); // relevance, name, rating, distance
  const [filterBy, setFilterBy] = useState('all'); // all, museums, galleries, events
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [showFilters, setShowFilters] = useState(false);

  // Filtra e ordina gli spots
  const filteredAndSortedSpots = useMemo(() => {
    let filtered = spots;

    // Filtro per testo di ricerca
    if (searchTerm) {
      filtered = filtered.filter(spot =>
        spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro per categoria
    if (filterBy !== 'all') {
      filtered = filtered.filter(spot => {
        switch (filterBy) {
          case 'museums': return spot.category === 'museum';
          case 'galleries': return spot.category === 'gallery';
          case 'events': return spot.category === 'event';
          case 'with-images': return spot.museumImages && spot.museumImages.length > 0;
          case 'ai-generated': return spot.source === 'openai';
          case 'ugc': return spot.source === 'ugc';
          default: return true;
        }
      });
    }

    // Ordinamento
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'images':
          const aImages = a.museumImages?.length || 0;
          const bImages = b.museumImages?.length || 0;
          return bImages - aImages;
        case 'relevance':
        default:
          // Priorità: spots con immagini, poi AI generated, poi UGC
          const aScore = (a.museumImages?.length || 0) * 10 + 
                        (a.source === 'openai' ? 5 : 0) +
                        (a.rating || 0);
          const bScore = (b.museumImages?.length || 0) * 10 + 
                        (b.source === 'openai' ? 5 : 0) +
                        (b.rating || 0);
          return bScore - aScore;
      }
    });

    return sorted;
  }, [spots, searchTerm, sortBy, filterBy]);

  // Statistiche per i filtri
  const stats = useMemo(() => {
    return {
      total: spots.length,
      museums: spots.filter(s => s.category === 'museum').length,
      galleries: spots.filter(s => s.category === 'gallery').length,
      events: spots.filter(s => s.category === 'event').length,
      withImages: spots.filter(s => s.museumImages && s.museumImages.length > 0).length,
      aiGenerated: spots.filter(s => s.source === 'openai').length,
      ugc: spots.filter(s => s.source === 'ugc').length
    };
  }, [spots]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header con ricerca e controlli */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        {/* Barra di ricerca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cerca nei risultati..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2 
              border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-orange-500 focus:border-transparent
              text-sm
            "
          />
        </div>

        {/* Controlli filtri e ordinamento */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Filtri */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                transition-colors duration-200
                ${showFilters 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              Filtri
            </button>

            {/* Ordinamento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="
                px-3 py-1.5 text-sm border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-orange-500 focus:border-transparent
                bg-white
              "
            >
              <option value="relevance">Rilevanza</option>
              <option value="name">Nome A-Z</option>
              <option value="rating">Rating</option>
              <option value="distance">Distanza</option>
              <option value="images">Con Immagini</option>
            </select>
          </div>

          {/* Modalità visualizzazione */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`
                p-1.5 rounded transition-colors duration-200
                ${viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
              aria-label="Vista lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`
                p-1.5 rounded transition-colors duration-200
                ${viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
              aria-label="Vista griglia"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pannello filtri espandibile */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'all' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                Tutti ({stats.total})
              </button>
              <button
                onClick={() => setFilterBy('museums')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'museums' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                🏛️ Musei ({stats.museums})
              </button>
              <button
                onClick={() => setFilterBy('galleries')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'galleries' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                🎨 Gallerie ({stats.galleries})
              </button>
              <button
                onClick={() => setFilterBy('events')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'events' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                🎭 Eventi ({stats.events})
              </button>
              <button
                onClick={() => setFilterBy('with-images')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'with-images' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                📸 Con Immagini ({stats.withImages})
              </button>
              <button
                onClick={() => setFilterBy('ai-generated')}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${filterBy === 'ai-generated' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                🤖 AI ({stats.aiGenerated})
              </button>
            </div>
          </div>
        )}

        {/* Contatore risultati */}
        <div className="mt-3 text-sm text-gray-600">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento risultati...
            </div>
          ) : (
            <span>
              {filteredAndSortedSpots.length} di {spots.length} risultati
              {searchTerm && ` per "${searchTerm}"`}
            </span>
          )}
        </div>
      </div>

      {/* Lista/Griglia risultati */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-gray-600">Caricamento spots...</p>
            </div>
          </div>
        ) : filteredAndSortedSpots.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun risultato trovato
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `Nessun spot corrisponde a "${searchTerm}"`
                  : 'Prova a modificare i filtri di ricerca'
                }
              </p>
              {(searchTerm || filterBy !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                  className="
                    px-4 py-2 bg-orange-500 text-white rounded-lg
                    hover:bg-orange-600 transition-colors duration-200
                  "
                >
                  Cancella filtri
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`
            p-4 
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' 
              : 'space-y-4'
            }
          `}>
            {filteredAndSortedSpots.map((spot) => (
              <EnhancedSpotCard
                key={spot.id}
                spot={spot}
                onSpotClick={onSpotClick}
                onNavigate={onSpotNavigate}
                onFavorite={onSpotFavorite}
                onShare={onSpotShare}
                isSelected={selectedSpotId === spot.id}
                showEnrichment={enableEnrichment}
                className={viewMode === 'grid' ? 'h-fit' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotsList;

