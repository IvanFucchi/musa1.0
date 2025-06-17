// MuseumImageThumbnail.jsx - Componente per singola thumbnail di opera museo
import React, { useState } from 'react';
import { ExternalLink, Info, Loader2 } from 'lucide-react';

const MuseumImageThumbnail = ({ 
  artwork, 
  onImageClick, 
  className = "",
  size = "md" 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dimensioni responsive
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20",
    xl: "w-24 h-24"
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleClick = () => {
    if (onImageClick && !imageError) {
      onImageClick(artwork);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Fallback per immagini non disponibili
  if (!artwork.primaryImage && !artwork.primaryImageSmall) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          bg-gray-100 border-2 border-dashed border-gray-300 
          rounded-lg flex items-center justify-center
          ${className}
        `}
      >
        <Info className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div 
      className={`
        relative group cursor-pointer
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Visualizza ${artwork.title} di ${artwork.artist}`}
    >
      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className={`
          ${sizeClasses[size]} 
          bg-gray-200 rounded-lg animate-pulse
          flex items-center justify-center
        `}>
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Immagine principale */}
      {!imageError && (
        <img
          src={artwork.primaryImageSmall || artwork.primaryImage}
          alt={`${artwork.title} di ${artwork.artist}`}
          className={`
            ${sizeClasses[size]} 
            object-cover rounded-lg border border-gray-200
            transition-all duration-200 ease-in-out
            group-hover:scale-105 group-hover:shadow-lg
            group-focus:scale-105 group-focus:shadow-lg
            group-focus:ring-2 group-focus:ring-orange-500 group-focus:ring-offset-2
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Fallback per errori di caricamento */}
      {imageError && imageLoaded && (
        <div className={`
          ${sizeClasses[size]} 
          bg-gray-100 border border-gray-300 rounded-lg
          flex items-center justify-center
        `}>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Overlay con informazioni al hover */}
      <div className="
        absolute inset-0 bg-black bg-opacity-0 
        group-hover:bg-opacity-60 
        transition-all duration-200 ease-in-out
        rounded-lg flex items-end justify-center
        opacity-0 group-hover:opacity-100
      ">
        <div className="
          text-white text-xs p-1 text-center
          transform translate-y-2 group-hover:translate-y-0
          transition-transform duration-200 ease-in-out
        ">
          <div className="font-medium truncate max-w-full">
            {artwork.title}
          </div>
          {artwork.artist && (
            <div className="text-gray-200 truncate">
              {artwork.artist}
            </div>
          )}
        </div>
      </div>

      {/* Badge museo */}
      <div className="
        absolute -top-1 -right-1 
        bg-orange-500 text-white text-xs 
        rounded-full w-5 h-5 
        flex items-center justify-center
        font-bold uppercase
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
      ">
        {artwork.source === 'met' ? 'M' : 
         artwork.source === 'aic' ? 'A' : 
         artwork.source === 'rijks' ? 'R' : '?'}
      </div>

      {/* Indicatore match score */}
      {artwork.matchScore && artwork.matchScore > 0.8 && (
        <div className="
          absolute -bottom-1 -left-1
          bg-green-500 rounded-full w-3 h-3
          border-2 border-white
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        " 
        title={`Match score: ${(artwork.matchScore * 100).toFixed(0)}%`}
        />
      )}
    </div>
  );
};

export default MuseumImageThumbnail;

