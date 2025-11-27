import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const ARTICLES = [
  {
    id: 1,
    title: 'Comprehensive Benefits of Magnesium for Overall Wellness',
    author: 'Dr Monisha Singhal',
    date: 'September 1, 2025',
    categories: ['health', 'healthy', 'lifestyle'],
    snippet: 'Introduction to Magnesium and Its Importance for Wellness In the ever-expanding landscape of preventive healthcare, magnesium has become a cornerstone for maintaining optimal health and wellness. Despite being involved in over 300 biochemical reactions, magnesium often doesn\'t receive the attention it deserves. Key Roles of Magnesium in the Body Energy Production - Crucial for ATP [...]',
    image: '/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg',
    slug: 'comprehensive-benefits-of-magnesium-for-overall-wellness'
  },
  {
    id: 2,
    title: 'Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies',
    author: 'Dr Monisha Singhal',
    date: 'October 9, 2024',
    categories: ['diabetes', 'health', 'healthy'],
    snippet: 'Uncontrolled diabetes is a serious condition and the worst is being unaware of one\'s Diabetes! Even in today\'s world, diabetes is one of the most rapidly rising health problems worldwide affecting millions. The frightening part is that about half of the population having diabetes is diagnosed so late that people only find out they have [...]',
    image: '/assets/diabetes-article.png',
    slug: 'early-detection-of-diabetes'
  },
  {
    id: 3,
    title: '6 good sources of vitamin D for vegans',
    author: 'Dr Monisha Singhal',
    date: 'February 27, 2020',
    categories: ['ayurvedic', 'health'],
    snippet: 'Vitamin D is essential for maintaining strong bones, supporting immune function, and promoting overall health. For vegans, finding adequate sources of this crucial nutrient can be challenging...',
    image: '/assets/vitamin-d-article.png',
    slug: '6-good-sources-of-vitamin-d-for-vegans'
  },
];

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const bodyFontSize = '17px';
  const bodyColor = '#2f2f2f';

  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower === 'health' || tagLower === 'healthy') {
      return { bg: '#fbbf24', text: '#000' }; // Yellow
    } else if (tagLower === 'diabetes') {
      return { bg: '#15803d', text: '#fff' }; // Dark green
    } else if (tagLower === 'lifestyle') {
      return { bg: '#22c55e', text: '#fff' }; // Green
    } else if (tagLower === 'ayurvedic') {
      return { bg: '#9ca3af', text: '#fff' }; // Grey
    }
    return { bg: '#e5e7eb', text: '#000' }; // Default grey
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality can be implemented here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-2/3 order-2 lg:order-1">
            {/* Blog Posts */}
            {ARTICLES.map((article) => (
              <article key={article.id} className="mb-12 pb-12 border-b border-gray-200 last:border-b-0">
                {/* Tags */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {article.categories.map((category, index) => {
                    const colors = getTagColor(category);
                    return (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-sm font-medium rounded"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {category}
                      </span>
                    );
                  })}
                </div>

                {/* Featured Image */}
                <div className="mb-6">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-auto rounded-lg"
                    style={{ maxHeight: '500px', objectFit: 'cover' }}
                  />
                </div>

                {/* Article Metadata */}
                <div className="mb-4 flex items-center justify-between text-gray-600" style={{ fontSize: bodyFontSize }}>
                  <div>
                    <span>{article.date}</span>
                    <span className="mx-2">•</span>
                    <span>By {article.author}</span>
                  </div>
                  <div>0 comments</div>
                </div>

                {/* Article Title */}
                <h2
                  className="text-3xl md:text-4xl font-bold mb-4 leading-tight hover:text-green-700 transition-colors"
                  style={{ color: '#1f2937', fontFamily: 'Georgia, serif' }}
                >
                  <Link to={`/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>

                {/* Article Excerpt */}
                <p
                  className="mb-4 leading-relaxed"
                  style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: '1.7' }}
                >
                  {article.snippet}
                </p>

                {/* Read More Link */}
                <Link
                  to={`/${article.slug}`}
                  className="inline-block text-green-700 font-semibold hover:text-green-800 transition-colors underline"
                >
                  READ MORE
                </Link>
              </article>
            ))}
          </main>

          {/* Sidebar - Right Side */}
          <aside className="lg:w-1/3 order-1 lg:order-2">
            {/* Search Bar */}
            <div className="mb-8">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontSize: bodyFontSize }}
                />
                <button
                  type="submit"
                  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left hover:text-green-700" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left hover:text-green-700" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left hover:text-green-700" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left hover:text-green-700" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left hover:text-green-700" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Lifestyle (1)</span>
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Recent Posts
              </h3>
              <div className="space-y-4">
                {ARTICLES.slice(0, 3).map((article) => (
                  <Link
                    key={article.id}
                    to={`/${article.slug}`}
                    className="flex gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-semibold mb-1 line-clamp-2"
                        style={{ color: bodyColor, fontSize: bodyFontSize }}
                      >
                        {article.title}
                      </h4>
                      <p className="text-gray-500 text-sm">{article.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: '#1c5f2a' }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['ASHWAGANDHA', 'AYURVEDIC', 'AYURVEDIC PRODUCTS', 'FEMALE WELLNESS', 'NO HARSH CHEMICALS', 'NON-GMO', 'NUT- AND GLUTEN-FREE', 'PRODUCTS', 'SCIENTIFICALLY TESTED', 'SOY-FREE'].map((tag, index) => (
                  <Link
                    key={index}
                    to={`/products?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium transition-colors rounded hover:bg-[#1e8f3a] hover:text-white"
                    style={{ fontSize: '14px' }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <CloneFooter />
    </div>
  );
};

export default Blog;

