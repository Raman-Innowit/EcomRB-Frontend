import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, getCitiesByState, getUserAddresses } from '../services/api';
import CloneFooter from '../components/CloneFooter';

const Checkout = () => {
  const { cartItems, clearCart, removeFromCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('flat_rate');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [emailSubscription, setEmailSubscription] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [cities, setCities] = useState([]);
  const [shippingCities, setShippingCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState('');
  const [selectedShippingAddress, setSelectedShippingAddress] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    country: 'India',
    town_city: '',
    house_number: '',
    apartment: '',
    state: 'Rajasthan',
    pin_code: '',
    phone: '',
    email: '',
    order_notes: '',
  });

  const [shippingData, setShippingData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    country: 'India',
    town_city: '',
    house_number: '',
    apartment: '',
    state: 'Rajasthan',
    pin_code: '',
  });

  // Fetch cities when state changes (billing address)
  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      getCitiesByState(formData.state)
        .then((response) => {
          if (response.success && response.cities) {
            setCities(response.cities);
            // Reset city if current city is not in the new list
            if (formData.town_city && !response.cities.includes(formData.town_city)) {
              setFormData(prev => ({ ...prev, town_city: '' }));
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching cities:', error);
          setCities([]);
        })
        .finally(() => {
          setLoadingCities(false);
        });
    }
  }, [formData.state]);

  // Fetch cities when shipping state changes
  useEffect(() => {
    if (shippingData.state) {
      setLoadingCities(true);
      getCitiesByState(shippingData.state)
        .then((response) => {
          if (response.success && response.cities) {
            setShippingCities(response.cities);
            // Reset city if current city is not in the new list
            if (shippingData.town_city && !response.cities.includes(shippingData.town_city)) {
              setShippingData(prev => ({ ...prev, town_city: '' }));
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching shipping cities:', error);
          setShippingCities([]);
        })
        .finally(() => {
          setLoadingCities(false);
        });
    }
  }, [shippingData.state]);

  // Fetch saved addresses when component loads (if user is logged in)
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true);
      getUserAddresses()
        .then((response) => {
          if (response.success && response.addresses) {
            setSavedAddresses(response.addresses || []);
          }
        })
        .catch((error) => {
          console.error('Error fetching saved addresses:', error);
          setSavedAddresses([]);
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [isAuthenticated]);

  // Parse address string and populate form fields
  const parseAndFillAddress = (addressString, isShipping = false) => {
    if (!addressString) return;
    
    // Address format: "house_number, apartment, town_city, state - pin_code"
    // Try to parse the address - handle various formats
    try {
      // Split by comma first
      const parts = addressString.split(',').map(p => p.trim());
      
      if (parts.length >= 3) {
        const houseNumber = parts[0] || '';
        const apartment = parts[1] || '';
        
        // Last part should be "state - pin_code"
        const lastPart = parts[parts.length - 1];
        const statePinMatch = lastPart.match(/^(.+?)\s*-\s*(.+)$/);
        
        if (statePinMatch) {
          const state = statePinMatch[1].trim();
          const pinCode = statePinMatch[2].trim();
          
          // Everything between apartment and last part is the city
          const townCity = parts.slice(2, -1).join(', ').trim() || '';
          
          if (isShipping) {
            setShippingData(prev => ({
              ...prev,
              house_number: houseNumber,
              apartment: apartment,
              town_city: townCity,
              state: state,
              pin_code: pinCode
            }));
            
            // Trigger city fetch for shipping
            if (state) {
              getCitiesByState(state)
                .then((response) => {
                  if (response.success && response.cities) {
                    setShippingCities(response.cities);
                  }
                })
                .catch((error) => {
                  console.error('Error fetching shipping cities:', error);
                });
            }
          } else {
            setFormData(prev => ({
              ...prev,
              house_number: houseNumber,
              apartment: apartment,
              town_city: townCity,
              state: state,
              pin_code: pinCode
            }));
            
            // Trigger city fetch for billing
            if (state) {
              getCitiesByState(state)
                .then((response) => {
                  if (response.success && response.cities) {
                    setCities(response.cities);
                  }
                })
                .catch((error) => {
                  console.error('Error fetching cities:', error);
                });
            }
          }
        } else {
          // Fallback: if no "state - pin" format, try simpler parsing
          console.warn('Could not parse address format:', addressString);
        }
      }
    } catch (error) {
      console.error('Error parsing address:', error);
    }
  };

  // Handle billing address selection
  const handleBillingAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedBillingAddress(addressId);
    
    if (addressId && addressId !== 'new') {
      const selectedAddress = savedAddresses.find(addr => addr.address === addressId);
      if (selectedAddress) {
        parseAndFillAddress(selectedAddress.address, false);
      }
    }
  };

  // Handle shipping address selection
  const handleShippingAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedShippingAddress(addressId);
    
    if (addressId && addressId !== 'new') {
      const selectedAddress = savedAddresses.find(addr => addr.address === addressId);
      if (selectedAddress) {
        parseAndFillAddress(selectedAddress.address, true);
      }
    }
  };

  const handleShippingChange = (e) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.salePrice || item.price || 0;
      return total + (itemPrice * (item.quantity || 1));
    }, 0);
  };

  const calculateShipping = () => {
    return shippingMethod === 'flat_rate' ? 1.00 : 0;
  };

  const calculateTaxes = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const taxableAmount = subtotal + shipping;
    const cgst = taxableAmount * 0.09;
    const sgst = taxableAmount * 0.09;
    return { cgst, sgst };
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const { cgst, sgst } = calculateTaxes();
    return subtotal + shipping + cgst + sgst;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout', message: 'Please login to place an order' } });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if user is logged in
    if (!isAuthenticated || !user || !user.id) {
      setError('You must be logged in to place an order. Please login first.');
      setLoading(false);
      navigate('/login', { state: { from: '/checkout', message: 'Please login to place an order' } });
      return;
    }

    try {
      const items = cartItems.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity || 1,
        price: item.salePrice || item.price || 0,
      }));

      const shippingAddress = shipToDifferentAddress
        ? `${shippingData.house_number}, ${shippingData.apartment}, ${shippingData.town_city}, ${shippingData.state} - ${shippingData.pin_code}`
        : `${formData.house_number}, ${formData.apartment}, ${formData.town_city}, ${formData.state} - ${formData.pin_code}`;

      const orderData = {
        user_id: user.id,  // REQUIRED: User must be logged in
        customer_name: `${formData.first_name} ${formData.last_name}`,
        customer_email: formData.email || user.email,
        customer_phone: formData.phone,
        shipping_address: shippingAddress,
        items: items,
        currency_symbol: '₹',
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        order_notes: formData.order_notes,
      };

      const response = await createOrder(orderData);

      if (response.success) {
        // Clear cart after successful order (this will not show any errors)
        clearCart();
        navigate('/order-success', { state: { orderId: response.order.id || response.order_id } });
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">Add some products to your cart to checkout</p>
        <button
          onClick={() => navigate('/products')}
          className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  // eslint-disable-next-line no-unused-vars
  const shipping = calculateShipping(); // Used in calculateTaxes and calculateTotal
  const { cgst, sgst } = calculateTaxes();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-white">
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

        {/* Coupon Section */}
        <div className="mb-8">
          <div className="h-0.5 bg-blue-600 mb-4"></div>
          <div className="bg-gray-100 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCouponInput}
                onChange={(e) => {
                  setShowCouponInput(e.target.checked);
                  if (!e.target.checked) {
                    setCouponCode('');
                    setCouponError('');
                  }
                }}
                className="mr-3 w-4 h-4 border-2 border-blue-500 rounded"
                style={{ accentColor: '#3b82f6' }}
              />
              <span className="text-gray-700">
                Have a coupon? <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCouponInput(true);
                  }}
                  className="text-green-700 underline ml-1 hover:text-green-800 bg-transparent border-none p-0 cursor-pointer"
                >
                  Click here to enter your code
                </button>
              </span>
            </label>
          </div>
          
          {showCouponInput && (
            <div className="bg-white border border-purple-200 rounded-lg p-6 mt-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError('');
                  }}
                  placeholder="Coupon code"
                  className="flex-1 border border-black rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!couponCode.trim()) {
                      setCouponError('Please enter a coupon code.');
                    } else {
                      setCouponError('');
                      // TODO: Apply coupon logic here
                      console.log('Applying coupon:', couponCode);
                    }
                  }}
                  className="bg-green-700 text-white px-6 py-3 rounded font-bold uppercase hover:bg-green-800 transition whitespace-nowrap"
                >
                  APPLY COUPON
                </button>
              </div>
              {couponError && (
                <p className="text-red-600 mt-2 text-sm">{couponError}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
      <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Billing Details */}
        <div className="lg:w-2/3">
              <h2 className="text-2xl font-bold mb-6">Billing details</h2>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <label htmlFor="first_name" className="block text-gray-700 mb-2">
                      First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                  onChange={handleChange}
                  required
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                    <label htmlFor="last_name" className="block text-gray-700 mb-2">
                      Last name <span className="text-red-500">*</span>
                </label>
                <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                  onChange={handleChange}
                  required
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company_name" className="block text-gray-700 mb-2">
                    Company name
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="India">India</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="town_city" className="block text-gray-700 mb-2">
                    Town / City
                  </label>
                  <select
                    id="town_city"
                    name="town_city"
                    value={formData.town_city}
                    onChange={handleChange}
                    disabled={loadingCities || cities.length === 0}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {loadingCities && (
                    <p className="text-sm text-gray-500 mt-1">Loading cities...</p>
                  )}
                </div>

                <div>
                  <label htmlFor="house_number" className="block text-gray-700 mb-2">
                    House number and street name
                  </label>
                  <input
                    type="text"
                    id="house_number"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="apartment" className="block text-gray-700 mb-2">
                    Apartment, suite, unit, etc. (optional)
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <label htmlFor="pin_code" className="block text-gray-700 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    id="pin_code"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                  <label htmlFor="phone" className="block text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                  onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shipToDifferentAddress}
                      onChange={(e) => setShipToDifferentAddress(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Ship to a different address?</span>
                  </label>
                </div>

                {shipToDifferentAddress && (
                  <div className="mb-6 border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
                    
                    {/* Saved Shipping Addresses Dropdown */}
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <label htmlFor="shipping_address_select" className="block text-gray-700 mb-2 font-medium">
                          Select a saved shipping address
                        </label>
                        <select
                          id="shipping_address_select"
                          value={selectedShippingAddress}
                          onChange={handleShippingAddressSelect}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="new">Enter new shipping address</option>
                          {savedAddresses.map((address, idx) => (
                            <option key={idx} value={address.address}>
                              {address.type === 'shipping' ? '📦' : '💳'} {address.address.substring(0, 50)}{address.address.length > 50 ? '...' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="shipping_first_name" className="block text-gray-700 mb-2">
                            First name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="shipping_first_name"
                            name="first_name"
                            value={shippingData.first_name}
                            onChange={handleShippingChange}
                            required={shipToDifferentAddress}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="First name*"
                          />
                        </div>

                        <div>
                          <label htmlFor="shipping_last_name" className="block text-gray-700 mb-2">
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="shipping_last_name"
                            name="last_name"
                            value={shippingData.last_name}
                            onChange={handleShippingChange}
                            required={shipToDifferentAddress}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Last name*"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="shipping_company_name" className="block text-gray-700 mb-2">
                          Company name
                        </label>
                        <input
                          type="text"
                          id="shipping_company_name"
                          name="company_name"
                          value={shippingData.company_name}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Company name"
                        />
                      </div>

                      <div>
                        <label htmlFor="shipping_country" className="block text-gray-700 mb-2">
                          Country / Region
                        </label>
                        <select
                          id="shipping_country"
                          name="country"
                          value={shippingData.country}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="India">India</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="shipping_town_city" className="block text-gray-700 mb-2">
                          Town / City
                        </label>
                        <select
                          id="shipping_town_city"
                          name="town_city"
                          value={shippingData.town_city}
                          onChange={handleShippingChange}
                          disabled={loadingCities || shippingCities.length === 0}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select City</option>
                          {shippingCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {loadingCities && (
                          <p className="text-sm text-gray-500 mt-1">Loading cities...</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="shipping_house_number" className="block text-gray-700 mb-2">
                          House number and street name
                        </label>
                        <input
                          type="text"
                          id="shipping_house_number"
                          name="house_number"
                          value={shippingData.house_number}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="House number and street name"
                        />
                      </div>

                      <div>
                        <label htmlFor="shipping_apartment" className="block text-gray-700 mb-2">
                          Apartment, suite, unit, etc. (optional)
                        </label>
                        <input
                          type="text"
                          id="shipping_apartment"
                          name="apartment"
                          value={shippingData.apartment}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Apartment, suite, unit, etc. (optional)"
                />
              </div>

              <div>
                        <label htmlFor="shipping_state" className="block text-gray-700 mb-2">
                          State / Province
                        </label>
                        <select
                          id="shipping_state"
                          name="state"
                          value={shippingData.state}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label htmlFor="shipping_pin_code" className="block text-gray-700 mb-2">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          id="shipping_pin_code"
                          name="pin_code"
                          value={shippingData.pin_code}
                          onChange={handleShippingChange}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="PIN Code"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="order_notes" className="block text-gray-700 mb-2">
                    Order notes
                </label>
                <textarea
                    id="order_notes"
                    name="order_notes"
                    value={formData.order_notes}
                  onChange={handleChange}
                  rows="4"
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Order notes"
                ></textarea>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
        <div className="lg:w-1/3">
              {/* Your Order */}
              <div className="bg-white border border-gray-200 rounded p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Your order</h2>
            
                <div className="space-y-4">
              {cartItems.map((item) => {
                const itemPrice = item.salePrice || item.price || 0;
                const itemTotal = itemPrice * (item.quantity || 1);
                return (
                      <div key={item.productId} className="flex items-center gap-4 pb-4 border-b border-gray-200">
                        <img
                          src={item.image_url || item.thumbnail_url || '/assets/placeholder.png'}
                          alt={item.name}
                          className="w-16 h-16 object-contain"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            ₹{itemPrice.toFixed(2)} × {item.quantity || 1}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{itemTotal.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                  </div>
                );
              })}
                </div>
              </div>

              {/* Cart Totals */}
              <div className="bg-white border border-gray-200 rounded p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Cart totals</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">SUBTOTAL</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">SHIPPING:</div>
                    <div className="space-y-2 ml-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          value="free"
                          checked={shippingMethod === 'free'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>Free shipping</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          value="flat_rate"
                          checked={shippingMethod === 'flat_rate'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>Flat rate: ₹1.00</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">9% CGST</span>
                    <span>₹{cgst.toFixed(2)}</span>
            </div>

              <div className="flex justify-between">
                    <span className="font-semibold">9% SGST</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white border border-gray-200 rounded p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium">Cash on delivery</div>
                      <div className="text-sm text-gray-600">Pay with cash upon delivery.</div>
                    </div>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="payment"
                      value="phonepe"
                      checked={paymentMethod === 'phonepe'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium">PhonePe Payment Solutions</div>
                      <div className="text-sm text-gray-600 mt-1">UPI, Credit/Debit Card, Netbanking</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email Subscription */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSubscription}
                    onChange={(e) => setEmailSubscription(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 text-sm">
                    I would like to receive exclusive emails with discounts and product information
                  </span>
                </label>
              </div>

              {/* Privacy Policy */}
              <p className="text-sm text-gray-600 mb-6">
                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                <a href="/privacy-policy" className="text-green-700 hover:underline">privacy policy</a>.
              </p>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-4 rounded font-semibold text-lg hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'PLACE ORDER'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default Checkout;
