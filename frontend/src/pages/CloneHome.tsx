import React, { useEffect, useMemo, useState } from 'react';
import CloneNavbar from '../components/CloneNavbar';
import HeroSlider from '../components/HeroSlider';
import CloneControls from '../components/CloneControls';
import CloneFooter from '../components/CloneFooter';
import CloneCategories from '../components/CloneCategories';
import CloneValueBadges from '../components/CloneValueBadges';
import CloneBestSellers from '../components/CloneBestSellers';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { getPublicProducts } from '../services/api';
import { Product } from '../services/api';
import CloneAbout from '../components/CloneAbout';

const CloneHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState('created_at-desc');

  const skeletons = useMemo(() => Array.from({ length: 9 }), []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [sort_by, sort_order] = sortValue.split('-');
        const data = await getPublicProducts({
          page: 1,
          per_page: 9,
          sort_by,
          sort_order,
          ...(searchValue ? { search: searchValue } : {}),
        } as any);
        setProducts(data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [sortValue, searchValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <CloneNavbar />
      <HeroSlider />

      <CloneCategories />
      <CloneValueBadges />
      <CloneAbout />

      <CloneControls
        total={products.length}
        sortValue={sortValue}
        onSortChange={setSortValue}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={() => {}}
        view={viewMode}
        onViewChange={setViewMode}
      />

      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {skeletons.map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <CloneBestSellers />

      <CloneFooter />
    </div>
  );
};

export default CloneHome;


