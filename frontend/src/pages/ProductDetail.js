import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  // Pack options with pricing tiers
  const packOptions = [
    {
      bottles: 1,
      tablets: 60,
      months: 1,
      discount: 30,
      price: 839,
      originalPrice: 1199,
      savings: 360,
    },
    {
      bottles: 2,
      tablets: 120,
      months: 2,
      discount: 33,
      price: 1607,
      originalPrice: 2398,
      savings: 791,
    },
    {
      bottles: 3,
      tablets: 180,
      months: 3,
      discount: 40,
      price: 2158,
      originalPrice: 3597,
      savings: 1439,
    },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getPublicProduct(parseInt(id));
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const pack = packOptions[selectedPack];
    addToCart({
      productId: product.id,
      name: product.name,
      price: pack.price,
      salePrice: pack.salePrice,
      quantity: pack.bottles * quantity,
      slug: product.slug,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link to="/products" className="text-green-600 hover:text-green-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const displayPriceRaw =
    product.converted_sale_price ??
    product.converted_price ??
    product.sale_price ??
    product.base_price ?? 0;
  const originalPriceRaw = product.converted_sale_price
    ? product.converted_price ?? product.base_price
    : null;

  const currencySymbol = product.currency_symbol ?? '₹';
  const displayPrice = Number(displayPriceRaw);
  const originalPrice = originalPriceRaw !== null ? Number(originalPriceRaw) : null;

  // Mock images - in real app, these would come from product data
  const productImages = [
    product.name.charAt(0).toUpperCase(),
    product.name.charAt(0).toUpperCase(),
    product.name.charAt(0).toUpperCase(),
    product.name.charAt(0).toUpperCase(),
    product.name.charAt(0).toUpperCase(),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side - Product Images */}
        <div>
          {/* Main Image */}
          <div className="relative mb-4">
            {displayPrice < originalPrice && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded z-10">
                SALE
              </div>
            )}
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              {productImages[selectedImage]}
            </div>
          </div>

          {/* Thumbnail Images */}
          <div className="grid grid-cols-4 gap-2">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === idx
                    ? 'border-pink-400 shadow-md'
                    : 'border-gray-200 hover:border-pink-200'
                }`}
              >
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  {img}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {String(product.name || 'Product')}
          </h1>
          <p className="text-gray-600 mb-4">60 veg capsules</p>

          {/* Price */}
          <div className="mb-4">
            {originalPrice && (
              <span className="text-gray-500 line-through mr-2">
                {currencySymbol}{originalPrice.toFixed(0)}
              </span>
            )}
            <span className="text-3xl font-bold text-green-700">
              {currencySymbol}{displayPrice.toFixed(0)}
            </span>
          </div>

          {/* Health Benefits */}
          {Array.isArray(product.health_benefits) && product.health_benefits.length > 0 && (
            <div className="mb-6">
              {product.health_benefits.slice(0, 4).map((hb, index) => {
                // Safely extract the name
                let benefitName = '';
                try {
                  if (typeof hb === 'string') {
                    benefitName = hb;
                  } else if (hb && typeof hb === 'object' && 'name' in hb) {
                    benefitName = String(hb.name || 'Health Benefit');
                  } else {
                    benefitName = 'Health Benefit';
                  }
                } catch (err) {
                  console.error('Error parsing health benefit:', err);
                  benefitName = 'Health Benefit';
                }
                
                return (
                  <span key={index} className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full mr-2 mb-2">
                    {benefitName}
                  </span>
                );
              })}
            </div>
          )}

          {/* Description */}
          {product.description && typeof product.description === 'string' && (
            <div className="mb-6">
              <p className="text-gray-700">
                {product.description}
              </p>
            </div>
          )}

          {/* Pack Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-3">Pack:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packOptions.map((pack, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPack(idx)}
                  className={`relative border-2 rounded-xl p-4 text-center transition-all ${
                    selectedPack === idx
                      ? 'border-green-600 bg-green-50 shadow-lg'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  {/* Best Seller Badge */}
                  {idx === 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                      BEST SELLER
                    </div>
                  )}

                  {/* Discount Badge */}
                  {pack.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {pack.discount}%
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {pack.bottles} Bottle{pack.bottles > 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {pack.tablets} Tablets
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {pack.months} Month{pack.months > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-bold text-green-700">
                      {currencySymbol}{pack.price}
                    </div>
                    {pack.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        {currencySymbol}{pack.originalPrice}
                      </div>
                    )}
                    {pack.savings > 0 && (
                      <div className="text-sm text-green-600 font-semibold">
                        Save {currencySymbol}{pack.savings}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity || 10, quantity + 1))}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-semibold"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              Buy Now
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">100% Natural</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">Vegan Friendly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
