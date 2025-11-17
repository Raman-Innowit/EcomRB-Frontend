import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CloneFooter from '../components/CloneFooter';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlistItems, clearWishlist } = useWishlist();
  const hasItems = wishlistItems.length > 0;

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
              onClick={clearWishlist}
              className="self-start md:self-auto bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {!hasItems && (
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

        {hasItems && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((product) => (
              <ProductCard key={product.id} product={product} />
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


