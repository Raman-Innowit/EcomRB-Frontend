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
});

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

