import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import CloneFooter from '../components/CloneFooter';

const CatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const bodyFontSize = '17px';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getPublicProducts({ page: 1, per_page: 20 });
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section / Banner */}
      <div 
        className="relative py-12 px-4"
        style={{
          backgroundColor: '#FAFAF5',
          backgroundImage: 'url(/assets/products-banner-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Watermark */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 200\'%3E%3Ctext x=\'10\' y=\'150\' font-family=\'Brush Script MT, Lucida Handwriting, cursive\' font-size=\'120\' fill=\'%23E8E8E0\' opacity=\'0.3\'%3ERasayana%3C/text%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'left bottom',
            backgroundSize: 'auto 60%'
          }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="relative" style={{ paddingLeft: '0', marginLeft: '0' }}>
            {/* Logo */}
            <div className="relative mt-8 mb-6" style={{ paddingLeft: '0' }}>
              <img 
                src="/assets/products-logo.png" 
                alt="RasayanaBio" 
                className="h-16 w-auto object-contain"
                style={{ marginLeft: '0' }}
              />
            </div>
            
            {/* Product Catalog Heading */}
            <h1 
              className="text-5xl md:text-6xl font-bold mb-4 relative z-10"
              style={{
                color: '#374151',
                paddingLeft: '0',
                marginLeft: '0',
                fontSize: '3rem',
                lineHeight: '1.2'
              }}
            >
              Product Catalog
            </h1>
            
            {/* Breadcrumbs */}
            <div 
              className="text-sm font-sans uppercase relative z-10" 
              style={{ 
                color: '#000000', 
                paddingLeft: '0', 
                marginLeft: '0',
                fontSize: '0.875rem'
              }}
            >
              <Link to="/" className="hover:text-green-700 transition-colors">HOME</Link>
              <span className="mx-2">&gt;</span>
              <span>PRODUCT CATALOG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Grid - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse h-96 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>

          {/* Sidebar - Right Side */}
          <aside className="lg:w-1/4 order-1 lg:order-2">
            {/* Search Box */}
            <div className="mb-8">
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: bodyFontSize }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-gray-100 transition"
                  style={{ color: '#1c5f2a' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Lifestyle (1)</span>
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-6 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Recent Posts
              </h3>
              <div className="space-y-5">
                <Link 
                  to="/comprehensive-benefits-of-magnesium-for-overall-wellness"
                  className="flex gap-4 hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug hover:text-green-700 transition-colors" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                      Comprehensive Benefits of Magnesium for
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>September 1, 2025</p>
                  </div>
                </Link>
                <Link 
                  to="/early-detection-of-diabetes"
                  className="flex gap-4 hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/assets/diabetes-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug hover:text-green-700 transition-colors" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                      Stay Healthy, Stay Informed: Early Detec
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>October 9, 2024</p>
                  </div>
                </Link>
                <Link 
                  to="/6-good-sources-of-vitamin-d-for-vegans"
                  className="flex gap-4 hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/assets/vitamin-d-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug hover:text-green-700 transition-colors" style={{ color: '#2f2f2f', fontSize: bodyFontSize }}>
                      6 good sources of vitamin D for vegans
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>February 27, 2020</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['ASHWAGANDHA', 'AYURVEDIC', 'AYURVEDIC PRODUCTS', 'FEMALE WELLNESS', 'NO HARSH CHEMICALS', 'NON-GMO', 'NUT- AND GLUTEN-FREE', 'PRODUCTS', 'SCIENTIFICALLY TESTED', 'SOY-FREE'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/products?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded font-medium border border-gray-300 transition-colors hover:bg-[#1e8f3a] hover:text-white hover:border-[#1e8f3a]"
                    style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default CatalogPage;

