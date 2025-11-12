import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProduct } from '../services/api';
import { Product } from '../services/api';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Scale, Heart, Shield, Sparkles } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState<number>(0);
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
      salePrice: pack.price,
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-[600px] w-full bg-gray-200 animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded" />
            <div className="h-20 w-full bg-gray-200 animate-pulse rounded" />
            <div className="flex gap-4">
              <div className="h-12 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-12 w-full bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-xl text-red-500">Product not found</div>
      </div>
    );
  }

  const displayPriceRaw =
    (product as any).converted_sale_price ??
    (product as any).converted_price ??
    (product as any).sale_price ??
    (product as any).base_price ?? 0;
  const originalPriceRaw = (product as any).converted_sale_price
    ? (product as any).converted_price ?? (product as any).base_price
    : null;

  const currencySymbol = (product as any).currency_symbol ?? '₹';
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
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative bg-gradient-to-br from-pink-50 to-white rounded-2xl overflow-hidden shadow-lg"
            >
              {displayPrice < (originalPrice || displayPrice) && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1 rounded-md font-semibold text-sm z-10">
                  SALE
                </div>
              )}
              <div className="aspect-square flex items-center justify-center p-12">
                <span className="text-pink-300 text-[200px] font-bold">
                  {productImages[selectedImage]}
                </span>
              </div>
            </motion.div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-5 gap-2">
              {productImages.map((img, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-pink-400 shadow-md'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
                    <span className="text-pink-300 text-2xl font-bold">{img}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {String(product.name || 'Product')}
              </h1>
              <p className="text-gray-600 text-lg mb-4">60 veg capsules</p>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl text-gray-400 line-through">
                  {currencySymbol}{originalPrice?.toFixed(0) || '1199'}
                </span>
                <span className="text-4xl font-bold text-green-600">
                  {currencySymbol}{displayPrice.toFixed(0)}
                </span>
              </div>

              {/* Health Benefits */}
              {Array.isArray(product.health_benefits) && product.health_benefits.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-6">
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
                      <div
                        key={`benefit-${index}`}
                        className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2"
                      >
                        <Scale className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefitName}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Description */}
              {product.description && typeof product.description === 'string' && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Pack Selection */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Pack:</h3>
                <div className="grid grid-cols-3 gap-4">
                  {packOptions.map((pack, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPack(idx)}
                      className={`relative border-2 rounded-xl p-4 text-center transition-all ${
                        selectedPack === idx
                          ? 'border-green-600 bg-green-50 shadow-lg'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {/* Best Seller Badge */}
                      {idx === 1 && (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white p-2 rounded-full">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      {/* Discount Badge */}
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {pack.discount}%
                      </div>

                      <div className="mb-2">
                        <div className="text-xl font-bold text-gray-800">
                          {pack.bottles} Bottle{pack.bottles > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-green-600 font-semibold">
                          {pack.tablets} Tablets
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {pack.months} Month{pack.months > 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-lg font-bold text-green-600">
                          {currencySymbol}{pack.price}
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          {currencySymbol}{pack.originalPrice}
                        </div>
                        <div className="text-xs text-red-600 font-semibold mt-1">
                          Save {currencySymbol}{pack.savings}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="font-semibold text-lg mb-3 block">Quantity:</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-20 h-12 text-center border-2 border-gray-300 rounded-lg font-semibold text-lg"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg shadow-lg"
                >
                  Add to Cart
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  className="flex-1 border-2 border-green-600 text-green-600 py-4 rounded-lg hover:bg-green-50 transition font-semibold text-lg"
                >
                  Buy Now
                </motion.button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">100% Natural</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Vegan Friendly</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;