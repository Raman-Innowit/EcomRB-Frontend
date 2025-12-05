import axios from 'axios';

const getApiBaseUrl = (service = 'default') => {
  // In local development, ALWAYS talk to the Flask backend on port 8800.
  // This must come first so any old REACT_APP_API_URL pointing to port 5000
  // (or another backend) does NOT override our local common backend.
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8800/api';
  }

  // For non‑development environments, fall back to the original
  // environment‑driven behaviour so deployments can still configure
  // their own API URLs.
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
 
  /**
   * For service‑specific APIs (if ever needed), allow overriding via
   * REACT_APP_<SERVICE>_API_URL in non‑development environments.
   */
  const serviceUrl = process.env[`REACT_APP_${service.toUpperCase()}_API_URL`];
  if (serviceUrl) {
    return serviceUrl;
  }

  // Fall back to main API URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // No fallback - require environment variable for external API
  throw new Error(
    'REACT_APP_API_URL environment variable is required. ' +
    'Please create a .env file in the frontend directory and set: ' +
    'REACT_APP_API_URL=https://your-external-api-url.com/api\n' +
    'See frontend/EXTERNAL_API_SETUP.md for configuration instructions.'
  );
};

/**
 * Get API endpoint path from environment variables or use default
 * Allows customization of endpoint paths for different API structures
 */
const getEndpointPath = (defaultPath, envKey) => {
  const customPath = process.env[envKey];
  return customPath || defaultPath;
};

/**
 * Get API timeout from environment variables
 */
const getApiTimeout = () => {
  const timeout = process.env.REACT_APP_API_TIMEOUT;
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Default timeout: 60 seconds (increased for slower connections)
  return 60000;
};

/**
 * Create axios instance with base configuration
 */
const createApiInstance = (baseURL) => {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: getApiTimeout(),
    withCredentials: false, // Don't send credentials for CORS
  });
};

// Simple session id generator for tracking user actions
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  const key = 'rasayanabio_session_id';
  try {
    let existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const newId = `${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, newId);
    return newId;
  } catch {
    return 'unknown_session';
  }
};

// Main API instance (uses default/base URL)
const api = createApiInstance(getApiBaseUrl());

/**
 * Add request interceptor to include JWT token
 */
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('rasayanabio_auth');
        if (authData) {
          const auth = JSON.parse(authData);
          // Check both 'token' and 'access_token' for compatibility
          const token = auth.token || auth.access_token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API] Added JWT token to request:', config.url);
          } else {
            console.warn('[API] No token found in auth data:', auth);
          }
        } else {
          console.warn('[API] No auth data found in localStorage');
        }
      } catch (error) {
        console.error('[API] Error getting token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Add response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Better error logging for network errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Backend connection failed. Is the backend running on port 8800?');
      console.error('Error details:', error);
    }
    return Promise.reject(error);
  }
);

// Public API endpoints
// These functions use environment variables for endpoint paths if configured
// Otherwise, they use the default paths that match the original backend structure

export const getPublicProducts = async (params) => {
  const endpoint = getEndpointPath('/public/products', 'REACT_APP_PRODUCTS_ENDPOINT');
  const apiInstance = createApiInstance(getApiBaseUrl('products'));
  const response = await apiInstance.get(endpoint, { params });
  return response.data;
};

export const getPublicProduct = async (productId) => {
  const baseEndpoint = getEndpointPath('/public/product', 'REACT_APP_PRODUCT_DETAIL_ENDPOINT');
  const apiInstance = createApiInstance(getApiBaseUrl('products'));
  const response = await apiInstance.get(`${baseEndpoint}/${productId}`);
  return response.data;
};

export const getPublicCategories = async () => {
  const endpoint = getEndpointPath('/public/categories', 'REACT_APP_CATEGORIES_ENDPOINT');
  const apiInstance = createApiInstance(getApiBaseUrl('categories'));
  const response = await apiInstance.get(endpoint);
  return response.data;
};

export const getPublicHealthBenefits = async () => {
  const endpoint = getEndpointPath('/public/health-benefits', 'REACT_APP_HEALTH_BENEFITS_ENDPOINT');
  const apiInstance = createApiInstance(getApiBaseUrl('health_benefits'));
  const response = await apiInstance.get(endpoint);
  return response.data;
};

export const createOrder = async (orderData) => {
  const endpoint = getEndpointPath('/public/orders', 'REACT_APP_ORDERS_ENDPOINT');
  const apiInstance = createApiInstance(getApiBaseUrl('orders'));
  const response = await apiInstance.post(endpoint, orderData);
  return response.data;
};

export const registerUser = async (userData) => {
  const endpoint = '/public/register';
  console.log('[DEBUG] Registering user, API base URL:', getApiBaseUrl());
  console.log('[DEBUG] Endpoint:', endpoint);
  console.log('[DEBUG] Full URL will be:', `${getApiBaseUrl()}${endpoint}`);
  console.log('[DEBUG] User data:', userData);
  // Add session_id and page_url for tracking
  const payload = {
    ...userData,
    session_id: getSessionId(),
    page_url: typeof window !== 'undefined' ? window.location.href : null
  };
  // Use the main api instance which already has the correct base URL
  const response = await api.post(endpoint, payload);
  return response.data;
};

export const loginUser = async (credentials) => {
  const endpoint = '/public/login';
  // Add session_id and page_url for tracking
  const payload = {
    ...credentials,
    session_id: getSessionId(),
    page_url: typeof window !== 'undefined' ? window.location.href : null
  };
  const response = await api.post(endpoint, payload);
  return response.data;
};

export const trackUserAction = async ({ actionType, userId, details, pageUrl }) => {
  const endpoint = '/analytics/track-action';
  const apiInstance = createApiInstance(getApiBaseUrl());

  const payload = {
    session_id: getSessionId(),
    user_id: userId || null,
    action_type: actionType,
    action_details: details || null,
    page_url: pageUrl || (typeof window !== 'undefined' ? window.location.href : null),
  };

  try {
    await apiInstance.post(endpoint, payload);
  } catch (error) {
    // Don't block UI if analytics fails
    console.warn('trackUserAction failed:', error?.message || error);
  }
};

export const setPassword = async (passwordData) => {
  const endpoint = '/public/reset-password';
  const apiInstance = createApiInstance(getApiBaseUrl());
  const response = await apiInstance.post(endpoint, passwordData);
  return response.data;
};

export const forgotPassword = async (emailData) => {
  const endpoint = '/public/forgot-password';
  const response = await api.post(endpoint, emailData);
  return response.data;
};

export const getCitiesByState = async (stateName) => {
  const endpoint = '/public/cities';
  const response = await api.get(endpoint, { params: { state: stateName } });
  return response.data;
};

export const getUserOrders = async () => {
  const endpoint = '/public/my-orders';
  const response = await api.get(endpoint);
  return response.data;
};

export const getUserAddresses = async () => {
  const endpoint = '/public/my-addresses';
  const response = await api.get(endpoint);
  return response.data;
};

export const getWishlist = async () => {
  const endpoint = '/public/wishlist';
  const response = await api.get(endpoint);
  return response.data;
};

export const addToWishlist = async (productId) => {
  const endpoint = '/public/wishlist';
  const response = await api.post(endpoint, { product_id: productId });
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const endpoint = `/public/wishlist/${productId}`;
  const response = await api.delete(endpoint);
  return response.data;
};

export const checkWishlist = async (productId) => {
  const endpoint = `/public/wishlist/check/${productId}`;
  const response = await api.get(endpoint);
  return response.data;
};

export const getCart = async () => {
  const endpoint = '/public/cart';
  const response = await api.get(endpoint);
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const endpoint = '/public/cart';
  const response = await api.post(endpoint, { product_id: productId, quantity });
  return response.data;
};

export const updateCartItem = async (cartId, quantity) => {
  const endpoint = `/public/cart/${cartId}`;
  const response = await api.put(endpoint, { quantity });
  return response.data;
};

export const removeFromCart = async (cartId) => {
  const endpoint = `/public/cart/${cartId}`;
  const response = await api.delete(endpoint);
  return response.data;
};

export const removeFromCartByProduct = async (productId) => {
  const endpoint = `/public/cart/product/${productId}`;
  const response = await api.delete(endpoint);
  return response.data;
};

export const clearCart = async () => {
  const endpoint = '/public/cart';
  const response = await api.delete(endpoint);
  return response.data;
};

// Review API functions
export const getProductReviews = async (productId, page = 1, perPage = 10) => {
  const endpoint = `/public/products/${productId}/reviews?page=${page}&per_page=${perPage}`;
  const response = await api.get(endpoint);
  return response.data;
};

export const createProductReview = async (productId, reviewData) => {
  const endpoint = `/public/products/${productId}/reviews`;
  
  // Handle both FormData (for file uploads) and regular objects
  const config = {};
  if (reviewData instanceof FormData) {
    config.headers = {
      'Content-Type': 'multipart/form-data',
    };
  }
  
  const response = await api.post(endpoint, reviewData, config);
  return response.data;
};

export default api;

