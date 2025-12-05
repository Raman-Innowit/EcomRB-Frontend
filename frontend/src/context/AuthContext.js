import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(undefined);

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null, token: null };
  }
  try {
    const stored = JSON.parse(localStorage.getItem('rasayanabio_auth') || '{}');
    return {
      isAuthenticated: Boolean(stored.isAuthenticated),
      user: stored.user || null,
      token: stored.token || null,
    };
  } catch (error) {
    console.warn('Failed to parse auth state', error);
    return { isAuthenticated: false, user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ isAuthenticated, user, token }, setAuthState] = useState(getInitialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'rasayanabio_auth',
        JSON.stringify({ isAuthenticated, user, token }),
      );
    }
  }, [isAuthenticated, user, token]);

  const login = ({ user: userData, token: accessToken }) => {
    setAuthState({
      isAuthenticated: true,
      user: userData || { name: 'Guest' },
      token: accessToken || null,
    });
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};








