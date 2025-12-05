import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart as apiGetCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, removeFromCartByProduct as apiRemoveFromCartByProduct, clearCart as apiClearCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart from backend when user is logged in
  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated) {
        // Fallback to localStorage for non-authenticated users
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('cart');
          setCartItems(saved ? JSON.parse(saved) : []);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await apiGetCart();
        if (response?.success) {
          // Transform API response to match frontend format
          const items = (response.cart || []).map(item => ({
            id: item.id, // cart item id
            productId: item.product_id,
            name: item.product_name,
            slug: item.product_slug,
            price: item.base_price,
            salePrice: item.sale_price,
            quantity: item.quantity,
            image_url: item.image_url,
            thumbnail_url: item.image_url,
          }));
          setCartItems(items);
        } else {
          console.error('[CartContext] Failed to load cart from API', response);
        }
      } catch (error) {
        console.error('[CartContext] Error loading cart from API', error);
        // Fallback to localStorage on error
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('cart');
          setCartItems(saved ? JSON.parse(saved) : []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

  // Sync to localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const addToCart = async (item) => {
    if (!isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
        return [...prev, item];
      });
      return;
    }

    try {
      console.log('[CartContext] Adding to cart, product id:', item.productId);
      const response = await apiAddToCart(item.productId, item.quantity || 1);
      console.log('[CartContext] Add to cart response:', response);
      
      // Refresh cart from backend
      const cartResponse = await apiGetCart();
      if (cartResponse?.success) {
        const items = (cartResponse.cart || []).map(cartItem => ({
          id: cartItem.id,
          productId: cartItem.product_id,
          name: cartItem.product_name,
          slug: cartItem.product_slug,
          price: cartItem.base_price,
          salePrice: cartItem.sale_price,
          quantity: cartItem.quantity,
          image_url: cartItem.image_url,
          thumbnail_url: cartItem.image_url,
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error('[CartContext] Failed to add to cart', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      alert(serverMsg || 'Failed to add item to cart. Please try again.');
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      setCartItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    try {
      console.log('[CartContext] Removing product from cart, productId:', productId);
      
      // Try using product_id endpoint first (more reliable)
      await apiRemoveFromCartByProduct(productId);
      
      // Refresh cart from backend
      const cartResponse = await apiGetCart();
      if (cartResponse?.success) {
        const items = (cartResponse.cart || []).map(item => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          price: item.base_price,
          salePrice: item.sale_price,
          quantity: item.quantity,
          image_url: item.image_url,
          thumbnail_url: item.image_url,
        }));
        setCartItems(items);
        console.log('[CartContext] Cart updated successfully');
      }
    } catch (error) {
      console.error('[CartContext] Failed to remove from cart', error);
      console.error('[CartContext] Error details:', error.response?.data || error.message);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      alert(serverMsg || 'Failed to remove item from cart. Please try again.');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (!isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
      return;
    }

    try {
      // Find cart item by productId to get cart_id
      const cartItem = cartItems.find(item => item.productId === productId);
      if (!cartItem || !cartItem.id) {
        console.error('[CartContext] Cart item not found for productId:', productId);
        return;
      }

      await apiUpdateCartItem(cartItem.id, quantity);
      
      // Refresh cart from backend
      const cartResponse = await apiGetCart();
      if (cartResponse?.success) {
        const items = (cartResponse.cart || []).map(item => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          price: item.base_price,
          salePrice: item.sale_price,
          quantity: item.quantity,
          image_url: item.image_url,
          thumbnail_url: item.image_url,
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error('[CartContext] Failed to update cart quantity', error);
      alert('Failed to update cart quantity. Please try again.');
    }
  };

  const clearCart = async () => {
    // Always clear local state immediately
    setCartItems([]);
    
    if (!isAuthenticated) {
      // For non-authenticated users, just clear localStorage
      return;
    }

    // Try to clear backend cart, but don't show errors to user
    try {
      console.log('[CartContext] Clearing cart in backend...');
      await apiClearCart();
      console.log('[CartContext] Backend cart cleared successfully');
    } catch (error) {
      console.error('[CartContext] Backend cart clear failed (silent):', error);
      // Silent failure - local cart is already cleared, that's enough for UX
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
