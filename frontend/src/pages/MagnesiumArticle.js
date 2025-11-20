import React from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const MagnesiumArticle = () => {
  const headingColor = '#1c5f2a';
  const bodyColor = '#2f2f2f';
  const bodyFontSize = '17px';
  const bodyLineHeight = '1.85';

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
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

            {/* Feature Image */}
            <div className="mt-4 mb-8">
              <img
                src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                alt="Magnesium and Its Importance"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '600px', objectFit: 'cover' }}
              />
            </div>

            {/* Article Metadata */}
            <div className="mb-6 flex items-center justify-between text-base text-gray-600">
              <div>
                <span>September 1, 2025</span>
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
              Comprehensive Benefits of Magnesium for Overall Wellness
            </h1>

            {/* Introduction Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Introduction to Magnesium and Its Importance for Wellness
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                In the ever-expanding landscape of preventive healthcare, magnesium has become a cornerstone for maintaining optimal health and wellness. Despite being involved in over <strong style={{ color: headingColor }}>300 biochemical reactions</strong>, magnesium often doesn't receive the attention it deserves.
              </p>
            </div>

            {/* Key Roles Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Key Roles of Magnesium in the Body
              </h2>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '18px' }}>Energy Production</span>
                  <span style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>– Crucial for ATP (body's main energy source).</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '18px' }}>Bone Strength</span>
                  <span style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>– Works with calcium & vitamin D to prevent osteoporosis.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '18px' }}>Heart Health</span>
                  <span style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>– Regulates heartbeat and blood pressure.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-gray-800 mr-2" style={{ fontSize: '18px' }}>Mental Wellness</span>
                  <span style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>– Reduces stress, anxiety, and migraines.</span>
                </li>
              </ul>
              <div className="mb-8 flex justify-center">
                <img
                  src="/assets/How-to-Incorporate-Magnesium-into-Your-We-scaled.jpg"
                  alt="Key Roles of Magnesium"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '70%', height: 'auto' }}
                />
              </div>
            </div>

            {/* Identifying Deficiency Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Identifying Magnesium Deficiency and Its Causes
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Modern lifestyles often lead to <strong style={{ color: headingColor }}>low magnesium levels</strong> due to:
              </p>
              <ul className="list-disc list-inside space-y-3 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>High intake of processed foods</li>
                <li>Stress, lack of sleep</li>
                <li>Excess alcohol use</li>
                <li>Nutrient-depleting medications</li>
              </ul>
            </div>

            {/* Symptoms Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Symptoms and Health Impacts of Magnesium Deficiency
              </h2>
              <div className="mb-8 flex justify-center">
                <img
                  src="/assets/common-symptoms.png"
                  alt="Common Symptoms"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '41%', height: 'auto' }}
                />
              </div>
              <div className="mb-6">
                <p className="font-bold text-gray-800 mb-3" style={{ fontSize: '18px' }}>Early signs:</p>
                <p style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>muscle cramps, fatigue, weakness</p>
              </div>
              <div className="mb-6">
                <p className="font-bold text-gray-800 mb-3" style={{ fontSize: '18px' }}>Advanced risks:</p>
                <p style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>high blood pressure, osteoporosis, type 2 diabetes, irregular heartbeat, anxiety, and depression</p>
              </div>
            </div>

            {/* Dietary Sources Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Dietary Sources Rich in Magnesium
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Top foods high in magnesium include:
              </p>
              <ul className="list-disc list-inside space-y-3 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>Spinach and leafy greens</li>
                <li>Lentils, black beans</li>
                <li>Almonds, pumpkin seeds</li>
                <li>Whole grains</li>
                <li>Bananas</li>
              </ul>
              <p className="mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                💡 Eating spinach + almonds + a banana = ~190 mg magnesium.
              </p>
            </div>

            {/* Image before Forms of Magnesium Section */}
            <div className="mb-10 flex justify-center">
              <img
                src="/assets/Magnesium-and-Its-Importance-for2-scaled.jpg"
                alt="Magnesium and Its Importance"
                className="h-auto rounded-lg"
                style={{ maxWidth: '70%', height: 'auto' }}
              />
            </div>

            {/* Forms of Magnesium Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Exploring Different Forms of Magnesium Supplements
              </h2>
              <ul className="space-y-4 mb-8" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li><strong className="text-gray-800">Magnesium Citrate</strong> – best for constipation & good absorption.</li>
                <li><strong className="text-gray-800">Magnesium Glycinate</strong> – calming, improves sleep & reduces anxiety.</li>
                <li><strong className="text-gray-800">Magnesium Oxide</strong> – cost-effective but less absorbable.</li>
              </ul>
              <div className="mb-8 flex justify-center">
                <img
                  src="/assets/Identifying-Magnesium-Deficiency-and-scaled.jpg"
                  alt="Identifying Magnesium Deficiency"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '70%', height: 'auto' }}
                />
              </div>
            </div>

            {/* Choosing the Right Magnesium Supplement Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Choosing the Right Magnesium Supplement
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Selection depends on health goals:
              </p>
              <ul className="space-y-3 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>For <strong className="text-gray-800">constipation</strong> → Citrate</li>
                <li>For <strong className="text-gray-800">relaxation & sleep</strong> → Glycinate</li>
                <li>For <strong className="text-gray-800">affordable option</strong> → Oxide</li>
              </ul>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Always check <strong style={{ color: headingColor }}>bioavailability, dosage, and tolerance</strong> before choosing.
              </p>
            </div>

            {/* Side Effects Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Side Effects of Excessive Magnesium
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Overuse can cause:
              </p>
              <ul className="space-y-3 mb-8" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>Diarrhea, nausea, stomach cramps</li>
                <li>Severe cases (especially in kidney issues) → toxicity</li>
              </ul>
              <div className="mb-8 flex justify-center">
                <img
                  src="/assets/Potential-Side-Effects-and-Risks-of-scaled.jpg"
                  alt="Potential Side Effects and Risks"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '70%', height: 'auto' }}
                />
              </div>
            </div>

            {/* How to Incorporate Magnesium Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                How to Incorporate Magnesium into Your Wellness Routine
              </h2>
              <ul className="space-y-3 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li className="flex items-start">
                  <span className="text-green-700 mr-2" style={{ fontSize: '20px' }}>✓</span>
                  <span>Eat magnesium-rich foods daily</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-700 mr-2" style={{ fontSize: '20px' }}>✓</span>
                  <span>Limit processed foods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-700 mr-2" style={{ fontSize: '20px' }}>✓</span>
                  <span>Use supplements only if necessary</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-700 mr-2" style={{ fontSize: '20px' }}>✓</span>
                  <span>Track total intake</span>
                </li>
              </ul>
              
              <p className="font-bold text-gray-800 mb-3" style={{ fontSize: '18px' }}>
                Recommended Daily Intake (RDA):
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>Women: 320 mg</li>
                <li>Men: 420 mg</li>
              </ul>

              <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                Consulting Healthcare Professionals
              </h3>
              <p className="leading-relaxed mb-8" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Always consult a doctor before starting supplements—especially if you take medications or have health conditions.
              </p>
              
              <div className="mb-8 flex justify-center">
                <img
                  src="/assets/Consultation-with-Healthcare-Professionals-scaled.jpg"
                  alt="Consultation with Healthcare Professionals"
                  className="h-auto rounded-lg"
                  style={{ maxWidth: '70%', height: 'auto' }}
                />
              </div>
            </div>

            {/* Conclusion Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Conclusion
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Magnesium is essential for <strong style={{ color: headingColor }}>energy, strong bones, heart health, and mental well-being</strong>. With the right diet and supplements, you can unlock its full wellness benefits for both immediate and long-term health.
              </p>
              
              {/* Hashtags */}
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="text-sm" style={{ color: bodyColor }}>##Benefits of magnesium</span>
                <span className="text-sm" style={{ color: bodyColor }}>##Best magnesium supplements</span>
                <span className="text-sm" style={{ color: bodyColor }}>##Magnesium deficiency symptoms</span>
                <span className="text-sm" style={{ color: bodyColor }}>##Magnesium for wellness</span>
                <span className="text-sm" style={{ color: bodyColor }}>##Magnesium-rich foods</span>
                <span className="text-sm" style={{ color: bodyColor }}>#Magnesium for sleep and anxiety</span>
              </div>

              {/* Social Media Icons */}
              <div className="flex gap-4 mb-10">
                <a href="#" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
                  <span className="font-bold text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition">
                  <span className="font-bold text-xs">in</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Post a Comment Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#374151' }}>
                Post a Comment
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Your email address will not be published. Required fields are marked *
              </p>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="comment" className="block text-gray-700 mb-2">
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="6"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                    style={{ fontSize: '15px' }}
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-gray-700 mb-2">
                    Your Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700 text-sm">Save my name, email, and website in this browser for the next time I comment.</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700 text-sm">I have read and agree to the Terms and Conditions and Privacy Policy. <span className="text-red-500">*</span></span>
                  </label>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 p-4 border border-gray-300 rounded bg-gray-50">
                    <input
                      type="checkbox"
                      id="recaptcha"
                      className="w-4 h-4"
                    />
                    <label htmlFor="recaptcha" className="text-sm text-gray-700 cursor-pointer">
                      I'm not a robot
                    </label>
                    <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                      <span>reCAPTCHA</span>
                      <div className="flex flex-col text-xs">
                        <a href="#" className="text-blue-600 hover:underline">Privacy</a>
                        <a href="#" className="text-blue-600 hover:underline">Terms</a>
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
                    <p className="text-gray-600 text-sm mb-3">
                      September 1, 2025 • By Dr Monisha Singhal
                    </p>
                    <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2">
                      Comprehensive Benefits of Magnesium for Overall Wellness
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">
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
                    <p className="text-gray-600 text-sm mb-3">
                      October 9, 2024 • By Dr Monisha Singhal
                    </p>
                    <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2">
                      Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">
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
                  style={{ fontSize: '15px' }}
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
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: '15px' }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: '15px' }}>
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
                <div className="flex gap-4">
                  <img
                    src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm mb-2 leading-snug" style={{ color: bodyColor, fontSize: '15px' }}>
                      Comprehensive Benefits of Magnesium for
                    </p>
                    <p className="text-xs text-gray-500">September 1, 2025</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <img
                    src="/assets/diabetes-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm mb-2 leading-snug" style={{ color: bodyColor, fontSize: '15px' }}>
                      Stay Healthy, Stay Informed: Early Detec
                    </p>
                    <p className="text-xs text-gray-500">October 9, 2024</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <img
                    src="/assets/vitamin-d-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm mb-2 leading-snug" style={{ color: bodyColor, fontSize: '15px' }}>
                      6 good sources of vitamin D for vegans
                    </p>
                    <p className="text-xs text-gray-500">February 27, 2020</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
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

