import React from 'react';
import { Link } from 'react-router-dom';

const ARTICLES = [
  {
    id: 1,
    title: 'Comprehensive Benefits of Magnesium for Overall Wellness',
    author: 'Dr Monisha Singhal',
    date: 'September 1, 2025',
    categories: ['Health', 'Healthy', 'Lifestyle'],
    snippet: 'Introduction to Magnesium and Its Importance for Wellness In the ever-expanding landscape of preventive healthcare, magnesium has become a cornerstone for maintaining optimal health and wellness...',
    image: '/assets/magnesium-article.jpg',
    slug: 'comprehensive-benefits-of-magnesium'
  },
  {
    id: 2,
    title: 'Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies',
    author: 'Dr Monisha Singhal',
    date: 'October 9, 2024',
    categories: ['Diabetes', 'Health', 'Healthy'],
    snippet: 'Uncontrolled diabetes is a serious condition and the worst is being unaware of one\'s Diabetes! Even in today\'s world, diabetes is one of the most rapidly rising health problems worldwide...',
    image: '/assets/diabetes-article.png',
    slug: 'early-detection-of-diabetes'
  },
  {
    id: 3,
    title: '6 good sources of vitamin D for vegans',
    author: 'Dr Monisha Singhal',
    date: 'February 27, 2020',
    categories: ['Ayurvedic', 'Health'],
    snippet: 'Vitamin D is essential for maintaining strong bones, supporting immune function, and promoting overall health. For vegans, finding adequate sources of this crucial nutrient can be challenging...',
    image: '/assets/vitamin-d-article.png',
    slug: 'vitamin-d-sources-for-vegans'
  },
];

const LatestNews = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <p 
              className="text-green-600 text-lg mb-2 font-serif italic"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              - Be Healthy -
            </p>
          </div>
          <Link
            to="/blog"
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition mt-4 md:mt-0"
          >
            VIEW MORE
          </Link>
        </div>

        {/* Section Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-green-800 mb-12">
          Our Latest News
        </h2>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
            >
              {/* Article Image */}
              <div className="relative w-full h-64 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Article Content */}
              <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2">
                  {article.title}
                </h3>

                {/* Author & Date */}
                <p className="text-gray-600 text-sm mb-3">
                  By {article.author} {article.date}
                </p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.categories.map((category, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                {/* Snippet */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {article.snippet}
                </p>

                {/* Read More Button */}
                <Link
                  to={`/blog/${article.slug}`}
                  className="inline-block text-green-700 font-semibold hover:text-green-800 transition-colors"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;

