import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CloneNavbar = () => {
  const { getWishlistCount } = useWishlist();
  const { getCartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
      {/* Row 1: Logo + main nav + icons */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/assets/rb.png" 
            alt="RasayanaBio" 
            className="h-16 w-auto object-contain"
          />
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-gray-700">
          <Link to="#" className="hover:text-green-700">Shop By Category</Link>
          <Link to="#" className="hover:text-green-700">Shop by Health Benefit</Link>
          <Link to="/about" className="hover:text-green-700">About Us</Link>
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/account' : '/login')}
            className="hover:text-green-700"
          >
            {isAuthenticated ? 'Account' : 'Login'}
          </button>
        </nav>
        <div className="flex items-center gap-4">
          {/* Search */}
          <button aria-label="Search" className="p-2 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </button>
          {/* Wishlist */}
          <Link aria-label="Wishlist" to="/wishlist" className="relative p-2 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            {getWishlistCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-green-700 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {getWishlistCount()}
              </span>
            )}
          </Link>
          {/* Cart */}
          <Link aria-label="Cart" to="/cart" className="relative p-2 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {getCartCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-green-700 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {getCartCount()}
              </span>
            )}
          </Link>
          <button className="px-4 py-1.5 rounded-lg bg-green-800 text-white text-sm hover:bg-green-900">Login</button>
        </div>
      </div>
      {/* Row 2 removed to avoid duplicate header appearance */}
    </header>
  );
};

export default CloneNavbar;


