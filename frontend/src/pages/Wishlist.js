import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CloneFooter from '../components/CloneFooter';
import { useAuth } from '../context/AuthContext';
import { getWishlist, removeFromWishlist } from '../services/api';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasItems = wishlistItems.length > 0;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wishlist', message: 'Please login to view your wishlist' } });
      return;
    }

    fetchWishlist();
  }, [isAuthenticated, navigate]);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Wishlist] Fetching wishlist...');
      const response = await getWishlist();
      console.log('[Wishlist] Response:', response);
      
      if (response.success) {
        // Transform API response to match ProductCard format
        const products = (response.wishlist || []).map(item => ({
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          price: item.base_price,
          salePrice: item.sale_price,
          image_url: item.image_url,
          thumbnail_url: item.image_url,
        }));
        console.log('[Wishlist] Transformed products:', products);
        setWishlistItems(products);
      } else {
        console.error('[Wishlist] API returned success=false:', response);
        setError(response.error || response.message || 'Failed to load wishlist');
      }
    } catch (err) {
      console.error('[Wishlist] Error fetching wishlist:', err);
      console.error('[Wishlist] Error details:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const response = await removeFromWishlist(productId);
      if (response.success) {
        // Remove from local state
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      try {
        // Remove all items one by one
        const removePromises = wishlistItems.map(item => removeFromWishlist(item.id));
        await Promise.all(removePromises);
        setWishlistItems([]);
      } catch (err) {
        console.error('Error clearing wishlist:', err);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-green-600 uppercase tracking-wide text-sm font-semibold mb-2">Your Favorites</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {hasItems
                ? 'Loved items gathered in one place. Move them to cart whenever you are ready.'
                : 'You have not saved any products yet. Browse products and tap the heart icon to add them here.'}
            </p>
          </div>

          {hasItems && (
            <button
              onClick={handleClearWishlist}
              className="self-start md:self-auto bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchWishlist}
              className="inline-flex items-center justify-center bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !hasItems && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-2xl font-bold mb-4">
              ♡
            </div>
            <p className="text-lg text-gray-700 mb-4">Save products you love and revisit them any time.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && hasItems && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((product) => (
              <div key={product.id} className="relative">
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
                  title="Remove from wishlist"
                >
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-16">
        <CloneFooter />
      </div>
    </div>
  );
};

export default Wishlist;


