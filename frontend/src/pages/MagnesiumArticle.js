import React from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const MagnesiumArticle = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                health
              </span>
              <span className="px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                healthy
              </span>
              <span className="px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                lifestyle
              </span>
            </div>

            {/* Feature Image */}
            <div className="mb-6">
              <img
                src="/assets/magnesium-importance.jpg"
                alt="Magnesium and Its Importance"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '500px', objectFit: 'cover' }}
              />
            </div>

            {/* Article Metadata */}
            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                <span>September 1, 2025</span>
                <span className="mx-2">•</span>
                <span>By Dr Monisha Singhal</span>
              </div>
              <div>0 comments</div>
            </div>

            {/* Article Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1f2937' }}>
              Comprehensive Benefits of Magnesium for Overall Wellness
            </h1>

            {/* Introduction Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Introduction to Magnesium and Its Importance for Wellness
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                Magnesium is a vital mineral that plays a crucial role in maintaining optimal health and wellness. Despite being involved in over <strong style={{ color: '#1e6e3c' }}>300 biochemical reactions</strong>, magnesium often doesn't receive the attention it deserves.
              </p>
            </div>

            {/* Key Roles Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Key Roles of Magnesium in the Body
              </h2>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/magnesium-roles.jpg"
                  alt="Key Roles of Magnesium"
                  className="h-auto rounded-lg mb-6"
                  style={{ maxWidth: '80%', height: 'auto' }}
                />
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '16px' }}>Energy Production</span>
                  <span className="text-gray-700" style={{ fontSize: '16px' }}>– Crucial for ATP (body's main energy source).</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '16px' }}>Bone Strength</span>
                  <span className="text-gray-700" style={{ fontSize: '16px' }}>– Works with calcium & vitamin D to prevent osteoporosis.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '16px' }}>Heart Health</span>
                  <span className="text-gray-700" style={{ fontSize: '16px' }}>– Regulates heartbeat and blood pressure.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '16px' }}>Mental Wellness</span>
                  <span className="text-gray-700" style={{ fontSize: '16px' }}>– Reduces stress, anxiety, and migraines.</span>
                </li>
              </ul>
            </div>

            {/* Identifying Deficiency Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Identifying Magnesium Deficiency and Its Causes
              </h2>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/magnesium-deficiency.jpg"
                  alt="Identifying Magnesium Deficiency"
                  className="h-auto rounded-lg mb-6"
                  style={{ maxWidth: '80%', height: 'auto' }}
                />
              </div>
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                Modern lifestyles often lead to <strong style={{ color: '#1e6e3c' }}>low magnesium levels</strong> due to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <li>High intake of processed foods</li>
                <li>Stress, lack of sleep</li>
                <li>Excess alcohol use</li>
                <li>Nutrient-depleting medications</li>
              </ul>
            </div>

            {/* Symptoms Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Symptoms and Health Impacts of Magnesium Deficiency
              </h2>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/common-symptoms.png"
                  alt="Common Symptoms"
                  className="h-auto rounded-lg mb-6"
                  style={{ maxWidth: '90%', height: 'auto' }}
                />
              </div>
              <div className="mb-4">
                <p className="font-bold text-gray-800 mb-2" style={{ fontSize: '16px' }}>Early signs:</p>
                <p className="text-gray-700" style={{ fontSize: '16px' }}>muscle cramps, fatigue, weakness</p>
              </div>
              <div className="mb-6">
                <p className="font-bold text-gray-800 mb-2" style={{ fontSize: '16px' }}>Advanced risks:</p>
                <p className="text-gray-700" style={{ fontSize: '16px' }}>high blood pressure, osteoporosis, type 2 diabetes, irregular heartbeat, anxiety, and depression</p>
              </div>
            </div>

            {/* Dietary Sources Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Dietary Sources Rich in Magnesium
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                Top foods high in magnesium include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <li>Spinach and leafy greens</li>
                <li>Lentils, black beans</li>
                <li>Almonds, pumpkin seeds</li>
                <li>Whole grains</li>
                <li>Bananas</li>
              </ul>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/vitamin-d.png"
                  alt="Vitamin D Sources"
                  className="h-auto rounded-lg mb-4"
                  style={{ maxWidth: '70%', height: 'auto' }}
                />
              </div>
              <p className="text-gray-700 mb-6" style={{ fontSize: '16px' }}>
                💡 Eating spinach + almonds + a banana = ~190 mg magnesium.
              </p>
            </div>

            {/* Forms of Magnesium Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                Exploring Different Forms of Magnesium Supplements
              </h2>
              <ul className="space-y-3 mb-6 text-gray-700" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <li><strong className="text-gray-800">Magnesium Citrate</strong> – best for constipation & good absorption.</li>
                <li><strong className="text-gray-800">Magnesium Glycinate</strong> – calming, improves sleep & reduces anxiety.</li>
                <li><strong className="text-gray-800">Magnesium Oxide</strong> – cost-effective but less absorbable.</li>
              </ul>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/magnesium-incorporate.jpg"
                  alt="How to Incorporate Magnesium"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '85%', height: 'auto' }}
                />
              </div>
            </div>

            {/* How to Incorporate Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
                How to Incorporate Magnesium into Your Wellness Routine
              </h2>
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/meter.jpg"
                  alt="Health Meter"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '80%', height: 'auto' }}
                />
              </div>
            </div>
          </main>

          {/* Sidebar - Right Side */}
          <aside className="lg:w-1/4 order-1 lg:order-2">
            {/* Search Box */}
            <div className="mb-6">
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-gray-100 transition"
                  style={{ color: '#1e6e3c', backgroundColor: '#1e6e3c' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1e6e3c' }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left text-gray-700" style={{ fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left text-gray-700" style={{ fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left text-gray-700" style={{ fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left text-gray-700" style={{ fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left text-gray-700" style={{ fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Lifestyle (1)</span>
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1e6e3c' }}>|</span>
                Recent Posts
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <img
                    src="/assets/magnesium-importance.jpg"
                    alt="Recent Post"
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                      Comprehensive Benefits of Magnesium for
                    </p>
                    <p className="text-xs text-gray-500">September 1, 2025</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <img
                    src="/assets/meter.jpg"
                    alt="Recent Post"
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                      Stay Healthy, Stay Informed: Early Detec
                    </p>
                    <p className="text-xs text-gray-500">October 9, 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1e6e3c' }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  ASHWAGANDHA
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  AYURVEDIC
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  AYURVEDIC PRODUCTS
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  FEMALE WELLNESS
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  NO HARSH CHEMICALS
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  NON-GMO
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  NUT- AND GLUTEN-FREE
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  PRODUCTS
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  SCIENTIFICALLY TESTED
                </button>
                <button className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6' }}>
                  SOY-FREE
                </button>
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

export default MagnesiumArticle;

