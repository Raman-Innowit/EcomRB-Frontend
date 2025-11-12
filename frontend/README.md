# RasayanaBio Frontend

React TypeScript frontend for RasayanaBio e-commerce website.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Create a `.env` file (already created) with:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

3. **Start Development Server**
   ```bash
   npm start
   ```

   The app will run on `http://localhost:3000`

## Features

- **Home Page**: Hero section, health benefits grid, best sellers
- **Product Listing**: Search, filter, sort products
- **Product Details**: Individual product pages
- **Shopping Cart**: Add/remove items, update quantities
- **Category Filtering**: Browse products by category
- **Health Benefit Filtering**: Browse products by health benefit
- **About Us**: Company information
- **Contact**: Contact form and information

## Tech Stack

- React 18
- TypeScript
- React Router DOM
- Axios
- Tailwind CSS
- React Context API (Cart Management)

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── context/        # React Context providers
│   ├── App.tsx         # Main app component
│   └── index.tsx       # Entry point
├── public/             # Static files
└── package.json        # Dependencies
```

## Backend Integration

The frontend connects to the Flask backend running on `http://localhost:5000`. Make sure:

1. Backend server is running
2. CORS is enabled (already configured in backend)
3. Public API endpoints are accessible at `/api/public/*`

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App (not recommended)

