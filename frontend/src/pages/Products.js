import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublicProducts, getPublicCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
        console.error('Error fetching products:', error);
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            RasayanaBio
          </h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">
            RasayanaBio
          </h2>
          <span className="text-sm">TM</span>
          <div className="mt-4">
            <p className="text-lg mb-2">Shop</p>
            <nav className="text-sm">
              <Link to="/" className="text-gray-600 hover:text-green-700">HOME</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-800">PRODUCT</span>
            </nav>
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
          {/* Sidebar */}
          <aside className="lg:w-1/4">
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                    !categoryId ? 'text-green-700 font-semibold' : ''
                  }`}
                  style={{ color: !categoryId ? '#16a34a' : '#333', fontSize: '15px' }}
                >
                  <span>All Products</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                      categoryId === cat.id.toString() ? 'text-green-700 font-semibold' : ''
                    }`}
                    style={{ color: categoryId === cat.id.toString() ? '#16a34a' : '#333', fontSize: '15px' }}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Price</h3>
              
              {/* Min Price Slider */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Min: ₹{priceRange.min}
                </label>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Max Price Slider */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Max: ₹{priceRange.max}
                </label>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  ₹{priceRange.min} — ₹{priceRange.max}
                </div>
                <button
                  onClick={handlePriceFilter}
                  className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
                >
                  FILTER
                </button>
              </div>
            </div>
          </aside>

          {/* Products Area */}
          <main className="lg:w-3/4">
            {/* Controls */}
            <div className="mb-4 flex justify-between items-center">
              {loading ? (
                <div>Loading products…</div>
              ) : (
                <div>Showing {startResult}–{endResult} of {totalResults} results</div>
              )}

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-');
                  const currentParams = Object.fromEntries(searchParams);
                  setSearchParams({ ...currentParams, sort_by: sb, sort_order: so });
                }}
                className="border border-gray-300 rounded px-4 py-2 bg-white hover:bg-gray-400 focus:bg-gray-400 focus:outline-none transition-colors"
                style={{ fontSize: '14px', color: '#333', minWidth: '200px' }}
              >
                <option value="created_at-desc">Default sorting</option>
                <option value="created_at-asc">Sort by oldest</option>
                <option value="name-desc">Name → Z</option>
                <option value="name-asc">Name → A</option>
                <option value="price-desc">Price → High</option>
                <option value="price-asc">Price → Low</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#000' : '#fff' }}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border-l border-gray-300 transition-colors ${
                  viewMode === 'list' 
                    ? 'text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#000' : '#fff' }}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
                      
                      
                      
                    
                  
                
              
            

            {/* Products Grid */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {skeletons.map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
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
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </main>
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
    </div>
  );
};

export default Products;
