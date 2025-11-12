import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';

const Cart: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Add some products to your cart to continue shopping</p>
        <Link
          to="/products"
          className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition inline-block"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Helper function to safely get item price
  const getItemPrice = (item: any): number => {
    return item.salePrice || item.price || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence initial={false}>
          {cartItems.map((item) => {
            const itemPrice = getItemPrice(item);
            const itemTotal = itemPrice * (item.quantity || 1);
            
            return (
              <motion.div
                layout
                key={item.productId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-2xl font-bold">
                      {item.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name || 'Unknown Product'}</h3>
                    <p className="text-green-700 font-bold">
                      ₹{itemPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => updateQuantity(item.productId, Math.max(1, (item.quantity || 1) - 1))}
                      disabled={(item.quantity || 1) <= 1}
                      className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </motion.button>
                    <span className="w-12 text-center">{item.quantity || 1}</span>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => updateQuantity(item.productId, (item.quantity || 1) + 1)}
                      className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +
                    </motion.button>
                  </div>
                  <p className="font-semibold w-24 text-right">
                    ₹{itemTotal.toFixed(2)}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(getTotalPrice() || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{(getTotalPrice() || 0).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-semibold mb-2"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;