// MuseumImageGallery.jsx - Componente galleria immagini museo per le card
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, ExternalLink } from 'lucide-react';
import MuseumImageThumbnail from './MuseumImageThumbnail';
import MuseumImageModal from './MuseumImageModal';

const MuseumImageGallery = ({ 
  museumImages = [], 
  spotName = "",
  className = "",
  maxVisible = 3,
  showControls = true 
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  // Aggiorna stato scroll
  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, [museumImages]);

  // Gestione scroll
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -80, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 80, behavior: 'smooth' });
    }
  };

  // Gestione click su immagine
  const handleImageClick = (artwork) => {
    setSelectedImage(artwork);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Se non ci sono immagini, non renderizzare nulla
  if (!museumImages || museumImages.length === 0) {
    return null;
  }

  // Filtra solo immagini valide
  const validImages = museumImages.filter(img => 
    img.primaryImage || img.primaryImageSmall
  );

  if (validImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`museum-gallery ${className}`}>
        {/* Header della galleria */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-medium text-gray-900">
              Opere Correlate
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {validImages.length}
            </span>
          </div>
          
          {/* Controlli scroll per desktop */}
          {showControls && validImages.length > maxVisible && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`
                  p-1 rounded-full transition-colors duration-200
                  ${canScrollLeft 
                    ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50' 
                    : 'text-gray-300 cursor-not-allowed'
                  }
                `}
                aria-label="Scorri a sinistra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`
                  p-1 rounded-full transition-colors duration-200
                  ${canScrollRight 
                    ? 'text-gray-600 hover:text-orange-500 hover:bg-orange-50' 
                    : 'text-gray-300 cursor-not-allowed'
                  }
                `}
                aria-label="Scorri a destra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Container scrollabile delle thumbnail */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="
              flex gap-2 overflow-x-auto scrollbar-hide
              pb-2 scroll-smooth
              sm:overflow-x-hidden sm:pb-0
            "
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: { display: 'none' }
            }}
          >
            {validImages.map((artwork, index) => (
              <div key={`${artwork.source}-${artwork.id}-${index}`} className="flex-shrink-0">
                <MuseumImageThumbnail
                  artwork={artwork}
                  onImageClick={handleImageClick}
                  size="md"
                  className="transition-transform duration-200"
                />
              </div>
            ))}
          </div>

          {/* Gradient fade per indicare scroll su mobile */}
          {validImages.length > 2 && (
            <>
              <div className="
                absolute top-0 left-0 bottom-2 w-4
                bg-gradient-to-r from-white to-transparent
                pointer-events-none sm:hidden
              " />
              <div className="
                absolute top-0 right-0 bottom-2 w-4
                bg-gradient-to-l from-white to-transparent
                pointer-events-none sm:hidden
              " />
            </>
          )}
        </div>

        {/* Info aggiuntive */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {/* Badge musei rappresentati */}
            {[...new Set(validImages.map(img => img.source))].map(source => (
              <span 
                key={source}
                className="
                  inline-flex items-center px-2 py-1 
                  bg-gray-100 text-gray-600 rounded-full
                  text-xs font-medium
                "
              >
                {source === 'met' ? '🏛️ Met Museum' :
                 source === 'aic' ? '🎨 Art Institute' :
                 source === 'rijks' ? '🇳🇱 Rijksmuseum' : source}
              </span>
            ))}
          </div>

          {/* Link per vedere tutte */}
          {validImages.length > maxVisible && (
            <button
              onClick={() => handleImageClick(validImages[0])}
              className="
                text-orange-500 hover:text-orange-600 
                font-medium transition-colors duration-200
                flex items-center gap-1
              "
            >
              Vedi tutte
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Modal per visualizzazione full-size */}
      {selectedImage && (
        <MuseumImageModal
          artwork={selectedImage}
          allArtworks={validImages}
          spotName={spotName}
          isOpen={!!selectedImage}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default MuseumImageGallery;

