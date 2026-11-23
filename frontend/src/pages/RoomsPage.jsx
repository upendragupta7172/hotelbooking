import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BedDouble, Check, Users, ArrowUpRight } from 'lucide-react';
import SiteLayout from '../components/common/SiteLayout';

const money = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

const amenityName = (a) => (typeof a === 'string' ? a : a?.name || '');

function RoomCard({ room }) {
  const navigate = useNavigate();
  const hotelId = room.hotel?._id || room.hotel;
  const hotelName = room.hotel?.name || 'View hotel';
  const image = room.images?.[0] || room.image || '';
  const type = room.type || room.name || 'Room';
  const price = Number(room.discountPrice ?? room.pricePerNight ?? 0);
  const basePrice = Number(room.pricePerNight ?? 0);
  const hasDiscount = room.discountPrice != null && room.discountPrice < basePrice;
  const amenities = (room.amenities || []).slice(0, 4).map(amenityName).filter(Boolean);

  return (
    <article className="explore-room-card">
      <div className="explore-room-img-wrap">
        {image
          ? <img src={image} alt={type} className="explore-room-img" />
          : <div className="explore-room-img explore-room-img-fallback"><BedDouble size={36} /></div>}
        <span className="explore-room-type-badge">{type}</span>
      </div>
      <div className="explore-room-body">
        <p className="explore-room-hotel">{hotelName}</p>
        <h3 className="explore-room-name">{room.name}</h3>
        {room.description && <p className="explore-room-desc">{room.description}</p>}
        <div className="explore-room-meta">
          <span><Users size={13} /> {room.capacity ?? 1} guests</span>
          {room.bedType && <span><BedDouble size={13} /> {room.bedType}</span>}
          {room.size && <span>{room.size}</span>}
        </div>
        {amenities.length > 0 && (
          <ul className="explore-room-amenities">
            {amenities.map((a) => <li key={a}><Check size={11} /> {a}</li>)}
          </ul>
        )}
        <div className="explore-room-footer">
          <div className="explore-room-price">
            <strong>{money(price)}</strong>
            {hasDiscount && <del>{money(basePrice)}</del>}
            <span>/ night</span>
          </div>
          <div className="explore-room-actions">
            {hotelId && (
              <Link to={`/hotels/${hotelId}`} className="explore-view-link">
                View hotel <ArrowUpRight size={13} />
              </Link>
            )}
            <button
              type="button"
              className="button button-primary explore-book-btn"
              onClick={() => navigate(`/hotels/${hotelId}`)}
            >
              Book <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/rooms')
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Unable to load rooms.');
        return payload;
      })
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Unable to load rooms.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteLayout>
      <main className="explore-page">
        <div className="explore-hero">
          <div className="section-shell">
            <p className="eyebrow">FIND YOUR ROOM</p>
            <h1>Rooms <em>&amp; Suites</em></h1>
            <p className="explore-hero-sub">Every room, suite and villa available across our properties — updated live from our system.</p>
          </div>
        </div>

        <div className="section-shell explore-content">
          {loading && (
            <div className="explore-state-center">
              <p className="explore-loading-text">Loading rooms…</p>
            </div>
          )}

          {!loading && error && (
            <div className="explore-state-center">
              <BedDouble size={40} className="explore-state-icon" />
              <h2>Could not load rooms</h2>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && rooms.length === 0 && (
            <div className="explore-state-center">
              <BedDouble size={48} className="explore-state-icon" />
              <h2>No rooms available right now</h2>
              <p>Check back soon — new rooms will appear here as soon as they are added by the property manager.</p>
              <Link to="/hotels" className="button button-primary">Browse hotels <ArrowRight size={14} /></Link>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && (
            <>
              <div className="explore-results-bar">
                <span>{rooms.length} room{rooms.length !== 1 ? 's' : ''} available</span>
                <Link to="/hotels" className="text-link">All hotels <ArrowRight size={13} /></Link>
              </div>
              <div className="explore-grid">
                {rooms.map((room) => (
                  <RoomCard key={room._id || room.id} room={room} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

export default RoomsPage;
