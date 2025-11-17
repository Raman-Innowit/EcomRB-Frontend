import React, { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(undefined);

const getInitialWishlist = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('wishlist');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse wishlist from storage', error);
      }
    }
  }
  return [];
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(getInitialWishlist);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  const isInWishlist = (productId) => wishlistItems.some((item) => item.id === productId);

  const addToWishlist = (product) => {
    setWishlistItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const toggleWishlist = (product) => {
    setWishlistItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const clearWishlist = () => setWishlistItems([]);

  const getWishlistCount = () => wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
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


