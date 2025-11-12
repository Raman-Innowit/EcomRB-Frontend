import React from 'react';

const About = () => {
  return (
    <div>
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
      <section className="relative bg-gray-100 py-16 overflow-hidden">
        {/* Background banner image */}
        <div className="absolute inset-0">
          <img
            src="/assets/about-banner.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Section */}
            <div className="relative">
              {/* Leaf illustration - upper left */}
              <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
                <svg viewBox="0 0 100 100" fill="none" stroke="#6b7280" strokeWidth="1">
                  <path d="M50 10 Q30 30 20 50 Q30 70 50 90 Q70 70 80 50 Q70 30 50 10" />
                  <path d="M50 20 L50 80 M30 40 L70 40 M30 60 L70 60" />
                </svg>
              </div>

              {/* Faint watermark text */}
              <div className="absolute top-20 left-10 text-gray-200 text-6xl font-serif italic opacity-10" style={{ fontFamily: 'Georgia, serif' }}>
                  RasayanaBio
              </div>

              {/* Logo with TM */}
              <div className="relative mt-8 mb-6">
                <img
                  src="/assets/about-logo.png"
                  alt="RasayanaBio"
                  className="h-16 w-auto object-contain"
                />
              </div>

              {/* Page Title */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 relative z-10">
                About Us
              </h1>

              {/* Breadcrumbs */}
              <p className="text-gray-600 text-sm relative z-10">
                HOME &gt; ABOUT US
              </p>

              {/* Pill illustrations */}
              <div className="absolute top-40 right-10 opacity-10">
                <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" stroke="#6b7280" strokeWidth="1">
                  <ellipse cx="50" cy="50" rx="30" ry="15" />
                  <line x1="20" y1="50" x2="80" y2="50" />
                </svg>
                <svg className="w-12 h-12 mt-2 ml-4" viewBox="0 0 100 100" fill="none" stroke="#6b7280" strokeWidth="1">
                  <ellipse cx="50" cy="50" rx="25" ry="12" />
                  <line x1="25" y1="50" x2="75" y2="50" />
                </svg>
              </div>
            </div>

            {/* Right Section - Woman with Plant */}
            <div className="relative">
              {/* Dark green frame */}
              <div className="relative bg-green-800 rounded-2xl p-6 overflow-visible">
                {/* White logo inside frame */}
                <div className="absolute top-4 left-4 z-20">
                  <img
                    src="/assets/about-logo.png"
                    alt="RasayanaBio"
                    className="h-8 w-auto object-contain brightness-0 invert"
                  />
                </div>

                {/* Woman with plant image */}
                <div className="relative rounded-lg overflow-visible">
                  <img
                    src="/assets/about-woman.png"
                    alt="Woman with plant"
                    className="w-full h-auto rounded-lg"
                  />
                  
                  {/* Leaves extending beyond frame - decorative overlay */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-80">
                    <svg viewBox="0 0 100 100" fill="#16a34a">
                      <path d="M50 10 Q30 30 20 50 Q30 70 50 90 Q70 70 80 50 Q70 30 50 10" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-16 h-16 opacity-80">
                    <svg viewBox="0 0 100 100" fill="#16a34a">
                      <path d="M50 10 Q30 30 20 50 Q30 70 50 90 Q70 70 80 50 Q70 30 50 10" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section - Image 1 Layout */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Section - Text Content */}
            <div>
              {/* "about us" heading - cursive handwritten style, dark green */}
              <p className="mb-2" style={{ 
                fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive, serif',
                fontSize: '32px',
                color: '#166534',
                fontWeight: 400
              }}>
                about us
              </p>
              
              {/* Main Title - bold sans-serif, very dark grey/black */}
              <h2 className="mb-6" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#2D3748',
                lineHeight: '1.2'
              }}>
                Welcome To Rasayana Bio
              </h2>
              
              {/* Body Paragraph - standard sans-serif, medium grey */}
              <p className="leading-relaxed" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#4A5568',
                fontWeight: 400
              }}>
                For creating affordable and efficacious products, RasayanaBio is here with premium formulations. In the year 2021, Dr Monisha and Dr Raman, a sibling duo, came up with an idea and, after a lot of brainstorming, launched a herbal brand with two official names in the year 2023: "RasayanaBio" and "Nutra's Bounty". Quality is our top-most priority; that's why we make our products in an FDA-approved facility and put them through a thorough and strict testing process to guarantee their safety and purity. Nutra's Bounty botanical formulas are a mixture of "āyus and Veda", as they are free from chemicals, GMOs, artificial colouring, scents, and fillers. Our products are 100% vegan, as we do not support animal exploitation. With Nutra's Bounty, commence on the path toward a healthy lifestyle, one healthy step at a time. let the natural world's serenity take you into a happy, balanced eternity. We are gratified to provide you with supplements of superior quality and worth, by conjoining the latest revolutions in nutritional science with premium ingredients.
              </p>
            </div>

            {/* Right Section - Image */}
            <div className="relative">
              <img
                src="/assets/welcome-image.jpg"
                alt="Welcome - Natural green leaves with wooden blocks"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Image 2 Layout */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold mb-2">— est. 2021 —</p>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why choose us?</h2>
            <p className="text-gray-700 max-w-2xl mx-auto mb-2">
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: "Commitment to Quality",
                desc: "Our topmost priority is to focus on quality. We take great care in sourcing our ayurvedic/natural herbs from various regions in India and around the world, and"
              },
              {
                icon: (
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                ),
                title: "Embraced by science",
                desc: "our product has no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence as we prioritise your health as naturally and"
              },
              {
                icon: (
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: "Transparent Practices",
                desc: "Transparency is the key to build trust. We commit to mentioning the ingredients with detailed information. Our manufacturing process will be mentioned."
              },
              {
                icon: (
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ),
                title: "Customer Satisfaction",
                desc: "Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives, and we ensure our herbal supplements are highly potent and"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 border-2 border-green-500 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-center text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Image 3 Layout */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Mission</h2>
              <p className="text-gray-700">
              Our mission is to grow in the nutraceuticals market while maintaining our core beliefs and providing our clients with the purest form of "Ayus and Vedas."
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Vision</h2>
              <p className="text-gray-700">
              Our vision is to promote sustainability through our herbal formulations and to build a deeper connection between people and the environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our History Timeline - Image 3 Layout */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold mb-2">— est. 2021 —</p>
            <h2 className="text-4xl font-bold text-gray-800">Our History</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              { year: "2021", title: "Idealization", desc: "" },
              { year: "2022-2023", title: "Investigating and generating ideas", desc: "" },
              { year: "2023", title: "Introducing Nutra's Bounty", desc: "" },
              { year: "2024", title: "Initial Stage of Product Launch", desc: "" }
            ].map((item, idx) => (
              <div key={idx} className="mb-8 pb-8 border-b border-gray-300 last:border-b-0">
                <div className="text-2xl font-bold text-green-700 mb-2">{item.year}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                {item.desc && <p className="text-gray-600">{item.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
