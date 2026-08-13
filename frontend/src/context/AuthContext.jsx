import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
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

  const attachInterceptors = (instance) => {
    const reqInterceptor = instance.interceptors.request.use((config) => {
      const token = csrfToken;
      if (token && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
        config.headers['X-CSRF-Token'] = token;
      }
      return config;
    });

    const resInterceptor = instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        const isProfileCheck = original.url?.includes('/api/auth/profile');
        const isRefresh = original.url?.includes('/api/auth/refresh');
        const isLogin = original.url?.includes('/api/auth/login');

        if (
          error.response?.status === 401 &&
          !original._retry &&
          !isRefresh &&
          !isLogin &&
          !isProfileCheck
        ) {
          original._retry = true;
          try {
            const { data } = await instance.post('/api/auth/refresh');
            setCsrfToken(data.csrfToken);
            return instance(original);
          } catch {
            setUser(null);
            setCsrfToken(null);
            const currentPath = window.location.pathname;
            const protectedPaths = ['/dashboard', '/admin', '/create-content', '/my-content', '/my-submissions'];
            const isProtected = protectedPaths.some(p => currentPath.startsWith(p));
            if (isProtected) {
              message.warning('Session expired. Please login again.');
              navigate('/login', { replace: true });
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return { reqInterceptor, resInterceptor };
  };

  useEffect(() => {
    const global = attachInterceptors(axios);
    const local = attachInterceptors(api);

    return () => {
      axios.interceptors.request.eject(global.reqInterceptor);
      axios.interceptors.response.eject(global.resInterceptor);
      api.interceptors.request.eject(local.reqInterceptor);
      api.interceptors.response.eject(local.resInterceptor);
    };
  }, [csrfToken, navigate]);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const { data } = await api.post('/api/auth/refresh');
          setCsrfToken(data.csrfToken);
          const response = await api.get('/api/auth/profile');
          setUser(response.data.user);
          return;
        } catch {
          setUser(null);
          setCsrfToken(null);
        }
      } else {
        console.error('Fetch user error:', error);
        setUser(null);
      }
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCsrfToken(null);
      message.success('Logged out successfully');
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

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return false;
  };

  const hasAnyPermission = (permissionNames) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissionNames.some(perm => hasPermission(perm));
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
    isAdmin: user?.role === 'admin',
    hasPermission,
    hasAnyPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
