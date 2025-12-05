import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getPublicProduct } from '../services/api';
import CloneFooter from '../components/CloneFooter';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
  } = useCart();
  const navigate = useNavigate();
  const [productImages, setProductImages] = useState({});
  const [shippingState, setShippingState] = useState('Rajasthan');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  // Track pending quantity changes (not applied until UPDATE CART is clicked)
  const [pendingQuantities, setPendingQuantities] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState({
    country: 'India',
    state: 'Rajasthan',
    town_city: '',
    pin_code: '',
  });

  // Initialize pending quantities from cart items only once on mount
  useEffect(() => {
    if (!hasInitialized && cartItems.length > 0) {
      const initialQuantities = {};
      cartItems.forEach(item => {
        initialQuantities[item.productId] = item.quantity || 1;
      });
      setPendingQuantities(initialQuantities);
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]); // Only depend on hasInitialized to prevent resets


  // Fetch product images
  useEffect(() => {
    const fetchImages = async () => {
      const images = {};
      for (const item of cartItems) {
        try {
          const product = await getPublicProduct(item.productId);
          if (product) {
            images[item.productId] = product.thumbnail_url || product.image_url || null;
          }
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
        }
      }
      setProductImages(images);
    };
    if (cartItems.length > 0) {
      fetchImages();
    }
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <>
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
        <CloneFooter />
      </>
    );
  }

  // Helper function to safely get item price
  const getItemPrice = (item) => {
    return item.salePrice || item.price || 0;
  };

  // Calculate subtotal based on actual cart quantities (not pending changes)
  const subtotal = getTotalPrice();
  const shippingCost = 1.00; // Flat rate
  const cgst = subtotal * 0.09; // 9% CGST
  const sgst = subtotal * 0.09; // 9% SGST
  const total = subtotal + shippingCost + cgst + sgst;

  // Handle quantity change (only updates local state, not cart)
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setPendingQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };

  // Apply all pending quantity changes to cart
  const handleUpdateCart = () => {
    // Store the updates we're about to apply
    const updates = { ...pendingQuantities };
    
    // Apply all pending quantity changes
    Object.keys(updates).forEach(productId => {
      const quantity = updates[productId];
      const productIdNum = parseInt(productId);
      if (quantity > 0) {
        updateQuantity(productIdNum, quantity);
      } else {
        removeFromCart(productIdNum);
      }
    });
    
    // Sync pendingQuantities with the updates we just applied
    // This ensures the display matches what we set in the cart
    // The cart context will trigger a re-render with updated prices
    setPendingQuantities(updates);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
    } else {
      // TODO: Implement coupon validation
      console.log('Applying coupon:', couponCode);
      setCouponError('');
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - Product Table */}
          <div className="lg:w-2/3">
            {/* Table Header */}
            <div className="bg-[#f5f5f0] border-b-2 border-gray-300 py-3 px-4 grid grid-cols-12 gap-4 font-semibold text-sm uppercase text-gray-700">
              <div className="col-span-1"></div>
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Product Rows */}
            {cartItems.map((item) => {
              const itemPrice = getItemPrice(item);
              // Display pending quantity in selector, but use actual cart quantity for calculations
              const displayQuantity = pendingQuantities[item.productId] !== undefined 
                ? pendingQuantities[item.productId] 
                : (item.quantity || 1);
              // Use actual cart quantity for subtotal calculation (not pending)
              const itemTotal = itemPrice * (item.quantity || 1);
              const productImage = productImages[item.productId];
              
              return (
                <div key={item.productId} className="border-b border-gray-200 py-4 px-4 grid grid-cols-12 gap-4 items-center">
                  {/* Remove Button */}
                  <div className="col-span-1">
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Product Image and Name */}
                  <div className="col-span-5 flex items-center gap-4">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={item.name || 'Product'}
                        className="w-20 h-20 object-contain bg-white border border-gray-200 p-2"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-400">
                          {(item.name && item.name.charAt(0).toUpperCase()) || '?'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-800 uppercase">{item.name || 'Unknown Product'}</span>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-center text-gray-700">
                    ₹{itemPrice.toFixed(2)}
                  </div>

                  {/* Quantity Selector */}
                  <div className="col-span-2 flex justify-center">
                    <div className="inline-flex items-stretch border border-gray-300 overflow-hidden" style={{ backgroundColor: '#f5f5f0', width: '120px' }}>
                      <button
                        onClick={() => handleQuantityChange(item.productId, Math.max(1, displayQuantity - 1))}
                        disabled={displayQuantity <= 1}
                        className="h-10 text-lg font-semibold text-gray-800 border-r border-gray-300 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f5f5f0', width: '40px', flexShrink: 0 }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-center text-lg font-semibold text-gray-800 border-r border-gray-300 select-none flex items-center justify-center" style={{ backgroundColor: '#ffffff', width: '40px', flexShrink: 0 }}>
                        {displayQuantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, displayQuantity + 1)}
                        className="h-10 text-lg font-semibold text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f5f5f0', width: '40px', flexShrink: 0 }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-2 text-right font-semibold text-gray-800">
                    ₹{itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}

            {/* Coupon Section */}
            <div className="mt-6 flex items-center gap-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                }}
                placeholder="Coupon code"
                className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleApplyCoupon}
                className="bg-green-700 text-white px-6 py-2 rounded font-semibold hover:bg-green-800 transition whitespace-nowrap"
              >
                APPLY COUPON
              </button>
            </div>
            {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}

            {/* Update Cart Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpdateCart}
                className="bg-gray-400 text-white px-6 py-2 rounded font-semibold hover:bg-gray-500 transition"
              >
                UPDATE CART
              </button>
            </div>
          </div>

          {/* Right Section - Cart Totals */}
          <div className="lg:w-1/3">
            <div className="bg-gray-50 border border-gray-300 p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6 uppercase">Cart Totals</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">SUBTOTAL</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span className="font-semibold">SHIPPING</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Flat rate: ₹{shippingCost.toFixed(2)}
                  </div>
                  {!showAddressForm && (
                    <>
                      <div className="text-sm text-gray-600 mb-1">
                        Shipping to {shippingState}.
                      </div>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-green-700 hover:text-green-800 text-sm underline"
                      >
                        Change address
                      </button>
                    </>
                  )}
                  
                  {showAddressForm && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="country" className="block text-gray-700 mb-2 text-sm">
                          Country / region
                        </label>
                        <select
                          id="country"
                          value={addressData.country}
                          onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        >
                          <option value="India">India</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-gray-700 mb-2 text-sm">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="state"
                          value={addressData.state}
                          onChange={(e) => {
                            setAddressData({ ...addressData, state: e.target.value });
                            setShippingState(e.target.value);
                          }}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        >
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                          <option value="Assam">Assam</option>
                          <option value="Bihar">Bihar</option>
                          <option value="Chhattisgarh">Chhattisgarh</option>
                          <option value="Goa">Goa</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Haryana">Haryana</option>
                          <option value="Himachal Pradesh">Himachal Pradesh</option>
                          <option value="Jharkhand">Jharkhand</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Manipur">Manipur</option>
                          <option value="Meghalaya">Meghalaya</option>
                          <option value="Mizoram">Mizoram</option>
                          <option value="Nagaland">Nagaland</option>
                          <option value="Odisha">Odisha</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Sikkim">Sikkim</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Tripura">Tripura</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Uttarakhand">Uttarakhand</option>
                          <option value="West Bengal">West Bengal</option>
                          <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                          <option value="Chandigarh">Chandigarh</option>
                          <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                          <option value="Ladakh">Ladakh</option>
                          <option value="Lakshadweep">Lakshadweep</option>
                          <option value="Puducherry">Puducherry</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="town_city" className="block text-gray-700 mb-2 text-sm">
                          Town / City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="town_city"
                          value={addressData.town_city}
                          onChange={(e) => setAddressData({ ...addressData, town_city: e.target.value })}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="pin_code" className="block text-gray-700 mb-2 text-sm">
                          PIN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="pin_code"
                          value={addressData.pin_code}
                          onChange={(e) => setAddressData({ ...addressData, pin_code: e.target.value })}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setShippingState(addressData.state);
                          setShowAddressForm(false);
                        }}
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition text-sm"
                      >
                        UPDATE
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">9% CGST</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">9% SGST</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-300 pt-4 flex justify-between text-lg font-bold text-gray-900">
                  <span>TOTAL</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-green-700 text-white py-3 rounded font-semibold hover:bg-green-800 transition uppercase"
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <CloneFooter />
    </>
  );
};

export default Cart;
