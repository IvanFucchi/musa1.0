import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '../shad-ui/command';
import { Button } from '../shad-ui/button';

// Lista di suggerimenti per arte e cultura
const artSuggestions = [
  { value: 'renaissance', label: 'Renaissance Art', category: 'Period' },
  { value: 'impressionism', label: 'Impressionism', category: 'Period' },
  { value: 'cubism', label: 'Cubism', category: 'Period' },
  { value: 'surrealism', label: 'Surrealism', category: 'Period' },
  { value: 'contemporary', label: 'Contemporary Art', category: 'Period' },
  { value: 'painting', label: 'Painting', category: 'Medium' },
  { value: 'sculpture', label: 'Sculpture', category: 'Medium' },
  { value: 'photography', label: 'Photography', category: 'Medium' },
  { value: 'installation', label: 'Installation Art', category: 'Medium' },
  { value: 'performance', label: 'Performance Art', category: 'Medium' },
  { value: 'louvre', label: 'Louvre Museum', category: 'Museum' },
  { value: 'moma', label: 'MoMA', category: 'Museum' },
  { value: 'tate', label: 'Tate Modern', category: 'Museum' },
  { value: 'uffizi', label: 'Uffizi Gallery', category: 'Museum' },
  { value: 'prado', label: 'Prado Museum', category: 'Museum' },
  { value: 'davinci', label: 'Leonardo da Vinci', category: 'Artist' },
  { value: 'vangogh', label: 'Vincent van Gogh', category: 'Artist' },
  { value: 'picasso', label: 'Pablo Picasso', category: 'Artist' },
  { value: 'monet', label: 'Claude Monet', category: 'Artist' },
  { value: 'warhol', label: 'Andy Warhol', category: 'Artist' }
];

const SearchBar = ({ onSearch, onOpenFilters }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Filtra i suggerimenti in base all'input dell'utente
  useEffect(() => {
    if (searchQuery.length < 2) {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = artSuggestions.filter(suggestion => 
      suggestion.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredSuggestions(filtered);
  }, [searchQuery]);

  // Gestisce la selezione di un suggerimento
  const handleSelect = (selectedValue) => {
    const selected = artSuggestions.find(item => item.value === selectedValue);
    if (selected) {
      setSearchQuery(selected.label);
      setIsOpen(false);
      
      // Passa la query di ricerca al componente genitore
      if (onSearch) {
        onSearch({ query: selected.label });
      }
    }
  };

  // Gestisce l'invio della ricerca
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch({ query: searchQuery });
    }
    setIsOpen(false);
  };

  // Raggruppa i suggerimenti per categoria
  const groupedSuggestions = filteredSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {});

  return (
    <div className="relative w-64">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative w-full">
          <Command className="rounded-lg border shadow-md" open={isOpen && filteredSuggestions.length > 0}>
            <CommandInput
              placeholder="Search art, museums..."
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value);
                setIsOpen(true);
              }}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              onFocus={() => setIsOpen(true)}
              className="border-none focus:ring-0"
            />
            {isOpen && filteredSuggestions.length > 0 && (
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(groupedSuggestions).map(([category, suggestions]) => (
                  <CommandGroup key={category} heading={category}>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.value}
                        value={suggestion.value}
                        onSelect={handleSelect}
                      >
                        {suggestion.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            )}
          </Command>
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="ml-2"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="sr-only">Open filters</span>
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;
