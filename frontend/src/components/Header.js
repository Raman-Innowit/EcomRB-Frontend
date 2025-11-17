import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { getPublicCategories, getPublicHealthBenefits } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [healthBenefits, setHealthBenefits] = useState([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [showHealthSubMenu, setShowHealthSubMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getPublicCategories().then((data) => setCategories(data.categories || []));
    getPublicHealthBenefits().then((data) => setHealthBenefits(data.health_benefits || []));
  }, []);

  // Filter to show only specific categories in the header dropdown
  const allowedCategoryNames = ['Health Supplements', 'Cosmetics', 'Honey'];
  const headerCategories = categories.filter((cat) => 
    allowedCategoryNames.includes(cat.name)
  );

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
                  fontWeight: '500',
                  padding: 0,
                  margin: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
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
                      className="block px-4 py-2 hover:bg-green-50 text-gray-700 border-l-4 border-green-700"
                    >
                      All Product
                    </Link>
                    {headerCategories.map((cat) => {
                      if (cat.name === 'Health Supplements') {
                        return (
                          <div
                            key={cat.id}
                            className="relative"
                            onMouseEnter={() => setShowHealthSubMenu(true)}
                            onMouseLeave={() => setShowHealthSubMenu(false)}
                          >
                            <Link
                              to={`/category/${cat.id}`}
                              className="block px-4 py-2 hover:bg-green-50 text-gray-700 flex items-center justify-between"
                            >
                              <span>{cat.name}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                            <AnimatePresence>
                              {showHealthSubMenu && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-full top-0 ml-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                                  onMouseEnter={() => setShowHealthSubMenu(true)}
                                  onMouseLeave={() => setShowHealthSubMenu(false)}
                                >
                                  <Link
                                    to="/category/essential-supplements"
                                    className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                                  >
                                    Essential Supplements
                                  </Link>
                                  <Link
                                    to="/category/speciality-supplements"
                                    className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                                  >
                                    Speciality Supplements
                                  </Link>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.id}`}
                          className="block px-4 py-2 hover:bg-green-50 text-gray-700"
                        >
                          {cat.name}
                        </Link>
                      );
                    })}
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
                  fontWeight: '500',
                  padding: 0,
                  margin: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
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
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              About Us
            </Link>

            <button
              onClick={() => navigate(isAuthenticated ? '/account' : '/login')}
              className="transition-colors"
              style={{ 
                color: '#333',
                fontSize: '15px',
                fontWeight: '500',
                padding: 0,
                margin: 0,
                marginLeft: '2rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d6a4f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              {isAuthenticated ? 'Account' : 'Login'}
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
            <Link 
              to="/wishlist"
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {getWishlistCount() > 0 && (
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                  style={{ backgroundColor: '#2d6a4f' }}
                >
                  {getWishlistCount()}
                </span>
              )}
            </Link>

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

            {/* Grid Menu Button */}
            <button
              onClick={() => setShowContactModal(true)}
              className="w-10 h-10 bg-green-800 rounded-lg flex items-center justify-center hover:bg-green-900 transition"
              aria-label="Contact Menu"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>

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

      {/* Contact Modal - Rendered outside header for proper positioning */}
      <AnimatePresence>
        {showContactModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
              onClick={() => setShowContactModal(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[101] w-full max-w-md p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Contact Us Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Us</h3>
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-800 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:support@rasayanabio.com" className="text-gray-700 hover:text-green-800 transition-colors">
                      support@rasayanabio.com
                    </a>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-800 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:916375257347" className="text-gray-700 hover:text-green-800 transition-colors">
                      91 6375-257347
                    </a>
                  </div>
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-800 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="text-gray-700">
                      B-41, Bank Officers Campus,<br />
                      Jagatpura, Jaipur -302017
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow Us Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {/* Facebook */}
                  <a
                    href="https://facebook.com/rasayanabio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    aria-label="Facebook"
                  >
                    <span className="text-gray-700 font-semibold text-lg">f</span>
                  </a>
                  {/* Twitter */}
                  <a
                    href="https://twitter.com/rasayanabio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    aria-label="Twitter"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com/company/rasayanabio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    aria-label="LinkedIn"
                  >
                    <span className="text-gray-700 font-semibold text-sm">in</span>
                  </a>
                  {/* Instagram */}
                  <a
                    href="https://instagram.com/rasayanabio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
