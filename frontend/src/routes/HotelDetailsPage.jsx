import React, { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Clock3, MapPin, Play, Star, X } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { toHotelView } from '../utils/hotelView';
import { getHotelById } from '../data/hotels';
import RoomCard from '../components/common/RoomCard';
import DealCountdown from '../components/common/DealCountdown';
import SiteLayout from '../components/common/SiteLayout';
import GalleryModal from '../components/common/GalleryModal';

const reviewDate = (review) => {
  const value = review.createdAt || review.date;
  return value ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '';
};

function RecentBookingToast({ activity, rooms }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!activity?.recentBookingCount) return undefined;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 10000);
    return () => window.clearTimeout(timer);
  }, [activity]);

  if (!visible || !activity?.recentBookingCount) return null;
  const roomName = rooms.find((room) => room.id === activity.latestRoomId)?.name || 'A room';
  const elapsedMinutes = Math.max(1, Math.floor((Date.now() - new Date(activity.latestCreatedAt).getTime()) / 60000));
  const elapsedLabel = elapsedMinutes < 60 ? `${elapsedMinutes} min ago` : `${Math.floor(elapsedMinutes / 60)} hr ago`;

  return (
    <aside className="recent-booking-toast" role="status" aria-live="polite">
      <span className="recent-booking-indicator" aria-hidden="true" />
      <div>
        <strong>Recent booking</strong>
        <p>{roomName} was booked {elapsedLabel}</p>
        {activity.recentBookingCount > 1 && <small>{activity.recentBookingCount} bookings at this property in the last 3 hours</small>}
      </div>
      <button type="button" aria-label="Dismiss recent booking notification" onClick={() => setVisible(false)}><X size={15} /></button>
    </aside>
  );
}

function HotelDetailsPage() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [gallery, setGallery] = useState(null);
  const { selectHotel, selectRoom } = useContext(BookingContext);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/hotels/${hotelId}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Unable to load this property.');
        return payload;
      })
      .then((data) => { if (active) setHotel(toHotelView(data)); })
      .catch(() => {
        const legacyHotel = getHotelById(hotelId);
        if (active && legacyHotel) setHotel(toHotelView(legacyHotel));
        else if (active) setLoadError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hotelId]);

  if (loading) return <SiteLayout><main className="hotel-details-page"><div className="section-shell"><p>Loading property…</p></div></main></SiteLayout>;
  if (loadError || !hotel) return <Navigate to="/not-found" replace />;

  const startBooking = () => {
    selectHotel(hotel);
    selectRoom(null);
    navigate('/booking');
  };
  const galleryImages = hotel.gallery.slice(0, 5);
  const discountedRoom = hotel.rooms.find((room) => room.discountPrice !== null && room.discountPrice !== undefined);
  const openGallery = (tab, index = 0) => setGallery({ tab, index });
  const clickableProps = (tab, index, label) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: () => openGallery(tab, index),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openGallery(tab, index);
      }
    },
  });
  const closeGallery = () => setGallery(null);

  return (
    <SiteLayout>
      <main className="hotel-details-page">
        <div className="section-shell hotel-details-shell">
          <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/hotels">Hotels</Link><span>/</span><span>{hotel.name}</span></div>
          <div className="hotel-detail-heading">
            <div>
              <p className="eyebrow">{hotel.propertyType.toUpperCase()}</p>
              <h1>{hotel.name}</h1>
              <p className="detail-location"><MapPin size={16} /> {hotel.location}, {hotel.state}</p>
            </div>
            <div className="detail-rating"><span><Star size={16} fill="currentColor" /> {hotel.rating}</span><small>{hotel.reviewCount} guest reviews</small></div>
          </div>
          <div className="hotel-gallery" aria-label={`${hotel.name} photo gallery`}>
            {galleryImages[0]
              ? <img className="gallery-main gallery-clickable" src={galleryImages[0]} alt={`${hotel.name} exterior and grounds`} {...clickableProps('photos', 0, `Open ${hotel.name} gallery, photo 1`)} />
              : <div className={`gallery-main gallery-image-fallback${hotel.videos.length ? ' gallery-clickable' : ''}`} {...(hotel.videos.length ? clickableProps('videos', 0, `Open ${hotel.name} videos`) : {})}><MapPin size={34} /></div>}
            {galleryImages.slice(1).map((image, index) => <img key={`${image}-${index}`} className={`gallery-image gallery-image-${index + 1} gallery-clickable`} src={image} alt={`${hotel.name} view ${index + 2}`} {...clickableProps('photos', index + 1, `Open ${hotel.name} gallery, photo ${index + 2}`)} />)}
            {hotel.gallery.length > 0 && (
              <button type="button" className="gallery-view-all-button" onClick={() => openGallery('photos', 0)}>
                View all {hotel.gallery.length} photos
              </button>
            )}
            {hotel.videos.length > 0 && <button type="button" className="gallery-videos-button" onClick={() => openGallery('videos', 0)}><Play size={13} fill="currentColor" /> Videos ({hotel.videos.length})</button>}
          </div>

          <div className="hotel-detail-layout">
            <div className="hotel-detail-main">
              <section className="detail-intro">
                <div>
                  <p className="eyebrow">A STAY WITH A SENSE OF PLACE</p>
                  <h2>Make yourself<br /><em>at home.</em></h2>
                </div>
                <p>{hotel.description}</p>
              </section>

              <section className="detail-section">
                <p className="eyebrow">THOUGHTFUL COMFORTS</p>
                <h2>Facilities & amenities</h2>
                <div className="amenity-grid">
                  {hotel.amenities.map((amenity) => <span key={amenity}><Check size={15} /> {amenity}</span>)}
                </div>
              </section>

              <section className="detail-section available-rooms">
                <div className="detail-section-heading">
                  <div><p className="eyebrow">FIND YOUR ROOM</p><h2>Stay a little longer.</h2></div>
                  <div className="available-rooms-heading-meta">
                    <span>{hotel.rooms.length} rooms</span>
                    {discountedRoom && <DealCountdown discountPrice={discountedRoom.discountPrice} className="deal-countdown-section" />}
                  </div>
                </div>
                <div className="room-options">
                  {hotel.rooms.map((room) => <RoomCard key={room.id} hotel={hotel} room={room} />)}
                </div>
              </section>

              <section className="detail-section">
                <p className="eyebrow">GOOD TO KNOW</p>
                <h2>Arrive at your own pace.</h2>
                <div className="checkin-grid">
                  <div><Clock3 size={17} /><span>Check-in</span><strong>{hotel.checkIn}</strong></div>
                  <div><Clock3 size={17} /><span>Check-out</span><strong>{hotel.checkOut}</strong></div>
                  <p>Please bring a valid government-issued photo ID for all adult guests at check-in.</p>
                </div>
              </section>

              <section className="detail-section review-section">
                <div className="detail-section-heading">
                  <div><p className="eyebrow">WORDS FROM OUR GUESTS</p><h2>Recent reviews</h2></div>
                  <span className="review-average"><Star size={15} fill="currentColor" /> {hotel.rating} / 5</span>
                </div>
                <div className="reviews-list">
                  {hotel.reviews.map((review, index) => (
                    <article className="review-card" key={review._id || `${review.booking || review.name || 'review'}-${index}`}>
                      <div className="review-card-top"><div><strong>{review.user?.name || review.name || 'Guest'}</strong><span>{reviewDate(review)}</span></div><span className="review-stars"><Star size={13} fill="currentColor" /> {review.rating}.0</span></div>
                      <p>{review.comment || review.text}</p>
                    </article>
                  ))}
                  {hotel.reviews.length === 0 && <p>No guest reviews yet.</p>}
                </div>
              </section>

              <section className="detail-section location-section">
                <p className="eyebrow">A PLACE TO FIND YOUR PACE</p>
                <h2>Find us here.</h2>
                <div className="map-card">
                  <div className="map-grid"><MapPin size={26} /></div>
                  <div><strong>{hotel.address}</strong><span>{hotel.coordinates}</span></div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`} target="_blank" rel="noreferrer">Open map <ArrowRight size={14} /></a>
                </div>
              </section>
            </div>

            <aside className="hotel-booking-aside">
              <p className="eyebrow">YOUR NEXT STAY</p>
              <h2>From the moment you arrive.</h2>
              <p>Rooms from <strong>₹{hotel.startingPrice.toLocaleString('en-IN')}</strong> / night</p>
              <button className="button button-primary" type="button" onClick={startBooking}>Choose a room <ArrowRight size={16} /></button>
              <small>Free to book · Pay at hotel available</small>
            </aside>
          </div>
        </div>
      </main>
      <RecentBookingToast activity={hotel.activity} rooms={hotel.rooms} />
      {gallery && <GalleryModal title={hotel.name} images={hotel.gallery} videos={hotel.videos} initialTab={gallery.tab} initialIndex={gallery.index} onClose={closeGallery} />}
    </SiteLayout>
  );
}

export default HotelDetailsPage;
