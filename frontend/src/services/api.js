import axios from 'axios';

const getDefaultApiBaseUrl = () => {
  // REACT_APP_API_URL is required - no hardcoded fallbacks
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // If not set, try to construct from window location and REACT_APP_API_PORT
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const apiPort = process.env.REACT_APP_API_PORT || process.env.REACT_APP_PORT;
    
    if (apiPort) {
      return `${protocol}//${hostname}:${apiPort}/api`;
    }
  }

  // No fallback - require environment variable
  throw new Error(
    'REACT_APP_API_URL environment variable is required. ' +
    'Please set it in your .env file (e.g., REACT_APP_API_URL=http://localhost:5000/api)'
  );
};

const apiTimeout = process.env.REACT_APP_API_TIMEOUT 
  ? parseInt(process.env.REACT_APP_API_TIMEOUT, 10) 
  : (() => {
      throw new Error('REACT_APP_API_TIMEOUT environment variable is required (in milliseconds)');
    })();

const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: apiTimeout,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout - the server took too long to respond');
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('[API] Network error - unable to connect to backend server');
      console.error(`[API] Expected URL: ${api.defaults.baseURL}`);
      console.error('[API] Make sure the backend server is running and REACT_APP_API_URL is set correctly');
    } else if (error.response) {
      // Server responded with error status
      console.error(`[API] Server error ${error.response.status}:`, error.response.data);
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Public API endpoints
export const getPublicProducts = async (params) => {
  const response = await api.get('/public/products', { params });
  return response.data;
};

export const getPublicProduct = async (productId) => {
  const response = await api.get(`/public/product/${productId}`);
  return response.data;
};

export const getPublicCategories = async () => {
  const response = await api.get('/public/categories');
  return response.data;
};

export const getPublicHealthBenefits = async () => {
  const response = await api.get('/public/health-benefits');
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/public/orders', orderData);
  return response.data;
};

export default api;

