import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts, getPublicHealthBenefits } from '../services/api';
import { Product, HealthBenefit } from '../services/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import HeroSlider from '../components/HeroSlider';

const Home: React.FC = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [healthBenefits, setHealthBenefits] = useState<HealthBenefit[]>([]);
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

  const getCategoryIcon = (name: string, idx: number) => {
    const nameLower = name.toLowerCase();
    
    // Beauty & Radiance - Shield with sparkles
    if (nameLower.includes('beauty') || nameLower.includes('radiance')) {
      return {
        color: 'from-orange-400 to-orange-500',
        borderColor: 'border-orange-400',
        leafColor: 'fill-orange-400',
        icon: (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path d="M40 15 L28 18 Q25 19 25 23 L25 38 Q25 50 40 58 Q55 50 55 38 L55 23 Q55 19 52 18 Z" fill="#fff" stroke="#f97316" strokeWidth="2.5"/>
            <circle cx="32" cy="30" r="2.5" fill="#f97316"/>
            <circle cx="40" cy="28" r="2.5" fill="#f97316"/>
            <circle cx="48" cy="30" r="2.5" fill="#f97316"/>
            <circle cx="35" cy="38" r="2.5" fill="#f97316"/>
            <circle cx="45" cy="38" r="2.5" fill="#f97316"/>
            <circle cx="40" cy="46" r="2.5" fill="#f97316"/>
            <g fill="#fbbf24" opacity="0.6">
              <path d="M22 15 L23 18 L26 18 L24 20 L25 23 L22 21 L19 23 L20 20 L18 18 L21 18 Z" transform="scale(0.5)"/>
              <path d="M58 20 L59 22 L61 22 L59.5 23.5 L60 25.5 L58 24 L56 25.5 L56.5 23.5 L55 22 L57 22 Z" transform="scale(0.6)"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path d="M45 20 Q35 20 30 30 Q25 40 30 50 Q35 60 45 60 Q50 60 54 57 Q48 55 45 50 Q40 42 42 35 Q44 28 50 25 Q48 20 45 20 Z" fill="#fff" stroke="#22c55e" strokeWidth="2.5"/>
            <g fill="#22c55e">
              <path d="M25 25 L26 28 L29 28 L27 30 L28 33 L25 31 L22 33 L23 30 L21 28 L24 28 Z"/>
              <path d="M55 32 L56 34 L58 34 L56.5 35.5 L57 37.5 L55 36 L53 37.5 L53.5 35.5 L52 34 L54 34 Z" transform="scale(0.8)"/>
              <path d="M28 50 L29 52 L31 52 L29.5 53.5 L30 55.5 L28 54 L26 55.5 L26.5 53.5 L25 52 L27 52 Z" transform="scale(0.7)"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="35" r="18" fill="#fff" stroke="#14b8a6" strokeWidth="2.5"/>
            <path d="M32 30 Q34 28 36 30" stroke="#14b8a6" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M44 30 Q46 28 48 30" stroke="#14b8a6" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M33 42 Q40 45 47 42" stroke="#14b8a6" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <g fill="#14b8a6" opacity="0.3">
              <circle cx="28" cy="25" r="3"/>
              <circle cx="52" cy="25" r="3"/>
              <circle cx="25" cy="40" r="2.5"/>
              <circle cx="55" cy="40" r="2.5"/>
              <circle cx="30" cy="50" r="2"/>
              <circle cx="50" cy="50" r="2"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="26" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="2.5"/>
            <path d="M40 33 L40 50 M32 40 L40 37 L48 40 M40 50 L35 60 M40 50 L45 60" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <g transform="translate(52, 28)">
              <rect x="-3" y="-3" width="14" height="14" rx="2" fill="#fff" stroke="#3b82f6" strokeWidth="2"/>
              <line x1="4" y1="0" x2="4" y2="8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="4" x2="8" y2="4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="26" r="7" fill="#fff" stroke="#ec4899" strokeWidth="2.5"/>
            <path d="M40 33 L40 48 M33 38 L40 35 L47 38 M33 48 L40 48 L47 48 L40 48 L35 60 M40 48 L45 60" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M33 38 Q40 42 47 38 L47 48 Q40 50 33 48 Z" fill="#fce7f3" opacity="0.6"/>
            <g>
              <circle cx="28" cy="24" r="2" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="52" cy="30" r="2.5" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="25" cy="36" r="1.5" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="54" cy="42" r="2" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.6"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <ellipse cx="40" cy="32" rx="14" ry="16" fill="#fff" stroke="#a855f7" strokeWidth="2.5"/>
            <ellipse cx="40" cy="32" rx="11" ry="13" fill="#f3e8ff" opacity="0.5"/>
            <rect x="37" y="47" width="6" height="13" rx="3" fill="#a855f7"/>
            <ellipse cx="40" cy="60" rx="5" ry="3" fill="#9333ea"/>
            <circle cx="36" cy="30" r="1.5" fill="#9333ea"/>
            <circle cx="44" cy="30" r="1.5" fill="#9333ea"/>
            <path d="M36 36 Q40 38 44 36" stroke="#9333ea" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <g fill="#a855f7" opacity="0.4">
              <circle cx="52" cy="24" r="1.5"/>
              <circle cx="28" cy="28" r="1.5"/>
              <circle cx="50" cy="38" r="1"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path d="M30 22 L50 22 L50 26 Q45 30 40 35 Q35 30 30 26 Z M30 58 L50 58 L50 54 Q45 50 40 45 Q35 50 30 54 Z" fill="#fff" stroke="#f59e0b" strokeWidth="2.5"/>
            <path d="M32 24 L48 24 L48 26 Q44 29 40 33 Q36 29 32 26 Z" fill="#fef3c7" opacity="0.8"/>
            <path d="M32 56 L48 56 L48 54 Q44 51 40 47 Q36 51 32 54 Z" fill="#fbbf24"/>
            <circle cx="40" cy="38" r="1" fill="#f59e0b"/>
            <circle cx="39" cy="41" r="0.8" fill="#f59e0b"/>
            <circle cx="41" cy="41" r="0.8" fill="#f59e0b"/>
            <g transform="translate(55, 35)">
              <path d="M0 0 Q2 -3 4 -2 Q3 0 2 2 Q1 3 0 2 Z" fill="#22c55e" opacity="0.8"/>
              <path d="M0 0 Q-2 -3 -4 -2 Q-3 0 -2 2 Q-1 3 0 2 Z" fill="#16a34a" opacity="0.8"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="26" r="7" fill="#fff" stroke="#ef4444" strokeWidth="2.5"/>
            <path d="M40 33 L40 48 M33 38 L40 35 L47 38 M40 48 L35 58 M40 48 L45 58" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <g transform="translate(52, 22)">
              <path d="M0 -6 L2 -1 L7 -1 L3 2 L5 7 L0 4 L-5 7 L-3 2 L-7 -1 L-2 -1 Z" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5"/>
              <circle cx="0" cy="0" r="2" fill="#ef4444"/>
            </g>
            <g fill="#ef4444" opacity="0.3">
              <circle cx="52" cy="32" r="1.5"/>
              <circle cx="28" cy="28" r="1"/>
              <circle cx="50" cy="42" r="1"/>
            </g>
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
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="40" r="18" fill="#fff" stroke="#6366f1" strokeWidth="2.5"/>
            <path d="M30 40 L37 47 L50 30" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="40" cy="40" r="12" fill="#e0e7ff" opacity="0.3"/>
          </svg>
        ),
      },
      {
        color: 'from-cyan-400 to-cyan-500',
        borderColor: 'border-cyan-400',
        leafColor: 'fill-cyan-400',
        icon: (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path d="M40 20 L45 35 L60 35 L48 45 L53 60 L40 50 L27 60 L32 45 L20 35 L35 35 Z" fill="#fff" stroke="#06b6d4" strokeWidth="2.5"/>
            <circle cx="40" cy="40" r="8" fill="#cffafe" opacity="0.5"/>
          </svg>
        ),
      },
    ];
    
    return defaultIcons[idx % defaultIcons.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl"
        >
          🌿
        </motion.div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Slider with Rich Graphics Overlay */}
      <div className="relative">
        <HeroSlider />
        
        {/* Floating Animated Graphics Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large decorative leaves - bottom left */}
          <motion.div
            className="absolute left-0 bottom-0 w-72 h-72 opacity-30"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 220Q80 180 110 160Q140 140 170 130" stroke="#15803d" strokeWidth="5" opacity="0.5"/>
              <ellipse cx="70" cy="180" rx="60" ry="90" fill="#16a34a" opacity="0.6" transform="rotate(-25 70 180)"/>
              <ellipse cx="100" cy="160" rx="55" ry="85" fill="#22c55e" opacity="0.5" transform="rotate(-20 100 160)"/>
              <ellipse cx="130" cy="145" rx="50" ry="75" fill="#4ade80" opacity="0.4" transform="rotate(-15 130 145)"/>
            </svg>
          </motion.div>

          {/* Large decorative leaves - top right */}
          <motion.div
            className="absolute right-0 top-0 w-80 h-80 opacity-25"
            animate={{
              y: [0, 25, 0],
              rotate: [0, -8, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="220" cy="100" rx="70" ry="100" fill="#22c55e" opacity="0.5" transform="rotate(25 220 100)"/>
              <ellipse cx="190" cy="110" rx="65" ry="95" fill="#16a34a" opacity="0.6" transform="rotate(30 190 110)"/>
              <ellipse cx="240" cy="130" rx="60" ry="85" fill="#4ade80" opacity="0.4" transform="rotate(35 240 130)"/>
              <path d="M240 60Q210 90 180 130Q150 170 120 200" stroke="#15803d" strokeWidth="6" opacity="0.4"/>
            </svg>
          </motion.div>

          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-green-400"
              style={{
                left: `${10 + i * 6}%`,
                top: `${20 + (i % 3) * 25}%`,
                width: `${6 + (i % 3) * 4}px`,
                height: `${6 + (i % 3) * 4}px`,
                opacity: 0.2,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Health Benefits Grid - Shop by Categories Style with Custom Illustrations */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-green-700 font-serif italic text-lg mb-2">-Categories-</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Shop by Health Benefit
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {healthBenefits.slice(0, 8).map((hb, idx) => {
              const style = getCategoryIcon(hb.name, idx);
              
              return (
                <motion.div
                  key={hb.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    to={`/health-benefit/${hb.id}`}
                    className="block text-center group"
                  >
                    {/* Circular icon container with custom illustration */}
                    <div className="relative inline-block mb-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-3 ${style.borderColor} bg-white flex items-center justify-center relative shadow-lg group-hover:shadow-xl transition-all`}
                      >
                        {/* Custom icon illustration */}
                        <div className="w-20 h-20 md:w-24 md:h-24">
                          {style.icon}
                        </div>
                      </motion.div>
                      
                      {/* Two-leaf decoration - top right */}
                      <div className="absolute -top-1 -right-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <ellipse cx="12" cy="9" rx="6" ry="9" className={style.leafColor} transform="rotate(-25 12 9)" opacity="0.9"/>
                          <ellipse cx="14" cy="11" rx="5" ry="8" className={style.leafColor} transform="rotate(-35 14 11)" opacity="0.7"/>
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-sm md:text-base text-gray-800 group-hover:text-green-700 transition-colors px-2">
                      {hb.name}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best Sellers Products */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Subtle background leaves */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-40 h-40"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 150 150" fill="none">
              <ellipse cx="75" cy="75" rx="60" ry="90" fill="#16a34a" transform="rotate(20 75 75)"/>
            </svg>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-green-700 font-serif italic text-xl mb-2">-Power Of Nature-</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-green-800 tracking-tight">
              Best Sellers Products
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestSellers.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          
          {bestSellers.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link
                to="/products"
                className="inline-block bg-green-700 text-white px-10 py-4 rounded-lg text-lg font-bold shadow-lg hover:bg-green-800 hover:shadow-xl transition-all hover:scale-105"
              >
                View More
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section - Colorful Modern Style */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 relative overflow-hidden">
        {/* Animated background shapes with different colors */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <motion.div
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-10 w-64 h-64 rounded-full bg-yellow-400"
            animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 25, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-400"
            animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Decorative elements */}
          <svg className="absolute top-10 right-1/4 w-48 h-48 opacity-20" viewBox="0 0 200 200" fill="none">
            <ellipse cx="100" cy="100" rx="80" ry="120" fill="#fbbf24" transform="rotate(25 100 100)"/>
          </svg>
          <svg className="absolute bottom-20 left-1/4 w-56 h-56 opacity-20" viewBox="0 0 200 200" fill="none">
            <ellipse cx="100" cy="100" rx="90" ry="130" fill="#60a5fa" transform="rotate(-35 100 100)"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <p className="text-white/90 font-serif italic text-lg mb-2">-Est. 2021-</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Why choose us?
            </h2>
            <p className="text-white/95 text-base max-w-3xl mx-auto mb-3">
              We keep our formulas basic since we are primarily concerned with your health.
            </p>
            <p className="text-white/95 text-base max-w-4xl mx-auto">
              Our products are made entirely from natural components. Our desire for authenticity compelled us to develop the greatest!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            {[
              {
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
                  </>
                ),
                title: 'Commitment to Quality',
                desc: 'Our topmost priority is quality. We source herbs from various regions and subject them to thorough testing.',
                bgColor: 'from-orange-400 to-orange-500',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
              },
              {
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </>
                ),
                title: 'Embraced by Science',
                desc: 'Our products have no side effects, just pure herbs helping you embrace a lifestyle rooted in scientific excellence.',
                bgColor: 'from-blue-400 to-blue-500',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
              },
              {
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                ),
                title: 'Transparent Practices',
                desc: 'Transparency is the key to build trust. We commit to mentioning ingredients with detailed information.',
                bgColor: 'from-purple-400 to-purple-500',
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
              },
              {
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </>
                ),
                title: 'Customer Satisfaction',
                desc: 'Your satisfaction is our primary objective. Our products contain no artificial or synthetic additives.',
                bgColor: 'from-pink-400 to-pink-500',
                iconBg: 'bg-pink-100',
                iconColor: 'text-pink-600',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="text-center bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
              >
                {/* Gradient hover effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Colorful icon container */}
                <motion.div
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`w-20 h-20 mx-auto mb-6 relative z-10 ${item.iconBg} rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <svg
                    className={`w-10 h-10 ${item.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {item.icon}
                  </svg>
                </motion.div>
                
                <h3 className="font-bold text-xl mb-4 text-gray-800 relative z-10">
                  {item.title}
                </h3>
                <p className="text-gray-600 relative z-10 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;