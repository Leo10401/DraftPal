'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Function to get stored token
  const getStoredToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  // Save token to localStorage
  const saveToken = (newToken) => {
    if (typeof window !== 'undefined' && newToken) {
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
    }
  };

  // Configure axios interceptor for token
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
    }

    // Add token to all requests if available
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const checkAuth = async () => {
    try {
      setError(null);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (res.data.success) {
        setUser(res.data.user);
        // If response includes a token, save it
        if (res.data.token) {
          saveToken(res.data.token);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error?.response?.data || error.message);
      setUser(null);
      setError(error?.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
        { withCredentials: true }
      );
      setUser(null);
      
      // Also clear localStorage token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      setToken(null);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    logout,
    checkAuth // Export checkAuth to allow manual refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};