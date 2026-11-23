import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, LockKeyhole, UserRound } from 'lucide-react';
import SiteLayout from '../components/common/SiteLayout';
import { useAuth } from '../context/AuthContext';
import './AccountAuth.css';

const AccountAuth = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (isAuthenticated) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      const result = isRegister
        ? await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim())
        : await login(form.email.trim(), form.password);
      navigate(result.user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'We could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <SiteLayout>
    <main className="account-auth-page">
      <section className="account-auth-card">
        <div className="account-auth-visual">
          <div className="account-auth-mark">SN</div>
          <p className="eyebrow">STAYNEST ACCOUNT</p>
          <h1>{isRegister ? <>Make room<br /><em>for a good stay.</em></> : <>Welcome<br /><em>back.</em></>}</h1>
          <p>Keep your bookings and guest details together in one secure place.</p>
          <span className="account-auth-assurance"><BadgeCheck size={16} /> Your account is protected</span>
        </div>
        <div className="account-auth-form-wrap">
          <Link to="/" className="account-back-link"><ArrowLeft size={15} /> Back to StayNest</Link>
          <div className="account-form-heading"><span>{isRegister ? <UserRound size={18} /> : <LockKeyhole size={18} />}</span><div><p className="eyebrow">{isRegister ? 'CREATE AN ACCOUNT' : 'MEMBER SIGN IN'}</p><h2>{isRegister ? 'Join StayNest' : 'Sign in to your account'}</h2></div></div>
          <form className="account-auth-form" onSubmit={submit}>
            {error && <p className="account-auth-error" role="alert">{error}</p>}
            {isRegister && <label>Full name<input name="name" autoComplete="name" value={form.name} onChange={update} required /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={update} required /></label>
            {isRegister && <label>Phone number <span className="account-optional">Optional</span><input name="phone" type="tel" autoComplete="tel" minLength="8" maxLength="20" value={form.phone} onChange={update} /></label>}
            <label>Password<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} value={form.password} onChange={update} required /></label>
            {isRegister && <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" value={form.confirmPassword} onChange={update} required /></label>}
            <button className="account-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
          </form>
          <p className="account-auth-switch">{isRegister ? 'Already have an account?' : 'New to StayNest?'} <Link to={isRegister ? '/account/login' : '/account/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        </div>
      </section>
    </main>
  </SiteLayout>;
};

export default AccountAuth;
