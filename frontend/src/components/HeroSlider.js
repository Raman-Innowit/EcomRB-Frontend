import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const defaultSlides = [
  {
    id: 1,
    title: (
      <>
        <div className="mb-3">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
        </div>
        <div className="text-green-800 leading-tight space-y-3">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold">सर्वे भवन्तु सुखिनः,</div>
          <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold">सर्वे सन्तु निरामयाः</div>
        </div>
      </>
    ),
    subtitle: <span className="text-gray-800 text-xl md:text-2xl mt-2 block">May all be happy, may all be free from disease</span>,
    ctaText: 'VIEW MORE',
    ctaLink: '/products',
    bgFrom: 'from-gray-50',
    bgTo: 'to-white',
    rightImage: '/assets/hero-capsule.png',
    rightImageClass: 'max-h-[850px] md:max-h-[900px] lg:max-h-[970px] -translate-y-12 md:-translate-y-14 lg:-translate-y-16 drop-shadow',
  },
  {
    id: 2,
    title: (
      <>
        <div className="mb-2">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl md:text-5xl lg:text-6xl italic text-black" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The greatest</div>
          <div className="font-extrabold text-6xl md:text-7xl lg:text-8xl" style={{ color: '#15803d' }}>Wealth Is</div>
          <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-black">Health</div>
        </div>
      </>
    ),
    bgFrom: 'from-gray-100',
    bgTo: 'to-gray-50',
    rightImage: '/assets/hero-leaf-head.png',
    rightImageClass: 'max-h-[850px] md:max-h-[900px] lg:max-h-[970px] translate-y-4',
  },
  {
    id: 3,
    title: (
      <>
        <div className="mb-2">
          <img src="/assets/lotus-logo.png" alt="Lotus" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
        </div>
        <span className="text-2xl md:text-3xl text-black block mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>From</span>
        <span className="font-extrabold text-4xl md:text-5xl lg:text-6xl block leading-tight mb-3" style={{ color: '#15803d' }}>Youthful Promise to Ageless Beauty</span>
        <div className="text-lg md:text-xl text-black mt-2 leading-relaxed">
          High Potency Collagen No side effects<br />
          <span className="font-bold">Radiant Results</span>
        </div>
      </>
    ),
    ctaText: 'VIEW MORE',
    ctaLink: '/products?search=beauty',
    bgFrom: 'from-gray-50',
    bgTo: 'to-gray-100',
    rightImage: '/assets/hero-beauty.png',
    rightImageClass: 'max-h-[850px] md:max-h-[900px] lg:max-h-[970px] -translate-y-20 md:-translate-y-24 lg:-translate-y-28 translate-x-[50px] lg:translate-x-[500px] xl:translate-x-[600px] 2xl:translate-x-[700px]',
  },
];

const transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

const HeroSlider = ({ slides = defaultSlides, auto = true, intervalMs = 5000 }) => {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [auto, intervalMs, total]);

  const goTo = (i) => setIndex(((i % total) + total) % total);
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const active = useMemo(() => slides[index], [slides, index]);

  return (
    <section className="relative overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      <div className={`relative h-full bg-gradient-to-br ${active.bgFrom} ${active.bgTo} transition-all duration-700`}>
        {/* Subtle botanical background image */}
        <img src="/assets/hero-bg.png" alt="pattern" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />

        <div className="w-full px-2 sm:px-4 lg:px-0 h-full">
          <div className="max-w-[1600px] w-full mx-auto relative flex flex-col lg:flex-row items-center justify-between h-full py-0 gap-4 lg:gap-6 lg:translate-x-16 xl:translate-x-24 2xl:translate-x-32">
            {/* Left Side - Content */}
            <div className="relative z-20 w-full lg:w-[40%] text-left space-y-2 lg:translate-x-8 xl:translate-x-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={transition}
                  className="text-left"
                >
                  <div className="mb-1 md:mb-2">{active.title}</div>
                  {active.subtitle && (
                    <div className="mb-2 md:mb-3">{active.subtitle}</div>
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
            <div className="relative w-full lg:w-[60%] h-full flex items-center justify-end pointer-events-none z-10 overflow-visible pr-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`img-${active.id}`}
                  src={active.rightImage}
                  alt="slide visual"
                  className={`object-contain w-[100vw] sm:w-[90vw] lg:w-[1050px] xl:w-[1250px] 2xl:w-[1500px] max-w-none translate-x-28 lg:translate-x-64 xl:translate-x-80 2xl:translate-x-[400px] ${active.rightImageClass || ''}`}
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -50 }}
                  transition={{ ...transition, delay: 0.1 }}
                />
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-2 sm:px-6 lg:px-10">
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


