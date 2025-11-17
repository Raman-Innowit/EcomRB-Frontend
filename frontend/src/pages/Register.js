import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CloneFooter from '../components/CloneFooter';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    login({ email: formData.email });
    navigate('/account');
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background with white overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#f3f8ef]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* White Card Container */}
          <div className="bg-white rounded-[32px] shadow-xl overflow-hidden">
            {/* Heading inside the card */}
            <div className="text-center py-8 px-8">
              <h1 
                className="text-4xl md:text-5xl font-bold"
                style={{ 
                  color: '#2d6a1f',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Become a Member of the Herbal Revolution
              </h1>
            </div>

            {/* Form and Image Container - Side by Side */}
            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Registration Form */}
              <div className="flex-1 p-8 lg:p-12 flex items-center justify-center">
                <form onSubmit={handleSubmit} className="w-full max-w-[380px] space-y-5">
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full px-4 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 placeholder-gray-400"
                      style={{
                        height: '46px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full px-4 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 placeholder-gray-400"
                      style={{
                        height: '46px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="E-mail Address"
                      className="w-full px-4 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 placeholder-gray-400"
                      style={{
                        height: '46px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Mobile Number"
                      className="w-full px-4 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 placeholder-gray-400"
                      style={{
                        height: '46px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  
                  {/* Buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="flex-1 font-bold text-white transition hover:opacity-90"
                      style={{
                        background: '#0c6a1f',
                        padding: '12px 32px',
                        borderRadius: '6px'
                      }}
                    >
                      REGISTER
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="flex-1 font-bold transition hover:opacity-90"
                      style={{
                        background: '#e8e8e8',
                        color: '#666',
                        padding: '12px 32px',
                        borderRadius: '6px'
                      }}
                    >
                      LOGIN
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side - Curved Green Leaf Structure */}
              <div className="relative w-full lg:w-[500px] h-[450px] lg:h-[500px] flex-shrink-0">
                {/* Leaf structure with smooth curved left edge and green ombre gradient */}
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    clipPath: 'polygon(15% 0%, 5% 50%, 15% 100%, 100% 100%, 100% 0%)',
                    background: 'linear-gradient(135deg, #15803d 0%, #1a8a45 15%, #21944d 30%, #2a9e55 45%, #35a85d 60%, #40b265 75%, #4db870 90%, #5ac97b 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: '0 32px 32px 0'
                  }}
                >
                  {/* RasayanaBio Logo - Centered in white */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <img 
                      src="/assets/rb.png" 
                      alt="RasayanaBio" 
                      className="h-24 md:h-32 w-auto object-contain"
                      style={{ 
                        filter: 'brightness(0) invert(1)',
                        opacity: 1
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <CloneFooter />
      </div>
    </div>
  );
};

export default Register;
