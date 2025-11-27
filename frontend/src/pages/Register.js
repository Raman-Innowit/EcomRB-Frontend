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
    // Store all registration data in user object
    login({ 
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobile: formData.mobile,
      name: `${formData.firstName} ${formData.lastName}`
    });
    navigate('/account');
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background with blurred capsules image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/assets/why-us-1.png)',
            filter: 'blur(8px)',
            transform: 'scale(1.1)',
            opacity: 1
          }}
        ></div>
        <div className="absolute inset-0 bg-white/60"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl md:text-4xl font-bold"
              style={{ 
                color: '#2d6a1f',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Become a Member of the Herbal Revolution
            </h1>
          </div>

          {/* Form and Image Container - Side by Side */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Left Side - Registration Form */}
            <div className="flex-1 w-full max-w-[500px]">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
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
            </div>

            {/* Right Side - Leaf Cutout with Image Inside */}
            <div 
              className="relative w-full lg:w-[500px] h-[400px] lg:h-[500px] flex-shrink-0"
              style={{
                backgroundImage: 'url(/assets/why-us-1.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Semi-transparent whitish overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(2px)'
                }}
              >
                {/* Leaf cutout - transparent where leaf is */}
                <div 
                  className="absolute inset-0"
                  style={{
                    maskImage: 'url(/assets/why-us-1.png)',
                    WebkitMaskImage: 'url(/assets/why-us-1.png)',
                    maskSize: 'cover',
                    WebkitMaskSize: 'cover',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    mixBlendMode: 'destination-out'
                  }}
                ></div>
              </div>
              
              {/* Second image - visible only through leaf-shaped cutout */}
              <div 
                className="absolute inset-0"
                style={{
                  maskImage: 'url(/assets/why-us-1.png)',
                  WebkitMaskImage: 'url(/assets/why-us-1.png)',
                  maskSize: 'cover',
                  WebkitMaskSize: 'cover',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  zIndex: 10
                }}
              >
                <img 
                  src="/assets/1-1.png" 
                  alt="Capsules background" 
                  className="w-full h-full object-cover"
                />
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
