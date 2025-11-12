import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4 text-green-700">Order Placed Successfully!</h1>
        {orderId && (
          <p className="text-gray-600 mb-2">
            Your order ID is: <span className="font-semibold">{orderId}</span>
          </p>
        )}
        <p className="text-gray-600 mb-8">
          Thank you for your order! We'll send you a confirmation email shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

