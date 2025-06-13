import React, { useState, useEffect } from 'react';
import { Button } from '../shad-ui/button';
import { Slider } from '../shad-ui/slider';
import { Label } from '../shad-ui/label';
import { Input } from '../shad-ui/input';
import { X } from 'lucide-react'; // Assicurati di avere lucide-react installato

const FilterDrawer = ({ isOpen, onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState({
    query: '',
    type: 'all',
    category: 'all',
    distance: 10,
    mood: '',
    musicGenre: ''
  });
  
  // Gestisci l'apertura/chiusura del drawer
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Impedisci lo scroll del body quando il drawer è aperto
      document.body.style.overflow = 'hidden';
    } else {
      // Aggiungi un ritardo per l'animazione di chiusura
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = 'auto';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (value) => {
    setFilters(prev => ({ ...prev, distance: value[0] }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  };

  // Se il drawer non è visibile, non renderizzare nulla
  if (!isVisible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay scuro */}
      <div 
        className="absolute inset-0 bg-black/80" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-3/4 max-w-md bg-zinc-900 p-6 text-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header con pulsante di chiusura */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Filtri di ricerca</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800"
            aria-label="Chiudi"
          >
            <X size={24} />
          </button>
        </div>
        
        <p className="text-zinc-400 mb-6">Personalizza la tua ricerca con filtri avanzati</p>
        
        <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Query di ricerca */}
          <div className="space-y-2">
            <Label htmlFor="query">Ricerca</Label>
            <Input
              id="query"
              name="query"
              placeholder="Cosa stai cercando?"
              value={filters.query}
              onChange={handleChange}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Tipo di spot */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Tutti</option>
              <option value="artwork">Opera d'arte</option>
              <option value="venue">Luogo</option>
              <option value="event">Evento</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Tutte</option>
              <option value="painting">Pittura</option>
              <option value="sculpture">Scultura</option>
              <option value="architecture">Architettura</option>
              <option value="museum">Museo</option>
              <option value="gallery">Galleria</option>
            </select>
          </div>

          {/* Distanza */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="distance">Distanza (km)</Label>
              <span>{filters.distance} km</span>
            </div>
            <Slider
              id="distance"
              min={1}
              max={50}
              step={1}
              value={[filters.distance]}
              onValueChange={handleSliderChange}
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label htmlFor="mood">Atmosfera</Label>
            <Input
              id="mood"
              name="mood"
              placeholder="Es. romantico, rilassante, energico"
              value={filters.mood}
              onChange={handleChange}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Genere musicale */}
          <div className="space-y-2">
            <Label htmlFor="musicGenre">Genere musicale</Label>
            <Input
              id="musicGenre"
              name="musicGenre"
              placeholder="Es. jazz, classica, rock"
              value={filters.musicGenre}
              onChange={handleChange}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleApply}>Applica filtri</Button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
