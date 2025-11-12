import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeleton';
import { getPublicProducts } from '../services/api';

const CloneBestSellers = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const skeletons = useMemo(() => Array.from({ length: 4 }), []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getPublicProducts({ page: 1, per_page: 4, sort_by: 'created_at', sort_order: 'desc' });
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
    <section className="container mx-auto px-4 py-14 md:py-16 bg-white">
      <div className="text-center mb-10 md:mb-12">
        <div className="text-green-900 italic font-serif text-xl md:text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          - Power Of Nature -
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-900 font-serif mt-2">
          Best Sellers Products
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {loading
          ? skeletons.map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="text-center mt-10 md:mt-12">
        <Link
          to="/products"
          className="inline-block px-8 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors shadow-sm"
        >
          VIEW MORE
        </Link>
      </div>
    </section>
  );
};

export default CloneBestSellers;


