import React from 'react';

const categories = [
  {
    label: 'Immunity Booster',
    color: '#f97316',
    img: '/assets/cat-immunity.png',
  },
  {
    label: 'Sleep Support',
    color: '#84cc16',
    img: '/assets/cat-sleep.png',
  },
  {
    label: 'Stress and Anxiety',
    color: '#14b8a6',
    img: '/assets/cat-stress.png',
  },
  {
    label: "Men's Health",
    color: '#0ea5e9',
    img: '/assets/cat-men.png',
  },
  {
    label: "Women's Health",
    color: '#ec4899',
    img: '/assets/cat-women.png',
  },
  {
    label: 'Beauty & Radiance',
    color: '#a855f7',
    img: '/assets/cat-beauty.png',
  },
  {
    label: 'Healthy Aging',
    color: '#a16207',
    img: '/assets/cat-aging.png',
  },
  {
    label: 'Sports & Fitness',
    color: '#f97316',
    img: '/assets/cat-sports.png',
  },
];

const CloneCategories = () => {
  return (
    <section className="container mx-auto px-4 py-14 bg-white">
      <div className="text-center mb-10">
        <div className="text-green-900 italic font-serif text-xl md:text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>-Categories-</div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-900 mt-2">Shop By Categories</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
        {categories.map((cat) => (
          <div key={cat.label} className="text-center group">
            <div className="relative inline-block">
              {/* Small leaf badge */}
              <div className="absolute -top-3 -left-3 z-10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2 Q8 4 6 8 Q4 12 6 16 Q8 20 12 18 Q16 20 18 16 Q20 12 18 8 Q16 4 12 2 Z" fill={cat.color} stroke={cat.color} strokeWidth="1"/>
                  <path d="M12 4 Q10 5 9 7 Q8 9 9 11 Q10 13 12 12 Q14 13 15 11 Q16 9 15 7 Q14 5 12 4 Z" fill="white" opacity="0.35"/>
                </svg>
              </div>
              {/* Icon ring */}
              <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:-translate-y-1" style={{ boxShadow: `inset 0 0 0 4px ${cat.color}20, 0 6px 16px rgba(0,0,0,0.06)` }}>
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 3px ${cat.color}` }} />
                <img src={cat.img} alt={cat.label} className="relative w-14 h-14 md:w-16 md:h-16 object-contain" />
              </div>
            </div>
            <div className="mt-5 font-semibold text-green-900 text-base md:text-lg tracking-tight">{cat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CloneCategories;


