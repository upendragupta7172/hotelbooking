import React, { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { toHotelView } from '../utils/hotelView';
import BookingSummary from '../components/common/BookingSummary';
import RoomCard from '../components/common/RoomCard';
import SiteLayout from '../components/common/SiteLayout';

const today = new Date().toISOString().slice(0, 10);

function BookingPage() {
  const {
    searchParams, updateSearch, selectedHotel, selectHotel,
    selectedRoom, selectRoom, guestInfo, updateGuestInfo,
  } = useContext(BookingContext);
  const [step, setStep] = useState(() => selectedRoom ? (guestInfo.name ? 3 : 2) : 1);
  const [formData, setFormData] = useState({
    name: guestInfo.name || '',
    email: guestInfo.email || '',
    phone: guestInfo.phone || '',
    requests: guestInfo.requests || '',
    checkIn: searchParams.checkIn || '',
    checkOut: searchParams.checkOut || '',
    adults: searchParams.adults || searchParams.guests || 2,
    rooms: 1,
  });
  const [formError, setFormError] = useState('');
  const [hotelCatalog, setHotelCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(!selectedHotel);
  const [catalogError, setCatalogError] = useState('');
  const hotel = selectedHotel || null;
  const room = selectedRoom || null;

  useEffect(() => {
    if (selectedHotel) {
      setCatalogLoading(false);
      return undefined;
    }
    let active = true;
    setCatalogLoading(true);
    fetch('/api/hotels')
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Unable to load stays.');
        return payload;
      })
      .then((data) => { if (active) setHotelCatalog(Array.isArray(data) ? data.map(toHotelView) : []); })
      .catch((err) => { if (active) setCatalogError(err.message || 'Unable to load stays.'); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [selectedHotel]);

  if (step > 1 && (!hotel || !room)) return <Navigate to="/booking" replace />;
  if (step === 3 && !guestInfo.name) return <Navigate to="/booking" replace />;

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const saveGuestDetails = (event) => {
    event.preventDefault();
    if (formData.checkOut <= formData.checkIn) {
      setFormError('Choose a check-out date after your check-in date.');
      return;
    }
    setFormError('');
    updateSearch({
      ...searchParams,
      destination: hotel.city,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      adults: Number(formData.adults),
      guests: Number(formData.adults),
      rooms: 1,
    });
    updateGuestInfo({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      requests: formData.requests.trim(),
    });
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeHotel = (nextHotel) => {
    selectHotel(nextHotel);
    selectRoom(null);
  };

  return (
    <SiteLayout>
      <main className="booking-page">
        <div className="page-banner booking-banner">
          <div className="section-shell">
            <p className="eyebrow"><Link to="/hotels">OUR STAYS</Link><span> / </span> YOUR BOOKING</p>
            <h1>A few easy steps<br /><em>to somewhere lovely.</em></h1>
          </div>
        </div>
        <div className="section-shell booking-shell">
          <div className="booking-progress">
            {['Choose a room', 'Your details', 'Review'].map((label, index) => {
              const number = index + 1;
              return (
                <div className={`progress-step ${step >= number ? 'progress-step-active' : ''}`} key={label}>
                  <span>{step > number ? <Check size={14} /> : `0${number}`}</span><small>{label}</small>
                  {index < 2 && <ChevronRight className="progress-chevron" size={14} />}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <section className="booking-select-step">
              <div className="booking-step-heading">
                <div><p className="eyebrow">STEP 01 · YOUR STAY</p><h2>{hotel ? `Choose a room at ${hotel.name}` : 'Choose a hotel & room'}</h2><p>Select the place that feels right, then find your room.</p></div>
                {hotel && <button className="text-link" type="button" onClick={() => changeHotel(null)}>Choose another hotel</button>}
              </div>
              {catalogLoading && <p className="catalog-empty">Loading available properties…</p>}
              {catalogError && <p className="catalog-empty">{catalogError}</p>}
              {(hotel ? [hotel] : hotelCatalog).map((stay) => (
                <div className="booking-hotel-choice" key={stay.id}>
                  {!hotel && (
                    <div className="booking-hotel-title">
                      {stay.image && <img src={stay.image} alt={stay.name} />}
                      <div><p className="eyebrow">{stay.propertyType}</p><h3>{stay.name}</h3><span>{stay.location}, {stay.state} · ★ {stay.rating}</span></div>
                    </div>
                  )}
                  <div className="room-options">
                    {stay.rooms.map((stayRoom) => <RoomCard key={stayRoom.id} hotel={stay} room={stayRoom} onSelect={() => setStep(2)} />)}
                    {stay.rooms.length === 0 && <p className="catalog-empty">No rooms have been added for this property yet.</p>}
                  </div>
                </div>
              ))}
              {!hotel && !catalogLoading && !catalogError && hotelCatalog.length === 0 && <p className="catalog-empty">No properties are available yet.</p>}
            </section>
          )}

          {step === 2 && hotel && room && (
            <div className="booking-form-layout">
              <section className="booking-form-panel">
                <p className="eyebrow">STEP 02 · THE DETAILS</p>
                <h2>Who’s joining you?</h2>
                <p className="booking-lead">A few details help us get everything ready for your arrival.</p>
                <form className="guest-details-form" onSubmit={saveGuestDetails}>
                  <div className="form-grid">
                    <label className="form-field form-field-wide">Full name<input name="name" autoComplete="name" value={formData.name} onChange={updateField} required /></label>
                    <label className="form-field">Email address<input name="email" type="email" autoComplete="email" value={formData.email} onChange={updateField} required /></label>
                    <label className="form-field">Phone number<input name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={updateField} minLength="8" required /></label>
                    <label className="form-field">Check-in<input name="checkIn" type="date" min={today} value={formData.checkIn} onChange={updateField} required /></label>
                    <label className="form-field">Check-out<input name="checkOut" type="date" min={formData.checkIn || today} value={formData.checkOut} onChange={updateField} required /></label>
                    <label className="form-field">Guests<select name="adults" value={formData.adults} onChange={updateField}>{[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}</select></label>
                    <label className="form-field form-field-wide">Anything we should know? <span className="optional-label">Optional</span><textarea name="requests" rows="3" value={formData.requests} onChange={updateField} placeholder="A small note for our team" /></label>
                  </div>
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  <div className="booking-form-actions">
                    <button className="button button-outline" type="button" onClick={() => setStep(1)}><ArrowLeft size={15} /> Change room</button>
                    <button className="button button-primary" type="submit">Review your stay <ArrowRight size={15} /></button>
                  </div>
                </form>
              </section>
              <BookingSummary hotel={hotel} room={room} guestInfo={guestInfo} searchParams={searchParams} />
            </div>
          )}

          {step === 3 && hotel && room && (
            <div className="booking-review-layout">
              <section className="booking-review-panel">
                <p className="eyebrow">STEP 03 · EVERYTHING IN ITS PLACE</p>
                <h2>Review your stay.</h2>
                <p className="booking-lead">Take a moment to make sure everything looks right.</p>
                <div className="review-detail-card">
                  <div><span>GUEST</span><strong>{guestInfo.name}</strong><small>{guestInfo.email} · {guestInfo.phone}</small></div>
                  <button type="button" onClick={() => setStep(2)}>Edit</button>
                </div>
                {guestInfo.requests && <div className="review-detail-card"><div><span>YOUR NOTE</span><strong>{guestInfo.requests}</strong></div><button type="button" onClick={() => setStep(2)}>Edit</button></div>}
                <div className="review-assurance"><Check size={16} /><span>Choose secure prepaid payment through Razorpay or reserve now and pay at the hotel.</span></div>
                <div className="booking-form-actions">
                  <button className="button button-outline" type="button" onClick={() => setStep(2)}><ArrowLeft size={15} /> Edit details</button>
                  <Link className="button button-primary" to="/booking/checkout">Continue to checkout <ArrowRight size={15} /></Link>
                </div>
              </section>
              <BookingSummary hotel={hotel} room={room} guestInfo={guestInfo} searchParams={searchParams} />
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

export default BookingPage;
