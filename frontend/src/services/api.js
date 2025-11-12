import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

