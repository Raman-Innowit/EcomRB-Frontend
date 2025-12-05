import React, { createContext, useContext, useEffect, useState } from 'react';
import { getWishlist as apiGetWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(undefined);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load wishlist from backend when user is logged in
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setWishlistItems([]);
        return;
      }

      try {
        setLoading(true);
        const response = await apiGetWishlist();
        if (response?.success) {
          const products = (response.wishlist || []).map(item => ({
            id: item.product_id,
            name: item.product_name,
            slug: item.product_slug,
            price: item.base_price,
            salePrice: item.sale_price,
            image_url: item.image_url,
            thumbnail_url: item.image_url,
          }));
          setWishlistItems(products);
        } else {
          console.error('[WishlistContext] Failed to load wishlist from API', response);
        }
      } catch (error) {
        console.error('[WishlistContext] Error loading wishlist from API', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId) => wishlistItems.some((item) => item.id === productId);

  const addToWishlist = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to add items to your wishlist.');
      return;
    }

    try {
      console.log('[WishlistContext] Adding to wishlist, product id:', product.id);
      const response = await apiAddToWishlist(product.id);
      console.log('[WishlistContext] Add to wishlist response:', response);
      setWishlistItems((prev) => {
        if (prev.some((item) => item.id === product.id)) {
          return prev;
        }
        return [...prev, product];
      });
    } catch (error) {
      console.error('[WishlistContext] Failed to add to wishlist', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      alert(serverMsg || 'Failed to add item to wishlist. Please try again.');
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await apiRemoveFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      console.error('[WishlistContext] Failed to remove from wishlist', error);
      alert('Failed to remove item from wishlist. Please try again.');
    }
  };

  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const clearWishlist = async () => {
    // Optional: could add a backend endpoint to clear all, for now remove one by one
    const current = [...wishlistItems];
    for (const item of current) {
      // Fire and forget; local state will be cleared below
      apiRemoveFromWishlist(item.id).catch(() => {});
    }
    setWishlistItems([]);
  };

  const getWishlistCount = () => wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        isInWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

