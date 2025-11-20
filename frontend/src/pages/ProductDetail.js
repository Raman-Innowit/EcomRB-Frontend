import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicProduct, getPublicProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import CloneFooter from '../components/CloneFooter';
import ProductCard from '../components/ProductCard';

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewTerms, setReviewTerms] = useState(false);
  const [bestSellers, setBestSellers] = useState([]);
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

  useEffect(() => {
    // Fetch best sellers products
    const fetchBestSellers = async () => {
      try {
        const data = await getPublicProducts({ featured: true, per_page: 4 });
        setBestSellers(data.products || []);
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setBestSellers([]);
      }
    };
    fetchBestSellers();
  }, []);

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
                    className={`relative w-full max-w-[255px] border transition-all duration-200 overflow-hidden text-center px-6 py-6 shadow-sm ${
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

                    <div className="mx-auto bg-[#f3efe7] border border-[#e8dfd1] px-3.5 py-2.5 flex flex-col items-center justify-center gap-1.5" style={{ width: '92%', aspectRatio: '1 / 1' }}>
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
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-gray-900">Key Ingredients</h3>
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
      <div className="mt-14 bg-[#1e8f3a] text-white text-center px-6 py-5">
        <h3 className="text-3xl font-bold mb-3 uppercase tracking-wide">DISCLAIMER</h3>
        <p className="text-base font-normal leading-relaxed">
          Always consult with a qualified health physician/Nutritionist before taking any new dietary supplement. This product is not intended to diagnose, treat, cure, or prevent any diseases.
        </p>
      </div>

      {/* FAQ */}
      <div className="mt-14 px-6 md:px-12 lg:px-16 xl:px-24">
        <h2 className="text-3xl font-semibold text-center text-gray-900 mb-8">Frequently asked questions (FAQs)</h2>
        <div className="space-y-4">
          {faqItems.map((faq) => {
            const isOpen = activeInfoTab === faq.question;
            return (
              <div key={faq.question} className="space-y-0">
                <div 
                  onClick={() =>
                    setActiveInfoTab((prev) => (prev === faq.question ? '' : faq.question))
                  }
                  className="bg-white border border-gray-900 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-medium text-gray-900">{faq.question}</span>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-900 pointer-events-none">
                    <span className="text-xl font-light text-gray-900">{isOpen ? '−' : '+'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="bg-white border border-gray-900 rounded-2xl px-5 py-4 mt-2">
                    <p className="text-base font-medium text-gray-900 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#efeadd] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Add a review</h2>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-4">
                {product && product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">{product?.name || 'Product Name'}</h3>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 ${
                            star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                          fill={star <= reviewRating ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{reviewRating}/5</span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                  placeholder="Write your review here..."
                />
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your email"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add photos or video to your review
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="reviewTerms"
                  checked={reviewTerms}
                  onChange={(e) => setReviewTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="reviewTerms" className="text-sm text-gray-700">
                  I have read and agree to the Terms and Conditions and Privacy Policy.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Handle submit logic here
                    setShowReviewModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Summary */}
      <div className="mt-16 px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="bg-[#efeadd] py-10 px-6 md:px-12 lg:px-16">
          <div className="bg-white border border-gray-200 px-6 py-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="text-center lg:text-left">
                <p className="text-5xl font-bold text-gray-800">0.0</p>
                <div className="flex justify-center lg:justify-start gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Based on 0 reviews</p>
              </div>
              <div className="hidden lg:block w-px h-20 bg-gray-200"></div>
              <div className="flex-1 w-full space-y-2 text-sm text-gray-700">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-16">{star} star</span>
                    <div className="flex-1 h-3 bg-white rounded-full border border-gray-200" />
                    <span className="w-10 text-right">0%</span>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block w-px h-20 bg-gray-200"></div>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-3 rounded-lg bg-green-800 text-white font-semibold hover:bg-green-900 transition whitespace-nowrap"
              >
                Add a review
              </button>
            </div>
          </div>
          <p className="text-center text-sm text-gray-900 mt-6">Sorry, no reviews match your current selections</p>
        </div>
      </div>

      {/* Power of Nature */}
      <div className="mt-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 italic" style={{ fontFamily: 'serif' }}>Power of Nature</h2>
        <h3 className="text-2xl md:text-3xl font-medium text-gray-900 mb-8">Best Sellers Products</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
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
