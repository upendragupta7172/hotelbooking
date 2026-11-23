// context/AdminContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingPages, setBookingPages] = useState(0);
  const [notifications, setNotifications] = useState({ count: 0, bookings: [] });
  const [foodNotifications, setFoodNotifications] = useState({ count: 0, orders: [] });
  const fetchFoodNotifications = async () => { const result = await api.get('/api/admin/food-orders/notifications'); setFoodNotifications(result); return result; };
  const markFoodNotificationsRead = async (ids = []) => { await api.post('/api/admin/food-orders/notifications/read', { ids }); setFoodNotifications((current) => ({ count: ids.length ? Math.max(0, current.count - ids.length) : 0, orders: ids.length ? current.orders.filter((order) => !ids.includes(order._id)) : [] })); };
  const fetchBookings = async (filters = {}) => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
    const result = await api.get(`/api/admin/bookings${params.size ? `?${params}` : ''}`);
    setBookings(result.bookings || []);
    setBookingTotal(result.total || 0);
    setBookingPages(result.pages || 0);
    return result;
  };
  const fetchBooking = async (id) => api.get(`/api/admin/bookings/${id}`);
  const fetchBookingNotifications = async () => {
    const result = await api.get('/api/admin/bookings/notifications');
    setNotifications(result);
    return result;
  };
  const markBookingNotificationsRead = async (ids = []) => {
    await api.post('/api/admin/bookings/notifications/read', { ids });
    setNotifications((current) => ({
      count: ids.length ? Math.max(current.count - ids.length, 0) : 0,
      bookings: ids.length ? current.bookings.filter((booking) => !ids.includes(booking._id)) : [],
    }));
  };
  const updateBookingStatus = async (id, status) => {
    const updated = await api.put(`/api/admin/bookings/${id}/status`, { status });
    setBookings((current) => current.map((booking) => booking._id === id ? updated : booking));
    return updated;
  };
  const modifyBooking = async (id, updates) => {
    const updated = await api.put(`/api/admin/bookings/${id}/modify`, updates);
    setBookings((current) => current.map((booking) => booking._id === id ? updated : booking));
    return updated;
  };
  const assignBookingRoom = async (id, roomId) => {
    const updated = await api.put(`/api/admin/bookings/${id}/assign-room`, { roomId });
    setBookings((current) => current.map((booking) => booking._id === id ? updated : booking));
    return updated;
  };
  const settleRoomServiceBill = async (id) => {
    const updated = await api.put(`/api/admin/bookings/${id}/room-service/settle`, {});
    setBookings((current) => current.map((booking) => booking._id === id ? updated : booking));
    return updated;
  };
  const uploadRoomImage = async (file) => {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
    return api.post('/api/admin/rooms/images', { name: file.name, type: file.type, dataUrl });
  };
  const fetchSummary = async () => {
    const data = await api.get('/api/admin/dashboard/summary');
    setSummary(data);
    return data;
  };
  const fetchRefunds = async () => {
    const data = await api.get('/api/admin/refunds');
    setRefunds(data);
    return data;
  };
  // Hotels
  const [hotels, setHotels] = useState([]);
  const fetchHotels = async () => {
    const data = await api.get('/api/admin/hotels');
    setHotels(data);
  };
  const createHotel = async (hotel) => {
    const newHotel = await api.post('/api/admin/hotels', hotel);
    setHotels((prev) => [...prev, newHotel]);
    await fetchSummary();
    return newHotel;
  };
  const updateHotel = async (id, updates) => {
    const updated = await api.put(`/api/admin/hotels/${id}`, updates);
    setHotels((prev) => prev.map((h) => (h._id === id ? updated : h)));
    await fetchSummary();
    return updated;
  };
  const updateHotelMenu = (id, menu, menuCategories) => setHotels((current) => current.map((hotel) => hotel._id === id ? { ...hotel, menu, menuCategories: menuCategories || hotel.menuCategories || [] } : hotel));
  const deleteHotel = async (id) => {
    await api.delete(`/api/admin/hotels/${id}`);
    setHotels((prev) => prev.filter((h) => h._id !== id));
    await Promise.all([fetchRooms(), fetchSummary()]);
  };

  // Rooms
  const [rooms, setRooms] = useState([]);
  const fetchRooms = async () => {
    const data = await api.get('/api/admin/rooms');
    setRooms(data);
  };
  const createRoom = async (room) => {
    const newRoom = await api.post('/api/admin/rooms', room);
    setRooms((prev) => [...prev, newRoom]);
    await fetchSummary();
    return newRoom;
  };
  const updateRoom = async (id, updates) => {
    const updated = await api.put(`/api/admin/rooms/${id}`, updates);
    setRooms((prev) => prev.map((r) => (r._id === id ? updated : r)));
    await fetchSummary();
    return updated;
  };
  const deleteRoom = async (id) => {
    await api.delete(`/api/admin/rooms/${id}`);
    setRooms((prev) => prev.filter((r) => r._id !== id));
    await fetchSummary();
  };

  // Categories & Amenities (reuse existing admin routes)
  const [categories, setCategories] = useState([]);
  const fetchCategories = async () => {
    const data = await api.get('/api/categories');
    setCategories(data);
  };
  const createCategory = async (cat) => {
    const newCat = await api.post('/api/categories', cat);
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };
  const updateCategory = async (id, upd) => {
    const updated = await api.put(`/api/categories/${id}`, upd);
    setCategories((prev) => prev.map((c) => (c._id === id ? updated : c)));
    return updated;
  };
  const deleteCategory = async (id) => {
    await api.delete(`/api/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  const [amenities, setAmenities] = useState([]);
  const fetchAmenities = async () => {
    const data = await api.get('/api/amenities');
    setAmenities(data);
  };
  const createAmenity = async (amen) => {
    const newAmen = await api.post('/api/amenities', amen);
    setAmenities((prev) => [...prev, newAmen]);
    return newAmen;
  };
  const updateAmenity = async (id, upd) => {
    const updated = await api.put(`/api/amenities/${id}`, upd);
    setAmenities((prev) => prev.map((a) => (a._id === id ? updated : a)));
    return updated;
  };
  const deleteAmenity = async (id) => {
    await api.delete(`/api/amenities/${id}`);
    setAmenities((prev) => prev.filter((a) => a._id !== id));
  };

  useEffect(() => {
    // Reference data is public; admin inventory and reporting require admin access.
    fetchCategories().catch((err) => console.error('Failed to load categories', err));
    fetchAmenities().catch((err) => console.error('Failed to load amenities', err));
    // A legacy admin marker may only contain an email and role. Require the
    // backend-issued user id too, so that marker cannot trigger admin requests.
    if (token && localStorage.getItem('token') === token && user?.role === 'admin' && user?.id) {
      fetchHotels().catch((err) => console.error('Failed to load hotels', err));
      fetchRooms().catch((err) => console.error('Failed to load admin rooms', err));
      fetchSummary().catch((err) => console.error('Failed to load dashboard summary', err));
      fetchRefunds().catch((err) => console.error('Failed to load refund requests', err));
    } else {
      setHotels([]);
      setRooms([]);
      setSummary(null);
      setRefunds([]);
      setBookings([]);
      setBookingTotal(0);
      setBookingPages(0);
      setNotifications({ count: 0, bookings: [] });
      setFoodNotifications({ count: 0, orders: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'admin' || !user?.id) return undefined;
    const refreshNotifications = () => {
      if (localStorage.getItem('token') !== token) return;
      fetchBookingNotifications().catch((err) => console.error('Failed to load booking notifications', err));
      fetchFoodNotifications().catch((err) => console.error('Failed to load room service notifications', err));
    };
    refreshNotifications();
    const interval = window.setInterval(() => {
      if (localStorage.getItem('token') !== token) return;
      fetchBookingNotifications().catch((err) => console.error('Failed to refresh booking notifications', err));
      fetchFoodNotifications().catch((err) => console.error('Failed to refresh room service notifications', err));
    }, 30000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role, user?.id]);

  return (
    <AdminContext.Provider
      value={{
        summary,
        fetchSummary,
        bookings,
        bookingTotal,
        bookingPages,
        fetchBookings,
        fetchBooking,
        updateBookingStatus,
        modifyBooking,
        assignBookingRoom,
        settleRoomServiceBill,
        notifications,
        foodNotifications,
        fetchFoodNotifications,
        markFoodNotificationsRead,
        fetchBookingNotifications,
        markBookingNotificationsRead,
        refunds,
        fetchRefunds,
        uploadRoomImage,
        hotels,
        fetchHotels,
        createHotel,
        updateHotel,
        updateHotelMenu,
        deleteHotel,
        rooms,
        fetchRooms,
        createRoom,
        updateRoom,
        deleteRoom,
        categories,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        amenities,
        fetchAmenities,
        createAmenity,
        updateAmenity,
        deleteAmenity,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
