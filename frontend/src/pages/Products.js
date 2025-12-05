import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublicProducts, getPublicCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import CloneFooter from '../components/CloneFooter';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [searchValue, setSearchValue] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id');
  const healthBenefitId = searchParams.get('health_benefit_id');
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  useEffect(() => {
    setSearchValue(search);
    if (minPrice || maxPrice) {
      setPriceRange({
        min: minPrice ? parseInt(minPrice) : 0,
        max: maxPrice ? parseInt(maxPrice) : 2000
      });
    }
  }, [search, minPrice, maxPrice]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getPublicCategories();
        setCategories(data.categories || []);
      } catch (error) {
        // Silently handle error
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          per_page: 20,
          sort_by: sortBy,
          sort_order: sortOrder,
        };
        if (search) params.search = search;
        if (categoryId) params.category_id = parseInt(categoryId);
        if (healthBenefitId) params.health_benefit_id = parseInt(healthBenefitId);
        if (minPrice) params.min_price = parseInt(minPrice);
        if (maxPrice) params.max_price = parseInt(maxPrice);

        const data = await getPublicProducts(params);
        setProducts(data.products || []);
        setTotalPages(data.pages || 1);
      } catch (error) {
        const errorMessage = error.message || 'Failed to load products. Please check your API configuration.';
        setError(errorMessage);
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, search, categoryId, healthBenefitId, sortBy, sortOrder, minPrice, maxPrice]);

  const handlePriceFilter = () => {
    const currentParams = Object.fromEntries(searchParams);
    const newParams = { ...currentParams };
    
    // Only add price filters if they're different from defaults
    if (priceRange.min > 0) {
      newParams.min_price = priceRange.min.toString();
    } else {
      delete newParams.min_price;
    }
    
    if (priceRange.max > 0 && priceRange.max < 2000) {
      newParams.max_price = priceRange.max.toString();
    } else {
      delete newParams.max_price;
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const currentParams = Object.fromEntries(searchParams);
    if (searchValue.trim()) {
      setSearchParams({ ...currentParams, search: searchValue.trim() });
    } else {
      const { search, ...rest } = currentParams;
      setSearchParams(rest);
    }
    setCurrentPage(1);
  };

  const handleCategoryClick = (catId) => {
    const currentParams = Object.fromEntries(searchParams);
    if (catId === null) {
      const { category_id, ...rest } = currentParams;
      setSearchParams(rest);
    } else {
      setSearchParams({ ...currentParams, category_id: catId.toString() });
    }
    setCurrentPage(1);
  };

  const skeletons = useMemo(() => Array.from({ length: 9 }), []);

  const totalResults = products.length;
  const startResult = (currentPage - 1) * 20 + 1;
  const endResult = Math.min(currentPage * 20, startResult + totalResults - 1);

  return (
    <div>
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
            
            {/* Shop Heading */}
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
              Shop
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
              <span>PRODUCT</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInDelay {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          50% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-slide-up { animation: slideUp 1s ease-out; }
        .animate-fade-in-delay { animation: fadeInDelay 1.4s ease-out; }
      `}</style>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Controls */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              {loading ? (
                <div className="text-gray-600">Loading products…</div>
              ) : (
                <div className="text-gray-700" style={{ fontSize: '14px' }}>
                  Showing {startResult}–{endResult} of {totalResults} results
                </div>
              )}
              <div className="flex items-center gap-4">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    const currentParams = Object.fromEntries(searchParams);
                    setSearchParams({ ...currentParams, sort_by: newSortBy, sort_order: newSortOrder });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  style={{ fontSize: '14px' }}
                >
                  <option value="created_at-desc">Default sorting</option>
                  <option value="name-asc">Sort by name: A to Z</option>
                  <option value="name-desc">Sort by name: Z to A</option>
                  <option value="base_price-asc">Sort by price: low to high</option>
                  <option value="base_price-desc">Sort by price: high to low</option>
                </select>
                <div className="flex gap-1 border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ backgroundColor: viewMode === 'grid' ? '#1e6e3c' : '#fff' }}
                    title="Grid View"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-l border-gray-300 transition-colors ${
                      viewMode === 'list' 
                        ? 'text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ backgroundColor: viewMode === 'list' ? '#1e6e3c' : '#fff' }}
                    title="List View"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
                      
                      
                      
                    
                  
                
              
            

            {/* Products Grid */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {skeletons.map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold mb-2 text-red-600">API Configuration Error</h3>
                <p className="text-gray-700 mb-4">{error}</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>To fix this:</strong>
                  </p>
                  <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                    <li>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the <code className="bg-gray-100 px-1 rounded">frontend</code> directory</li>
                    <li>Add your API URL: <code className="bg-gray-100 px-1 rounded">REACT_APP_API_URL=https://your-api-url.com/api</code></li>
                    <li>Restart your development server</li>
                  </ol>
                  <p className="text-xs text-gray-600 mt-3">
                    See <code className="bg-gray-100 px-1 rounded">frontend/API_SETUP.md</code> for detailed instructions.
                  </p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded font-semibold transition ${
                      currentPage === page
                        ? 'text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ 
                      backgroundColor: currentPage === page ? '#1e6e3c' : '#fff',
                      fontSize: '14px'
                    }}
                  >
                    {page}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-10 h-10 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </main>

          {/* Sidebar - Right Side */}
          <aside className="lg:w-1/4 order-1 lg:order-2">
            {/* Search Box */}
            <div className="mb-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  style={{ color: '#1e6e3c' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: '#000' }}>
                <span className="w-1 h-8 mr-3" style={{ backgroundColor: '#1e6e3c' }}></span>
                Categories
              </h3>
              <div className="space-y-0">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`transition-colors flex items-center w-full py-2.5 text-left ${
                    !categoryId ? 'text-green-700 font-semibold' : 'text-gray-700'
                  }`}
                  style={{ fontSize: '15px' }}
                >
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>All Products ({products.length})</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`transition-colors flex items-center w-full py-2.5 text-left ${
                      categoryId === cat.id.toString() ? 'text-green-700 font-semibold' : 'text-gray-700'
                    }`}
                    style={{ fontSize: '15px' }}
                  >
                    <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                    <span>{cat.name} ({cat.product_count || 0})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-1 h-6 mr-3" style={{ backgroundColor: '#1e6e3c' }}></span>
                Price
              </h3>
              
              {/* Dual Range Slider */}
              <div className="mb-4">
                <div className="relative h-2 bg-gray-200 rounded-lg">
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange.min}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      setPriceRange(prev => ({
                        ...prev,
                        min: Math.min(newMin, prev.max - 50)
                      }));
                    }}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                    style={{ zIndex: 1 }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange.max}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      setPriceRange(prev => ({
                        ...prev,
                        max: Math.max(newMax, prev.min + 50)
                      }));
                    }}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                    style={{ zIndex: 2 }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-2 mb-3" style={{ fontSize: '13px' }}>
                  PRICE: ₹{priceRange.min} — ₹{priceRange.max}
                </div>
                <button
                  onClick={handlePriceFilter}
                  className="w-full text-white py-2.5 rounded font-semibold transition"
                  style={{ backgroundColor: '#1e6e3c', fontSize: '14px' }}
                >
                  FILTER
                </button>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-1 h-6 mr-3" style={{ backgroundColor: '#1e6e3c' }}></span>
                Availability
              </h3>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-gray-700">Stock status</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="mr-2 w-4 h-4" style={{ accentColor: '#1e6e3c' }} />
                    <span className="text-sm text-gray-700">In Stock</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="mr-2 w-4 h-4" style={{ accentColor: '#1e6e3c' }} />
                    <span className="text-sm text-gray-700">Out of Stock</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-1 h-6 mr-3" style={{ backgroundColor: '#1e6e3c' }}></span>
                Products
              </h3>
              {/* Featured products can be added here */}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #16a34a;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #16a34a;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-webkit-slider-track {
          background: linear-gradient(to right, #16a34a 0%, #16a34a 50%, #e5e7eb 50%, #e5e7eb 100%);
          height: 8px;
          border-radius: 4px;
        }

        .slider::-moz-range-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
        }
      `}</style>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default Products;
