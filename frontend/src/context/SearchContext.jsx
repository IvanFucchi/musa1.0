import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useState({
    center: [-74.006, 40.7128],
    zoom: 10
  });

  const handleSearch = ({ center, zoom }) => {
    setSearchParams({ center, zoom });
  };

  return (
    <SearchContext.Provider value={{ searchParams, handleSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
