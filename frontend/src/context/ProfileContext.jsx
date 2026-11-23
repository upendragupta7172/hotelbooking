// src/context/ProfileContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { token, user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    if (!token || user?.role !== 'customer' || !localStorage.getItem('token')) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get('/api/profile/me');
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const data = await api.put('/api/profile/me', updates);
      setProfile(data);
      await refreshUser();
      return data;
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    const result = await api.put('/api/profile/password', { currentPassword, newPassword });
    return result;
  };

  useEffect(() => {
    if (token && user?.role === 'customer') loadProfile();
    else setProfile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  return (
    <ProfileContext.Provider value={{ profile, loading, loadProfile, updateProfile, updatePassword }}>
      {children}
    </ProfileContext.Provider>
  );
};
