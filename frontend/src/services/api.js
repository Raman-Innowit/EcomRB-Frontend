import axios from 'axios';

const getDefaultApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // When running the CRA dev server on port 3000 we usually run the API on 5000.
    if (port === '3000') {
      return `${protocol}//${hostname}:5000/api`;
    }

    const normalizedPort = port ? `:${port}` : '';
    return `${protocol}//${hostname}${normalizedPort}/api`;
  }

  // Fallback for non-browser environments (tests, SSR, etc.)
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
      console.error('[API] Make sure the backend server is running on port 5000');
      console.error(`[API] Expected URL: ${api.defaults.baseURL}`);
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

