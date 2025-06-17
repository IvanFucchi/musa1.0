import React, { useState } from 'react';

// Componente per singola thumbnail di opera museo
const MuseumImageThumbnail = ({ artwork, onImageClick, size = 'md' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = (e) => {
    e.stopPropagation(); // Previene il click sulla card
    if (onImageClick) {
      onImageClick(artwork);
    }
  };

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <span className="text-xs text-gray-400">🖼️</span>
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100`}
      onClick={handleClick}
      title={`${artwork.title} - ${artwork.artist}`}
    >
      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Immagine */}
      <img
        src={artwork.primaryImageSmall || artwork.primaryImage}
        alt={artwork.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Overlay hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-xs">🔍</span>
        </div>
      </div>
      
      {/* Badge museo */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
          {artwork.source?.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

// Componente per galleria immagini museo nelle card
const MuseumImageGallery = ({ museumImages, spotName, maxVisible = 3, onImageClick }) => {
  if (!museumImages || museumImages.length === 0) {
    return null;
  }

  const visibleImages = museumImages.slice(0, maxVisible);
  const remainingCount = museumImages.length - maxVisible;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Opere correlate</h4>
        <span className="text-xs text-gray-500">
          {museumImages.length} {museumImages.length === 1 ? 'opera' : 'opere'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Thumbnails visibili */}
        <div className="flex gap-2">
          {visibleImages.map((artwork, index) => (
            <MuseumImageThumbnail
              key={`${artwork.source}-${artwork.id || index}`}
              artwork={artwork}
              onImageClick={onImageClick}
              size="md"
            />
          ))}
        </div>
        
        {/* Indicatore immagini rimanenti */}
        {remainingCount > 0 && (
          <div 
            className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              // Qui potresti aprire un modal con tutte le immagini
              console.log('Show all images for:', spotName);
            }}
            title={`Vedi altre ${remainingCount} opere`}
          >
            <span className="text-sm font-medium text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
      
      {/* Info musei rappresentati */}
      {museumImages.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {[...new Set(museumImages.map(img => img.source))].map(source => (
            <span 
              key={source}
              className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
            >
              {source === 'met' && '🏛️ Met Museum'}
              {source === 'aic' && '🎨 Art Institute'}
              {source === 'rijks' && '🇳🇱 Rijksmuseum'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal semplice per visualizzazione immagine (opzionale)
const ImageModal = ({ artwork, isOpen, onClose }) => {
  if (!isOpen || !artwork) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{artwork.title}</h3>
              <p className="text-gray-600">{artwork.artist}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <img
            src={artwork.primaryImage}
            alt={artwork.title}
            className="w-full h-auto rounded-lg"
          />
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Museo:</strong> {artwork.repository}</p>
            {artwork.objectDate && <p><strong>Data:</strong> {artwork.objectDate}</p>}
            {artwork.medium && <p><strong>Tecnica:</strong> {artwork.medium}</p>}
            {artwork.objectURL && (
              <a 
                href={artwork.objectURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-600 hover:underline"
              >
                Vedi nel museo →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// MapPinList aggiornato con galleria immagini museo
const MapPinList = ({ pinsData, selectedPinId, onSelectPin }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!pinsData.length) {
    return <p className="p-4 text-gray-500">Nessuno spot da mostrare.</p>;
  }

  const handleImageClick = (artwork) => {
    setSelectedImage(artwork);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <div className="overflow-y-auto md:pe-6 grid grid-cols-1 gap-4 w-full">
        {pinsData.map((pin, idx) => {
          const { id, position: { lat, lng }, title, description, museumImages } = pin;
          const isSelected = id === selectedPinId;
          
          return (
            <div
              key={id}
              onClick={() => onSelectPin(id)}
              className={`
                cursor-pointer
                bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200
                ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
                ${idx === 0 ? 'mt-4' : ''}
                ${idx === pinsData.length - 1 ? 'mb-4' : ''}
              `}
            >
              {/* Contenuto esistente */}
              <h3 className="text-lg font-semibold mb-1">{title}</h3>
              <p className="text-sm mb-2 text-zinc-600">{description}</p>
              
              {/* NUOVO: Galleria immagini museo */}
              <MuseumImageGallery
                museumImages={museumImages}
                spotName={title}
                maxVisible={3}
                onImageClick={handleImageClick}
              />
              
              {/* Link indicazioni esistente */}
              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()} // Previene il click sulla card
                >
                  Indicazioni →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal per visualizzazione immagine */}
      <ImageModal
        artwork={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default MapPinList;

