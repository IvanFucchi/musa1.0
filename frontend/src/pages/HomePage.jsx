import React from 'react';
import Hero from '../components/layout/sections/Hero'
import Cards from '../components/layout/sections/Cards'
import Suggestions from '../components/layout/sections/Suggestions'
import Banner from '../components/layout/sections/Banner'

const HomePage = () => {
  return (
    <>
      <Hero/>
      <Cards/>
      <Suggestions/>
      <Banner/>
    </>
  );
};

export default HomePage;
