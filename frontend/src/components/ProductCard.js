import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const displayPrice = product.converted_sale_price || product.converted_price;
  const originalPrice = product.converted_sale_price ? product.converted_price : null;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.converted_price,
      salePrice: product.converted_sale_price,
      quantity: 1,
      slug: product.slug,
    });
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.converted_price,
      salePrice: product.converted_sale_price,
      quantity: 1,
      slug: product.slug,
    });
    navigate('/checkout');
  };

  return (
    <div 
      className="bg-white rounded overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow relative group flex flex-col h-full"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Sale Badge - Top Left */}
      {originalPrice && (
        <div className="absolute top-2 left-2 z-20">
          <span className="text-white text-xs font-bold px-2.5 py-1 rounded" style={{ backgroundColor: '#ff6347', letterSpacing: '0.5px' }}>
            SALE
          </span>
        </div>
      )}

      {/* Wishlist Heart Icon - Top Right */}
      <button 
        className="absolute top-2 right-2 z-20 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all"
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product);
        }}
      >
        <svg
          className="w-4 h-4 transition-colors"
          fill={inWishlist ? '#dc2626' : 'none'}
          stroke={inWishlist ? '#dc2626' : 'currentColor'}
          viewBox="0 0 24 24"
          style={{ color: inWishlist ? '#dc2626' : '#333' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
      
      <Link to={`/product/${product.id}`} className="block flex-grow flex flex-col">
        {/* Product Image Area */}
        <div className="w-full h-56 bg-white flex items-center justify-center relative overflow-hidden">
          {product.thumbnail_url || product.image_url ? (
            <img 
              src={product.thumbnail_url || product.image_url} 
              alt={product.name}
              className="max-w-full max-h-full object-contain p-6"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-bold" style={{ color: '#2d6a4f' }}>
                {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
              </span>
            </div>
          )}
          
          {/* Add to Cart overlay button - appears on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center bg-white/90">
            <button
              onClick={handleAddToCart}
              className="px-6 py-3 font-semibold flex items-center justify-center gap-2 rounded-lg shadow-lg"
              style={{ 
                backgroundColor: 'rgba(30, 110, 60, 0.95)', 
                color: '#fff',
                fontSize: '14px', 
                letterSpacing: '0.5px' 
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              ADD TO CART
            </button>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="px-4 pt-4 pb-2 text-center flex-grow flex flex-col">
          <h3 className="font-semibold mb-3 line-clamp-2" style={{ fontSize: '16px', lineHeight: '1.4', color: '#1e6e3c' }}>
            {product.name || 'Product Name'}
          </h3>
          
          {/* Price Section */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {originalPrice && (
              <span className="text-gray-400 line-through" style={{ fontSize: '14px' }}>
                {product.currency_symbol || '₹'}
                {originalPrice.toFixed(2)}
              </span>
            )}
            <span className="font-bold" style={{ color: '#1e6e3c', fontSize: '18px' }}>
              {product.currency_symbol || '₹'}
              {displayPrice ? displayPrice.toFixed(2) : '0.00'}
            </span>
          </div>

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-4 h-4" fill="#e5e5e5" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </Link>
      
      {/* Buy Now Button */}
      <div className="px-4 pb-4 mt-auto">
        <button
          onClick={handleBuyNow}
          className="block w-full text-center py-3 rounded font-semibold transition-colors"
          style={{ 
            backgroundColor: '#1e6e3c',
            color: '#fff',
            fontSize: '14px',
            letterSpacing: '0.5px'
          }}
        >
          BUY NOW
        </button>
      </div>
    </div>
  );
};

export default ProductCard;


