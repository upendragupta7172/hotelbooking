// src/pages/AdminRegister.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminAuth.css"; // optional premium styling

const AdminRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { adminRegister } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await adminRegister(email, password);
      navigate("/admin"); // go to dashboard after registration
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <h2 className="admin-auth-title">Create Admin Account</h2>
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
        <label>
          Confirm Password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Creating…" : "Create Admin"}
        </button>
      </form>
      <p className="admin-auth-switch">
        Already have an admin account? <Link to="/admin/login">Log in</Link>
      </p>
    </div>
  );
};

export default AdminRegister;
