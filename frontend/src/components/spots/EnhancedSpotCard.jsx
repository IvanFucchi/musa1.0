// EnhancedSpotCard.jsx - Card spot arricchita con immagini museo
import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Euro, 
  ExternalLink, 
  Heart,
  Share2,
  Navigation,
  Star,
  Info
} from 'lucide-react';
import MuseumImageGallery from './MuseumImageGallery';

const EnhancedSpotCard = ({ 
  spot, 
  onSpotClick, 
  onNavigate,
  onFavorite,
  onShare,
  className = "",
  isSelected = false,
  showEnrichment = true 
}) => {
  const [isFavorited, setIsFavorited] = useState(spot.isFavorited || false);
  const [imageError, setImageError] = useState(false);

  // Gestione click sulla card
  const handleCardClick = (e) => {
    // Evita il click se si sta interagendo con elementi interni
    if (e.target.closest('.museum-gallery') || 
        e.target.closest('button') || 
        e.target.closest('a')) {
      return;
    }
    
    if (onSpotClick) {
      onSpotClick(spot);
    }
  };

  // Gestione favoriti
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(spot, !isFavorited);
    }
  };

  // Gestione condivisione
  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(spot);
    }
  };

  // Gestione navigazione
  const handleNavigateClick = (e) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(spot);
    }
  };

  // Determina il mood color
  const getMoodColor = (mood) => {
    const moodColors = {
      contemplativo: 'bg-blue-100 text-blue-800',
      romantico: 'bg-pink-100 text-pink-800',
      energico: 'bg-orange-100 text-orange-800',
      mistico: 'bg-purple-100 text-purple-800',
      drammatico: 'bg-red-100 text-red-800',
      sereno: 'bg-green-100 text-green-800'
    };
    return moodColors[mood] || 'bg-gray-100 text-gray-800';
  };

  // Formatta il prezzo
  const formatPrice = (price) => {
    if (!price) return null;
    if (price.toLowerCase().includes('gratuito') || price === '€0') {
      return 'Gratuito';
    }
    return price;
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg
        transition-all duration-300 ease-in-out
        cursor-pointer border border-gray-200
        ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Immagine principale del luogo (se disponibile) */}
      {spot.mainImage && !imageError && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={spot.mainImage}
            alt={spot.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay con azioni rapide */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleFavoriteClick}
              className={`
                p-2 rounded-full backdrop-blur-sm transition-all duration-200
                ${isFavorited 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                }
              `}
              aria-label={isFavorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShareClick}
              className="
                p-2 rounded-full bg-white bg-opacity-80 text-gray-700
                backdrop-blur-sm hover:bg-opacity-100
                transition-all duration-200
              "
              aria-label="Condividi"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Badge categoria */}
          <div className="absolute bottom-3 left-3">
            <span className="
              px-2 py-1 bg-black bg-opacity-60 text-white text-xs
              rounded-full backdrop-blur-sm font-medium
            ">
              {spot.category === 'museum' ? '🏛️ Museo' :
               spot.category === 'gallery' ? '🎨 Galleria' :
               spot.category === 'event' ? '🎭 Evento' :
               spot.category}
            </span>
          </div>
        </div>
      )}

      {/* Contenuto della card */}
      <div className="p-4">
        {/* Header con titolo e rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {spot.name}
          </h3>
          
          {spot.rating && (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {spot.rating}
              </span>
            </div>
          )}
        </div>

        {/* Descrizione */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {spot.description}
        </p>

        {/* Tags mood e genere */}
        <div className="flex flex-wrap gap-2 mb-3">
          {spot.mood && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${getMoodColor(spot.mood)}
            `}>
              {spot.mood}
            </span>
          )}
          
          {spot.musicGenre && (
            <span className="
              px-2 py-1 text-xs font-medium rounded-full
              bg-yellow-100 text-yellow-800
            ">
              🎵 {spot.musicGenre}
            </span>
          )}

          {spot.source === 'openai' && (
            <span className="
              px-2 py-1 text-xs font-medium rounded-full
              bg-blue-100 text-blue-800
            ">
              🤖 AI Generated
            </span>
          )}
        </div>

        {/* Galleria immagini museo */}
        {showEnrichment && spot.museumImages && spot.museumImages.length > 0 && (
          <div className="mb-4">
            <MuseumImageGallery
              museumImages={spot.museumImages}
              spotName={spot.name}
              maxVisible={3}
            />
          </div>
        )}

        {/* Stato arricchimento (per debug/admin) */}
        {showEnrichment && spot.imageEnrichmentStatus && process.env.NODE_ENV === 'development' && (
          <div className="mb-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>
                Enrichment: {spot.imageEnrichmentStatus}
                {spot.totalMatchesFound && ` (${spot.totalMatchesFound} matches)`}
              </span>
            </div>
          </div>
        )}

        {/* Informazioni pratiche */}
        <div className="space-y-2 mb-4">
          {/* Indirizzo */}
          {spot.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{spot.address}</span>
            </div>
          )}

          {/* Orari */}
          {spot.openingHours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span>{spot.openingHours}</span>
            </div>
          )}

          {/* Prezzo */}
          {spot.price && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Euro className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className={formatPrice(spot.price) === 'Gratuito' ? 'text-green-600 font-medium' : ''}>
                {formatPrice(spot.price)}
              </span>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex gap-2">
          {/* Navigazione */}
          <button
            onClick={handleNavigateClick}
            className="
              flex-1 flex items-center justify-center gap-2
              px-3 py-2 bg-orange-500 text-white
              rounded-lg hover:bg-orange-600
              transition-colors duration-200
              text-sm font-medium
            "
          >
            <Navigation className="w-4 h-4" />
            Naviga
          </button>

          {/* Link esterno (se disponibile) */}
          {spot.website && (
            <a
              href={spot.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="
                flex items-center justify-center
                px-3 py-2 bg-gray-100 text-gray-700
                rounded-lg hover:bg-gray-200
                transition-colors duration-200
                text-sm
              "
              aria-label="Visita sito web"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSpotCard;

