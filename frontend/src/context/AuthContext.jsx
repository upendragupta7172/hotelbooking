// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api'; // wrapper around axios with baseURL & token header handling

// 1️⃣ Create the context
export const AuthContext = createContext(null);

// 2️⃣ Provider component – manages JWT token and user info
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // decoded user object (id, name, role, etc.)
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to persist token & user in localStorage so session survives refreshes
  const persistAuth = (jwt, userData) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  // 3️⃣ Load stored user on initial mount (if token exists)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn('Corrupt user data in localStorage – clearing');
        logout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const clearInvalidSession = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', clearInvalidSession);
    return () => window.removeEventListener('auth:unauthorized', clearInvalidSession);
  }, []);

  // 4️⃣ Generic login (for future use)
  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    persistAuth(data.token, data.user);
    return data;
  };

  // 5️⃣ Generic register (for future use)
  const register = async (name, email, password, phone = '') => {
    const data = await api.post('/api/auth/register', { name, email, password, phone });
    persistAuth(data.token, data.user);
    return data;
  };

  // 6️⃣ Admin login (single admin)
  const adminLogin = async (email, password) => {
    const data = await api.post('/api/admin/login', { email, password });
    persistAuth(data.token, data.user);
    return data;
  };

  // 7️⃣ Admin register (only if none exists)
  const adminRegister = async (email, password) => {
    const data = await api.post('/api/admin/register', { email, password });
    persistAuth(data.token, data.user);
    return data;
  };

  // 6️⃣ Logout – clear everything
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // 7️⃣ Refresh user data from backend (useful after profile update)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await api.get('/api/profile/me'); // profile endpoint returns the latest user info
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    adminLogin,
    adminRegister,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// 8️⃣ Convenience hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
