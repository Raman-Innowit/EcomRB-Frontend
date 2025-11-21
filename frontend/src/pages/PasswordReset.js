import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const PasswordReset = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [message, setMessage] = useState('');
  const bodyFontSize = '17px';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setMessage('Please enter your email address or username.');
      return;
    }
    // Handle password reset logic here
    setMessage('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#1f2937' }}>
                Password Reset
              </h1>
              
              <p className="mb-6" style={{ color: '#2f2f2f', fontSize: bodyFontSize, lineHeight: '1.85' }}>
                To reset your password, please enter your email address or username below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => {
                      setEmailOrUsername(e.target.value);
                      setMessage('');
                    }}
                    placeholder="Enter your username or email"
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ fontSize: bodyFontSize }}
                    required
                  />
                </div>

                {message && (
                  <p className={`text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
                  style={{ fontSize: bodyFontSize }}
                >
                  Reset password
                </button>
              </form>
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
                  style={{ color: '#1c5f2a' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>All Products (15)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Beauty & Radiance (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Cosmetics (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Female wellness (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health Supplements (10)</span>
                </button>
                <div className="ml-4 space-y-0">
                  <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                    <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                    <span>Immunity Booster (3)</span>
                  </button>
                  <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                    <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                    <span>Essential Supplements (5)</span>
                  </button>
                  <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                    <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                    <span>Sleep Support (1)</span>
                  </button>
                  <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                    <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                    <span>Stress and Anxiety (2)</span>
                  </button>
                </div>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>healthy (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy Aging (4)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Men's Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Speciality Supplements (5)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Sports & Fitness (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Weight (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Women's Health (5)</span>
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="mb-6">
              <img
                src="/assets/password-reset-image.jpg"
                alt="Supplements"
                className="w-full h-auto rounded"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  Ayurvedic
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  Diabetes
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  Health
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  Healthy
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  Lifestyle
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

export default PasswordReset;

