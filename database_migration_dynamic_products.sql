-- Migration script to add dynamic content columns to products table
-- Run this script on your MySQL database to enable dynamic product detail pages

-- Add columns for product-specific dynamic content
-- These columns store JSON or TEXT data for different products

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS key_ingredients TEXT COMMENT 'Key ingredients text or JSON array',
ADD COLUMN IF NOT EXISTS highlights TEXT COMMENT 'Product highlights/features',
ADD COLUMN IF NOT EXISTS recommended_dosage TEXT COMMENT 'Recommended dosage instructions',
ADD COLUMN IF NOT EXISTS directions TEXT COMMENT 'Usage directions',
ADD COLUMN IF NOT EXISTS warning TEXT COMMENT 'Warning information',
ADD COLUMN IF NOT EXISTS product_features JSON COMMENT 'Array of product features/benefits',
ADD COLUMN IF NOT EXISTS faqs JSON COMMENT 'Array of FAQ objects with question and answer',
ADD COLUMN IF NOT EXISTS additional_images JSON COMMENT 'Array of additional product image URLs',
ADD COLUMN IF NOT EXISTS gallery_images JSON COMMENT 'Array of gallery image URLs',
ADD COLUMN IF NOT EXISTS ingredient_details JSON COMMENT 'Array of ingredient objects with name, description, and image';

-- Example data structure for JSON columns:
-- 
-- product_features: ["Feature 1", "Feature 2", "Feature 3"]
-- 
-- faqs: [
--   {
--     "question": "What is this product?",
--     "answer": "This product is..."
--   },
--   {
--     "question": "How do I use it?",
--     "answer": "Take one tablet..."
--   }
-- ]
-- 
-- ingredient_details: [
--   {
--     "name": "Ashwagandha",
--     "description": "Description here",
--     "image": "/assets/ashwagandha.png"
--   }
-- ]
-- 
-- gallery_images or additional_images: [
--   "/assets/product-image-1.jpg",
--   "/assets/product-image-2.jpg"
-- ]

-- Note: If your MySQL version doesn't support IF NOT EXISTS in ALTER TABLE,
-- you may need to check if columns exist first or remove the IF NOT EXISTS clause.
-- For MySQL 5.7+, you can use:
-- 
-- ALTER TABLE products 
-- ADD COLUMN key_ingredients TEXT COMMENT 'Key ingredients text or JSON array',
-- ADD COLUMN highlights TEXT COMMENT 'Product highlights/features',
-- ADD COLUMN recommended_dosage TEXT COMMENT 'Recommended dosage instructions',
-- ADD COLUMN directions TEXT COMMENT 'Usage directions',
-- ADD COLUMN warning TEXT COMMENT 'Warning information',
-- ADD COLUMN product_features JSON COMMENT 'Array of product features/benefits',
-- ADD COLUMN faqs JSON COMMENT 'Array of FAQ objects with question and answer',
-- ADD COLUMN additional_images JSON COMMENT 'Array of additional product image URLs',
-- ADD COLUMN gallery_images JSON COMMENT 'Array of gallery image URLs',
-- ADD COLUMN ingredient_details JSON COMMENT 'Array of ingredient objects with name, description, and image';

