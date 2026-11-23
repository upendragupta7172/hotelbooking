import React from 'react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { formatPrice } from '../../data/hotels';
import { getBookingPrice } from '../../utils/booking';

const formatDate = (value) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Choose dates';

const BookingSummary = ({ hotel, room, guestInfo = {}, searchParams = {}, compact = false, couponCode = '', couponDiscount = 0 }) => {
  const { nights, roomCount, subtotal, taxes, total } = getBookingPrice(room, searchParams);
  const discount = Math.min(Math.max(0, Number(couponDiscount) || 0), total);

  return (
    <aside className={`booking-summary ${compact ? 'booking-summary-compact' : ''}`}>
      {!compact && <img className="summary-image" src={room?.image || hotel?.image} alt={room?.name || hotel?.name} />}
      <div className="summary-content">
        <p className="eyebrow">YOUR STAY</p>
        <h2>{hotel?.name || 'Choose a hotel'}</h2>
        {hotel && <p className="summary-location"><MapPin size={14} /> {hotel.location}</p>}
        {room && <div className="summary-room">{room.name}{room.size && <> <span>·</span> {room.size}</>}{room.packageName && <><br /><span>Rate package: {room.packageName}</span></>}</div>}
        <div className="summary-facts">
          <span><CalendarDays size={14} /> {formatDate(searchParams.checkIn)}</span>
          <span><CalendarDays size={14} /> {formatDate(searchParams.checkOut)}</span>
          <span><Users size={14} /> {searchParams.adults || searchParams.guests || 2} guests · {roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span>
        </div>
        {guestInfo.name && <p className="summary-guest">Guest: {guestInfo.name}</p>}
        {room && (
          <div className="summary-pricing">
            <div><span>{formatPrice(room.price)} × {nights} {nights === 1 ? 'night' : 'nights'} × {roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span><strong>{formatPrice(subtotal)}</strong></div>
            <div><span>Taxes & service (12%)</span><strong>{formatPrice(taxes)}</strong></div>
            {couponCode && discount > 0 && <div className="summary-coupon-discount"><span>Coupon · {couponCode}</span><strong>− {formatPrice(discount)}</strong></div>}
            <div className="summary-total"><span>Total payable</span><strong>{formatPrice(total - discount)}</strong></div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default BookingSummary;
