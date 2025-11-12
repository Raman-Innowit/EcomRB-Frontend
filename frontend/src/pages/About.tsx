import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>

      {/* Hero Banner */}
      <div className="relative bg-[#f5f3f0] py-16 px-4 overflow-hidden">
        <div className="absolute left-8 top-8 w-40 h-56 opacity-20">
          <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 Q30 40 35 70 Q40 100 50 130 Q60 100 65 70 Q70 40 50 10Z" 
                  stroke="#1a5f3f" strokeWidth="0.8" fill="none"/>
            <path d="M50 30 L25 50" stroke="#1a5f3f" strokeWidth="0.5"/>
            <path d="M50 50 L20 70" stroke="#1a5f3f" strokeWidth="0.5"/>
            <path d="M50 70 L25 95" stroke="#1a5f3f" strokeWidth="0.5"/>
            <path d="M50 30 L75 50" stroke="#1a5f3f" strokeWidth="0.5"/>
            <path d="M50 50 L80 70" stroke="#1a5f3f" strokeWidth="0.5"/>
            <path d="M50 70 L75 95" stroke="#1a5f3f" strokeWidth="0.5"/>
          </svg>
        </div>

        <div className="absolute left-1/3 top-12 w-32 h-16 opacity-10">
          <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="35" height="20" rx="10" stroke="#1a5f3f" strokeWidth="1.5" fill="none"/>
            <line x1="27.5" y1="15" x2="27.5" y2="35" stroke="#1a5f3f" strokeWidth="1.5"/>
            <rect x="55" y="15" width="35" height="20" rx="10" stroke="#1a5f3f" strokeWidth="1.5" fill="none"/>
            <line x1="72.5" y1="15" x2="72.5" y2="35" stroke="#1a5f3f" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <div className="mb-8 flex items-center gap-3">
                <h2 className="text-4xl font-serif text-[#1a5f3f]" style={{fontFamily: 'Georgia, serif'}}>
                  RasayanaBio
                </h2>
                <span className="text-xs text-[#1a5f3f] border border-[#1a5f3f] rounded-full px-2 py-0.5">TM</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
                About Us
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <a href="/" className="hover:text-[#1a5f3f] transition-colors cursor-pointer">HOME</a>
                <span>&gt;</span>
                <span className="text-[#1a5f3f]">ABOUT US</span>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#1a5f3f] to-[#2d7a52] rounded-3xl shadow-xl p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="50" cy="30" rx="35" ry="45" fill="#fff" transform="rotate(25 50 30)"/>
                    <ellipse cx="60" cy="70" rx="40" ry="50" fill="#fff" transform="rotate(-15 60 70)"/>
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="text-2xl font-serif text-white/90 mb-6" style={{fontFamily: 'Georgia, serif'}}>
                    RasayanaBio
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="text-6xl mb-6 text-center">🌱</div>
                    <h3 className="text-2xl font-bold text-white text-center mb-4">
                      Premium Herbal Solutions
                    </h3>
                    <p className="text-green-50 text-center leading-relaxed">
                      Crafted with care using the finest natural ingredients to support your wellness journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section - Image 1 Layout */}
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="fade-in">
            <p className="text-[#1a5f3f] font-serif italic text-xl mb-4" style={{fontFamily: 'Georgia, serif'}}>
              about us
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Welcome To Rasayana Bio
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              For creating affordable and efficacious products, RasayanaBio is here with premium formulations. In the year 2021, Dr Monisha and Dr Raman, a sibling duo, came up with an idea and, after a lot of brainstorming, launched a herbal brand with two official names in the year 2023: "RasayanaBio" and "Nutra's Bounty". Quality is our top-most priority; that's why we make our products in an FDA-approved facility and put them through a thorough and strict testing process to guarantee their safety and purity. Nutra's Bounty botanical formulas are a mixture of "āyus and Veda", as they are free from chemicals, GMOs, artificial colouring, scents, and fillers. Our products are 100% vegan, as we do not support animal exploitation. With Nutra's Bounty, commence on the path toward a healthy lifestyle, one healthy step at a time. let the natural world's serenity take you into a happy, balanced eternity. We are gratified to provide you with supplements of superior quality and worth, by conjoining the latest revolutions in nutritional science with premium ingredients.
            </p>
          </div>

          <div className="fade-in">
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-12 shadow-xl">
              <div className="absolute top-8 right-8 w-32 h-32 opacity-20">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="30" rx="25" ry="35" fill="#16a34a" transform="rotate(15 50 30)"/>
                  <ellipse cx="50" cy="70" rx="28" ry="38" fill="#22c55e" transform="rotate(-10 50 70)"/>
                </svg>
              </div>
              <div className="absolute bottom-8 left-8 w-24 h-24 opacity-20">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="50" rx="30" ry="40" fill="#15803d" transform="rotate(-25 50 50)"/>
                </svg>
              </div>
              <div className="relative z-10 text-center">
                <div className="text-7xl mb-6">🌿</div>
                <h3 className="text-3xl font-bold text-[#1a5f3f] mb-4">Natural Excellence</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Blending ancient Ayurvedic wisdom with modern scientific validation to create premium herbal formulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section - Image 2 Layout */}
      <div className="relative bg-gradient-to-br from-green-100 via-lime-50 to-green-50 py-20 overflow-hidden">
        {/* Large leaf background */}
        <div className="absolute left-0 top-0 w-96 h-96 opacity-30">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="150" rx="120" ry="180" fill="#4ade80" opacity="0.5" transform="rotate(-35 100 150)"/>
            <ellipse cx="150" cy="200" rx="130" ry="200" fill="#22c55e" opacity="0.4" transform="rotate(-25 150 200)"/>
            <ellipse cx="80" cy="250" rx="100" ry="160" fill="#16a34a" opacity="0.3" transform="rotate(-45 80 250)"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-4 fade-in">
            <p className="text-[#1a5f3f] font-serif italic text-lg mb-2" style={{fontFamily: 'Georgia, serif'}}>
              — est. 2021 —
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why choose us?
            </h2>
            <p className="text-gray-800 text-base max-w-3xl mx-auto mb-3">
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p className="text-gray-800 text-base max-w-4xl mx-auto">
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              {
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                    <path d="M32 8L36 24L32 40L28 24Z" fill="#1a5f3f"/>
                    <circle cx="32" cy="48" r="6" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                    <path d="M20 20L32 28L44 20" stroke="#1a5f3f" strokeWidth="2"/>
                    <path d="M16 32L24 36L32 32" stroke="#1a5f3f" strokeWidth="2"/>
                  </svg>
                ),
                title: "Commitment to Quality",
                desc: "Our topmost priority is to focus on quality. We take great care in sourcing our ayurvedic/natural herbs from various regions in India and around the world, and"
              },
              {
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                    <circle cx="24" cy="28" r="12" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                    <circle cx="24" cy="28" r="6" fill="#1a5f3f"/>
                    <path d="M40 20L48 28L40 36L44 28Z" stroke="#1a5f3f" strokeWidth="2"/>
                    <circle cx="44" cy="44" r="8" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                  </svg>
                ),
                title: "Embraced by science",
                desc: "our product has no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence as we prioritise your health as naturally and"
              },
              {
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                    <path d="M32 12C32 12 20 20 20 32C20 38 24 44 32 44C40 44 44 38 44 32C44 20 32 12 32 12Z" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                    <path d="M28 32L32 44L36 32" fill="#1a5f3f"/>
                    <circle cx="32" cy="24" r="3" fill="#1a5f3f"/>
                  </svg>
                ),
                title: "Transparent Practices",
                desc: "Transparency is the key to build trust. We commit to mentioning the ingredients with detailed information. Our manufacturing process will be mentioned."
              },
              {
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="24" r="10" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                    <path d="M20 40C20 35 25 32 32 32C39 32 44 35 44 40L44 48L20 48Z" stroke="#1a5f3f" strokeWidth="2" fill="none"/>
                    <path d="M48 16L52 20L48 24" stroke="#1a5f3f" strokeWidth="2"/>
                    <circle cx="50" cy="12" r="2" fill="#1a5f3f"/>
                  </svg>
                ),
                title: "Customer Satisfaction",
                desc: "Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives, and we ensure our herbal supplements are highly potent and"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all fade-in">
                <div className="flex justify-center mb-6 text-[#1a5f3f]">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision Section - Image 3 Layout */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-gray-100 p-12 fade-in">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Mission</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Our mission is to grow in the nutraceuticals market while maintaining our core beliefs and providing our clients with the purest form of "Ayus and Vedas."
            </p>
          </div>
          <div className="bg-[#1a5f3f] p-12 fade-in" style={{clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)'}}>
            <h2 className="text-4xl font-bold text-white mb-6">Vision</h2>
            <p className="text-green-50 text-base leading-relaxed">
              Our vision is to promote sustainability through our herbal formulations and to build a deeper connection between people and the environment.
            </p>
          </div>
        </div>
      </div>

      {/* Our History Timeline - Image 3 Layout */}
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-16 fade-in">
          <p className="text-[#1a5f3f] font-serif italic text-xl mb-2" style={{fontFamily: 'Georgia, serif'}}>
            — est. 2021 —
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800">Our History</h2>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 hidden md:block"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { year: "2021", title: "Idealization", desc: "" },
              { year: "2022-2023", title: "Investigating and generating ideas", desc: "" },
              { year: "2023", title: "Introducing Nutra's Bounty", desc: "" },
              { year: "2024", title: "Initial Stage of Product Launch", desc: "" }
            ].map((item, idx) => (
              <div key={idx} className="text-center fade-in relative">
                <div className="w-12 h-12 mx-auto mb-6 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center relative z-10">
                  <div className="w-4 h-4 bg-[#1a5f3f] rounded-full"></div>
                </div>
                <h3 className="text-3xl font-bold text-[#1a5f3f] mb-3" style={{fontFamily: 'Georgia, serif'}}>
                  {item.year}
                </h3>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {item.title}
                </h4>
                {item.desc && <p className="text-gray-600 text-sm">{item.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;