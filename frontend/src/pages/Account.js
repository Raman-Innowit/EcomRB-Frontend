import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Account = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || 'Guest');
  const [lastName, setLastName] = useState(user?.name?.split(' ')[1] || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    // Handle account update
    console.log('Updating account:', { firstName, lastName });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <h3 className="font-semibold text-gray-800">Dr Monisha Singhal</h3>
            </div>

            {/* Account and Change Password Box */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-200 rounded px-2">
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
              <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-200 rounded px-2 mt-2">
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
              onClick={() => setActiveSection('dashboard')}
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
              {/* Account Heading */}
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800">Account</h2>
              </div>

              {/* Account Form */}
              <form onSubmit={handleUpdateAccount} className="mb-8">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
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
                  Hello <strong>{user?.name || 'Valued Customer'}</strong>{' '}
                  <span className="text-gray-500">
                    (not Dr Monisha Singhal?{' '}
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
                  <Link to="#" className="text-green-800 hover:underline font-medium">
                    edit your password and account details
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

