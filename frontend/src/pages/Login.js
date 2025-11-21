import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CloneFooter from '../components/CloneFooter';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }
    setError('');
    login({ email, keepSignedIn });
    navigate('/account');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f8ef]">
      <div className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-[32px] shadow-xl overflow-hidden grid lg:grid-cols-2">
          {/* Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-6" style={{ color: '#15803d' }}>Welcome Back</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Email Address"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Password"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  Keep me signed in
                </label>
                <Link to="/password-reset" className="hover:underline" style={{ color: '#15803d' }}>
                  Forgot your password?
                </Link>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 text-white py-3 rounded-lg font-semibold transition"
                  style={{ backgroundColor: '#15803d' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#166534'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#15803d'}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Register
                </button>
              </div>
            </form>
            <div className="mt-6">
              <button className="w-full border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login with Google
              </button>
            </div>
          </div>

          {/* Illustration */}
          <div 
            className="flex items-center justify-center p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #15803d 0%, #1a8a45 20%, #21944d 40%, #2a9e55 60%, #35a85d 80%, #40b265 100%)'
            }}
          >
            <img 
              src="/assets/login-illustration.png" 
              alt="Rejuvenate Physical and Mental Health" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
      <CloneFooter />
    </div>
  );
};

export default Login;



