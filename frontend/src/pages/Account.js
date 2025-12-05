import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CloneFooter from '../components/CloneFooter';
import { trackUserAction, getUserOrders, getUserAddresses } from '../services/api';

const Account = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('account-details');
  const [firstName, setFirstName] = useState(user?.first_name || user?.firstName || user?.full_name?.split(' ')[0] || 'Guest');
  const [lastName, setLastName] = useState(user?.last_name || user?.lastName || user?.full_name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile_number || user?.mobile || user?.phone || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Orders and addresses
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Sync form fields with user data when component loads or user changes
    if (user) {
      setFirstName(user.first_name || user.firstName || user.full_name?.split(' ')[0] || 'Guest');
      setLastName(user.last_name || user.lastName || user.full_name?.split(' ').slice(1).join(' ') || '');
      setEmail(user.email || '');
      setMobile(user.mobile_number || user.mobile || user.phone || '');
    }
  }, [user]);

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    // Update user data in auth context
    const updatedUser = {
      ...user,
      firstName,
      lastName,
      email,
      mobile,
      name: `${firstName} ${lastName}`.trim()
    };
    // Update localStorage and context
    if (typeof window !== 'undefined') {
      const authData = {
        isAuthenticated: true,
        user: updatedUser
      };
      localStorage.setItem('rasayanabio_auth', JSON.stringify(authData));
      // Trigger re-render by updating state
      window.location.reload();
    }
    console.log('Account updated:', updatedUser);
  };

  const handleLogout = () => {
    // Track logout action
    if (user?.id) {
      trackUserAction({
        actionType: 'logout',
        userId: user.id,
        details: JSON.stringify({ email: user.email }),
      });
    }
    logout();
    navigate('/login');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    // For now, just store in localStorage (in a real app, this would call an API)
    // Update user object with password (in production, never store passwords in localStorage!)
    const updatedUser = {
      ...user,
      password: newPassword // In production, this should be hashed and sent to backend
    };

    if (typeof window !== 'undefined') {
      const authData = {
        isAuthenticated: true,
        user: updatedUser
      };
      localStorage.setItem('rasayanabio_auth', JSON.stringify(authData));
    }

    setPasswordSuccess('Password updated successfully!');
    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setPasswordSuccess('');
    }, 3000);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch orders when orders section is active
  useEffect(() => {
    if (activeSection === 'orders' && isAuthenticated) {
      setLoadingOrders(true);
      getUserOrders()
        .then((response) => {
          console.log('Orders response:', response);
          if (response.success) {
            setOrders(response.orders || []);
          } else {
            console.error('Orders API returned success=false:', response);
            setOrders([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching orders:', error);
          console.error('Error details:', error.response?.data || error.message);
          setOrders([]);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    }
  }, [activeSection, isAuthenticated]);

  // Fetch addresses when addresses section is active
  useEffect(() => {
    if (activeSection === 'addresses' && isAuthenticated) {
      setLoadingAddresses(true);
      getUserAddresses()
        .then((response) => {
          console.log('Addresses response:', response);
          if (response.success) {
            setAddresses(response.addresses || []);
          } else {
            console.error('Addresses API returned success=false:', response);
            setAddresses([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching addresses:', error);
          console.error('Error details:', error.response?.data || error.message);
          setAddresses([]);
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [activeSection, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="md:col-span-1">
            {/* User Avatar and Name */}
              <div className="bg-white rounded-lg p-6 mb-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">{user?.full_name || user?.name || `${firstName} ${lastName}`.trim() || 'Guest User'}</h3>
            </div>

            {/* Account and Change Password Box */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div 
                onClick={() => setActiveSection('account-details')}
                className={`flex items-center justify-between py-2 cursor-pointer hover:bg-gray-200 rounded px-2 ${
                  activeSection === 'account-details' ? 'bg-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Account</span>
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div 
                onClick={() => setActiveSection('change-password')}
                className={`flex items-center justify-between py-2 cursor-pointer hover:bg-gray-200 rounded px-2 mt-2 ${
                  activeSection === 'change-password' ? 'bg-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4 4-4-4 4-4 .257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Change Password</span>
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* DASHBOARD Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-green-800 text-white py-3 px-4 rounded-lg font-semibold uppercase mb-6 hover:bg-green-900 transition"
            >
              DASHBOARD
            </button>

            {/* Navigation Links */}
            <div className="bg-white rounded-lg p-4">
              <nav className="space-y-2">
                {[ 
                  { label: 'ORDERS', section: 'orders' },
                  { label: 'DOWNLOADS', section: 'downloads' },
                  { label: 'ADDRESSES', section: 'addresses' },
                  { label: 'ACCOUNT DETAILS', section: 'account-details' },
                  { label: 'POINTS', section: 'points' },
                  { label: 'MY COUPONS', section: 'coupons' },
                  { label: 'LOG OUT', section: 'logout' }
                ].map((item) => (
                  <button
                    key={item.section}
                    onClick={() => {
                      if (item.section === 'logout') {
                        handleLogout();
                      } else {
                        setActiveSection(item.section);
                      }
                    }}
                    className={`w-full text-left py-2 px-2 uppercase text-sm font-medium transition ${
                      activeSection === item.section
                        ? 'text-green-800 bg-green-50'
                        : 'text-gray-700 hover:text-green-800 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg p-8">
              {/* Orders Section */}
              {activeSection === 'orders' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
                  </div>
                  
                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-gray-500 text-lg mb-2">No orders yet</p>
                      <p className="text-gray-400">Your orders will appear here once you place them.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">Order #{order.order_number}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg text-gray-800">
                                {order.currency === 'INR' ? '₹' : order.currency} {order.total_amount.toFixed(2)}
                              </p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                            <ul className="space-y-2">
                              {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {order.currency === 'INR' ? '₹' : order.currency} {item.total_price.toFixed(2)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {order.shipping_address && (
                            <div className="border-t border-gray-200 pt-4 mt-4">
                              <h4 className="font-medium text-gray-700 mb-2">Shipping Address:</h4>
                              <p className="text-sm text-gray-600">{order.shipping_address}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : activeSection === 'addresses' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Addresses</h2>
                  </div>
                  
                  {loadingAddresses ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading addresses...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg mb-2">No addresses saved</p>
                      <p className="text-gray-400">Your addresses will appear here after you place an order.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.map((address, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              address.type === 'shipping' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {address.type.toUpperCase()}
                            </span>
                            {address.order_number && (
                              <span className="text-xs text-gray-500">Order #{address.order_number}</span>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed">{address.address}</p>
                          {address.created_at && (
                            <p className="text-xs text-gray-400 mt-3">
                              Used on {new Date(address.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : activeSection === 'downloads' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Downloads</h2>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No downloads available yet.</p>
                  </div>
                </>
              ) : activeSection === 'points' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Reward Points</h2>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reward points yet.</p>
                  </div>
                </>
              ) : activeSection === 'coupons' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">My Coupons</h2>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No coupons available yet.</p>
                  </div>
                </>
              ) : activeSection === 'change-password' ? (
                <>
                  {/* Change Password Heading */}
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4 4-4-4 4-4 .257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="mb-8">
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordError('');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError('');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder="Enter your new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordError('');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder="Confirm Password"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{passwordError}</p>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{passwordSuccess}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-green-800 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-900 transition"
                    >
                      Update Password
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Account Heading */}
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800">Account</h2>
                  </div>

                  {/* Account Form */}
                  <form onSubmit={handleUpdateAccount} className="mb-8">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-green-800 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-900 transition"
                >
                  Update Account
                </button>
              </form>

                  {/* Welcome Message */}
                  <div className="mb-6">
                    <p className="text-gray-700">
                      Hello <strong>{user?.full_name || user?.name || `${firstName} ${lastName}`.trim() || 'Valued Customer'}</strong>{' '}
                      <span className="text-gray-500">
                        (not {user?.full_name || user?.name || `${firstName} ${lastName}`.trim() || 'you'}?{' '}
                        <button type="button" onClick={handleLogout} className="text-green-800 hover:underline">
                          Log out
                        </button>
                        )
                      </span>
                    </p>
                  </div>

                  {/* Dashboard Description */}
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      From your account dashboard you can view your{' '}
                      <Link to="#" className="text-green-800 hover:underline font-medium">
                        recent orders
                      </Link>
                      , manage your{' '}
                      <Link to="#" className="text-green-800 hover:underline font-medium">
                        shipping and billing addresses
                      </Link>
                      , and{' '}
                      <button 
                        type="button"
                        onClick={() => setActiveSection('change-password')}
                        className="text-green-800 hover:underline font-medium"
                      >
                        edit your password and account details
                      </button>
                      .
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default Account;

