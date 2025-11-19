import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CloneFooter from '../components/CloneFooter';

const Cart = () => {
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
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">Add some products to your cart to continue shopping</p>
        <Link
          to="/products"
          className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Helper function to safely get item price
  const getItemPrice = (item) => {
    return item.salePrice || item.price || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          {cartItems.map((item) => {
            const itemPrice = getItemPrice(item);
            const itemTotal = itemPrice * (item.quantity || 1);
            
            return (
              <div key={item.productId} className="flex items-center gap-4 p-4 border-b">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                      {(item.name && item.name.charAt(0)) || '?'}
                    </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name || 'Unknown Product'}</h3>
                    <p className="text-gray-600">₹{itemPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, Math.max(1, (item.quantity || 1) - 1))}
                        disabled={(item.quantity || 1) <= 1}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity || 1}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, (item.quantity || 1) + 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-semibold w-24 text-right">
                      ₹{itemTotal.toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
          })}
        </div>
        
        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(getTotalPrice() || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
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
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default Cart;
