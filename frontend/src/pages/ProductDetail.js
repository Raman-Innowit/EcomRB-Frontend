import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import CloneFooter from '../components/CloneFooter';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState('keyIngredients');
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const { addToCart } = useCart();

  const packOptions = [
    {
      bottles: 1,
      tablets: 60,
      months: 1,
      discount: 27,
      price: 802,
      originalPrice: 1099,
      savings: 297,
      label: '1 Bottle',
      highlight: '60 Tablets · 1 Month',
    },
    {
      bottles: 2,
      tablets: 120,
      months: 2,
      discount: 33,
      price: 1473,
      originalPrice: 2198,
      savings: 725,
      label: '2 Bottles',
      highlight: '120 Tablets · 2 Months',
      badge: 'MOST POPULAR',
    },
    {
      bottles: 3,
      tablets: 180,
      months: 3,
      discount: 40,
      price: 2158,
      originalPrice: 3597,
      savings: 1439,
      label: '3 Bottles',
      highlight: '180 Tablets · 3 Months',
    },
  ];

  const benefitPills = [
    'Manage Stress and Anxiety',
    'Boosts Testosterone Levels',
    'Improve Reproductive Health',
    'Enhance Cognitive Function',
  ];

  const infoTabs = {
    keyIngredients:
      'Key Ingredients: Ashwangandha (Withania somnifera)- 80mg, Gokshura (Tribulus terrestris)- 160 mg, Ginseng- 60 mg, Maca (Lepidium meyenii)- 60 mg and Yohimbe (Pausinystalia yohimbe)- 40 mg.',
    highlights: 'Highlights: Scientifically tested, Nut- & gluten-free, No harsh chemicals, Non-GMO, Soy-Free.',
    dosage:
      'Recommended Dosage: A healthy adult can take one tablet twice a day with water, 30 minutes before breakfast & lunch or as advised by a healthcare professional.',
    directions:
      'Directions: Keep out of children’s reach. If you are younger than eighteen, pregnant, breastfeeding, have any medical issues, or are using prescription/OTC medications, do not use this or any other supplement.',
    warning:
      'Warning: Do not take this or any other supplement if under 18, pregnant or nursing, or if you have any known medical conditions or are taking prescription drugs.',
  };

  const ingredientCards = [
    {
      name: 'Ashwagandha (Withania somnifera)',
      description:
        'The primary active compounds in Ashwagandha, an adaptogen, Withanolides are known to balance hormones, reduce stress, and improves overall sexual health in women',
      image: '/assets/Ashwagandha-Withania-somnifera.png',
    },
    {
      name: 'Shatavari (Asparagus racemosus)',
      description:
        'Shatavari is a powerhouse of nutrients that nourishes the body from within and have plant-based estrogens, Shatavarins I-IV, to nurture hormonal balance and enhance reproductive wellness in females.',
      image: '/assets/Shatavari.png',
    },
    {
      name: 'Maca Root (Lepidium meyenii)',
      description:
        'Maca root is a nutritional powerhouse of potassium, calcium, amino acids, vitamins and minerals that balance hormones, boost energy, and enhance libido in females.',
      image: '/assets/Maca-Root-Lepidium-meyenii.png',
    },
    {
      name: 'Gokshura',
      description:
        'Known for aphrodisiac properties that improve sperm quality, stamina, and libido in males.',
      image: '/assets/Gokshura.png',
    },
  ];

  // eslint-disable-next-line no-unused-vars
  const paymentIcons = [
    { name: 'Visa', icon: '💳' },
    { name: 'Mastercard', icon: '💳' },
    { name: 'Paytm', icon: '💠' },
    { name: 'UPI', icon: '⚡' },
    { name: 'RuPay', icon: '💳' },
  ];

  const faqItems = [
    {
      question: 'What is vitality?',
      answer:
        'Vitality refers to a person’s ability to live, grow, and develop. It also refers to having energy and being vigorous and active.',
    },
    {
      question: 'How long should I use the Nutra’s Bounty Male vitality capsules to see results?',
      answer:
        'Use the capsules consistently for at least 2 months to experience optimal benefits including improved stamina, libido, and blood flow.',
    },
    {
      question: 'Can I take the Nutra’s Bounty Male vitality capsules with other medications?',
      answer:
        'If you have any medical issues or take prescription medication, please consult your doctor before use. Avoid use if pregnant, breastfeeding, or under 18.',
    },
    {
      question: 'How does this product benefit men?',
      answer:
        'Nutra’s Bounty Male Vitality is a herbal energizer that helps improve energy and stamina, reduces stress, and enhances overall performance.',
    },
  ];

  const bestSellers = [
    {
      name: 'PCOS Care',
      price: 670,
      originalPrice: 999,
      image:
        'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=400&q=60',
    },
    {
      name: 'Multivitamin Gummies',
      price: 670,
      originalPrice: 999,
      image:
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=400&q=60',
    },
    {
      name: 'Hair Serum',
      price: 799,
      originalPrice: 1199,
      image:
        'https://images.unsplash.com/photo-1458253329476-1ebb8593a652?auto=format&fit=crop&w=400&q=60',
    },
    {
      name: 'Face Wash with Glutathione',
      price: 599,
      originalPrice: 900,
      image:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=60',
    },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getPublicProduct(parseInt(id));
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const galleryImages = useMemo(() => {
    // Default product images
    const defaultImages = [
      '/assets/female-vitality.jpg',
      '/assets/product-thumb-1.png',
      '/assets/product-thumb-2.png',
      '/assets/product-thumb-3.png',
      '/assets/product-thumb-4.png',
    ];
    // If product has its own image, use it as the first image, otherwise use the default
    const mainImage = product?.image_url || product?.thumbnail_url;
    if (mainImage) {
      return [mainImage, ...defaultImages.slice(1)];
    }
    return defaultImages;
  }, [product?.image_url, product?.thumbnail_url]);


  const handleAddToCart = () => {
    if (!product) return;
    const pack = packOptions[selectedPack];
    addToCart({
      productId: product.id,
      name: product.name,
      price: pack.price,
      salePrice: pack.salePrice,
      quantity: pack.bottles * quantity,
      slug: product.slug,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link to="/products" className="text-green-600 hover:text-green-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const displayPriceRaw =
    product.converted_sale_price ??
    product.converted_price ??
    product.sale_price ??
    product.base_price ?? 0;
  const originalPriceRaw = product.converted_sale_price
    ? product.converted_price ?? product.base_price
    : null;

  const currencySymbol = product.currency_symbol ?? '₹';
  const displayPrice = Number(displayPriceRaw);
  const originalPrice = originalPriceRaw !== null ? Number(originalPriceRaw) : null;

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[520px,1fr] gap-10">
          {/* Media */}
          <div className="flex flex-row gap-4 lg:sticky lg:top-10 lg:self-start">
            {/* Thumbnails - Left Column */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all group ${
                    selectedImage === idx ? 'border-green-700 shadow-xl' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`View ${idx + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" 
                  />
                </button>
              ))}
            </div>
            {/* Main Image - Right Side */}
            <div className="flex-1 relative">
              {originalPrice && displayPrice < originalPrice && (
                <span className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  SALE
                </span>
              )}
              <div className="relative group">
                <div 
                  className="rounded-[32px] border border-gray-200 shadow-sm overflow-hidden bg-white relative cursor-zoom-in inline-block"
                  onMouseEnter={() => setShowZoom(true)}
                  onMouseLeave={() => setShowZoom(false)}
                  onMouseMove={(e) => {
                    if (showZoom) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                      setZoomPosition({ x, y });
                    }
                  }}
                >
                  <img 
                    src={galleryImages[selectedImage]} 
                    alt={product.name} 
                    className="block max-w-full h-auto"
                  />
                  {/* Zoom indicator */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                {/* Zoom preview box - appears beside the image, only on xl screens to avoid overlap */}
                {showZoom && (
                  <div 
                    className="absolute left-full ml-4 top-0 w-[320px] border border-gray-200 rounded-[32px] overflow-hidden shadow-xl bg-white z-20 pointer-events-none hidden xl:block"
                    style={{
                      backgroundImage: `url(${galleryImages[selectedImage]})`,
                      backgroundSize: '250%',
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundRepeat: 'no-repeat',
                      height: '100%',
                      maxHeight: '600px'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info */}
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500 mb-3">Nutra’s Bounty</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {String(product.name || 'Male Vitality')}
          </h1>
            <p className="text-gray-700 mb-4">60 veg capsules</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-lg text-gray-700 line-through">
                {currencySymbol} {originalPrice ? originalPrice.toFixed(0) : '1199'}
              </span>
              <span className="text-2xl font-bold text-[#1e8f3a]">
                {currencySymbol} {displayPrice.toFixed(0)}
              </span>
            </div>

            <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'minmax(338px, 1fr) minmax(338px, 1fr)' }}>
              <div className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm">
                <img 
                  src="/assets/Supports-Hormonal-Balance.png" 
                  alt="Hormonal Balance" 
                  className="w-6 h-6 object-contain flex-shrink-0"
                />
                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Supports Hormonal Balance</p>
              </div>
              <div className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm">
                <img 
                  src="/assets/Rejuvenate-Physical-and-Mental-Health.png" 
                  alt="Physical and Mental Health" 
                  className="w-6 h-6 object-contain flex-shrink-0"
                />
                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Rejuvenate Physical and Mental Health</p>
              </div>
              <div className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm">
                <img 
                  src="/assets/Manages-Stress-and-Anxiety.png" 
                  alt="Stress and Anxiety" 
                  className="w-6 h-6 object-contain flex-shrink-0"
                />
                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Manages Stress and Anxiety</p>
              </div>
              <div className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm">
                <img 
                  src="/assets/Supports-Immunity.png" 
                  alt="Immunity" 
                  className="w-6 h-6 object-contain flex-shrink-0"
                />
                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Supports Immunity</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-8 text-base">
              Experience renewed energy, enhanced mood, and optimal hormonal balance with our comprehensive female vitality supplement. Our carefully curated formula combines powerful antioxidants, essential vitamins, and minerals to support overall well-being and radiant health.
            </p>

            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pack:</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
              {packOptions.map((pack, idx) => (
                <button
                    key={pack.label}
                  onClick={() => setSelectedPack(idx)}
                    className={`relative w-full max-w-[255px] rounded-[28px] border transition-all duration-200 overflow-hidden text-center px-6 py-6 shadow-sm ${
                      selectedPack === idx ? 'border-[#1e8f3a] shadow-lg' : 'border-[#e1dbcf] hover:border-[#1e8f3a]'
                    }`}
                    style={{
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <img
                      src="/assets/card-bg.png"
                      alt="Badge"
                      className="absolute top-0 right-0 w-[78px] h-[78px] object-contain pointer-events-none select-none"
                    />

                    <div className="relative flex flex-col items-center gap-1 mb-4 pt-3">
                      <img
                        src="/assets/ph_seal-1.png"
                        alt="Quality seal"
                        className="w-10 h-10 object-contain pointer-events-none select-none"
                      />
                      <h3 className="text-lg font-bold text-[#1f1f1f] leading-tight mt-1">{pack.label}</h3>
                      <p className="text-sm font-semibold text-[#1b7b37]">
                        {pack.tablets} Tablets
                      </p>
                      <p className="text-xs text-gray-500">
                        {pack.months} {pack.months > 1 ? 'Months' : 'Month'}
                      </p>
                    </div>

                    <div className="mx-auto bg-[#f3efe7] border border-[#e8dfd1] rounded-[18px] px-3.5 py-2.5 flex flex-col items-center justify-center gap-1.5" style={{ width: '92%', aspectRatio: '1 / 1' }}>
                      <div className="bg-[#e30202] text-white text-xs font-bold px-3 py-0.5 rounded-md uppercase tracking-wider">
                        {pack.discount}%
                      </div>
                      <div className="text-2xl font-bold text-[#1f873b] leading-tight">
                        {currencySymbol} {pack.price}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {currencySymbol} {pack.originalPrice}
                      </div>
                      <div className="text-sm font-bold text-[#d60000]">
                        Save {currencySymbol} {pack.savings}
                      </div>
                      {pack.badge && (
                        <span className="mt-0.5 inline-block text-[10px] font-semibold text-[#1b7b37] bg-[#e0f3e6] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                </button>
              ))}
            </div>
          </div>

            <div className="mb-8">
              <div className="mb-4">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product?.stock_quantity || 10}
                  showLabel={true}
                  label="Quantity :"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#1e8f3a] text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wide hover:bg-[#1a7d32] transition-colors duration-200"
                >
                  ADD TO CART
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#1e8f3a] text-white py-3.5 px-6 rounded-lg font-bold uppercase tracking-wide hover:bg-[#1a7d32] transition-colors duration-200"
                >
                  BUY NOW
                </button>
              </div>
            </div>

            <div className="mb-8">
              <img 
                src="/assets/payment.png" 
                alt="Payment Methods" 
                className="max-w-xs h-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-gray-50 border border-[#1e8f3a] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Feature</h3>
            <ul className="space-y-3 text-gray-700 text-sm list-none">
              <li className="flex items-start gap-3">
                <img 
                  src="/assets/pajamas_nature.png" 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <span>Supports Energy &amp; Mood</span>
              </li>
              <li className="flex items-start gap-3">
                <img 
                  src="/assets/pajamas_nature.png" 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <span>Boosts Immunity</span>
              </li>
              <li className="flex items-start gap-3">
                <img 
                  src="/assets/pajamas_nature.png" 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <span>Natural Energy Supplement</span>
              </li>
              <li className="flex items-start gap-3">
                <img 
                  src="/assets/pajamas_nature.png" 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <span>Reduce Stress &amp; Anxiety</span>
              </li>
              <li className="flex items-start gap-3">
                <img 
                  src="/assets/pajamas_nature.png" 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <span>Enhance Stamina &amp; Endurance: Boost mood, focus, and overall sense of well-being</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-[#1e8f3a] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Description</h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              Experience a balanced and harmonious life with our all-natural supplement designed to support women's overall health. Our unique blend of botanicals helps regulate boost energy levels, enhance your mood, immune function, and promote overall well-being.
            </p>
          </div>
        </div>

        <div className="mt-14">
          <div className="overflow-x-auto">
            <div className="flex gap-8 border-b border-gray-200">
              {Object.keys(infoTabs).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab)}
                  className={`py-3 whitespace-nowrap text-base font-medium relative ${
                    activeInfoTab === tab ? 'text-green-800' : 'text-gray-500'
                  }`}
                >
                  {{
                    keyIngredients: 'Key Ingredients',
                    highlights: 'Highlights',
                    dosage: 'Recommended Dosage',
                    directions: 'Directions',
                    warning: 'Warning',
                  }[tab]}
                  {activeInfoTab === tab && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-green-700 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-green-50/80 border border-green-100 rounded-3xl p-6 mt-6 text-gray-700 leading-relaxed text-sm">
            {infoTabs[activeInfoTab]}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-semibold text-gray-900">Key Ingredients</h3>
            <p className="text-sm text-gray-500">Premium botanicals for performance &amp; vitality</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ingredientCards.map((ingredient) => (
              <div
                key={ingredient.name}
                className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-white">
                  <img src={ingredient.image} alt={ingredient.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-800 mb-2">{ingredient.name}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{ingredient.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-14 rounded-2xl bg-[#1e8f3a] text-white text-center px-6 py-5">
        <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">DISCLAIMER</h3>
        <p className="text-base font-normal leading-relaxed">
          Always consult with a qualified health physician/Nutritionist before taking any new dietary supplement. This product is not intended to diagnose, treat, cure, or prevent any diseases.
        </p>
      </div>

      {/* FAQ */}
      <div className="mt-14">
        <h2 className="text-3xl font-semibold text-center text-gray-900 mb-8">Frequently asked questions (FAQs)</h2>
        <div className="space-y-4">
          {faqItems.map((faq) => {
            const isOpen = activeInfoTab === faq.question;
            return (
              <div key={faq.question} className="space-y-0">
                <div className="bg-white border border-gray-900 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <span className="text-base font-medium text-gray-900">{faq.question}</span>
                  <button
                    onClick={() =>
                      setActiveInfoTab((prev) => (prev === faq.question ? '' : faq.question))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl font-light text-gray-900">{isOpen ? '−' : '+'}</span>
                  </button>
                </div>
                {isOpen && (
                  <div className="bg-white border border-gray-900 rounded-2xl px-5 py-4 mt-2">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Summary */}
      <div className="mt-16 bg-[#efeadd] rounded-3xl px-6 py-10">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-800">0.0</p>
            <p className="text-yellow-500 text-xl mt-1">★★★★★</p>
            <p className="text-sm text-gray-500 mt-2">Based on 0 reviews</p>
          </div>
          <div className="flex-1 w-full space-y-2 text-sm text-gray-700">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3">
                <span className="w-10">{star} star</span>
                <div className="flex-1 h-3 bg-white rounded-full border border-gray-200" />
                <span className="w-8 text-right">0%</span>
              </div>
            ))}
          </div>
          <button className="px-6 py-3 rounded-lg bg-green-800 text-white font-semibold hover:bg-green-900 transition">
            Add a review
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">Sorry, no reviews match your current selections</p>
      </div>

      {/* Power of Nature */}
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-semibold text-green-900 mb-2">Power of Nature</h2>
        <p className="text-gray-600 mb-8">Discover our best-selling products made with the goodness of nature.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((item) => (
            <div key={item.name} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative">
                <img src={item.image} alt={item.name} className="w-full h-52 object-cover" />
                <span className="absolute top-3 right-3 bg-green-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  -35%
                </span>
              </div>
              <div className="px-5 py-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-gray-400 line-through">
                    ₹{item.originalPrice}
                  </span>
                  <span className="text-green-700 font-bold">₹{item.price}</span>
                </div>
                <button className="w-full bg-green-800 text-white py-2.5 rounded-lg font-medium hover:bg-green-900 transition">
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Footer */}
      <div className="mt-16">
        <CloneFooter />
      </div>
    </div>
  );
};

export default ProductDetail;
