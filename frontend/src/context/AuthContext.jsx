import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const navigate = useNavigate();

  // ── Axios interceptors ─────────────────────────────────────────
  useEffect(() => {
    // Attach CSRF token to every mutating request
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = csrfToken;
      if (token && ['post','put','patch','delete'].includes(config.method)) {
        config.headers['X-CSRF-Token'] = token;
      }
      return config;
    });

    // Auto-refresh on 401 — retry once, only redirect if user was logged in
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        // Only attempt refresh if:
        // 1. It's a 401
        // 2. We haven't retried yet
        // 3. It's not the refresh or login endpoint itself
        // 4. It's not the profile check on initial load (user just isn't logged in)
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
            const { data } = await axios.post('/api/auth/refresh');
            setCsrfToken(data.csrfToken);
            return axios(original);
          } catch {
            // Refresh failed — user session expired
            // Only navigate to login if they were on a protected route
            setUser(null);
            setCsrfToken(null);
            const currentPath = window.location.pathname;
            const protectedPaths = ['/dashboard', '/admin', '/create-content', '/my-content', '/my-submissions'];
            const isProtected = protectedPaths.some(p => currentPath.startsWith(p));
            if (isProtected) {
              window.open('/login', '_blank', 'noopener,noreferrer');
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [csrfToken, navigate]);

  useEffect(() => {
    fetchUser();
  }, []);
 
  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
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
      const response = await axios.post('/api/auth/login', { email, password });
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
      const response = await axios.post('/api/auth/register', userData);
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
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCsrfToken(null);
      message.success('Logged out successfully');
      // Navigate to home — if they're on a dashboard route close won't work
      // so just redirect to home in same tab
      navigate('/');
    }
  };
 
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
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
    // For now, admins have all permissions
    if (user.role === 'admin') return true;
    // TODO: Implement actual permission checking from backend
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
 