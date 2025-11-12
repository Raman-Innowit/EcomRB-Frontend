import React, { useState, useEffect } from 'react';

const TESTIMONIALS = [
  {
    name: 'Charu Chadha',
    role: 'Customer',
    rating: 4,
    text: "I never tried supplements as I never found any quality product that is vegetarian. RasayanaBio Ashwagandha are veg capsules and have better results so far.",
    image: '/assets/testimonial-1.jpg'
  },
  {
    name: 'Saloni Sharma',
    role: 'Customer',
    rating: 4,
    text: "It is a good product for keeping UTI health in control. Additionally, my menstrual cycle became regular after consuming it regularly for a few months.",
    image: '/assets/testimonial-2.jpg'
  },
  {
    name: 'Juhi Sharma',
    role: 'Customer',
    rating: 4,
    text: "RasayanaBio Hair Serum's natural blend of herbal extracts effectively reduced my hair fall and promoted new growth. The formula nourishes both hair and scalp, leaving my hair noticeably stronger and healthier.",
    image: '/assets/testimonial-3.jpg'
  },
  {
    name: 'Akansha Gupta',
    role: 'Customer',
    rating: 5,
    text: "This product is the best I have used so far. It has really helped me in boosting my metabolism as I see a noticeable difference in my energy. Will buy again!",
    image: '/assets/testimonial-4.jpg'
  },
  {
    name: 'Aniket Sharma',
    role: 'Customer',
    rating: 5,
    text: "I have been using this product for almost 2 weeks and it is clearly visible that my energy levels have changed significantly.",
    image: '/assets/testimonial-5.jpg'
  },
];

const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2); // Default: 2 cards on desktop

  // Responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1); // 1 card on mobile
      } else {
        setCardsPerView(2); // 2 cards on desktop
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const totalSlides = Math.ceil(TESTIMONIALS.length / cardsPerView);

  // Reset to first slide when cardsPerView changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [cardsPerView]);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [totalSlides]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className="w-5 h-5"
        fill={index < rating ? '#fbbf24' : 'none'}
        stroke={index < rating ? '#fbbf24' : '#d1d5db'}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
            Clients Testimonials
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Testimonials Carousel */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="flex-shrink-0 w-full flex gap-4"
                >
                  {TESTIMONIALS.slice(
                    slideIndex * cardsPerView,
                    slideIndex * cardsPerView + cardsPerView
                  ).map((testimonial, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="flex-shrink-0 px-4 w-full md:w-1/2"
                    >
                  <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 h-full">
                    {/* Profile Picture */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center overflow-hidden">
                        {testimonial.image ? (
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-green-700">
                            {testimonial.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-3">
                      <h3 className="font-bold text-green-800 text-lg mb-1">
                        {testimonial.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{testimonial.role}</p>
                    </div>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-1 mb-4">
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-gray-700 text-sm leading-relaxed text-center italic">
                      "{testimonial.text}"
                    </p>
                    </div>
                  </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-black w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

