// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Props: admin (boolean) – if true, only allow users with role 'admin'
export const ProtectedRoute = ({ admin = false, customer = false, children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in – redirect to admin login page
    return <Navigate to={admin ? '/admin/login' : '/account/login'} replace />;
  }

  if (admin && user.role !== 'admin') {
    // Logged in but not admin – redirect to not‑found or home
    return <Navigate to="/not-found" replace />;
  }

  if (customer && user.role !== 'customer') return <Navigate to={user.role === 'admin' ? '/admin' : '/not-found'} replace />;

  // Authorized – render the protected component tree
  return children;
};

export default ProtectedRoute;
