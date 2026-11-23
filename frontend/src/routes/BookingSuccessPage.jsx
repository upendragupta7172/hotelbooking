import React, { useContext } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays, MapPin, Users } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/hotels';
import SiteLayout from '../components/common/SiteLayout';

const formatDate = (date) => date
  ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  : 'Flexible dates';

function BookingSuccessPage() {
  const { bookingId } = useParams();
  const { bookings } = useContext(BookingContext);
  const location = useLocation();
  const booking = location.state?.booking || bookings.find((item) => item.id === bookingId);

  return (
    <SiteLayout>
      <main className="success-page">
        <section className="success-card">
          <span className="success-icon"><BadgeCheck size={34} /></span>
          <p className="eyebrow">{booking?.status === 'Pending' ? 'PAYMENT RECEIVED · CONFIRMATION PENDING' : 'YOUR NEXT CHAPTER IS BOOKED'}</p>
          <h1>It’s a date.<br /><em>We’ll be ready.</em></h1>
          <p className="success-intro">{booking?.status === 'Pending' ? 'Your payment is secure. The hotel will review and confirm your reservation shortly.' : 'Your reservation is confirmed and saved.'}</p>
          {booking ? (
            <div className="success-booking-details">
              <img src={booking.hotelImage || booking.roomImage} alt={booking.hotelName} />
              <div className="success-booking-copy">
                <p className="eyebrow">REFERENCE {booking.reference}</p>
                <h2>{booking.hotelName}</h2>
                <p><MapPin size={14} /> {booking.hotelLocation}</p>
                <p><CalendarDays size={14} /> {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p>
                <p><Users size={14} /> {booking.guests} guests · {booking.rooms} {booking.rooms === 1 ? 'room' : 'rooms'} · {booking.roomName}</p>
                <strong>Total {formatPrice(booking.total)}</strong>
                <small>{booking.paymentMethod === 'hotel' ? 'Payment due at the hotel during check-in.' : `Online payment received securely through Razorpay.${booking.status === 'Pending' ? ' Confirmation is awaiting hotel review.' : ''}`}</small>
              </div>
            </div>
          ) : (
            <div className="success-missing"><p>That booking may be on another device or has been removed.</p><Link to="/my-bookings">View my bookings <ArrowRight size={14} /></Link></div>
          )}
          <div className="success-actions">
            <Link className="button button-primary" to="/my-bookings">View my bookings <ArrowRight size={15} /></Link>
            <Link className="button button-outline" to="/hotels">Explore more stays</Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default BookingSuccessPage;
