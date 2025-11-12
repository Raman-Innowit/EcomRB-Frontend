# Database Setup Instructions

## Prerequisites
- MySQL server running on localhost:3306
- Database: `ecommerce_admin`
- User: `root`
- Password: `password@12345`

## Setup Steps

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variable**
   Set the `DATABASE_URL` environment variable before running the backend:
   
   **Windows (PowerShell):**
   ```powershell
   $env:DATABASE_URL="mysql+pymysql://root:password%4012345@localhost:3306/ecommerce_admin"
   python backend.py
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set DATABASE_URL=mysql+pymysql://root:password%4012345@localhost:3306/ecommerce_admin
   python backend.py
   ```
   
   **Linux/Mac:**
   ```bash
   export DATABASE_URL="mysql+pymysql://root:password%4012345@localhost:3306/ecommerce_admin"
   python backend.py
   ```

3. **Database Tables**
   The backend will automatically create the following tables if they don't exist:
   - `categories` - Product categories
   - `health_benefits` - Health benefit tags
   - `products` - Product information
   - `orders` - Customer orders
   - `order_items` - Order line items

4. **Start Backend Server**
   ```bash
   python backend.py
   ```
   The server will run on `http://localhost:5000`

5. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/public/products` - Get all products (supports pagination, filtering, sorting)
- `GET /api/public/product/<id>` - Get product details
- `GET /api/public/categories` - Get all categories
- `GET /api/public/health-benefits` - Get all health benefits

### Orders
- `POST /api/public/orders` - Create a new order
  ```json
  {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "shipping_address": "123 Main St, City, State, ZIP",
    "items": [
      {
        "product_id": 1,
        "product_name": "Product Name",
        "quantity": 2,
        "price": 99.99
      }
    ]
  }
  ```

## Notes
- The password in the URL is URL-encoded: `password@12345` becomes `password%4012345`
- Make sure MySQL server is running before starting the backend
- The database connection will be established automatically when the backend starts

