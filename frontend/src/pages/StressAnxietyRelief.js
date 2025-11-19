import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublicProducts, getPublicCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import CloneFooter from '../components/CloneFooter';

const StressAnxietyRelief = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getPublicCategories();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          health_benefit_id: 3, // Stress & Anxiety Relief ID
          page,
          per_page: 20,
        };
        
        const search = searchParams.get('search');
        if (search) {
          params.search = search;
        }
        
        const data = await getPublicProducts(params);
        setProducts(data.products || []);
        setTotalPages(data.pages || 1);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const currentParams = Object.fromEntries(searchParams);
    if (searchValue.trim()) {
      currentParams.search = searchValue.trim();
    } else {
      delete currentParams.search;
    }
    setSearchParams(currentParams);
    setPage(1);
  };

  const handleCategoryClick = (categoryId) => {
    const currentParams = Object.fromEntries(searchParams);
    if (categoryId) {
      currentParams.category_id = categoryId.toString();
    } else {
      delete currentParams.category_id;
    }
    setSearchParams(currentParams);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner - Image Background Only */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        {/* Background Image - Full Image Only */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/assets/anxiety-numbness-1-jpg.png)',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 h-full container mx-auto px-4 md:px-8 flex items-center">
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between">
            {/* Left Side - Logo and Text */}
            <div className="flex-1 mb-4 md:mb-0">
              {/* Logo with TM */}
              <div className="mb-4">
                <div className="flex items-center">
                  <img 
                    src="/assets/nutras-bounty-logo.png" 
                    alt="Nutra's Bounty" 
                    className="h-12 md:h-16 w-auto object-contain"
                  />
                  <span className="text-xs ml-1" style={{ color: '#1e6e3c', marginTop: '-8px' }}>TM</span>
                </div>
              </div>
              
              {/* Main Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2" style={{ color: '#374151' }}>
                Stress and Anxiety
              </h1>
              
              {/* Breadcrumb */}
              <div className="text-sm md:text-base mb-2" style={{ color: '#000' }}>
                <Link to="/" className="hover:text-green-600 transition-colors" style={{ color: '#000' }}>HOME</Link> &gt; STRESS AND ANXIETY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Green "Home" Heading */}
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1e6e3c' }}>
              Home
            </h2>
            
            {/* Descriptive Text */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                Achieve a Higher Level of Stress and Anxiety Relief with Nutra's Bounty. Nutra's Bounty has developed a range of 100% drug-free stress and anxiety relief supplements that are ideal for people who struggle with daily stress, anxiety, or need to enhance their mental well-being. Explore our selection of science-based, innovative and high-quality stress and anxiety relief supplements.
              </p>
              <p className="text-gray-800 font-semibold" style={{ fontSize: '16px' }}>
                Get More with Nutra's Bounty All the Time!
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 mt-8">
                <p className="text-gray-600 text-lg">No products found for Stress and Anxiety</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="lg:w-1/4 order-1 lg:order-2">
            <div className="mb-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-gray-100 transition"
                  style={{ color: '#1e6e3c', backgroundColor: '#1e6e3c' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1e6e3c' }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`transition-colors flex items-center w-full py-2.5 text-left ${
                    !searchParams.get('category_id') ? 'text-green-700 font-semibold' : 'text-gray-700'
                  }`}
                  style={{ fontSize: '15px' }}
                >
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>All Products ({products.length})</span>
                </button>
                {categories.map((cat) => {
                  const categoryProducts = products.filter(p => p.category_id === cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`transition-colors flex items-center w-full py-2.5 text-left ${
                        searchParams.get('category_id') === cat.id.toString() ? 'text-green-700 font-semibold' : 'text-gray-700'
                      }`}
                      style={{ fontSize: '15px' }}
                    >
                      <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                      <span>{cat.name} ({categoryProducts.length})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src="/assets/why-choose-us.jpg" 
                  alt="Why Choose Us" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <CloneFooter />
    </div>
  );
};

export default StressAnxietyRelief;

