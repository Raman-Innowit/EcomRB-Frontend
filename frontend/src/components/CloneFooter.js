import React, { useState } from 'react';

const CloneFooter = () => {
  const [email, setEmail] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribing:', email);
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <footer className="bg-white">
      {/* Top Section - Service Highlights Banner */}
      <div className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Shop Online */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="#fbbf24" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shop Online</h3>
                <p className="text-sm text-green-100">
                  Enjoy a seamless shopping experience from the comfort of your home. Browse, select, and order with just a few clicks.
                </p>
              </div>
            </div>

            {/* Free Shipping */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="#fbbf24" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Free Shipping</h3>
                <p className="text-sm text-green-100">
                  Get your favorite products delivered to your doorstep without any extra cost. Fast, reliable, and hassle-free shipping.
                </p>
              </div>
            </div>

            {/* Return Policy */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-400">24</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Return Policy</h3>
                <p className="text-sm text-green-100">
                  Shop with confidence! Easy returns and exchanges within 7 days if the product doesn't meet your expectations.
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="#fbbf24" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Payment Methods</h3>
                <p className="text-sm text-green-100">
                  We accept all major payment methods—Credit/Debit Cards, Net Banking, UPI, and Cash on Delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Newsletter Signup and Footer Links */}
      <div className="relative overflow-hidden">
        {/* Background Image - fully visible and covering full space including bottom section */}
        <div className="absolute inset-0">
          <img
            src="/assets/footer-background.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center center' }}
          />
        </div>

        {/* Newsletter Section */}
        <div className="relative z-10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              {/* Brand Logo - Image - Bigger */}
              <div className="mb-6 flex justify-center">
                <img
                  src="/assets/rb.png"
                  alt="RasayanaBio"
                  className="h-28 md:h-36 w-auto object-contain"
                />
              </div>

              {/* Newsletter Call to Action */}
              <p className="text-green-800 text-lg font-semibold mb-2">
                Get Exclusive Access & 10% Off
              </p>
              <p className="text-gray-600 mb-8">
                When you sign up for our newsletter!
              </p>

              {/* Email Input and Subscribe Button */}
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition font-semibold uppercase"
                >
                  SUBSCRIBE
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section - Footer Links */}
        <div className="relative z-10 py-8">
          <div className="container mx-auto px-4">
            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm mb-4">
              <a href="/shipping-policy" className="text-black font-bold hover:text-gray-700 transition">
                Shipping Policy
              </a>
              <a href="/terms-of-service" className="text-black font-bold hover:text-gray-700 transition">
                Terms Of Service
              </a>
              <a href="/privacy-policy" className="text-black font-bold hover:text-gray-700 transition">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="text-black font-bold hover:text-gray-700 transition">
                Refund Policy
              </a>
              <a href="/disclaimer" className="text-black font-bold hover:text-gray-700 transition">
                Disclaimer
              </a>
              <a href="/press-release" className="text-black font-bold hover:text-gray-700 transition">
                Press Release
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center text-sm">
              <p className="text-gray-500 font-bold mb-4">Copyright© 2025. RasayanaBio. All rights reserved.</p>
              
              {/* Social Media Icons */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <a 
                  href="https://facebook.com" 
                  aria-label="Facebook" 
                  className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: '#2d5016' }}
                >
                  <span className="text-white font-bold text-lg">f</span>
                </a>
                <a 
                  href="https://twitter.com" 
                  aria-label="Twitter" 
                  className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: '#2d5016' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.22 4.22 0 0 0 1.85-2.33 8.44 8.44 0 0 1-2.68 1.03 4.21 4.21 0 0 0-7.17 3.84A11.94 11.94 0 0 1 3.16 4.9a4.19 4.19 0 0 0-.57 2.12c0 1.46.74 2.75 1.87 3.5a4.22 4.22 0 0 1-1.91-.53v.05c0 2.04 1.45 3.74 3.36 4.13-.36.1-.75.16-1.15.16-.28 0-.55-.03-.82-.08.55 1.72 2.16 2.98 4.07 3.01A8.45 8.45 0 0 1 2 19.54a11.9 11.9 0 0 0 6.44 1.89c7.73 0 11.96-6.4 11.96-11.95 0-.18-.01-.36-.02-.54A8.5 8.5 0 0 0 22.46 6z"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  aria-label="LinkedIn" 
                  className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: '#2d5016' }}
                >
                  <span className="text-white font-bold text-xs">in</span>
                </a>
                <a 
                  href="https://instagram.com" 
                  aria-label="Instagram" 
                  className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: '#2d5016' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button - positioned above WhatsApp button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-24 right-6 w-10 h-10 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center shadow-md transition z-40"
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default CloneFooter;
