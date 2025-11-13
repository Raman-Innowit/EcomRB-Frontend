import React from 'react';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import CloneFooter from '../components/CloneFooter';
import CloneCategories from '../components/CloneCategories';
import CloneValueBadges from '../components/CloneValueBadges';
import CloneBestSellers from '../components/CloneBestSellers';
import CloneAbout from '../components/CloneAbout';
import CloneWhyChooseUs from '../components/CloneWhyChooseUs';
import Testimonials from '../components/Testimonials';
import LatestNews from '../components/LatestNews';

const CloneHome = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Header />
      <HeroSlider />

      <CloneCategories />
      <CloneValueBadges />
      <CloneBestSellers />
      <CloneAbout />
      <CloneWhyChooseUs />
      <Testimonials />
      <LatestNews />

      <CloneFooter />
    </div>
  );
};

export default CloneHome;


