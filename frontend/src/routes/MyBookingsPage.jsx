import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/hotels';
import SiteLayout from '../components/common/SiteLayout';

const formatDate = (date) => date
  ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Flexible dates';
const today = new Date().toISOString().slice(0, 10);

function MyBookingsPage() {
  const { bookings, cancelBooking } = useContext(BookingContext);
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleCancel = (booking) => {
    if (!['Confirmed', 'Pending'].includes(booking.status) || (booking.checkIn && booking.checkIn <= today)) return;
    if (window.confirm(`Cancel your booking at ${booking.hotelName}?`)) cancelBooking(booking.id);
  };

  return (
    <SiteLayout>
      <main className="bookings-page">
        <div className="page-banner">
          <div className="section-shell">
            <p className="eyebrow">YOUR STAYNEST JOURNEYS</p>
            <h1>Plans worth <em>looking forward to.</em></h1>
            <p>Every stay you’ve booked, all in one place.</p>
          </div>
        </div>
        <div className="section-shell bookings-content">
          {sortedBookings.length ? (
            <div className="booking-history-list">
              {sortedBookings.map((booking) => {
                const canCancel = ['Confirmed', 'Pending'].includes(booking.status) && !booking.guestCheckout && (!booking.checkIn || booking.checkIn > today);
                return (
                  <article className="booking-history-card" key={booking.id}>
                    <img src={booking.hotelImage || booking.roomImage} alt={booking.hotelName} />
                    <div className="booking-history-info">
                      <div className="history-card-heading">
                        <div><p className="eyebrow">BOOKING {booking.reference || booking.id.slice(0, 8).toUpperCase()}</p><h2>{booking.hotelName}</h2></div>
                        <span className={`booking-status status-${String(booking.status).toLowerCase().replace(/\s+/g, '-')}`}>{booking.status}</span>
                      </div>
                      <p className="history-location"><MapPin size={14} /> {booking.hotelLocation}</p>
                      <div className="history-facts">
                        <span><strong>Room</strong>{booking.roomName}</span>
                        <span><strong>Dates</strong><CalendarDays size={13} /> {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                        <span><strong>Guests</strong><Users size={13} /> {booking.guests} guests · {booking.rooms} {booking.rooms === 1 ? 'room' : 'rooms'}</span>
                      </div>
                      <div className="history-card-footer">
                        <span>Total <strong>{formatPrice(booking.total)}</strong> <small>· {booking.paymentMethod === 'hotel' ? 'Pay at hotel · due' : 'Paid online'}</small></span>
                        {canCancel && <button className="cancel-booking" type="button" onClick={() => handleCancel(booking)}>Cancel booking</button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-bookings">
              <span className="empty-bookings-icon"><CalendarDays size={25} /></span>
              <p className="eyebrow">A LITTLE SPACE FOR WHAT’S NEXT</p>
              <h2>No stays booked yet.</h2>
              <p>Your next meaningful escape is waiting to be found.</p>
              <Link className="button button-primary" to="/hotels">Explore stays <ArrowRight size={15} /></Link>
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

export default MyBookingsPage;
