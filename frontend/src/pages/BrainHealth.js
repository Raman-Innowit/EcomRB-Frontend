import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import CloneFooter from '../components/CloneFooter';

const BrainHealth = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          health_benefit_id: 8, // Sports & Fitness ID (using same products)
          page: 1,
          per_page: 20,
        };
        
        const data = await getPublicProducts(params);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/assets/sleep-1.png)',
          }}
        />
        <div className="relative z-10 h-full container mx-auto px-4 md:px-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg md:text-xl lg:text-2xl font-bold" style={{ color: '#ffffff' }}>
              <Link to="/" className="hover:text-green-200 transition-colors" style={{ color: '#ffffff' }}>Home</Link> » brain health
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-center mb-12">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative">
            <div className="relative">
              <img
                src="/assets/about-1.webp"
                alt="Grapefruits"
                className="w-full h-auto rounded-lg"
              />
              {/* 100% ORGANIC Label */}
              <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">
                100% ORGANIC
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1f2937' }}>
              Brain Health
            </h1>
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#2f2f2f', lineHeight: '1.8' }}>
              The importance of maintaining brain health increases with age. Nutra's Bounty recognised this need, and that's why we provide a selection of supplements for brain health that are intended to preserve ideal nerve and brain function. You may boost your brain's ability as you age by addressing several aspects of brain health, such as mental alertness, memory, focus, and more.
            </p>
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#2f2f2f', lineHeight: '1.8' }}>
              Our brain health supplements are made with high-quality ingredients and are supported by thorough scientific study, they are intended to keep you focused and alert while promoting your brain's vibrancy and general health.
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: '#1f2937' }}>
            Brain Health Products
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found for Brain Health</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default BrainHealth;

