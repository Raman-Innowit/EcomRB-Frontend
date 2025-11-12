import React from 'react';

const CloneAbout = () => {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Left: Text */}
        <div>
          <div className="text-green-900 italic font-serif text-xl mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            - About Us
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-green-900">
            Welcome to Health Care
            <br />
            Nutrition
          </h2>
          <div className="mt-6 space-y-4 text-gray-700 leading-7 text-[15px] md:text-base max-w-2xl">
            <p>
              For creating affordable and efficacious products, RasayanaBio is here with premium formulations. In the year 2021, Dr Monisha and Dr Raman, a sibling duo, came up with an idea and, after a lot of brainstorming, launched a herbal brand with two official names in the year 2023: "RasayanaBio" and "Nutra's Bounty".
            </p>
            <p>
              Quality is our top-most priority; that's why we make our products in an FDA-approved facility and put them through a thorough and strict testing process to guarantee their safety and purity.
            </p>
            <p>
              Nutra's Bounty botanical formulas are a mixture of "Ayus and Veda", as they are free from chemicals, GMOs, artificial colouring, scents, and fillers. Our products are 100% vegan, as we do not support animal exploitation.
            </p>
          </div>
          <div className="mt-8">
            <a href="#about" className="inline-block bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-lg font-semibold shadow-sm">
              READ MORE
            </a>
          </div>
        </div>

        {/* Right: Image with play button overlay */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img
              src="/assets/about-capsules.png"
              alt="wooden plate with herbal capsules"
              className="w-full h-auto object-cover"
            />
          </div>
          {/* Play button */}
          <button
            aria-label="Play"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white text-green-700 shadow-lg grid place-items-center hover:scale-105 transition"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CloneAbout;


