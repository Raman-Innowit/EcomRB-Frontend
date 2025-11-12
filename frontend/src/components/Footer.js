import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto">
      {/* Full green background newsletter section - matching reference exactly */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #9ccc65 0%, #aed581 40%, #c5e1a5 70%, #dcedc8 100%)' }}>
        {/* Decorative leaf graphics - realistic botanical leaves with stems */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top-left: Large dark green monstera-style leaf cluster with stems */}
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px]" style={{ animation: 'floatSlow 15s ease-in-out infinite' }}>
            <svg viewBox="0 0 600 600" className="w-full h-full" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.1))' }}>
              {/* Stem/veins */}
              <path d="M 100 500 Q 150 400 200 300" stroke="#2d5016" strokeWidth="6" fill="none" opacity="0.6"/>
              <path d="M 200 300 Q 250 200 300 100" stroke="#2d5016" strokeWidth="5" fill="none" opacity="0.6"/>
              <path d="M 150 500 Q 200 380 250 280" stroke="#2d5016" strokeWidth="5" fill="none" opacity="0.5"/>
              
              {/* Large dark green leaf */}
              <ellipse cx="280" cy="200" rx="140" ry="200" fill="#2d5016" opacity="0.7" transform="rotate(-30 280 200)"/>
              <ellipse cx="320" cy="180" rx="130" ry="190" fill="#33691e" opacity="0.65" transform="rotate(-25 320 180)"/>
              
              {/* Medium leaves */}
              <ellipse cx="220" cy="320" rx="110" ry="160" fill="#3d6621" opacity="0.6" transform="rotate(-40 220 320)"/>
              <ellipse cx="180" cy="380" rx="100" ry="150" fill="#3d6621" opacity="0.55" transform="rotate(-20 180 380)"/>
              
              {/* Lighter accent leaf */}
              <ellipse cx="250" cy="250" rx="90" ry="140" fill="#558b2f" opacity="0.5" transform="rotate(-35 250 250)"/>
            </svg>
          </div>
          
          {/* Bottom-left: Very large rounded leaf with prominent stem */}
          <div className="absolute -bottom-40 -left-32 w-[700px] h-[700px]" style={{ animation: 'floatDelayed 18s ease-in-out infinite' }}>
            <svg viewBox="0 0 700 700" className="w-full h-full" style={{ filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.12))' }}>
              {/* Main stem */}
              <path d="M 100 100 Q 200 250 300 400 T 400 650" stroke="#2d5016" strokeWidth="8" fill="none" opacity="0.6"/>
              <path d="M 300 400 Q 350 450 380 520" stroke="#2d5016" strokeWidth="6" fill="none" opacity="0.5"/>
              
              {/* Very large rounded leaf */}
              <ellipse cx="350" cy="450" rx="200" ry="280" fill="#1b5e20" opacity="0.75" transform="rotate(25 350 450)"/>
              <ellipse cx="320" cy="430" rx="180" ry="260" fill="#2e7d32" opacity="0.65" transform="rotate(22 320 430)"/>
              
              {/* Secondary large leaf */}
              <ellipse cx="280" cy="350" rx="150" ry="220" fill="#33691e" opacity="0.6" transform="rotate(18 280 350)"/>
              
              {/* Smaller accent leaves */}
              <ellipse cx="400" cy="500" rx="120" ry="180" fill="#3d6621" opacity="0.55" transform="rotate(30 400 500)"/>
              <ellipse cx="250" cy="280" rx="100" ry="150" fill="#43a047" opacity="0.5" transform="rotate(15 250 280)"/>
            </svg>
          </div>

          {/* Top-right: Lighter green leaves cluster */}
          <div className="absolute -top-16 -right-16 w-[500px] h-[500px]" style={{ animation: 'floatReverse 12s ease-in-out infinite' }}>
            <svg viewBox="0 0 500 500" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 25px rgba(0,0,0,0.08))' }}>
              {/* Stems */}
              <path d="M 400 100 Q 350 180 300 260" stroke="#558b2f" strokeWidth="5" fill="none" opacity="0.5"/>
              <path d="M 300 260 Q 280 320 270 380" stroke="#558b2f" strokeWidth="4" fill="none" opacity="0.45"/>
              
              {/* Light green leaves */}
              <ellipse cx="320" cy="200" rx="110" ry="170" fill="#7cb342" opacity="0.6" transform="rotate(35 320 200)"/>
              <ellipse cx="280" cy="280" rx="100" ry="155" fill="#8bc34a" opacity="0.55" transform="rotate(42 280 280)"/>
              <ellipse cx="350" cy="250" rx="95" ry="145" fill="#9ccc65" opacity="0.5" transform="rotate(28 350 250)"/>
              <ellipse cx="300" cy="340" rx="85" ry="130" fill="#aed581" opacity="0.48" transform="rotate(38 300 340)"/>
            </svg>
          </div>

          {/* Middle-right: Medium dark leaf accent */}
          <div className="absolute top-1/3 right-10 w-[350px] h-[350px]" style={{ animation: 'pulseGentle 10s ease-in-out infinite' }}>
            <svg viewBox="0 0 350 350" className="w-full h-full">
              {/* Stem */}
              <path d="M 180 100 Q 170 150 160 200" stroke="#3d6621" strokeWidth="5" fill="none" opacity="0.5"/>
              
              {/* Medium dark leaf */}
              <ellipse cx="150" cy="180" rx="90" ry="140" fill="#2d5016" opacity="0.55" transform="rotate(-15 150 180)"/>
              <ellipse cx="170" cy="200" rx="75" ry="120" fill="#33691e" opacity="0.5" transform="rotate(-10 170 200)"/>
            </svg>
          </div>

          {/* Bottom-right: Small leaf cluster */}
          <div className="absolute bottom-32 right-1/4 w-[300px] h-[300px]" style={{ animation: 'floatSlow 13s ease-in-out infinite 3s' }}>
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {/* Small stems */}
              <path d="M 150 80 Q 140 120 130 160" stroke="#558b2f" strokeWidth="4" fill="none" opacity="0.45"/>
              
              {/* Small leaves */}
              <ellipse cx="120" cy="140" rx="65" ry="100" fill="#43a047" opacity="0.5" transform="rotate(20 120 140)"/>
              <ellipse cx="140" cy="170" rx="60" ry="95" fill="#558b2f" opacity="0.48" transform="rotate(25 140 170)"/>
              <ellipse cx="100" cy="160" rx="55" ry="85" fill="#689f38" opacity="0.45" transform="rotate(15 100 160)"/>
            </svg>
          </div>

          {/* Additional overlay leaves for depth */}
          <div className="absolute top-1/4 left-1/3 w-[280px] h-[280px]" style={{ animation: 'floatReverse 16s ease-in-out infinite 2s' }}>
            <svg viewBox="0 0 280 280" className="w-full h-full">
              <path d="M 140 60 Q 135 110 130 160" stroke="#3d6621" strokeWidth="4" fill="none" opacity="0.4"/>
              <ellipse cx="120" cy="130" rx="70" ry="110" fill="#2e7d32" opacity="0.45" transform="rotate(-25 120 130)"/>
              <ellipse cx="145" cy="150" rx="65" ry="100" fill="#388e3c" opacity="0.42" transform="rotate(-18 145 150)"/>
            </svg>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Brand name - elegant serif font */}
            <h2 
              className="text-[42px] md:text-[52px] lg:text-[58px] leading-none tracking-wide mb-5 select-none"
              style={{ 
                fontFamily: 'Cormorant Garamond, Playfair Display, Georgia, serif',
                fontWeight: '600',
                color: '#1b5e20',
                letterSpacing: '0.01em',
                animation: 'fadeInUp 0.8s ease-out'
              }}
            >
              RasayanaBio
            </h2>
            
            <div 
              className="text-[20px] md:text-[24px] font-bold mb-3"
              style={{ 
                color: '#1b5e20',
                animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
              }}
            >
              Get Exclusive Access & 10% Off
            </div>
            
            <p 
              className="mb-8 text-[15px] md:text-[16px]"
              style={{ 
                color: '#2e7d32',
                animation: 'fadeInUp 0.8s ease-out 0.4s backwards'
              }}
            >
              When you sign up for our newsletter!
            </p>
            
            <form
              onSubmit={(e) => e.preventDefault()}
              className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 mb-8"
              style={{ animation: 'fadeInUp 0.8s ease-out 0.6s backwards' }}
            >
              <input
                type="email"
                required
                placeholder="Email Address"
                className="flex-1 rounded-lg px-5 py-3.5 text-gray-700 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-green-800 focus:outline-none focus:border-transparent transition-all shadow-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              />
              <button 
                className="px-10 py-3.5 rounded-lg font-bold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 transform uppercase tracking-wide text-[14px]"
                style={{ backgroundColor: '#1b5e20', color: 'white' }}
              >
                SUBSCRIBE
              </button>
            </form>
            
            <div 
              className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[14px]"
              style={{ 
                color: '#2e7d32',
                animation: 'fadeInUp 0.8s ease-out 0.8s backwards'
              }}
            >
              <a className="hover:text-green-900 hover:underline transition-colors" href="/shipping-policy">Shipping Policy</a>
              <a className="hover:text-green-900 hover:underline transition-colors" href="/terms">Terms Of Service</a>
              <a className="hover:text-green-900 hover:underline transition-colors" href="/privacy-policy">Privacy Policy</a>
              <a className="hover:text-green-900 hover:underline transition-colors" href="/refund-policy">Refund Policy</a>
              <a className="hover:text-green-900 hover:underline transition-colors" href="/disclaimer">Disclaimer</a>
              <a className="hover:text-green-900 hover:underline transition-colors" href="/press-release">Press Release</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright section with dark background */}
      <div className="bg-[#1a1f2e] text-center py-8 px-4">
        <p className="text-gray-400 text-[14px] mb-5" style={{ animation: 'fadeIn 1s ease-out' }}>
          Copyright© 2025, RasayanaBio All rights reserved
        </p>
        <div className="flex items-center justify-center gap-4" style={{ animation: 'fadeIn 1s ease-out 0.2s backwards' }}>
          <a 
            href="https://facebook.com" 
            aria-label="Facebook" 
            className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{ backgroundColor: '#2d5016' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.01 3.66 9.16 8.44 9.93v-7.02H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34v7.02C18.34 21.23 22 17.08 22 12.07z"/>
            </svg>
          </a>
          <a 
            href="https://twitter.com" 
            aria-label="Twitter" 
            className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{ backgroundColor: '#2d5016' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.22 4.22 0 0 0 1.85-2.33 8.44 8.44 0 0 1-2.68 1.03 4.21 4.21 0 0 0-7.17 3.84A11.94 11.94 0 0 1 3.16 4.9a4.19 4.19 0 0 0-.57 2.12c0 1.46.74 2.75 1.87 3.5a4.22 4.22 0 0 1-1.91-.53v.05c0 2.04 1.45 3.74 3.36 4.13-.36.1-.75.16-1.15.16-.28 0-.55-.03-.82-.08.55 1.72 2.16 2.98 4.07 3.01A8.45 8.45 0 0 1 2 19.54a11.9 11.9 0 0 0 6.44 1.89c7.73 0 11.96-6.4 11.96-11.95 0-.18-.01-.36-.02-.54A8.5 8.5 0 0 0 22.46 6z"/>
            </svg>
          </a>
          <a 
            href="https://instagram.com" 
            aria-label="Instagram" 
            className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{ backgroundColor: '#2d5016' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3.5A5.5 5.5 0 1 0 17.5 13 5.51 5.51 0 0 0 12 7.5zm0 2A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5zm4.25-3a1.25 1.25 0 1 0 1.25 1.25A1.25 1.25 0 0 0 16.25 6.5z"/>
            </svg>
          </a>
          <a 
            href="https://linkedin.com" 
            aria-label="LinkedIn" 
            className="w-10 h-10 grid place-items-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{ backgroundColor: '#2d5016' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M6.94 6.5A2.44 2.44 0 1 1 4.5 4.06 2.44 2.44 0 0 1 6.94 6.5zM4.75 8.5h4.38v10.94H4.75zm6.56 0h4.2v1.5h.06c.58-1.1 2-2.26 4.12-2.26 4.41 0 5.22 2.9 5.22 6.67v5.03h-4.38v-4.46c0-1.06-.02-2.42-1.48-2.42-1.49 0-1.72 1.16-1.72 2.35v4.53h-4.38z"/>
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes floatSlow {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(12px, -15px) rotate(2deg);
          }
          50% {
            transform: translate(6px, -28px) rotate(-1.5deg);
          }
          75% {
            transform: translate(-6px, -15px) rotate(1.5deg);
          }
        }
        
        @keyframes floatDelayed {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-10px, 14px) rotate(-2.5deg);
          }
          50% {
            transform: translate(-18px, 25px) rotate(1.8deg);
          }
          75% {
            transform: translate(-6px, 12px) rotate(-1.2deg);
          }
        }
        
        @keyframes floatReverse {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(-14px, 16px) rotate(3deg);
          }
          66% {
            transform: translate(10px, 28px) rotate(-2.5deg);
          }
        }
        
        @keyframes pulseGentle {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.08);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
