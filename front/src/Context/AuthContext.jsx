'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount and when URL changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { withCredentials: true }
        );
        
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (error) {
        console.log('Not authenticated');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for URL changes (for when user is redirected back after Google auth)
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/dashboard' && !user) {
        const checkAuth = async () => {
          try {
            const res = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
              { withCredentials: true }
            );
            
            if (res.data.success) {
              setUser(res.data.user);
            }
          } catch (error) {
            console.log('Auth check failed after route change');
          }
        };
        
        checkAuth();
      }
    };

    // Run once on mount to check if we're already on dashboard
    handleRouteChange();
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [user]);

  const logout = async () => {
    try {
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
        { withCredentials: true }
      );
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};