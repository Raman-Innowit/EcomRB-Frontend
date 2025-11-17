import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CategoryProducts from './pages/CategoryProducts';
import HealthBenefitProducts from './pages/HealthBenefitProducts';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import CloneHome from './pages/CloneHome';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import WhatsAppButton from './components/WhatsAppButton';
import './index.css';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.24, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<CloneHome />} />
        <Route path="/old-home" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/category/:id" element={<PageTransition><CategoryProducts /></PageTransition>} />
        <Route path="/health-benefit/:id" element={<PageTransition><HealthBenefitProducts /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/order-success" element={<PageTransition><OrderSuccess /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { scrollYProgress } = useScroll();
  const location = useLocation();
  const isCloneHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {!isCloneHome && (
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="fixed top-0 left-0 right-0 h-1 origin-left bg-gradient-to-r from-green-500 via-emerald-500 to-lime-500 z-[60]"
        />
      )}
      {!isCloneHome && <Header />}
      <main className="flex-grow">
        <AnimatedRoutes />
      </main>
      <WhatsAppButton />
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;


