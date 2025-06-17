// MuseumImageModal.jsx - Modal per visualizzazione full-size delle opere
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Calendar,
  Palette,
  MapPin,
  Info,
  Download,
  Share2
} from 'lucide-react';

const MuseumImageModal = ({ 
  artwork, 
  allArtworks = [], 
  spotName = "",
  isOpen = false, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Trova l'indice dell'artwork corrente
  useEffect(() => {
    if (artwork && allArtworks.length > 0) {
      const index = allArtworks.findIndex(art => 
        art.source === artwork.source && art.id === artwork.id
      );
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [artwork, allArtworks]);

  // Reset stati quando cambia artwork
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentIndex]);

  // Gestione keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Blocca scroll del body quando modal è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentArtwork = allArtworks[currentIndex] || artwork;

  const goToPrevious = () => {
    if (allArtworks.length > 1) {
      setCurrentIndex((prev) => 
        prev === 0 ? allArtworks.length - 1 : prev - 1
      );
    }
  };

  const goToNext = () => {
    if (allArtworks.length > 1) {
      setCurrentIndex((prev) => 
        prev === allArtworks.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentArtwork.objectURL) {
      try {
        await navigator.share({
          title: currentArtwork.title,
          text: `${currentArtwork.title} di ${currentArtwork.artist}`,
          url: currentArtwork.objectURL
        });
      } catch (err) {
        console.log('Sharing failed:', err);
      }
    } else {
      // Fallback: copia URL negli appunti
      if (currentArtwork.objectURL) {
        navigator.clipboard.writeText(currentArtwork.objectURL);
      }
    }
  };

  const getMuseumName = (source) => {
    switch (source) {
      case 'met': return 'Metropolitan Museum of Art';
      case 'aic': return 'Art Institute of Chicago';
      case 'rijks': return 'Rijksmuseum';
      default: return 'Museo';
    }
  };

  const getMuseumIcon = (source) => {
    switch (source) {
      case 'met': return '🏛️';
      case 'aic': return '🎨';
      case 'rijks': return '🇳🇱';
      default: return '🏛️';
    }
  };

  if (!isOpen || !currentArtwork) return null;

  return (
    <div 
      className="
        fixed inset-0 z-50 
        bg-black bg-opacity-90 
        flex items-center justify-center
        p-4 sm:p-6
      "
      onClick={handleBackdropClick}
    >
      <div className="
        relative max-w-6xl max-h-full w-full
        bg-white rounded-lg overflow-hidden
        flex flex-col sm:flex-row
        shadow-2xl
      ">
        {/* Pulsante chiudi */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10
            bg-black bg-opacity-50 text-white
            rounded-full p-2 hover:bg-opacity-70
            transition-all duration-200
          "
          aria-label="Chiudi modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Controlli navigazione */}
        {allArtworks.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="
                absolute left-4 top-1/2 transform -translate-y-1/2 z-10
                bg-black bg-opacity-50 text-white
                rounded-full p-2 hover:bg-opacity-70
                transition-all duration-200
                hidden sm:block
              "
              aria-label="Immagine precedente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="
                absolute right-16 top-1/2 transform -translate-y-1/2 z-10
                bg-black bg-opacity-50 text-white
                rounded-full p-2 hover:bg-opacity-70
                transition-all duration-200
                hidden sm:block
              "
              aria-label="Immagine successiva"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Sezione immagine */}
        <div className="
          flex-1 relative 
          bg-gray-100 
          flex items-center justify-center
          min-h-64 sm:min-h-96
        ">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {!imageError && currentArtwork.primaryImage && (
            <img
              src={currentArtwork.primaryImage}
              alt={`${currentArtwork.title} di ${currentArtwork.artist}`}
              className={`
                max-w-full max-h-full object-contain
                transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {imageError && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Info className="w-12 h-12 mb-2" />
              <p>Immagine non disponibile</p>
            </div>
          )}

          {/* Indicatore posizione */}
          {allArtworks.length > 1 && (
            <div className="
              absolute bottom-4 left-1/2 transform -translate-x-1/2
              bg-black bg-opacity-50 text-white
              px-3 py-1 rounded-full text-sm
            ">
              {currentIndex + 1} di {allArtworks.length}
            </div>
          )}
        </div>

        {/* Pannello informazioni */}
        <div className="
          w-full sm:w-80 
          bg-white p-6 
          overflow-y-auto
          flex flex-col
        ">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentArtwork.title}
            </h2>
            {currentArtwork.artist && (
              <p className="text-lg text-gray-700 mb-2">
                {currentArtwork.artist}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">
                {getMuseumIcon(currentArtwork.source)}
              </span>
              <span>{getMuseumName(currentArtwork.source)}</span>
            </div>
          </div>

          {/* Metadati */}
          <div className="space-y-3 mb-6">
            {currentArtwork.date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Data</div>
                  <div className="text-sm text-gray-600">{currentArtwork.date}</div>
                </div>
              </div>
            )}

            {currentArtwork.medium && (
              <div className="flex items-start gap-3">
                <Palette className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Tecnica</div>
                  <div className="text-sm text-gray-600">{currentArtwork.medium}</div>
                </div>
              </div>
            )}

            {currentArtwork.dimensions && (
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Dimensioni</div>
                  <div className="text-sm text-gray-600">{currentArtwork.dimensions}</div>
                </div>
              </div>
            )}

            {currentArtwork.repository && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Collezione</div>
                  <div className="text-sm text-gray-600">{currentArtwork.repository}</div>
                </div>
              </div>
            )}
          </div>

          {/* Match score */}
          {currentArtwork.matchScore && (
            <div className="mb-6 p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-1">
                Rilevanza per "{spotName}"
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentArtwork.matchScore * 100}%` }}
                  />
                </div>
                <span className="text-sm text-green-700 font-medium">
                  {(currentArtwork.matchScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Azioni */}
          <div className="mt-auto space-y-3">
            {/* Controlli mobile per navigazione */}
            {allArtworks.length > 1 && (
              <div className="flex gap-2 sm:hidden">
                <button
                  onClick={goToPrevious}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2 bg-gray-100 text-gray-700
                    rounded-lg hover:bg-gray-200
                    transition-colors duration-200
                  "
                >
                  <ChevronLeft className="w-4 h-4" />
                  Precedente
                </button>
                <button
                  onClick={goToNext}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2 bg-gray-100 text-gray-700
                    rounded-lg hover:bg-gray-200
                    transition-colors duration-200
                  "
                >
                  Successiva
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Link al museo */}
            {currentArtwork.objectURL && (
              <a
                href={currentArtwork.objectURL}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-full flex items-center justify-center gap-2
                  px-4 py-3 bg-orange-500 text-white
                  rounded-lg hover:bg-orange-600
                  transition-colors duration-200
                  font-medium
                "
              >
                <ExternalLink className="w-4 h-4" />
                Vedi nel Museo
              </a>
            )}

            {/* Azioni secondarie */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2 bg-gray-100 text-gray-700
                  rounded-lg hover:bg-gray-200
                  transition-colors duration-200
                "
              >
                <Share2 className="w-4 h-4" />
                Condividi
              </button>
              
              {currentArtwork.isPublicDomain && currentArtwork.primaryImage && (
                <a
                  href={currentArtwork.primaryImage}
                  download
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2 bg-gray-100 text-gray-700
                    rounded-lg hover:bg-gray-200
                    transition-colors duration-200
                  "
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuseumImageModal;

