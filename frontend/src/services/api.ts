import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  sale_price?: number;
  converted_price: number;
  converted_sale_price?: number;
  currency_symbol: string;
  display_currency: string;
  stock_quantity: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  health_benefits?: Array<{
    id: number;
    name: string;
  }>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
}

export interface HealthBenefit {
  id: number;
  name: string;
  description?: string;
}

// Public API endpoints
export const getPublicProducts = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
  health_benefit_id?: number;
  featured?: boolean;
  sort_by?: string;
  sort_order?: string;
  currency?: string;
  country_code?: string;
}) => {
  const response = await api.get('/public/products', { params });
  return response.data;
};

export const getPublicProduct = async (productId: number) => {
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

export default api;

