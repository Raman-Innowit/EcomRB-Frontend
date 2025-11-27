import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CloneFooter from '../components/CloneFooter';

const Account = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('account-details');
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || 'Guest');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ')[1] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    // Sync form fields with user data when component loads or user changes
    if (user) {
      setFirstName(user.firstName || user?.name?.split(' ')[0] || 'Guest');
      setLastName(user.lastName || user?.name?.split(' ')[1] || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
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
              <h3 className="font-semibold text-gray-800">{user?.name || `${firstName} ${lastName}`.trim() || 'Guest User'}</h3>
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
              {/* Change Password Section */}
              {activeSection === 'change-password' ? (
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
                      Hello <strong>{user?.name || `${firstName} ${lastName}`.trim() || 'Valued Customer'}</strong>{' '}
                      <span className="text-gray-500">
                        (not {user?.name || `${firstName} ${lastName}`.trim() || 'you'}?{' '}
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

