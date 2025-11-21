import React from 'react';
import CloneFooter from '../components/CloneFooter';

const PressRelease = () => {
  const pressCards = [
    {
      id: 1,
      image: '/assets/abp__.jpg',
      title: 'Business Today'
    },
    {
      id: 2,
      image: '/assets/abp__-1.jpg',
      title: 'Entrepreneur Saga'
    },
    {
      id: 3,
      image: '/assets/1-2.jpg',
      title: 'RD Times'
    },
    {
      id: 4,
      image: '/assets/7.jpg',
      title: 'Deccan Business'
    },
    {
      id: 5,
      image: '/assets/6-1.jpg',
      title: 'Republic Bharat'
    },
    {
      id: 6,
      image: '/assets/3-1.jpg',
      title: 'Entrepreneur Saga'
    }
  ];

  const pressCards2 = [
    {
      id: 7,
      image: '/assets/images-3.png',
      title: 'Wow Entrepreneurs'
    },
    {
      id: 8,
      image: '/assets/images-4.png',
      title: 'The Indian Bulletin'
    },
    {
      id: 9,
      image: '/assets/BRLogo-IconTest.jpg',
      title: 'Business Reporter'
    },
    {
      id: 10,
      image: '/assets/4-1.jpg',
      title: 'RD Times'
    },
    {
      id: 11,
      image: '/assets/9.jpg',
      title: 'Money Mania'
    },
    {
      id: 12,
      image: '/assets/2-1.jpg',
      title: 'Business Today'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ color: '#1f2937' }}>
            Press Release
          </h1>

          {/* Press Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pressCards.map((card) => (
              <div
                key={card.id}
                className="group relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:border-green-700 hover:shadow-lg"
                style={{
                  minHeight: '200px',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(22, 163, 74, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Hover Bookmark Triangle */}
                <div 
                  className="absolute top-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '30px solid #16a34a',
                    borderLeft: '30px solid #16a34a',
                    borderRight: '30px solid transparent',
                    borderBottom: '30px solid transparent'
                  }}
                />

                {/* Card Content */}
                <div className="p-6 flex flex-col items-center h-full">
                  <div className="flex-1 flex items-center justify-center mb-4" style={{ minHeight: '120px' }}>
                    <img
                      src={card.image}
                      alt={card.title}
                      className="max-w-full max-h-32 object-contain"
                    />
                  </div>
                  <p className="text-center text-base font-medium" style={{ color: '#2f2f2f', fontSize: '16px', marginTop: 'auto' }}>
                    {card.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Second Press Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
            {pressCards2.map((card) => (
              <div
                key={card.id}
                className="group relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:border-green-700 hover:shadow-lg"
                style={{
                  minHeight: '200px',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(22, 163, 74, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Hover Bookmark Triangle */}
                <div 
                  className="absolute top-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '30px solid #16a34a',
                    borderLeft: '30px solid #16a34a',
                    borderRight: '30px solid transparent',
                    borderBottom: '30px solid transparent'
                  }}
                />

                {/* Card Content */}
                <div className="p-6 flex flex-col items-center h-full">
                  <div className="flex-1 flex items-center justify-center mb-4" style={{ minHeight: '120px' }}>
                    <img
                      src={card.image}
                      alt={card.title}
                      className="max-w-full max-h-32 object-contain"
                    />
                  </div>
                  <p className="text-center text-base font-medium" style={{ color: '#2f2f2f', fontSize: '16px', marginTop: 'auto' }}>
                    {card.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default PressRelease;

