import React, { createContext, useEffect, useState } from 'react';
import { getItem, setItem } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const toBookingView = (booking) => {
  const hotel = booking.hotel && typeof booking.hotel === 'object' ? booking.hotel : {};
  const room = booking.room && typeof booking.room === 'object' ? booking.room : {};
  return {
    ...booking,
    id: String(booking._id || booking.id || ''),
    reference: String(booking._id || booking.id || '').slice(-8).toUpperCase(),
    hotelName: hotel.name || booking.hotelName || 'StayNest property',
    hotelLocation: [hotel.city, hotel.country].filter(Boolean).join(', ') || booking.hotelLocation || '',
    hotelImage: hotel.images?.[0] || hotel.image || booking.hotelImage || '',
    roomName: room.type || room.name || booking.roomName || 'Room',
    roomNumber: room.roomNumber || booking.roomNumber || '',
    roomImage: room.images?.[0] || room.image || booking.roomImage || '',
    total: Number(booking.totalPrice ?? booking.total ?? 0),
    roomServiceTotal: Number(booking.roomServiceTotal || 0),
    roomServiceSettledAt: booking.roomServiceSettledAt || null,
    status: ({ booked: 'Confirmed', confirmed: 'Confirmed', pending: 'Pending', 'checked-in': 'Checked-in', 'checked-out': 'Checked-out', cancelled: 'Cancelled', rejected: 'Rejected', 'no-show': 'No-show', completed: 'Completed' })[booking.status] || booking.status,
    paymentMethod: booking.paymentMethod || 'online',
    paymentStatus: booking.paymentStatus || (booking.payment ? 'paid' : 'pending'),
    guestInfo: booking.guestInfo || {},
    checkIn: booking.checkIn ? new Date(booking.checkIn).toISOString().slice(0, 10) : '',
    checkOut: booking.checkOut ? new Date(booking.checkOut).toISOString().slice(0, 10) : '',
    rooms: Number(booking.roomCount || booking.rooms || 1),
    guestCheckout: !booking.user,
  };
};

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const { token, user } = useAuth();
  // State slices (persisted in localStorage for temporary selections)
  const [searchParams, setSearchParams] = useState(() => getItem('searchParams') || {});
  const [selectedHotel, setSelectedHotel] = useState(() => getItem('selectedHotel') || null);
  const [selectedRoom, setSelectedRoom] = useState(() => getItem('selectedRoom') || null);
  const [guestInfo, setGuestInfo] = useState(() => getItem('guestInfo') || {});
  const [bookings, setBookings] = useState([]);

  // Persist temporary selections to localStorage
  useEffect(() => { setItem('searchParams', searchParams); }, [searchParams]);
  useEffect(() => { setItem('selectedHotel', selectedHotel); }, [selectedHotel]);
  useEffect(() => { setItem('selectedRoom', selectedRoom); }, [selectedRoom]);
  useEffect(() => { setItem('guestInfo', guestInfo); }, [guestInfo]);

  // Keep guest bookings locally; authenticated bookings are refreshed from the API.
  useEffect(() => {
    if (!token || user?.role !== 'customer') { setBookings([]); return; }
    let active = true;
    const fetchBookings = async () => {
      try {
        const data = await api.get('/api/bookings');
        if (active) setBookings(data.map(toBookingView));
      } catch (err) {
        if (active) console.error('Failed to load bookings', err);
      }
    };
    fetchBookings();
    const refreshInterval = window.setInterval(fetchBookings, 60000);
    return () => { active = false; window.clearInterval(refreshInterval); };
  }, [token, user?.role]);

  // Actions
  const updateSearch = (params) => setSearchParams(params);
  const selectHotel = (hotel) => setSelectedHotel(hotel);
  const selectRoom = (room) => setSelectedRoom(room);
  const updateGuestInfo = (info) => setGuestInfo(info);

  // Create a booking via backend
  const addBooking = async (extra = {}) => {
    if (!selectedHotel || !selectedRoom) return null;
    const payload = {
      roomId: selectedRoom._id || selectedRoom.id,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: Number(searchParams.adults || searchParams.guests) || 1,
      rooms: Number(searchParams.rooms) || 1,
      packageId: selectedRoom.packageId || undefined,
      guestInfo,
      ...extra,
    };
    try {
      const response = await api.post('/api/bookings/pay-at-hotel', payload);
      const newBooking = toBookingView(response.booking);
      setBookings((prev) => [newBooking, ...prev.filter((item) => item.id !== newBooking.id)]);
      return newBooking;
    } catch (err) {
      console.error('Booking creation failed', err);
      throw err;
    }
  };

  const saveBooking = (booking) => {
    const newBooking = toBookingView(booking);
    setBookings((prev) => [newBooking, ...prev.filter((item) => item.id !== newBooking.id)]);
    return newBooking;
  };

  // Cancel a booking via backend
  const cancelBooking = async (bookingId) => {
    try {
      const updated = await api.put(`/api/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: 'Cancelled' } : b))
      );
      return updated;
    } catch (err) {
      console.error('Cancel booking failed', err);
      throw err;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        searchParams,
        updateSearch,
        selectedHotel,
        selectHotel,
        selectedRoom,
        selectRoom,
        guestInfo,
        updateGuestInfo,
        bookings,
        addBooking,
        saveBooking,
        cancelBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
