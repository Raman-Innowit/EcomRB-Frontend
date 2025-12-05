import React from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const VitaminDArticle = () => {
  const headingColor = '#1c5f2a';
  const bodyColor = '#2f2f2f';
  const bodyFontSize = '17px';
  const bodyLineHeight = '1.85';

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#d4a574', color: '#fff' }}>ayurvedic</span>
              <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>health</span>
            </div>

            {/* Feature Image */}
            <div className="mt-4 mb-8">
              <img
                src="/assets/vitamin-d-article.png"
                alt="6 good sources of vitamin D for vegans"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '600px', objectFit: 'cover' }}
              />
            </div>

            {/* Article Metadata */}
            <div className="mb-6 flex items-center justify-between text-gray-600" style={{ fontSize: bodyFontSize }}>
              <div>
                <span>February 27, 2020</span>
                <span className="mx-2">•</span>
                <span>By Dr Monisha Singhal</span>
              </div>
              <div>0 comments</div>
            </div>

            {/* Article Title */}
            <h1
              className="text-4xl md:text-5xl font-bold mb-8 leading-tight"
              style={{ color: '#1f2937', fontFamily: 'Georgia, serif' }}
            >
              6 good sources of vitamin D for vegans
            </h1>

            {/* Article Content */}
            <div className="mb-10">
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Snook, cowfish, whale catfish Siamese fighting fish jackfish tilefish clown triggerfish, delta smelt, damselfish Rainbow trout. Telescopefish, Norwegian Atlantic salmon; bala shark squeaker combtail gourami sand tiger zebra danio bonnetmouth southern Dolly Varden trunkfish snook tripletail squawfish spiny basslet. Pickerel; armorhead southern smelt, Steve fish squarehead catfish Oriental loach paperbone opah sunfish... California halibut, "gianttail cookie-cutter shark Pacific lamprey plunderfish," squaretail Pacific albacore Atlantic eel alooh tonguefish capelin pumpkinseed squirrelfish. Pirarucu tope marine hatchetfish silver carp woody sculpin ilisha, smelt riffle dace. Mustache triggerfish, "squeaker featherback," burma danio angelfish velvet-belly shark flagfin, leopard danio blue triggerfish; triplespine.
              </p>

              {/* Blockquote */}
              <blockquote className="mb-6 pl-6 border-l-4" style={{ borderColor: headingColor }}>
                <p className="leading-relaxed mb-4 italic" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  <span className="text-4xl leading-none" style={{ color: headingColor }}>"</span>
                  No animal product contamination or usage is present in any food, cosmetic, clothing items – ideal for Pure Vegetarians, Jains and of course for Vegans. Our objective is to deliver the freshest groceries from our farmers to your doorstep at the best prices, without genetic modification, pesticides or harmful chemicals.
                  <span className="text-4xl leading-none" style={{ color: headingColor }}>"</span>
                </p>
              </blockquote>
            </div>

            {/* Hashtags */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span style={{ color: bodyColor, fontSize: bodyFontSize }}>#Diet</span>
              <span style={{ color: bodyColor, fontSize: bodyFontSize }}>, </span>
              <span style={{ color: bodyColor, fontSize: bodyFontSize }}>#Nutrition</span>
              <span style={{ color: bodyColor, fontSize: bodyFontSize }}>, </span>
              <span style={{ color: bodyColor, fontSize: bodyFontSize }}>#Vegans</span>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4 mb-10">
              <a href="https://www.facebook.com/people/RasayanaBio/61565640287427/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
                <span className="font-bold text-sm">f</span>
              </a>
              <a href="https://twitter.com/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition">
                <span className="font-bold text-xs">in</span>
              </a>
              <a href="https://www.instagram.com/rasayanabio_/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            {/* Post a Comment Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#374151' }}>
                Post a Comment
              </h2>
              <p className="text-gray-600 mb-6" style={{ fontSize: bodyFontSize }}>
                Your email address will not be published. Required fields are marked *
              </p>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="comment" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="6"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                    style={{ fontSize: bodyFontSize }}
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700" style={{ fontSize: bodyFontSize }}>Save my name, email, and website in this browser for the next time I comment.</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700" style={{ fontSize: bodyFontSize }}>I have read and agree to the Terms and Conditions and Privacy Policy. <span className="text-red-500">*</span></span>
                  </label>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 p-4 border border-gray-300 rounded bg-gray-50">
                    <input
                      type="checkbox"
                      id="recaptcha"
                      className="w-4 h-4"
                    />
                    <label htmlFor="recaptcha" className="text-gray-700 cursor-pointer" style={{ fontSize: bodyFontSize }}>
                      I'm not a robot
                    </label>
                    <div className="ml-auto flex items-center gap-2 text-gray-500" style={{ fontSize: bodyFontSize }}>
                      <span>reCAPTCHA</span>
                      <div className="flex flex-col" style={{ fontSize: bodyFontSize }}>
                        <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy</a>
                        <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms</a>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  SEND COMMENT
                </button>
              </form>
            </div>

            {/* Similar Posts Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: headingColor }}>
                Similar Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Post 1 - Magnesium Article */}
                <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                  <div className="relative w-full h-64 overflow-hidden">
                    <img
                      src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                      alt="Comprehensive Benefits of Magnesium"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                        health
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                        healthy
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                        lifestyle
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-3" style={{ fontSize: bodyFontSize }}>
                      September 1, 2025 • By Dr Monisha Singhal
                    </p>
                    <Link to="/comprehensive-benefits-of-magnesium-for-overall-wellness">
                      <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2 hover:text-green-900 cursor-pointer transition-colors">
                        Comprehensive Benefits of Magnesium for Overall Wellness
                      </h3>
                    </Link>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2" style={{ fontSize: bodyFontSize }}>
                      Introduction to Magn
                    </p>
                    <Link
                      to="/comprehensive-benefits-of-magnesium-for-overall-wellness"
                      className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition font-semibold"
                    >
                      READ MORE
                    </Link>
                  </div>
                </article>

                {/* Post 2 - Diabetes Article */}
                <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                  <div className="relative w-full h-64 overflow-hidden">
                    <img
                      src="/assets/diabetes-article.png"
                      alt="Early Detection of Diabetes"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                        diabetes
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                        health
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                        healthy
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-3" style={{ fontSize: bodyFontSize }}>
                      October 9, 2024 • By Dr Monisha Singhal
                    </p>
                    <Link to="/early-detection-of-diabetes">
                      <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2 hover:text-green-900 cursor-pointer transition-colors">
                        Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies
                      </h3>
                    </Link>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2" style={{ fontSize: bodyFontSize }}>
                      Uncontrolled diabete
                    </p>
                    <Link
                      to="/early-detection-of-diabetes"
                      className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition font-semibold"
                    >
                      READ MORE
                    </Link>
                  </div>
                </article>
              </div>
            </div>
          </main>

          {/* Sidebar - Right Side */}
          <aside className="lg:w-1/4 order-1 lg:order-2">
            {/* Search Box */}
            <div className="mb-8">
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: bodyFontSize }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-gray-100 transition"
                  style={{ color: headingColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headingColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Lifestyle (1)</span>
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-6 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Recent Posts
              </h3>
              <div className="space-y-5">
                <Link to="/comprehensive-benefits-of-magnesium-for-overall-wellness" className="flex gap-4 group">
                  <img
                    src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      Comprehensive Benefits of Magnesium for
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>September 1, 2025</p>
                  </div>
                </Link>
                <Link to="/early-detection-of-diabetes" className="flex gap-4 group">
                  <img
                    src="/assets/diabetes-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      Stay Healthy, Stay Informed: Early Detec
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>October 9, 2024</p>
                  </div>
                </Link>
                <Link to="/6-good-sources-of-vitamin-d-for-vegans" className="flex gap-4 group">
                  <img
                    src="/assets/vitamin-d-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      6 good sources of vitamin D for vegans
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>February 27, 2020</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['ASHWAGANDHA', 'AYURVEDIC', 'AYURVEDIC PRODUCTS', 'FEMALE WELLNESS', 'NO HARSH CHEMICALS', 'NON-GMO', 'NUT- AND GLUTEN-FREE', 'PRODUCTS', 'SCIENTIFICALLY TESTED', 'SOY-FREE'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/products?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded font-medium border border-gray-300 transition-colors hover:bg-[#1e8f3a] hover:text-white hover:border-[#1e8f3a]"
                    style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default VitaminDArticle;

