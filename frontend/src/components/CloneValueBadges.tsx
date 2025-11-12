import React from 'react';

const BADGES = [
  {
    title: 'Scientific Integrity',
    points: ['Ingredient research and testing in-house', 'Transparent documentation and findings'],
    icon: '/assets/value-scientific.png',
  },
  {
    title: 'Quality Assurance',
    points: ['No synthetic additives, or shortcuts', 'Verified sourcing'],
    icon: '/assets/value-quality.png',
  },
  {
    title: 'Research-Driven Innovation',
    points: ['Clinically tested and standardized formulations', 'Harness the knowledge of our Scientific Experts.'],
    icon: '/assets/value-research.png',
  },
  {
    title: 'Consumer Transparency',
    points: ['QR codes for detailed product info', 'Educational content and open feedback'],
    icon: '/assets/value-transparency.png',
  },
];

const CloneValueBadges: React.FC = () => {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      {/* Background image with hexagon pattern and DNA helix */}
      <div className="absolute inset-0">
        <img src="/assets/value-bg.png" alt="background pattern" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {BADGES.map((b) => (
            <div key={b.title} className="bg-white rounded-lg p-6 md:p-7 shadow-sm">
              {/* Icon - black outline style */}
              <div className="w-14 h-14 md:w-16 md:h-16 mb-4 flex items-center justify-center">
                <img src={b.icon} alt={b.title} className="w-full h-full object-contain" />
              </div>
              {/* Title - bold dark green */}
              <h3 className="text-green-800 font-extrabold text-lg md:text-xl mb-3 tracking-tight">{b.title}</h3>
              {/* Bullet points - dark gray with asterisk */}
              <ul className="space-y-2 text-sm md:text-[15px] text-gray-700">
                {b.points.map((p, idx) => (
                  <li key={idx} className="flex items-start leading-relaxed">
                    <span className="text-gray-700 mr-2 select-none font-semibold">*</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CloneValueBadges;


