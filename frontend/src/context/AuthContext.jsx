import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Fetch user error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user, csrfToken } = response.data;
      setUser(user);
      setCsrfToken(csrfToken);
      message.success(`Welcome ${user.first_name}!`);
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { user, csrfToken } = response.data;
      setUser(user);
      setCsrfToken(csrfToken);
      message.success('Registration successful!');
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
      setUser(null);
      setCsrfToken(null);
      message.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setCsrfToken(null);
      navigate('/');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh');
      const { csrfToken } = response.data;
      setCsrfToken(csrfToken);
      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      setUser(null);
      setCsrfToken(null);
      return false;
    }
  };

  const value = {
    user,
    loading,
    csrfToken,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};