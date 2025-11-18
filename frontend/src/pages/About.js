import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              <div className="text-gray-600 text-sm relative z-10">
                <Link to="/" className="hover:text-green-700 hover:underline transition-colors">HOME</Link>
                <span className="mx-2">&gt;</span>
                <span className="text-gray-800">ABOUT US</span>
              </div>

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

      {/* Why Choose Us Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img 
            src="/assets/why-choose-us-bg.png" 
            alt="background pattern" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Why choose us?</h2>
            <p className="text-gray-700 max-w-2xl mx-auto mb-2" style={{ fontSize: '16px' }}>
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p className="text-gray-700 max-w-2xl mx-auto" style={{ fontSize: '16px' }}>
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                image: '/assets/commitment-to-quality.jpg',
                title: "Commitment to Quality",
                desc: "Our topmost priority is to focus on quality. We take great care in sourcing our ayurvedic/natural herbs from various regions in India and around the world, and we subject them to thorough testing for active compounds, impurities, or contaminations."
              },
              {
                image: '/assets/embraced-by-science.jpg',
                title: "Embraced by science",
                desc: "our product has no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence as we prioritise your health as naturally and effectively as possible."
              },
              {
                image: '/assets/transparent-practices.jpg',
                title: "Transparent Practices",
                desc: "Transparency is the key to build trust. We commit to mentioning the ingredients with detailed information. Our manufacturing process will be mentioned."
              },
              {
                image: '/assets/customer-satisfaction.jpg',
                title: "Customer Satisfaction",
                desc: "Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives, and we ensure that our herbal supplements are highly potent and rich in nutrients."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-6 shadow-lg"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed text-center">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#FAFAF5' }}>
        {/* Horizontal divider line at top */}
        <div className="h-px bg-gray-300"></div>
        
        <div className="grid md:grid-cols-2 relative">
          {/* Left Side - Mission */}
          <div className="py-10 px-8 md:px-16 relative z-10" style={{ paddingRight: '20%', backgroundColor: '#FAFAF5' }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontWeight: 700,
              color: '#1f2937',
              fontSize: '2.5rem'
            }}>
              Mission
            </h2>
            <p className="text-gray-700 leading-relaxed" style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#374151'
            }}>
              Our mission is to grow in the nutraceuticals market while maintaining our core beliefs and providing our clients with the purest form of "Ayus and Vedas."
            </p>
          </div>

          {/* Right Side - Vision with diagonal cut */}
          <div className="bg-green-800 py-10 px-8 md:px-16 relative" style={{ 
            backgroundColor: '#166534',
            clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)'
          }}>
            <div className="ml-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                fontSize: '2.5rem'
              }}>
                Vision
              </h2>
              <p className="text-white leading-relaxed" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                Our vision is to promote sustainability through our herbal formulations and to build a deeper connection between people and the environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our History Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="mb-4" style={{ 
              fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive, serif',
              fontSize: '30px',
              color: '#166534',
              fontStyle: 'italic'
            }}>
              — est. 2021 —
            </p>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontWeight: 700,
              color: '#1f2937',
              fontSize: '2.75rem'
            }}>
              Our History
            </h2>
          </div>

          {/* Horizontal Timeline */}
          <div className="max-w-6xl mx-auto relative" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
            {/* Timeline line */}
            <div className="absolute left-0 right-0" style={{ 
              top: '50%',
              height: '2px',
              backgroundColor: '#166534',
              transform: 'translateY(-50%)'
            }}></div>

            {/* Timeline items */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {[
                { year: "2021", title: "Idealization" },
                { year: "2022-2023", title: "Investigating and generating ideas" },
                { year: "2023", title: "Introducing Nutra's Bounty" },
                { year: "2024", title: "Initial Stage of Product Launch" }
              ].map((item, idx) => (
                <div key={idx} className="text-center relative">
                  {/* Year above timeline line - large italicized dark green */}
                  <div className="mb-12" style={{ 
                    fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive, serif',
                    fontSize: '40px',
                    color: '#166534',
                    fontStyle: 'italic',
                    fontWeight: 400
                  }}>
                    {item.year}
                  </div>
                  
                  {/* Circular node on timeline */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '50%' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                      border: '3px solid #166534',
                      backgroundColor: 'white'
                    }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#166534' }}></div>
                    </div>
                  </div>
                  
                  {/* Description below timeline line - bold and increased size */}
                  <div className="mt-12" style={{ 
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '19px',
                    color: '#374151',
                    lineHeight: '1.6',
                    fontWeight: 700
                  }}>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-16" style={{ backgroundColor: '#FAFAF5' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Dr Monisha Singhal */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Founders' Vision Unfolded
              </h2>
              <div style={{ position: 'relative' }}>
                <img
                  src="/assets/monisha.jpg"
                  alt="Dr Monisha Singhal"
                  className="float-right ml-4 mb-4"
                  style={{ 
                    width: '200px',
                    height: 'auto',
                    objectFit: 'contain',
                    shapeOutside: 'margin-box'
                  }}
                />
                <p className="leading-relaxed" style={{ 
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  fontSize: '16px',
                  color: '#374151',
                  lineHeight: '1.7',
                  textAlign: 'left'
                }}>
                  Dr Monisha Singhal, the founder of Nutra's Bounty, is a scientist by profession and a visionary with a lab coat. Armed with a doctoral degree in life sciences where she found her passion in herbal remedies. Modernisation was her foremost concern as problems like stress, poor food choices, and endless medicines were becoming common in those days. Then, Monisha realised that it was time to go back to the roots, where healthy living lies. In 2017, she began her research, which convinced her that for a better future, we need our old-age cultural "nuskha". This gave birth to Nutra's Bounty in 2023 with no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence as we prioritise your health as naturally and effectively as possible.
                </p>
              </div>
            </div>

            {/* Right Column - Mrs Rajni Singhal */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Unraveling Our Co-Founders' Story
              </h2>
              <div style={{ position: 'relative' }}>
                <img
                  src="/assets/rajni-singhal.jpg"
                  alt="Mrs Rajni Singhal"
                  className="float-left mr-4 mb-4"
                  style={{ 
                    width: '200px',
                    height: 'auto',
                    objectFit: 'contain',
                    shapeOutside: 'margin-box'
                  }}
                />
                <p className="leading-relaxed" style={{ 
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  fontSize: '16px',
                  color: '#374151',
                  lineHeight: '1.7',
                  textAlign: 'left'
                }}>
                  Mrs Rajni Singhal, with many hats of responsibilities, is a Co-founder of Nutra's Bounty. A full-time working professional, a mother, a homemaker and, importantly, a nature lover by heart. Mrs Singhal sets an example of multi-tasking with grace. She was deeply connected with nature, healing through the stems of nature was in her blood. Balancing a career with the house is tough, but Mrs Singhal managed everything with passion. She interacted with the modern generation, and this made her realise that everyone here is battling with common health issues. At this stage she thought to come up with an organic solution, with no side-effects. This in-depth understanding, along with her passionate devotion to the environment, planted the initial seeds of Nutra's Bounty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            {/* "- hard work -" subtitle */}
            <p className="mb-4" style={{ 
              fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive, serif',
              fontSize: '30px',
              color: '#166534',
              fontStyle: 'italic'
            }}>
              - hard work -
            </p>
            
            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontWeight: 700,
              color: '#1f2937',
              fontSize: '2.5rem'
            }}>
              Our Team
            </h2>
            
            {/* Description */}
            <p className="text-gray-700 max-w-3xl mx-auto" style={{ 
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              color: '#374151',
              lineHeight: '1.6'
            }}>
              We support environmental awareness, just business practices, and health, and our selections illustrate that.
            </p>
          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Dr Raman Singhal */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img
                  src="/assets/raman-sir.jpg"
                  alt="Dr Raman Singhal"
                  className="w-48 h-48 rounded-lg object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Dr Raman Singhal
              </h3>
              <p className="text-gray-600" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Strategic Business Advisor
              </p>
            </div>

            {/* Dr Nidhi Gupta */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img
                  src="/assets/nidhi-gupta.jpg"
                  alt="Dr Nidhi Gupta"
                  className="w-48 h-48 rounded-lg object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Dr Nidhi Gupta
              </h3>
              <p className="text-gray-600" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Scientific Expert
              </p>
            </div>

            {/* Dr Surendra Nimesh */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img
                  src="/assets/surender-nimesh.jpeg"
                  alt="Dr Surendra Nimesh"
                  className="w-48 h-48 rounded-lg object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Dr Surendra Nimesh
              </h3>
              <p className="text-gray-600" style={{ 
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Scientific Expert
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing before footer */}
      <div className="py-8"></div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default About;

