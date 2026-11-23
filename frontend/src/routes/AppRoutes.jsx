// src/routes/AppRoutes.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import AboutPage from './AboutPage';
import BookingPage from './BookingPage';
import BookingSuccessPage from './BookingSuccessPage';
import CheckoutPage from './CheckoutPage';
import ContactPage from './ContactPage';
import HotelDetailsPage from './HotelDetailsPage';
import HotelsPage from './HotelsPage';
import HomePage from './HomePage';
import MyBookingsPage from './MyBookingsPage';
import NotFoundPage from './NotFoundPage';
import AdminDashboard from '../pages/AdminDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import AdminLogin from '../pages/AdminLogin';
import AdminRegister from '../pages/AdminRegister';
import AccountAuth from '../pages/AccountAuth';
import RoomsPage from '../pages/RoomsPage';
import DiningPage from '../pages/DiningPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

const AppRoutes = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/hotels" element={<HotelsPage />} />
      <Route path="/hotels/:hotelId" element={<HotelDetailsPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/dining" element={<DiningPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/checkout" element={<CheckoutPage />} />
      <Route path="/booking/success/:bookingId" element={<BookingSuccessPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/account/login" element={<AccountAuth mode="login" />} />
      <Route path="/account/register" element={<AccountAuth mode="register" />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute customer><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
