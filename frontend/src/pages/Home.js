import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts, getPublicHealthBenefits } from '../services/api';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';

const Home = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [healthBenefits, setHealthBenefits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, healthData] = await Promise.all([
          getPublicProducts({ featured: true, per_page: 4 }),
          getPublicHealthBenefits(),
        ]);
        setBestSellers(productsData.products || []);
        setHealthBenefits(healthData.health_benefits || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (name, idx) => {
    const nameLower = name.toLowerCase();
    
    // Beauty & Radiance - Shield with sparkles
    if (nameLower.includes('beauty') || nameLower.includes('radiance')) {
      return {
        color: 'from-orange-400 to-orange-500',
        borderColor: 'border-orange-400',
        leafColor: 'fill-orange-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        ),
      };
    }
    
    // Bio Burner / Weight Loss - Crescent moon
    if (nameLower.includes('bio') || nameLower.includes('burner') || nameLower.includes('weight')) {
      return {
        color: 'from-green-400 to-green-500',
        borderColor: 'border-green-400',
        leafColor: 'fill-green-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ),
      };
    }
    
    // Collagen - Face with skin cells
    if (nameLower.includes('collagen')) {
      return {
        color: 'from-teal-400 to-teal-500',
        borderColor: 'border-teal-400',
        leafColor: 'fill-teal-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      };
    }
    
    // Diabetes Care - Person with medical symbol
    if (nameLower.includes('diabetes')) {
      return {
        color: 'from-blue-400 to-blue-500',
        borderColor: 'border-blue-400',
        leafColor: 'fill-blue-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      };
    }
    
    // Facewash with Glutathione - Female face with bubbles
    if (nameLower.includes('facewash') || nameLower.includes('glutathione') || nameLower.includes('face')) {
      return {
        color: 'from-pink-400 to-pink-500',
        borderColor: 'border-pink-400',
        leafColor: 'fill-pink-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
          </svg>
        ),
      };
    }
    
    // Female Vitality - Mirror with face
    if (nameLower.includes('female') || nameLower.includes('vitality') || nameLower.includes('women')) {
      return {
        color: 'from-purple-400 to-purple-500',
        borderColor: 'border-purple-400',
        leafColor: 'fill-purple-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        ),
      };
    }
    
    // Glass Gel / Hourglass
    if (nameLower.includes('glass') || nameLower.includes('gel')) {
      return {
        color: 'from-amber-400 to-amber-500',
        borderColor: 'border-amber-400',
        leafColor: 'fill-amber-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 12h20" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        ),
      };
    }
    
    // Hair Serum - Person with star
    if (nameLower.includes('hair') || nameLower.includes('serum')) {
      return {
        color: 'from-red-400 to-red-500',
        borderColor: 'border-red-400',
        leafColor: 'fill-red-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      };
    }
    
    // Default fallback icons
    const defaultIcons = [
      {
        color: 'from-indigo-400 to-indigo-500',
        borderColor: 'border-indigo-400',
        leafColor: 'fill-indigo-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      },
      {
        color: 'from-cyan-400 to-cyan-500',
        borderColor: 'border-cyan-400',
        leafColor: 'fill-cyan-400',
        icon: (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        ),
      },
    ];
    
    return defaultIcons[idx % defaultIcons.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl">🌿</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Slider with Rich Graphics Overlay */}
      <HeroSlider />
      
      {/* Health Benefits Grid - Shop by Categories Style with Custom Illustrations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold mb-2">-Categories-</p>
            <h2 className="text-4xl font-bold text-gray-800">
              Shop by Health Benefit
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {healthBenefits.slice(0, 8).map((hb, idx) => {
              const style = getCategoryIcon(hb.name, idx);
              
              return (
                <Link
                  key={hb.id}
                  to={`/health-benefit/${hb.id}`}
                  className="group relative"
                >
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-20 h-20 flex items-center justify-center">
                        {style.icon}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 w-8 h-8 opacity-60">
                      <svg viewBox="0 0 24 24" fill="currentColor" className={style.leafColor}>
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="mt-3 text-center font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                    {hb.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best Sellers Products */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold mb-2">-Power Of Nature-</p>
            <h2 className="text-4xl font-bold text-gray-800">Best Sellers Products</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestSellers.map((product, idx) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {bestSellers.length > 0 && (
            <div className="text-center mt-8">
              <Link
                to="/products"
                className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition"
              >
                View More
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section - Colorful Modern Style */}
      <section className="py-16 relative overflow-hidden bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-green-600 text-sm font-semibold mb-2">-Est. 2021-</p>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why choose us?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-2">
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: 'Commitment to Quality',
                desc: 'Our topmost priority is quality. We source herbs from various regions and subject them to thorough testing.',
                bgColor: 'from-orange-400 to-orange-500',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: 'Embraced by Science',
                desc: 'Our products have no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence.',
                bgColor: 'from-blue-400 to-blue-500',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: 'Transparent Practices',
                desc: 'Transparency is the key to build trust. We commit to mentioning ingredients with detailed information.',
                bgColor: 'from-purple-400 to-purple-500',
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                title: 'Customer Satisfaction',
                desc: 'Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives.',
                bgColor: 'from-pink-400 to-pink-500',
                iconBg: 'bg-pink-100',
                iconColor: 'text-pink-600',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-300"
              >
                <div className={`w-16 h-16 ${item.iconBg} rounded-full flex items-center justify-center mb-4 ${item.iconColor}`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
