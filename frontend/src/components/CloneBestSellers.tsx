import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeleton';
import { getPublicProducts } from '../services/api';
import { Product } from '../services/api';

const CloneBestSellers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const skeletons = useMemo(() => Array.from({ length: 4 }), []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getPublicProducts({ page: 1, per_page: 4, sort_by: 'created_at', sort_order: 'desc' } as any);
        setProducts(data.products || []);
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center">
        <div className="text-green-900 italic font-serif">- Power Of Nature -</div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-900 font-serif mt-2">Best Sellers Products</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading
          ? skeletons.map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="text-center mt-10">
        <button className="px-6 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800">VIEW MORE</button>
      </div>
    </section>
  );
};

export default CloneBestSellers;


