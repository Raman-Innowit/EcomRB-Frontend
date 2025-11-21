import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import CloneFooter from '../components/CloneFooter';

const BoneAndJointHealth = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          health_benefit_id: 7, // Healthy Ageing ID (using same products)
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
              <Link to="/" className="hover:text-green-200 transition-colors" style={{ color: '#ffffff' }}>Home</Link> » bone and joint health
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
              Bone and Joint Health
            </h1>
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#2f2f2f', lineHeight: '1.8' }}>
              Maintaining flexibility and motion is essential for overall well-being. Nutra's Bounty provides supplements specifically formulated to support your bone and joint health. Our products contain essential nutrients that are known to help maintain strong bones and healthy joints.
            </p>
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#2f2f2f', lineHeight: '1.8' }}>
              Our carefully chosen, scientifically researched components support overall joint health and help with periodic joint stiffness, providing quality care for your bone and joint health.
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: '#1f2937' }}>
            Bone and Joint Health Products
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found for Bone and Joint Health</p>
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

export default BoneAndJointHealth;

