import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getPublicCategories, getPublicHealthBenefits } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [healthBenefits, setHealthBenefits] = useState([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getPublicCategories().then((data) => setCategories(data.categories || []));
    getPublicHealthBenefits().then((data) => setHealthBenefits(data.health_benefits || []));
  }, []);

  const mainCategories = categories.filter((cat) => !cat.parent_id);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left Side */}
          <Link to="/" className="flex items-center">
            <motion.img
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              src="/assets/rb.png"
              alt="RasayanaBio"
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div
              className="relative"
              onMouseEnter={() => setShowCategoryMenu(true)}
              onMouseLeave={() => setShowCategoryMenu(false)}
            >
              <button 
                className="flex items-center transition-colors"
                style={{ 
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
              >
                Shop By Category{' '}
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {showCategoryMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2"
                  >
                    <Link
                      to="/products"
                      className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                    >
                      All Products
                    </Link>
                    {mainCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.id}`}
                        className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setShowHealthMenu(true)}
              onMouseLeave={() => setShowHealthMenu(false)}
            >
              <button 
                className="flex items-center transition-colors"
                style={{ 
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
              >
                Shop by Health Benefit{' '}
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {showHealthMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 py-2"
                  >
                    {healthBenefits.map((hb) => (
                      <Link
                        key={hb.id}
                        to={`/health-benefit/${hb.id}`}
                        className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                      >
                        {hb.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              to="/about" 
              className="transition-colors"
              style={{ 
                color: '#333',
                fontSize: '15px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              About Us
            </Link>

            <button
              onClick={() => navigate('/login')}
              className="transition-colors"
              style={{ 
                color: '#333',
                fontSize: '15px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              Account
            </button>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-6">
            {/* Search Icon */}
            <button 
              className="transition-colors"
              style={{ color: '#333' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Heart/Wishlist Icon */}
            <button 
              className="transition-colors"
              style={{ color: '#333' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Cart Icon with Badge */}
            <Link 
              to="/cart" 
              className="relative transition-colors"
              style={{ color: '#333' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {getCartCount() > 0 && (
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                  style={{ backgroundColor: '#2d6a4f' }}
                >
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: '#333' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden py-4 border-t"
            >
              <Link
                to="/products"
                className="block py-2 hover:text-green-700"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              <Link
                to="/about"
                className="block py-2 hover:text-green-700"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              {healthBenefits.slice(0, 5).map((hb) => (
                <Link
                  key={hb.id}
                  to={`/health-benefit/${hb.id}`}
                  className="block py-2 hover:text-green-700 pl-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {hb.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
