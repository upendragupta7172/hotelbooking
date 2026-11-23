// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminAuth.css'; // optional premium styling

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin(email, password);
      navigate('/admin'); // go to dashboard after successful login
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <h2 className="admin-auth-title">Admin Login</h2>
      <form className="admin-auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p className="admin-auth-switch">
        No admin account?{' '}
        <Link to="/admin/register">Create one</Link>
      </p>
    </div>
  );
};

export default AdminLogin;
