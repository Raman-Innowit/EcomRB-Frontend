import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublicProducts } from '../services/api';
import { Product } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
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
    
    if (priceRange.max < 2000) {
      newParams.max_price = priceRange.max.toString();
    } else {
      delete newParams.max_price;
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
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

  const handleCategoryClick = (catId: number | null) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-300" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute select-none"
            style={{ 
              fontSize: 'clamp(8rem, 20vw, 16rem)',
              fontFamily: 'Brush Script MT, cursive',
              fontWeight: '400',
              color: '#d8d0c0',
              left: '5%',
              top: '50%',
              transform: 'translateY(-50%)',
              lineHeight: '1',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              opacity: '0.4'
            }}
          >
            RasayanaBio
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="text-left max-w-2xl">
            <div className="text-3xl md:text-4xl mb-2 animate-fade-in inline-flex items-center gap-1">
              <span className="tracking-wide" style={{ 
                fontFamily: 'Cormorant Garamond, Playfair Display, Georgia, serif',
                color: '#2d6a4f',
                fontWeight: '400',
                letterSpacing: '0.02em'
              }}>
                RasayanaBio
              </span>
              <sup className="text-sm" style={{ color: '#2d6a4f' }}>TM</sup>
            </div>
            
            <h1 
              className="mb-4 animate-slide-up leading-none"
              style={{ 
                fontFamily: 'Arial, Helvetica, sans-serif', 
                fontWeight: '700',
                letterSpacing: '0',
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                color: '#2c2c2c'
              }}
            >
              Shop
            </h1>
            
            <div className="text-sm flex items-center gap-2 animate-fade-in-delay">
              <Link 
                to="/" 
                className="hover:text-green-700 transition-all duration-300 font-medium hover:scale-105 inline-block uppercase tracking-wide"
                style={{ color: '#999', fontSize: '0.75rem' }}
              >
                HOME
              </Link>
              <span style={{ color: '#999' }}>›</span>
              <span className="font-semibold uppercase tracking-wide" style={{ color: '#2c2c2c', fontSize: '0.75rem' }}>PRODUCT</span>
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
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 order-1 lg:order-1 space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:border-green-600 transition-colors"
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 text-white rounded-r hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-xl mb-6 text-black">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => handleCategoryClick(null)}
                    className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                      !categoryId ? 'text-green-700 font-semibold' : ''
                    }`}
                    style={{ color: !categoryId ? '#16a34a' : '#333', fontSize: '15px' }}
                  >
                    <span>All Products</span>
                    <span style={{ color: '#999', fontSize: '13px' }}>(15)</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleCategoryClick(1)}
                    className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                      categoryId === '1' ? 'text-green-700 font-semibold' : ''
                    }`}
                    style={{ color: categoryId === '1' ? '#16a34a' : '#333', fontSize: '15px' }}
                  >
                    <span>Beauty & Radiance</span>
                    <span style={{ color: '#999', fontSize: '13px' }}>(3)</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleCategoryClick(2)}
                    className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                      categoryId === '2' ? 'text-green-700 font-semibold' : ''
                    }`}
                    style={{ color: categoryId === '2' ? '#16a34a' : '#333', fontSize: '15px' }}
                  >
                    <span>Cosmetics</span>
                    <span style={{ color: '#999', fontSize: '13px' }}>(2)</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleCategoryClick(3)}
                    className={`hover:text-green-700 transition-colors flex items-center justify-between w-full py-2.5 text-left ${
                      categoryId === '3' ? 'text-green-700 font-semibold' : ''
                    }`}
                    style={{ color: categoryId === '3' ? '#16a34a' : '#333', fontSize: '15px' }}
                  >
                    <span>Essential Supplements</span>
                    <span style={{ color: '#999', fontSize: '13px' }}>(5)</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-xl mb-6 text-black">Price</h3>
              <div className="space-y-4">
                {/* Min Price Slider */}
                <div className="relative">
                  <label className="text-xs font-semibold mb-2 block" style={{ color: '#666' }}>
                    Min: ₹{priceRange.min}
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="50"
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
                <div className="relative">
                  <label className="text-xs font-semibold mb-2 block" style={{ color: '#666' }}>
                    Max: ₹{priceRange.max}
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="50"
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

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold" style={{ color: '#333' }}>
                    ₹{priceRange.min} — ₹{priceRange.max}
                  </span>
                  <button 
                    onClick={handlePriceFilter}
                    className="px-6 py-2 rounded font-semibold text-white text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    FILTER
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Area */}
          <div className="flex-1 order-2 lg:order-2">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div className="text-base" style={{ color: '#6c6c6c' }}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                    Loading products…
                  </span>
                ) : (
                  `Showing ${startResult}–${endResult} of ${totalResults} results`
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split('-');
                    const currentParams = Object.fromEntries(searchParams);
                    setSearchParams({ ...currentParams, sort_by: sb, sort_order: so });
                  }}
                  className="border border-gray-300 rounded px-4 py-2 bg-white hover:border-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                  style={{ fontSize: '14px', color: '#333', minWidth: '200px' }}
                >
                  <option value="created_at-desc">Default sorting</option>
                  <option value="created_at-asc">Sort by oldest</option>
                  <option value="name-asc">Name: A → Z</option>
                  <option value="name-desc">Name: Z → A</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
                
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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="1" width="5" height="5"/>
                      <rect x="10" y="1" width="5" height="5"/>
                      <rect x="1" y="10" width="5" height="5"/>
                      <rect x="10" y="10" width="5" height="5"/>
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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="2" width="14" height="2"/>
                      <rect x="1" y="7" width="14" height="2"/>
                      <rect x="1" y="12" width="14" height="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6 animate-fade-in`}>
                {skeletons.map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-gray-100 animate-fade-in">
                <div className="text-6xl mb-4 opacity-20">🔍</div>
                <p className="text-gray-600 text-2xl font-semibold mb-2">No products found</p>
                <p className="text-gray-400 text-base">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div 
                className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
                style={{ animation: 'fadeIn 0.5s ease-out' }}
              >
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    style={{
                      animation: `slideUp 0.5s ease-out ${index * 0.05}s backwards`
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
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