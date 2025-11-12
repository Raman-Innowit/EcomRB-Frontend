import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, Transition } from 'framer-motion';

type Slide = {
  id: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  bgFrom: string;
  bgTo: string;
  rightImage: string; // path to hero image on the right
  rightImageClass?: string; // optional sizing/position classes
};

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: (
      <>
        <div className="mb-4">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-16 h-16 object-contain" />
        </div>
        <div className="text-green-800 font-serif leading-tight">
          <div className="text-2xl md:text-3xl mb-2">सर्वे भवन्तु सुखिनः,</div>
          <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold">सर्वे सन्तु निरामयाः</div>
        </div>
      </>
    ),
    subtitle: <span className="text-gray-700">May all be happy, may all be free from disease</span>,
    ctaText: 'VIEW MORE',
    ctaLink: '/products',
    bgFrom: 'from-gray-50',
    bgTo: 'to-white',
    rightImage: '/assets/hero-capsule.png',
    rightImageClass: 'max-h-[520px] md:max-h-[560px] lg:max-h-[600px] drop-shadow',
  },
  {
    id: 2,
    title: (
      <>
        <div className="mb-3">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-14 h-14 object-contain" />
        </div>
        <div>
          <div className="font-serif text-3xl md:text-4xl lg:text-5xl italic mb-2 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>The greatest</div>
          <div className="font-extrabold text-4xl md:text-5xl lg:text-6xl mb-2" style={{ color: '#166534' }}>Wealth Is</div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-black">Health</div>
        </div>
      </>
    ),
    bgFrom: 'from-gray-100',
    bgTo: 'to-gray-50',
    rightImage: '/assets/hero-leaf-head.png',
    rightImageClass: 'max-h-[520px] md:max-h-[560px] lg:max-h-[620px] translate-y-4',
  },
  {
    id: 3,
    title: (
      <>
        <div className="mb-3">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-14 h-14 object-contain" />
        </div>
        <span className="font-serif italic text-lg md:text-xl text-green-700 block mb-1" style={{ fontFamily: 'Georgia, serif' }}>From</span>
        <span className="font-extrabold text-2xl md:text-3xl lg:text-4xl text-green-800 block leading-tight">Youthful Promise to Ageless Beauty</span>
        <div className="text-sm md:text-base text-gray-700 mt-3 leading-relaxed">
          High Potency Collagen No side effects<br />
          <span className="font-semibold">Radiant Results</span>
        </div>
      </>
    ),
    ctaText: 'VIEW MORE',
    ctaLink: '/products?search=beauty',
    bgFrom: 'from-gray-50',
    bgTo: 'to-gray-100',
    rightImage: '/assets/hero-beauty.png',
    rightImageClass: 'max-h-[520px] md:max-h-[560px] lg:max-h-[600px] translate-y-2',
  },
];

const transition: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

const HeroSlider: React.FC<{ slides?: Slide[]; auto?: boolean; intervalMs?: number }>
  = ({ slides = defaultSlides, auto = true, intervalMs = 5000 }) => {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [auto, intervalMs, total]);

  const goTo = (i: number) => setIndex(((i % total) + total) % total);
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const active = useMemo(() => slides[index], [slides, index]);

  return (
    <section className="relative overflow-hidden">
      <div className={`relative min-h-[520px] md:min-h-[600px] bg-gradient-to-br ${active.bgFrom} ${active.bgTo} transition-all duration-700`}>
        {/* Subtle botanical background image */}
        <img src="/assets/hero-bg.png" alt="pattern" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />

        <div className="container mx-auto px-4 h-full">
          <div className="relative flex items-center min-h-[520px] md:min-h-[600px] py-12">
            {/* Left Side - Content */}
            <div className="relative z-20 w-full md:w-1/2 pr-4 md:pr-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={transition}
                  className="text-left"
                >
                  <div className="mb-4 md:mb-6">{active.title}</div>
                  {active.subtitle && (
                    <div className="mb-6 md:mb-8 text-gray-700">{active.subtitle}</div>
                  )}
                  {active.ctaText && active.ctaLink && (
                    <Link
                      to={active.ctaLink}
                      className="inline-block bg-green-800 hover:bg-green-900 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-lg font-semibold text-sm md:text-base transition-all shadow-md"
                    >
                      {active.ctaText}
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Side - Image */}
            <div className="absolute right-0 top-0 w-full md:w-1/2 h-full flex items-center justify-center pointer-events-none z-10">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`img-${active.id}`}
                  src={active.rightImage}
                  alt="slide visual"
                  className={`object-contain ${active.rightImageClass || ''}`}
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -50 }}
                  transition={{ ...transition, delay: 0.1 }}
                />
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10" style={{ left: '-60px', right: '-60px' }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={prev}
                className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-lg border border-gray-200 text-green-700"
                aria-label="Previous slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-lg border border-gray-200 text-green-700"
                aria-label="Next slide"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3 z-20">
            {slides.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => goTo(i)}
                whileHover={{ scale: 1.2 }}
                className={`h-3 rounded-full transition-all shadow-md ${i === index ? 'w-8 bg-green-700' : 'w-3 bg-green-300 hover:bg-green-400'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;