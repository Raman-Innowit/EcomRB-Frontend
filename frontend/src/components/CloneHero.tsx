import React from 'react';

const CloneHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-green-500">
        <div className="container mx-auto px-4 py-16 text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Premium Quality Products
          </span>
          <h1 className="font-extrabold text-5xl md:text-6xl font-serif">Shop</h1>
          <div className="mt-2 text-white/90">Home · Products</div>
        </div>
      </div>
    </section>
  );
};

export default CloneHero;


