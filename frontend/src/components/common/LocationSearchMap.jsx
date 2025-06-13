import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button"

// prova bottone con icona
import { MapPin } from "lucide-react"; // icona geolocalizzazione


const MAPBOX_TOKEN = 'pk.eyJ1IjoiaXZhbi1mdWNjaGkiLCJhIjoiY21iY2tjaWt4MHJjdzJzc2F1em5scXI5aiJ9.eV_JXLtKNGzFIvsvXBV8FQ';


const LocationSearchMap = ({ onSearch: propSearch }) => {
  const { handleSearch } = useAuth();
  const onSearch = propSearch || handleSearch;

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (value.length < 3) return setSuggestions([]);

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=place`
    );
    const data = await res.json();
    setSuggestions(data.features || []);
  };

  const handlePlaceSelect = (place) => {
    const [lng, lat] = place.center;
    setSuggestions([]);
    setSearchText(place.place_name);
    onSearch({ center: [lng, lat], zoom: 12 });
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      onSearch({ center: [longitude, latitude], zoom: 12 });
    });
  };

  return (
    <div className="flex items-center gap-2 text-gray-700">
      <div className="relative">


        <div className="relative w-full max-w-md">
          {/* Input vero e proprio, con padding-right extra per lo spazio dell’icona */}
          <Input
            type="text"
            value={searchText}
            onChange={handleInputChange}
            placeholder="Search for a city..."
            className="pr-10"     // spazio a destra per l’icona
          />

          {/* Icona cliccabile, posizionata assoluta */}
          <button
            type="button"
            onClick={useMyLocation}
            className="absolute inset-y-0 right-0 flex items-center pr-2"
            aria-label="Use my location"
          >
            <MapPin className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {suggestions.length > 0 && (
          <ul className="bg-white border rounded shadow max-h-64 overflow-y-auto absolute top-12 left-0 w-full z-20">
            {suggestions.map((place) => (
              <li
                key={place.id}
                onClick={() => handlePlaceSelect(place)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {place.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default LocationSearchMap;
