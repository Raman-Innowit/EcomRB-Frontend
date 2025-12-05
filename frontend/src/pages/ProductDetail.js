import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicProduct, getPublicProducts, getProductReviews, createProductReview } from '../services/api';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import CloneFooter from '../components/CloneFooter';
import ProductCard from '../components/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  // eslint-disable-next-line no-unused-vars
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
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewVideo, setReviewVideo] = useState(null);
  const [reviewImagePreview, setReviewImagePreview] = useState(null);
  const [reviewVideoPreview, setReviewVideoPreview] = useState(null);
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

  // Default fallback values - memoized to prevent re-creation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultInfoTabs = useMemo(() => ({
    keyIngredients:
      'Key Ingredients: Ashwangandha (Withania somnifera)- 80mg, Gokshura (Tribulus terrestris)- 160 mg, Ginseng- 60 mg, Maca (Lepidium meyenii)- 60 mg and Yohimbe (Pausinystalia yohimbe)- 40 mg.',
    highlights: 'Highlights: Scientifically tested, Nut- & gluten-free, No harsh chemicals, Non-GMO, Soy-Free.',
    dosage:
      'Recommended Dosage: A healthy adult can take one tablet twice a day with water, 30 minutes before breakfast & lunch or as advised by a healthcare professional.',
    directions:
      'Directions: Keep out of children\'s reach. If you are younger than eighteen, pregnant, breastfeeding, have any medical issues, or are using prescription/OTC medications, do not use this or any other supplement.',
    warning:
      'Warning: Do not take this or any other supplement if under 18, pregnant or nursing, or if you have any known medical conditions or are taking prescription drugs.',
  }), []);

  // Parse highlights to ensure it's an array when possible
  const parsedHighlights = useMemo(() => {
    if (!product?.highlights) return null;
    
    // If it's already an array, return it
    if (Array.isArray(product.highlights)) {
      return product.highlights;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof product.highlights === 'string') {
      try {
        const parsed = JSON.parse(product.highlights);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If JSON parsing fails, try splitting by comma
        // This handles cases where highlights might be stored as comma-separated string
        if (product.highlights.includes(',')) {
          return product.highlights.split(',').map(item => item.trim()).filter(item => item);
        }
      }
    }
    
    return null;
  }, [product?.highlights]);

  // Dynamic content from product data with fallbacks
  const infoTabs = useMemo(() => {
    if (!product) return defaultInfoTabs;
    
    // Handle key_ingredients - can be array of objects (from key_ingredients table) or string/array
    let keyIngredientsText = defaultInfoTabs.keyIngredients;
    if (product.key_ingredients) {
      if (Array.isArray(product.key_ingredients) && product.key_ingredients.length > 0) {
        // Check if it's an array of objects (from key_ingredients table) or strings
        if (typeof product.key_ingredients[0] === 'object' && product.key_ingredients[0].name) {
          // Array of objects from key_ingredients table - extract names
          keyIngredientsText = product.key_ingredients.map(ing => ing.name).filter(Boolean).join(', ');
        } else {
          // Array of strings
          keyIngredientsText = product.key_ingredients.join(', ');
        }
      } else if (typeof product.key_ingredients === 'string') {
        keyIngredientsText = product.key_ingredients;
      }
    }
    
    // Handle highlights - keep as string for fallback, but we'll use parsedHighlights for rendering
    let highlightsText = defaultInfoTabs.highlights;
    if (parsedHighlights && parsedHighlights.length > 0) {
      // For fallback text, join with commas
      highlightsText = `Highlights: ${parsedHighlights.join(', ')}`;
    } else if (product.highlights && typeof product.highlights === 'string') {
      highlightsText = product.highlights;
    }
    
    return {
      keyIngredients: keyIngredientsText,
      highlights: highlightsText,
      dosage: product.recommended_dosage || defaultInfoTabs.dosage,
      directions: product.directions || defaultInfoTabs.directions,
      warning: product.warning || defaultInfoTabs.warning,
    };
  }, [product, parsedHighlights, defaultInfoTabs]);

  // Default ingredient cards - memoized to prevent re-creation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultIngredientCards = useMemo(() => [
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
  ], []);

  // Dynamic ingredient cards from database
  // Priority: key_ingredients (from key_ingredients table) > ingredient_details > default
  // Only show ingredients that have images assigned in the database
  const ingredientCards = useMemo(() => {
    if (!product) return [];
    
    // First, try to use key_ingredients from key_ingredients table (via product_key_ingredients)
    if (Array.isArray(product.key_ingredients) && product.key_ingredients.length > 0) {
      // Filter out ingredients without images - only include those with image_url or thumbnail_url
      const cardsWithImages = product.key_ingredients
        .filter(ing => {
          const hasImage = (ing.image_url && ing.image_url.trim()) || (ing.thumbnail_url && ing.thumbnail_url.trim());
          return hasImage;
        })
        .map(ing => ({
          name: ing.name || '',
          description: ing.description || '',
          image: ing.image_url || ing.thumbnail_url,
        }));
      
      // Only return if we have ingredients with images
      if (cardsWithImages.length > 0) {
        return cardsWithImages;
      }
    }
    
    // Fallback to ingredient_details if key_ingredients not available
    if (product.ingredient_details) {
      let detailsArray = [];
      
      // If ingredient_details is an array, use it directly
      if (Array.isArray(product.ingredient_details) && product.ingredient_details.length > 0) {
        detailsArray = product.ingredient_details;
      }
      // Try to parse if it's a JSON string
      else if (typeof product.ingredient_details === 'string') {
        try {
          const parsed = JSON.parse(product.ingredient_details);
          if (Array.isArray(parsed) && parsed.length > 0) {
            detailsArray = parsed;
          }
        } catch {
          // If parsing fails, return empty
        }
      }
      
      // Filter out ingredients without images
      if (detailsArray.length > 0) {
        const cardsWithImages = detailsArray
          .filter(ing => {
            const hasImage = (ing.image && ing.image.trim()) || (ing.image_url && ing.image_url.trim());
            return hasImage;
          })
          .map(ing => ({
            name: ing.name || ing.title || '',
            description: ing.description || ing.desc || '',
            image: ing.image || ing.image_url,
          }));
        
        if (cardsWithImages.length > 0) {
          return cardsWithImages;
        }
      }
    }
    
    // Return empty array if no ingredients with images found (no defaults)
    return [];
  }, [product]);

  // eslint-disable-next-line no-unused-vars
  const paymentIcons = [
    { name: 'Visa', icon: '💳' },
    { name: 'Mastercard', icon: '💳' },
    { name: 'Paytm', icon: '💠' },
    { name: 'UPI', icon: '⚡' },
    { name: 'RuPay', icon: '💳' },
  ];

  // Dynamic FAQs from database - only use FAQs from product_faqs table
  const faqItems = useMemo(() => {
    // Only return FAQs if they exist in the database
    if (!product || !product.faqs) return [];
    
    if (Array.isArray(product.faqs) && product.faqs.length > 0) {
      return product.faqs.map(faq => ({
        question: faq.question || faq.q || '',
        answer: faq.answer || faq.a || '',
      })).filter(faq => faq.question && faq.answer); // Only include FAQs with both question and answer
    }
    
    // Try to parse if it's a JSON string
    if (typeof product.faqs === 'string') {
      try {
        const parsed = JSON.parse(product.faqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(faq => ({
            question: faq.question || faq.q || '',
            answer: faq.answer || faq.a || '',
          })).filter(faq => faq.question && faq.answer);
        }
      } catch {
        // If parsing fails, return empty array
      }
    }
    
    // Return empty array if no FAQs found (no hardcoded defaults)
    return [];
  }, [product]);

  // Dynamic product features from database
  const productFeatures = useMemo(() => {
    const defaultFeatures = [
      'Supports Energy &amp; Mood',
      'Boosts Immunity',
      'Natural Energy Supplement',
      'Reduce Stress &amp; Anxiety',
      'Enhance Stamina &amp; Endurance: Boost mood, focus, and overall sense of well-being',
    ];
    
    if (!product || !product.product_features) return defaultFeatures;
    
    // If it's already an array, use it
    if (Array.isArray(product.product_features)) {
      return product.product_features;
    }
    
    // If it's a string, try to parse as JSON first
    if (typeof product.product_features === 'string') {
      try {
        const parsed = JSON.parse(product.product_features);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If JSON parsing fails, treat as newline-separated string
        return product.product_features.split('\n').filter(Boolean);
      }
    }
    
    return defaultFeatures;
  }, [product]);

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

  // Fetch reviews for the product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        setReviewsLoading(true);
        const data = await getProductReviews(parseInt(id), 1, 10);
        setReviews(data.reviews || []);
        setReviewStats(data.statistics || null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
        setReviewStats(null);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  // Parse images from database - combine all image sources
  const productImages = useMemo(() => {
    if (!product) return [];
    
    const allImages = [];
    
    // Helper function to parse image arrays from various formats
    const parseImageArray = (value) => {
      if (!value) return [];
      
      // If it's already an array, return it
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
      
      // If it's a string, try to parse as JSON first
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // If JSON parsing fails, try comma-separated
          if (value.includes(',')) {
            const urls = value.split(',').map(url => url.trim()).filter(url => url);
            if (urls.length > 0) {
              return urls;
            }
          }
        }
      }
      
      return [];
    };
    
    // Helper function to add images to the array (allow duplicates)
    const addImages = (images) => {
      if (Array.isArray(images)) {
        images.forEach(url => {
          if (url) {
            const trimmedUrl = String(url).trim();
            // Add if URL is not empty (allow duplicates)
            if (trimmedUrl.length > 0) {
              allImages.push(trimmedUrl);
            }
          }
        });
      }
    };
    
    // Add images from gallery_images (highest priority)
    const galleryImgs = parseImageArray(product.gallery_images);
    addImages(galleryImgs);

    // Add images from additional_images
    const additionalImgs = parseImageArray(product.additional_images);
    addImages(additionalImgs);
    
    // Add images from image_urls array (from backend - contains images from image_1 through image_5)
    // This is the primary source - backend fetches from image_1, image_2, image_3, image_4, image_5 columns
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      // Debug: Log to see what we're getting from backend
      console.log('Product image_urls from backend:', product.image_urls);
      addImages(product.image_urls);
    }
    
    // Fallback: parse image_url if it's comma-separated (shouldn't happen if backend works correctly)
    if (product.image_url && typeof product.image_url === 'string') {
      if (product.image_url.includes(',')) {
        const urls = product.image_url.split(',').map(url => url.trim()).filter(url => url);
        addImages(urls);
      } else if (allImages.length === 0) {
        // Only add single image_url if no other images found
        addImages([product.image_url]);
      }
    }
    
    // Add thumbnail_url as last fallback (if no other images found)
    if (allImages.length === 0 && product.thumbnail_url) {
      addImages([product.thumbnail_url]);
    }
    
    // Debug: Log final images array
    console.log('Final allImages array:', allImages);
    console.log('Total images found:', allImages.length);
    
    return allImages;
  }, [product]);


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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setReviewImage(file);
      setReviewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        return;
      }
      setReviewVideo(file);
      setReviewVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setReviewImage(null);
    setReviewImagePreview(null);
  };

  const removeVideo = () => {
    setReviewVideo(null);
    setReviewVideoPreview(null);
  };

  const handleSubmitReview = async () => {
    // Validate required fields
    if (!reviewName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!reviewEmail.trim()) {
      alert('Please enter your email');
      return;
    }
    if (reviewRating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!reviewTerms) {
      alert('Please agree to the Terms and Conditions');
      return;
    }

    try {
      setSubmitReviewLoading(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('name', reviewName.trim());
      formData.append('email', reviewEmail.trim());
      formData.append('rating', reviewRating);
      if (reviewText.trim()) {
        formData.append('review_text', reviewText.trim());
      }
      
      // Add files if selected
      if (reviewImage) {
        formData.append('image', reviewImage);
      }
      if (reviewVideo) {
        formData.append('video', reviewVideo);
      }

      await createProductReview(parseInt(id), formData);
      
      // Reset form
      setReviewName('');
      setReviewEmail('');
      setReviewRating(0);
      setReviewText('');
      setReviewTerms(false);
      setReviewImage(null);
      setReviewVideo(null);
      setReviewImagePreview(null);
      setReviewVideoPreview(null);
      setShowReviewModal(false);
      
      // Refresh reviews
      const data = await getProductReviews(parseInt(id), 1, 10);
      setReviews(data.reviews || []);
      setReviewStats(data.statistics || null);
      
      alert('Review submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit review. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitReviewLoading(false);
    }
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
          {/* Media - Image Gallery with 5 slots */}
          <div className="flex flex-row gap-4 lg:sticky lg:top-10 lg:self-start">
            {/* Thumbnails - Left Column (5 slots total) */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              {Array.from({ length: 5 }).map((_, idx) => {
                // Get image from productImages array or use placeholder
                const imageUrl = productImages[idx] || null;
                const isSelected = selectedImage === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (imageUrl) {
                        setSelectedImage(idx);
                      }
                    }}
                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                      isSelected ? 'border-[#1e8f3a] shadow-md' : 'border-gray-200 hover:border-gray-300'
                    } ${!imageUrl ? 'bg-gray-100 cursor-default' : 'bg-white cursor-pointer'}`}
                    disabled={!imageUrl}
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={`Product view ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Main Image - Right Side */}
            <div className="flex-1 relative" style={{ maxWidth: '100%', overflow: 'visible' }}>
              {originalPrice && displayPrice < originalPrice && (
                <span className="absolute top-4 left-4 z-10 inline-block bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  SALE
                </span>
              )}
              <div className="relative group" style={{ width: '100%' }}>
                <div 
                  className="rounded-2xl border border-gray-200 shadow-sm overflow-visible bg-gray-50 relative flex items-end cursor-zoom-in"
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
                  <div className="w-full overflow-hidden rounded-2xl">
                    {productImages[selectedImage] ? (
                      <img 
                        src={productImages[selectedImage]} 
                        alt={product.name} 
                        className="w-full h-auto object-contain block"
                        style={{ maxHeight: '600px' }}
                      />
                    ) : productImages[0] ? (
                      <img 
                        src={productImages[0]} 
                        alt={product.name} 
                        className="w-full h-auto object-contain block"
                        style={{ maxHeight: '600px' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '500px' }}>
                        <svg className="w-32 h-32 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Zoom indicator */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                {/* Zoom preview box - positioned to the right but constrained to image column */}
                {showZoom && (productImages[selectedImage] || productImages[0]) && (
                  <div 
                    className="absolute left-full ml-4 top-0 w-[280px] h-[350px] border border-gray-200 rounded-2xl overflow-hidden shadow-xl bg-white z-50 pointer-events-none hidden xl:block"
                    style={{
                      backgroundImage: `url(${productImages[selectedImage] || productImages[0]})`,
                      backgroundSize: '250%',
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundRepeat: 'no-repeat',
                      maxWidth: 'calc(100vw - 600px)' // Prevent overlap with content column
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info */}
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500 mb-3">
              {product.category?.name || "Nutra's Bounty"}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {String(product.name || 'Product')}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-lg text-gray-700 line-through">
                {currencySymbol} {originalPrice ? originalPrice.toFixed(0) : '1199'}
              </span>
              <span className="text-2xl font-bold text-[#1e8f3a]">
                {currencySymbol} {displayPrice.toFixed(0)}
              </span>
            </div>

            {/* Feature Cards from Database (only when explicitly configured) */}
            {product && Array.isArray(product.feature_cards) && product.feature_cards.length > 0 && (
              <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'minmax(338px, 1fr) minmax(338px, 1fr)' }}>
                {product.feature_cards.slice(0, 4).map((card, idx) => {
                  const label = card.card_text || '';
                  const imageUrl = card.card_image_url;
                  const key = card.id || idx;
                  if (!label) return null;
                  return (
                    <div
                      key={key}
                      className="bg-[#f5f5f0] border border-[#e8dfd1] rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm"
                    >
                      {imageUrl && imageUrl.trim() && (
                        <img
                          src={imageUrl}
                          alt={label}
                          className="w-6 h-6 object-contain flex-shrink-0"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <p className="text-sm font-semibold text-gray-800 break-words flex-1">
                        {label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Description from Database - appears after health benefits */}
            {product.short_description && (
              <p className="text-gray-700 leading-relaxed mb-8 text-base">
                {product.short_description}
              </p>
            )}

            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pack:</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
              {packOptions.map((pack, idx) => {
                const packSlug = pack.bottles === 1 ? '1-bottle' : pack.bottles === 2 ? '2-bottles' : '3-bottles';
                return (
                <button
                    key={pack.label}
                  onClick={() => navigate(`/product/${id}/pack/${packSlug}`)}
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
                );
              })}
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
              {productFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <img 
                    src="/assets/pajamas_nature.png" 
                    alt="" 
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                  />
                  <span dangerouslySetInnerHTML={{ __html: feature }} />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 border border-[#1e8f3a] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Description</h3>
            {product.description ? (
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-gray-500 italic text-sm">No description available.</p>
            )}
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
                  {(() => {
                    const tabLabels = {
                      keyIngredients: 'Key Ingredients',
                      highlights: 'Highlights',
                      dosage: 'Recommended Dosage',
                      directions: 'Directions',
                      warning: 'Warning',
                    };
                    return tabLabels[tab];
                  })()}
                  {activeInfoTab === tab && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-green-700 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {(() => {
                const tabLabels = {
                  keyIngredients: 'Key Ingredients',
                  highlights: 'Highlights',
                  dosage: 'Recommended Dosage',
                  directions: 'Directions',
                  warning: 'Warning',
                };
                return tabLabels[activeInfoTab];
              })()}
            </h3>
            <div className="text-gray-700 leading-relaxed text-sm">
              {activeInfoTab === 'keyIngredients' && Array.isArray(product?.key_ingredients) && product.key_ingredients.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {product.key_ingredients.map((ingredient, idx) => (
                    <li key={ingredient.id || idx}>
                      {typeof ingredient === 'string' ? ingredient : ingredient.name || ''}
                    </li>
                  ))}
                </ul>
              ) : activeInfoTab === 'highlights' && parsedHighlights && parsedHighlights.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {parsedHighlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              ) : (
                <p>{infoTabs[activeInfoTab]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Key Ingredients - Only show if there are ingredients with images */}
        {ingredientCards && ingredientCards.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-gray-900">Key Ingredients</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-14 bg-[#1e8f3a] text-white text-center px-6 py-5">
        <h3 className="text-3xl font-bold mb-3 uppercase tracking-wide">DISCLAIMER</h3>
        <p className="text-base font-normal leading-relaxed">
          Always consult with a qualified health physician/Nutritionist before taking any new dietary supplement. This product is not intended to diagnose, treat, cure, or prevent any diseases.
        </p>
      </div>

      {/* FAQ - Only show if FAQs exist in database */}
      {faqItems && faqItems.length > 0 && (
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
      )}

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
                <div className="flex gap-4 flex-wrap">
                  {/* Image Upload */}
                  <div className="relative">
                    {reviewImagePreview ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <img 
                          src={reviewImagePreview} 
                          alt="Review" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </label>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="relative">
                    {reviewVideoPreview ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <video 
                          src={reviewVideoPreview} 
                          className="w-full h-full object-cover"
                          muted
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </label>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Images: Max 5MB (JPG, PNG, GIF) • Videos: Max 50MB (MP4, MOV, AVI)
                </p>
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
                  onClick={handleSubmitReview}
                  disabled={submitReviewLoading}
                  className="flex-1 px-6 py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitReviewLoading ? 'Submitting...' : 'Submit'}
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
                <p className="text-5xl font-bold text-gray-800">
                  {reviewsLoading ? '...' : (reviewStats?.average_rating || 0)}
                </p>
                <div className="flex justify-center lg:justify-start gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-6 h-6 ${star <= (reviewStats?.average_rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={1.5} 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Based on {reviewStats?.total_reviews || 0} review{(reviewStats?.total_reviews || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="hidden lg:block w-px h-20 bg-gray-200"></div>
              <div className="flex-1 w-full space-y-2 text-sm text-gray-700">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats?.rating_distribution?.[star] || 0;
                  const total = reviewStats?.total_reviews || 0;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-16">{star} star</span>
                      <div className="flex-1 h-3 bg-white rounded-full border border-gray-200">
                        <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-10 text-right">{percentage}%</span>
                    </div>
                  );
                })}
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
          {/* Reviews List */}
          <div className="mt-6">
            {reviewsLoading ? (
              <p className="text-center text-sm text-gray-500">Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth={1.5} 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                        {review.is_verified && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.review_text}</p>
                    )}
                    
                    {/* Review Media */}
                    {(review.image_url || review.video_url) && (
                      <div className="flex gap-2 mt-3">
                        {review.image_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <img 
                              src={`http://localhost:8800${review.image_url}`}
                              alt="Review" 
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                              onClick={() => window.open(`http://localhost:8800${review.image_url}`, '_blank')}
                            />
                          </div>
                        )}
                        {review.video_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden relative">
                            <video 
                              src={`http://localhost:8800${review.video_url}`}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => window.open(`http://localhost:8800${review.video_url}`, '_blank')}
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-6 h-6 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
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
