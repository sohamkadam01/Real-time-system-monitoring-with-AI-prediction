import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      // Update user data from response
      const userFromResponse = {
        id: data.userId || data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        ...data
      };
      setUser(userFromResponse);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err };
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const data = await authService.login(credentials);
      
      // Extract user data from response
      const userData = {
        id: data.userId || data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        token: data.token,
        ...data
      };
      
      setUser(userData);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  const isAdmin = () => {
    return authService.isAdmin();
  };

  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  const refreshUserData = async () => {
    try {
      const updatedUser = await authService.refreshUserData();
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getCurrentUser,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};