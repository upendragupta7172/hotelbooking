import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Star } from 'lucide-react';
import { BookingContext } from '../../context/BookingContext';
import { formatPrice } from '../../data/hotels';

const HotelCard = ({ hotel, compact = false }) => {
  const { selectHotel, selectRoom } = useContext(BookingContext);
  const navigate = useNavigate();

  const startBooking = () => {
    selectHotel(hotel);
    selectRoom(null);
    navigate('/booking');
  };

  return (
    <article className={`hotel-card ${compact ? 'hotel-card-compact' : ''}`}>
      <Link className="hotel-card-photo" to={`/hotels/${hotel.id}`} aria-label={`View ${hotel.name}`}>
        {hotel.image ? <img src={hotel.image} alt={hotel.name} loading="lazy" /> : <span className="hotel-image-fallback"><Building2 size={32} /></span>}
        <span className="hotel-type">{hotel.propertyType || 'Stay'}</span>
        <span className="hotel-card-rating"><Star size={14} fill="currentColor" /> {hotel.rating}</span>
      </Link>
      <div className="hotel-card-content">
        <p className="hotel-location"><MapPin size={14} /> {hotel.location}{hotel.state ? `, ${hotel.state}` : ''}</p>
        <div className="hotel-card-title">
          <div>
            <h3><Link to={`/hotels/${hotel.id}`}>{hotel.name}</Link></h3>
            <span>{hotel.reviewCount ? `${hotel.reviewCount} guest reviews` : 'New property'}</span>
          </div>
          <div className="hotel-card-price">
            <small>FROM</small>
            <strong>{formatPrice(hotel.startingPrice)}</strong>
            <span>/ night</span>
          </div>
        </div>
        <p className="hotel-card-description">{hotel.shortDescription}</p>
        <div className="hotel-amenities">
          {(hotel.amenities || []).slice(0, 3).map((amenity) => <span key={amenity}>{amenity}</span>)}
          {(hotel.amenities || []).length > 3 && <span>+{hotel.amenities.length - 3} more</span>}
        </div>
        <div className="hotel-card-actions">
          <Link className="button button-outline" to={`/hotels/${hotel.id}`}>View details</Link>
          <button className="button button-primary" type="button" onClick={startBooking}>
            Book now <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default HotelCard;
