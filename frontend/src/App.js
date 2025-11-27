import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductPack from './pages/ProductPack';
import CategoryProducts from './pages/CategoryProducts';
import HealthBenefitProducts from './pages/HealthBenefitProducts';
import BeautyRadiance from './pages/BeautyRadiance';
import DigestiveHealth from './pages/DigestiveHealth';
import HealthyAgeing from './pages/HealthyAgeing';
import BoneAndJointHealth from './pages/BoneAndJointHealth';
import BrainHealth from './pages/BrainHealth';
import ImmunityBooster from './pages/ImmunityBooster';
import MensHealth from './pages/MensHealth';
import SleepSupport from './pages/SleepSupport';
import SportsFitness from './pages/SportsFitness';
import StressAnxietyRelief from './pages/StressAnxietyRelief';
import WomensHealth from './pages/WomensHealth';
import MagnesiumArticle from './pages/MagnesiumArticle';
import DiabetesArticle from './pages/DiabetesArticle';
import VitaminDArticle from './pages/VitaminDArticle';
import CatalogPage from './pages/CatalogPage';
import PasswordReset from './pages/PasswordReset';
import ShippingPolicy from './pages/ShippingPolicy';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import PressRelease from './pages/PressRelease';
import Blog from './pages/Blog';
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

// ScrollToTop component that scrolls to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<CloneHome />} />
        <Route path="/old-home" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/products" element={<Products />} />
        <Route path="/catalog-page" element={<PageTransition><CatalogPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/product/:id/pack/:packType" element={<PageTransition><ProductPack /></PageTransition>} />
        <Route path="/category/:id" element={<PageTransition><CategoryProducts /></PageTransition>} />
        <Route path="/health-benefit/:id" element={<PageTransition><HealthBenefitProducts /></PageTransition>} />
        {/* Individual Health Benefit Pages */}
        <Route path="/beauty-radiance" element={<PageTransition><BeautyRadiance /></PageTransition>} />
        <Route path="/digestive-health" element={<PageTransition><DigestiveHealth /></PageTransition>} />
        <Route path="/healthy-ageing" element={<PageTransition><HealthyAgeing /></PageTransition>} />
        <Route path="/bone-and-joint-health" element={<PageTransition><BoneAndJointHealth /></PageTransition>} />
        <Route path="/brain-health" element={<PageTransition><BrainHealth /></PageTransition>} />
        <Route path="/immunity-booster" element={<PageTransition><ImmunityBooster /></PageTransition>} />
        <Route path="/mens-health" element={<PageTransition><MensHealth /></PageTransition>} />
        <Route path="/sleep-support" element={<PageTransition><SleepSupport /></PageTransition>} />
        <Route path="/sports-fitness" element={<PageTransition><SportsFitness /></PageTransition>} />
        <Route path="/stress-anxiety-relief" element={<PageTransition><StressAnxietyRelief /></PageTransition>} />
        <Route path="/womens-health" element={<PageTransition><WomensHealth /></PageTransition>} />
        <Route path="/comprehensive-benefits-of-magnesium-for-overall-wellness" element={<PageTransition><MagnesiumArticle /></PageTransition>} />
        <Route path="/early-detection-of-diabetes" element={<PageTransition><DiabetesArticle /></PageTransition>} />
        <Route path="/6-good-sources-of-vitamin-d-for-vegans" element={<PageTransition><VitaminDArticle /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/order-success" element={<PageTransition><OrderSuccess /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/password-reset" element={<PageTransition><PasswordReset /></PageTransition>} />
        <Route path="/shipping-policy" element={<PageTransition><ShippingPolicy /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/press-release" element={<PageTransition><PressRelease /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
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
      <ScrollToTop />
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


