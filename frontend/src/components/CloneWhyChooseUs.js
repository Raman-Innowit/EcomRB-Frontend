import React from 'react';

const WHY_CHOOSE_US = [
  {
    title: 'Commitment to Quality',
    description: 'Our topmost priority is to focus on quality. We take great care in sourcing our ayurvedic/natural herbs from various regions in India and around the world, and we subject them to thorough testing for active compounds, impurities, or contaminations.',
    image: '/assets/commitment-to-quality.jpg',
  },
  {
    title: 'Embraced by science',
    description: 'our product has no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence as we prioritise your health as naturally and effectively as possible.',
    image: '/assets/embraced-by-science.jpg',
  },
  {
    title: 'Transparent Practices',
    description: 'Transparency is the key to build trust. We commit to mentioning the ingredients with detailed information. Our manufacturing process will be mentioned.',
    image: '/assets/transparent-practices.jpg',
  },
  {
    title: 'Customer Satisfaction',
    description: 'Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives, and we ensure that our herbal supplements are highly potent and rich in nutrients.',
    image: '/assets/customer-satisfaction.jpg',
  },
];

const CloneWhyChooseUs = () => {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Blurred background image */}
      <div className="absolute inset-0">
        <img 
          src="/assets/why-bg.jpg" 
          alt="background pattern" 
          className="w-full h-full object-cover"
          style={{ filter: 'blur(2px)' }}
        />
      </div>
      
      {/* Dark green overlay */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(22, 101, 52, 0.85)' }}
      />

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <div 
            className="text-xl md:text-2xl mb-4 font-serif italic"
            style={{ color: '#86efac', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            - Est. 2021 -
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Why choose us?
          </h2>
          <div className="max-w-3xl mx-auto space-y-3 text-white text-base md:text-lg leading-relaxed">
            <p>
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p>
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </div>
        </div>

        {/* Value Proposition Cards - White with green border - 4 in one line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {WHY_CHOOSE_US.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow border-2"
              style={{ borderColor: '#15803d' }}
            >
              {/* Image/Logo */}
              <div className="mb-4 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-20 h-20 md:w-24 md:h-24 object-contain"
                />
              </div>
              
              {/* Title */}
              <h3 className="text-gray-900 font-extrabold text-lg md:text-xl mb-3 text-center">
                {item.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-700 text-xs md:text-sm leading-relaxed text-center">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CloneWhyChooseUs;


