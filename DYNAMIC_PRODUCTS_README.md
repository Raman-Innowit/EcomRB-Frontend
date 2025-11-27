# Dynamic Product Detail Pages

This document explains how the dynamic product detail pages work and how to configure product-specific content in your database.

## Overview

The product detail page now supports dynamic content that can be customized per product. This includes:
- Custom product images/galleries
- Product-specific ingredients with descriptions and images
- Custom FAQs
- Product features/benefits
- Info tabs content (key ingredients, highlights, dosage, directions, warnings)

## Database Setup

### 1. Run the Migration Script

Run the SQL migration script to add the necessary columns to your `products` table:

```bash
mysql -u your_username -p your_database < database_migration_dynamic_products.sql
```

Or run it directly in your MySQL client.

### 2. Database Columns

The following columns will be added to your `products` table:

- `key_ingredients` (TEXT) - Key ingredients text
- `highlights` (TEXT) - Product highlights/features
- `recommended_dosage` (TEXT) - Recommended dosage instructions
- `directions` (TEXT) - Usage directions
- `warning` (TEXT) - Warning information
- `product_features` (JSON) - Array of product features
- `faqs` (JSON) - Array of FAQ objects
- `additional_images` (JSON) - Array of additional image URLs
- `gallery_images` (JSON) - Array of gallery image URLs
- `ingredient_details` (JSON) - Array of ingredient objects

## Example Data

### Product Features (JSON Array)

```json
[
  "Supports Energy & Mood",
  "Boosts Immunity",
  "Natural Energy Supplement",
  "Reduce Stress & Anxiety",
  "Enhance Stamina & Endurance"
]
```

### FAQs (JSON Array of Objects)

```json
[
  {
    "question": "What is this product?",
    "answer": "This product is a natural supplement designed to..."
  },
  {
    "question": "How long should I use it?",
    "answer": "Use consistently for at least 2 months to see optimal results."
  },
  {
    "question": "Can I take it with other medications?",
    "answer": "Please consult your doctor before use if you are taking prescription medications."
  }
]
```

### Ingredient Details (JSON Array of Objects)

```json
[
  {
    "name": "Ashwagandha (Withania somnifera)",
    "description": "The primary active compounds in Ashwagandha, an adaptogen, Withanolides are known to balance hormones, reduce stress, and improves overall sexual health.",
    "image": "/assets/Ashwagandha-Withania-somnifera.png"
  },
  {
    "name": "Shatavari (Asparagus racemosus)",
    "description": "Shatavari is a powerhouse of nutrients that nourishes the body from within and have plant-based estrogens.",
    "image": "/assets/Shatavari.png"
  }
]
```

### Gallery Images (JSON Array)

```json
[
  "/assets/product-image-1.jpg",
  "/assets/product-image-2.jpg",
  "/assets/product-image-3.jpg",
  "/assets/product-image-4.jpg"
]
```

## How It Works

### Backend

1. The backend API endpoint `/api/public/product/<id>` automatically detects if the dynamic content columns exist in your database
2. If they exist, it fetches and includes them in the product response
3. JSON fields are automatically parsed and returned as structured data

### Frontend

1. The `ProductDetail` component checks if dynamic content is available from the API
2. If dynamic content exists, it uses that content
3. If not, it falls back to default/hardcoded content
4. This ensures backward compatibility - products without dynamic content will still display correctly

## Updating Product Content

You can update product content in several ways:

### Via SQL

```sql
UPDATE products 
SET 
  key_ingredients = 'Ashwagandha - 80mg, Gokshura - 160mg',
  highlights = 'Scientifically tested, Nut- & gluten-free',
  product_features = '["Feature 1", "Feature 2"]',
  faqs = '[{"question": "Q1", "answer": "A1"}]',
  gallery_images = '["/assets/img1.jpg", "/assets/img2.jpg"]'
WHERE id = 1;
```

### Via Admin Panel (Future)

An admin panel can be built to manage this content through a user-friendly interface.

## Fallback Behavior

If a product doesn't have dynamic content configured:
- Default images will be used
- Default ingredient cards will be displayed
- Default FAQs will be shown
- Default info tabs content will be used
- Default product features will be displayed

This ensures all products display correctly even without custom content.

## Notes

- All JSON fields are optional - products will work fine without them
- The main product image (`image_url` or `thumbnail_url`) is always used as the primary image
- Gallery images are displayed in addition to the main image
- Ingredients, FAQs, and features are completely customizable per product
- The layout remains consistent across all products, only the content changes

