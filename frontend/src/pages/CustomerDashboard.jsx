// import React, { useContext, useEffect, useMemo, useState } from 'react';
// import { CalendarDays, Check, ChevronRight, CircleDollarSign, Clock3, Compass, LayoutDashboard, LogOut, MapPin, ShieldCheck, UserRound, X } from 'lucide-react';
// import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// import SiteLayout from '../components/common/SiteLayout';
// import Modal from '../components/common/Modal';
// import RoomService from '../components/customer/RoomService';
// import { useAuth } from '../context/AuthContext';
// import { ProfileContext } from '../context/ProfileContext';
// import { BookingContext } from '../context/BookingContext';
// import { api } from '../utils/api';
// import './CustomerDashboard.css';

// const sections = [
//   { id: 'overview', label: 'Overview', icon: LayoutDashboard },
//   { id: 'bookings', label: 'My bookings', icon: CalendarDays },
//   { id: 'profile', label: 'Personal details', icon: UserRound },
//   { id: 'security', label: 'Security', icon: ShieldCheck },
// ];
// const currency = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
// const date = (value) => value ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';

// const CustomerDashboard = () => {
//   const { user, logout } = useAuth();
//   const { profile, loading: profileLoading, updateProfile, updatePassword } = useContext(ProfileContext);
//   const { bookings, cancelBooking } = useContext(BookingContext);
//   const [params, setParams] = useSearchParams();
//   const navigate = useNavigate();
//   const section = sections.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'overview';
//   const [form, setForm] = useState({ name: '', email: '', phone: '' });
//   const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
//   const [notice, setNotice] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [cancelling, setCancelling] = useState('');
//   const [roomServiceBooking, setRoomServiceBooking] = useState(null);
//   const [reviewedBookings, setReviewedBookings] = useState({});
//   const [reviewsLoading, setReviewsLoading] = useState(true);
//   const [reviewBooking, setReviewBooking] = useState(null);
//   const [reviewRating, setReviewRating] = useState(5);
//   const [reviewComment, setReviewComment] = useState('');
//   const [reviewError, setReviewError] = useState('');
//   const [reviewSaving, setReviewSaving] = useState(false);

//   useEffect(() => {
//     if (profile) setForm({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' });
//   }, [profile]);

//   useEffect(() => {
//     let active = true;
//     if (user?.role !== 'customer') {
//       setReviewedBookings({});
//       setReviewsLoading(false);
//       return () => { active = false; };
//     }

//     setReviewsLoading(true);
//     api.get('/api/reviews/mine')
//       .then((reviews) => {
//         if (!active) return;
//         const byBooking = reviews.reduce((result, review) => {
//           result[String(review.booking)] = review;
//           return result;
//         }, {});
//         setReviewedBookings(byBooking);
//       })
//       .catch((error) => {
//         if (active) setNotice({ type: 'error', text: error.message || 'Could not load your submitted reviews.' });
//       })
//       .finally(() => { if (active) setReviewsLoading(false); });
//     return () => { active = false; };
//   }, [user?.id, user?.role]);

//   const upcoming = useMemo(() => bookings.filter((item) => ['Pending', 'Confirmed', 'Checked-in'].includes(item.status) && item.checkIn && new Date(`${item.checkIn}T00:00:00`) >= new Date(new Date().toDateString())).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn)), [bookings]);
//   const past = useMemo(() => bookings.filter((item) => ['Checked-out', 'Completed'].includes(item.status) && item.checkOut && new Date(`${item.checkOut}T00:00:00`) < new Date(new Date().toDateString())), [bookings]);
//   const pending = bookings.filter((item) => ['pending', 'created', ''].includes(String(item.paymentStatus || '').toLowerCase())).length;
//   const setSection = (id) => { setParams(id === 'overview' ? {} : { tab: id }); setNotice(null); };

//   const saveProfile = async (event) => {
//     event.preventDefault(); setSaving(true); setNotice(null);
//     try { await updateProfile(form); setNotice({ type: 'success', text: 'Your personal details have been updated.' }); }
//     catch (error) { setNotice({ type: 'error', text: error.message || 'Could not update your details.' }); }
//     finally { setSaving(false); }
//   };
//   const savePassword = async (event) => {
//     event.preventDefault(); setNotice(null);
//     if (passwordForm.newPassword !== passwordForm.confirmPassword) { setNotice({ type: 'error', text: 'The new passwords do not match.' }); return; }
//     setSaving(true);
//     try { const result = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setNotice({ type: 'success', text: result.message || 'Your password has been updated.' }); }
//     catch (error) { setNotice({ type: 'error', text: error.message || 'Could not update your password.' }); }
//     finally { setSaving(false); }
//   };
//   const cancel = async (booking) => {
//     if (!window.confirm(`Cancel booking ${booking.reference}?`)) return;
//     setCancelling(booking.id); setNotice(null);
//     try { await cancelBooking(booking.id); setNotice({ type: 'success', text: 'Your booking has been cancelled.' }); }
//     catch (error) { setNotice({ type: 'error', text: error.message || 'Could not cancel this booking.' }); }
//     finally { setCancelling(''); }
//   };
//   const openReview = (booking) => {
//     setReviewBooking(booking);
//     setReviewRating(5);
//     setReviewComment('');
//     setReviewError('');
//   };
//   const submitReview = async (event) => {
//     event.preventDefault();
//     if (!reviewBooking) return;
//     setReviewSaving(true);
//     setReviewError('');
//     try {
//       const review = await api.post(`/api/reviews/bookings/${reviewBooking.id}`, {
//         rating: Number(reviewRating),
//         comment: reviewComment,
//       });
//       setReviewedBookings((current) => ({ ...current, [reviewBooking.id]: review }));
//       setReviewBooking(null);
//       setNotice({ type: 'success', text: 'Thank you. Your stay review has been submitted.' });
//     } catch (error) {
//       setReviewError(error.message || 'Could not submit your review.');
//     } finally {
//       setReviewSaving(false);
//     }
//   };

//   const bookingList = (list) => list.length ? <div className="account-booking-list">{list.map((booking) => <article className="account-booking" key={booking.id}>
//     {booking.hotelImage ? <img className="account-booking-image" src={booking.hotelImage} alt={booking.hotelName} /> : <div className="account-booking-placeholder"><Compass size={25} /></div>}
//     <div className="account-booking-content"><div className="account-booking-title"><div><span className="account-booking-ref">BOOKING {booking.reference}</span><h3>{booking.hotelName}</h3></div><span className={`account-status status-${String(booking.status || '').toLowerCase()}`}>{booking.status || 'Pending'}</span></div>
//       <p className="account-booking-location"><MapPin size={14} />{booking.hotelLocation || 'Location on your reservation'}</p>
//       <div className="account-booking-meta"><span><CalendarDays size={15} />{date(booking.checkIn)} – {date(booking.checkOut)}</span><span><CircleDollarSign size={15} />{currency(booking.total)}</span>{booking.roomServiceTotal > 0 && <span>Room dining {currency(booking.roomServiceTotal)} · {booking.roomServiceSettledAt ? 'settled' : 'due at checkout'}</span>}<span className="account-payment-state">{booking.paymentMethod === 'pay-at-hotel' || booking.paymentMethod === 'hotel' ? 'Pay at hotel' : `Payment ${booking.paymentStatus || 'pending'}`}</span></div>
//       {['Confirmed', 'Pending'].includes(booking.status) && booking.checkIn && new Date(`${booking.checkIn}T00:00:00`) >= new Date(new Date().toDateString()) && <button className="account-cancel-booking" type="button" disabled={cancelling === booking.id} onClick={() => cancel(booking)}>{cancelling === booking.id ? 'Cancelling…' : 'Cancel booking'}</button>}
//       {booking.status === 'Checked-in' && <button className="account-room-service" type="button" onClick={() => { setRoomServiceBooking(booking); setNotice(null); }}>Order room service</button>}
//       {['Checked-out', 'Completed'].includes(booking.status) && (reviewedBookings[booking.id] ? <span className="account-review-submitted">Review submitted · {reviewedBookings[booking.id].rating}/5</span> : <button className="account-review-button" type="button" disabled={reviewsLoading} onClick={() => openReview(booking)}>{reviewsLoading ? 'Checking review…' : 'Write a Review'}</button>)}
//     </div>
//   </article>)}</div> : <div className="account-empty"><span><CalendarDays size={22} /></span><h3>No bookings here yet</h3><p>When you make a reservation, its details will appear here.</p><Link to="/hotels" className="account-inline-link">Explore available stays <ChevronRight size={15} /></Link></div>;

//   return <SiteLayout><main className="customer-account-page">
//     <div className="account-welcome"><div><p className="eyebrow">YOUR STAYNEST ACCOUNT</p><h1>Good to see you, {profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'traveller'}.</h1><p>Manage your stays and account details in one place.</p></div><button className="account-signout" onClick={() => { logout(); navigate('/'); }}><LogOut size={16} /> Sign out</button></div>
//     <div className="account-layout">
//       <aside className="account-sidebar"><div className="account-identity"><div className="account-avatar">{(profile?.name || user?.name || 'G').trim().charAt(0).toUpperCase()}</div><div><strong>{profile?.name || user?.name || 'Guest'}</strong><span>{profile?.email || user?.email}</span></div></div><nav aria-label="Account sections">{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? 'active' : ''} onClick={() => setSection(id)}><Icon size={17} />{label}{id === 'bookings' && <span className="account-nav-count">{bookings.length}</span>}</button>)}</nav><div className="account-sidebar-note"><ShieldCheck size={17} /><span>Your personal information is kept with your StayNest account.</span></div></aside>
//       <section className="account-main">
//         {notice && <div className={`account-notice ${notice.type}`} role="status">{notice.type === 'success' ? <Check size={17} /> : <X size={17} />}{notice.text}</div>}
//         {section === 'overview' && <>
//           <div className="account-section-heading"><div><p className="eyebrow">ACCOUNT OVERVIEW</p><h2>Your travel at a glance</h2></div><Link to="/hotels" className="account-outline-link">Find a stay <ChevronRight size={15} /></Link></div>
//           <div className="account-stat-grid"><article><span><CalendarDays size={18} /></span><small>Total bookings</small><strong>{bookings.length}</strong></article><article><span><Clock3 size={18} /></span><small>Upcoming stays</small><strong>{upcoming.length}</strong></article><article><span><CircleDollarSign size={18} /></span><small>Pending payments</small><strong>{pending}</strong></article><article><span><Check size={18} /></span><small>Completed stays</small><strong>{past.length}</strong></article></div>
//           <div className="account-list-heading"><div><h2>Next up</h2><p>Your upcoming reservations</p></div><button type="button" onClick={() => setSection('bookings')}>All bookings <ChevronRight size={15} /></button></div>{bookingList(upcoming.slice(0, 3))}
//         </>}
//         {section === 'bookings' && <><div className="account-section-heading"><div><p className="eyebrow">YOUR RESERVATIONS</p><h2>My bookings</h2><p className="account-subtitle">Reservations made with your account.</p></div></div>{bookings.length ? bookingList(bookings) : bookingList([])}</>}
//         {section === 'profile' && <><div className="account-section-heading"><div><p className="eyebrow">ACCOUNT DETAILS</p><h2>Personal details</h2><p className="account-subtitle">Keep your contact information up to date.</p></div></div>{profileLoading ? <div className="account-loading">Loading your profile…</div> : <form className="account-edit-form" onSubmit={saveProfile}><label>Full name<input autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Phone number <span>Optional</span><input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><button className="account-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form>}</>}
//         {section === 'security' && <><div className="account-section-heading"><div><p className="eyebrow">ACCOUNT SECURITY</p><h2>Change password</h2><p className="account-subtitle">Choose a password with at least 8 characters.</p></div></div><form className="account-edit-form" onSubmit={savePassword}><label>Current password<input type="password" autoComplete="current-password" minLength="8" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label><label>New password<input type="password" autoComplete="new-password" minLength="8" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></label><button className="account-primary-button" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button></form></>}
//       </section>
//     </div>
//   </main>{reviewBooking && <Modal onClose={() => { if (!reviewSaving) setReviewBooking(null); }} title={`Review your stay at ${reviewBooking.hotelName}`}>
//     <form className="account-review-form" onSubmit={submitReview}>
//       <label>Rating<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}</select></label>
//       <label>Your review<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows="5" maxLength="2000" required placeholder="Share what you liked about your stay." /></label>
//       {reviewError && <p className="account-review-error" role="alert">{reviewError}</p>}
//       <div className="account-review-actions"><button type="button" onClick={() => setReviewBooking(null)} disabled={reviewSaving}>Cancel</button><button className="account-primary-button" type="submit" disabled={reviewSaving}>{reviewSaving ? 'Submitting…' : 'Submit review'}</button></div>
//     </form>
//   </Modal>}{roomServiceBooking && <RoomService booking={roomServiceBooking} onClose={() => setRoomServiceBooking(null)} />}</SiteLayout>;
// };

// export default CustomerDashboard;




import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/common/SiteLayout';
import Modal from '../components/common/Modal';
import RoomService from '../components/customer/RoomService';
import { useAuth } from '../context/AuthContext';
import { ProfileContext } from '../context/ProfileContext';
import { BookingContext } from '../context/BookingContext';
import { api } from '../utils/api';
import './CustomerDashboard.css';

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My bookings', icon: CalendarDays },
  { id: 'profile', label: 'Personal details', icon: UserRound },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

const currency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const date = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : '—';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { profile, loading: profileLoading, updateProfile, updatePassword } =
    useContext(ProfileContext);
  const { bookings, cancelBooking } = useContext(BookingContext);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const section = sections.some((item) => item.id === params.get('tab'))
    ? params.get('tab')
    : 'overview';

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState('');
  const [roomServiceBooking, setRoomServiceBooking] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    if (user?.role !== 'customer') {
      setReviewedBookings({});
      setReviewsLoading(false);
      return () => {
        active = false;
      };
    }

    setReviewsLoading(true);
    api
      .get('/api/reviews/mine')
      .then((reviews) => {
        if (!active) return;
        const byBooking = reviews.reduce((result, review) => {
          result[String(review.booking)] = review;
          return result;
        }, {});
        setReviewedBookings(byBooking);
      })
      .catch((error) => {
        if (active) {
          setNotice({
            type: 'error',
            text: error.message || 'Could not load your submitted reviews.',
          });
        }
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter(
          (item) =>
            ['Pending', 'Confirmed', 'Checked-in'].includes(item.status) &&
            item.checkIn &&
            new Date(`${item.checkIn}T00:00:00`) >= new Date(new Date().toDateString())
        )
        .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn)),
    [bookings]
  );

  const past = useMemo(
    () =>
      bookings.filter(
        (item) =>
          ['Checked-out', 'Completed'].includes(item.status) &&
          item.checkOut &&
          new Date(`${item.checkOut}T00:00:00`) < new Date(new Date().toDateString())
      ),
    [bookings]
  );

  const pending = bookings.filter((item) =>
    ['pending', 'created', ''].includes(String(item.paymentStatus || '').toLowerCase())
  ).length;

  const setSection = (id) => {
    setParams(id === 'overview' ? {} : { tab: id });
    setNotice(null);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await updateProfile(form);
      setNotice({
        type: 'success',
        text: 'Your personal details have been updated.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.message || 'Could not update your details.',
      });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setNotice(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({
        type: 'error',
        text: 'The new passwords do not match.',
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setNotice({
        type: 'success',
        text: result.message || 'Your password has been updated.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.message || 'Could not update your password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.reference}?`)) return;
    setCancelling(booking.id);
    setNotice(null);
    try {
      await cancelBooking(booking.id);
      setNotice({ type: 'success', text: 'Your booking has been cancelled.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.message || 'Could not cancel this booking.',
      });
    } finally {
      setCancelling('');
    }
  };

  const openReview = (booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewBooking) return;
    setReviewSaving(true);
    setReviewError('');
    try {
      const review = await api.post(`/api/reviews/bookings/${reviewBooking.id}`, {
        rating: Number(reviewRating),
        comment: reviewComment,
      });
      setReviewedBookings((current) => ({
        ...current,
        [reviewBooking.id]: review,
      }));
      setReviewBooking(null);
      setNotice({
        type: 'success',
        text: 'Thank you. Your stay review has been submitted.',
      });
    } catch (error) {
      setReviewError(error.message || 'Could not submit your review.');
    } finally {
      setReviewSaving(false);
    }
  };

  const bookingList = (list) =>
    list.length ? (
      <div className="account-booking-list">
        {list.map((booking) => (
          <article className="account-booking" key={booking.id}>
            {booking.hotelImage ? (
              <img
                className="account-booking-image"
                src={booking.hotelImage}
                alt={booking.hotelName}
              />
            ) : (
              <div className="account-booking-placeholder">
                <Compass size={25} />
              </div>
            )}
            <div className="account-booking-content">
              <div className="account-booking-title">
                <div>
                  <span className="account-booking-ref">
                    BOOKING {booking.reference}
                  </span>
                  <h3>{booking.hotelName}</h3>
                </div>
                <span
                  className={`account-status status-${String(booking.status || '').toLowerCase()}`}
                >
                  {booking.status || 'Pending'}
                </span>
              </div>
              <p className="account-booking-location">
                <MapPin size={14} />
                {booking.hotelLocation || 'Location on your reservation'}
              </p>
              <div className="account-booking-meta">
                <span>
                  <CalendarDays size={15} />
                  {date(booking.checkIn)} – {date(booking.checkOut)}
                </span>
                <span>
                  <CircleDollarSign size={15} />
                  {currency(booking.total)}
                </span>
                {booking.roomServiceTotal > 0 && (
                  <span>
                    Room dining {currency(booking.roomServiceTotal)} ·{' '}
                    {booking.roomServiceSettledAt
                      ? 'settled'
                      : 'due at checkout'}
                  </span>
                )}
                <span className="account-payment-state">
                  {booking.paymentMethod === 'pay-at-hotel' ||
                  booking.paymentMethod === 'hotel'
                    ? 'Pay at hotel'
                    : `Payment ${booking.paymentStatus || 'pending'}`}
                </span>
              </div>
              <div className="account-booking-actions">
                {['Confirmed', 'Pending'].includes(booking.status) &&
                  booking.checkIn &&
                  new Date(`${booking.checkIn}T00:00:00`) >=
                    new Date(new Date().toDateString()) && (
                    <button
                      className="account-cancel-booking"
                      type="button"
                      disabled={cancelling === booking.id}
                      onClick={() => cancel(booking)}
                    >
                      {cancelling === booking.id
                        ? 'Cancelling…'
                        : 'Cancel booking'}
                    </button>
                  )}
                {booking.status === 'Checked-in' && (
                  <button
                    className="account-room-service"
                    type="button"
                    onClick={() => {
                      setRoomServiceBooking(booking);
                      setNotice(null);
                    }}
                  >
                    Order room service
                  </button>
                )}
                {['Checked-out', 'Completed'].includes(booking.status) &&
                  (reviewedBookings[booking.id] ? (
                    <span className="account-review-submitted">
                      Review submitted · {reviewedBookings[booking.id].rating}/5
                    </span>
                  ) : (
                    <button
                      className="account-review-button"
                      type="button"
                      disabled={reviewsLoading}
                      onClick={() => openReview(booking)}
                    >
                      {reviewsLoading ? 'Checking review…' : 'Write a Review'}
                    </button>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="account-empty">
        <span>
          <CalendarDays size={22} />
        </span>
        <h3>No bookings here yet</h3>
        <p>When you make a reservation, its details will appear here.</p>
        <Link to="/hotels" className="account-inline-link">
          Explore available stays <ChevronRight size={15} />
        </Link>
      </div>
    );

  return (
    <SiteLayout>
      <main className="customer-account-page">
        <div className="account-shell">
          <aside className="account-sidebar">
            <div className="account-brand-head">
              <span className="account-brand-mark">S</span>
              <div>
                <strong>StayNest</strong>
                <small>GUEST CONSOLE</small>
              </div>
            </div>

            <div className="account-identity">
              <div className="account-avatar">
                {(profile?.name || user?.name || 'G').trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{profile?.name || user?.name || 'Guest'}</strong>
                <span>{profile?.email || user?.email}</span>
              </div>
            </div>

            <p className="account-sidebar-caption">ACCOUNT MENU</p>
            <nav aria-label="Account sections">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={section === id ? 'active' : ''}
                  onClick={() => setSection(id)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {id === 'bookings' && (
                    <span className="account-nav-count">
                      {bookings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="account-sidebar-note">
              <ShieldCheck size={17} />
              <span>
                Your personal information is kept with your StayNest account.
              </span>
            </div>

            <button
              type="button"
              className="account-signout"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </aside>

          <section className="account-main">
            <div className="account-welcome">
              <div>
                <p className="eyebrow">YOUR STAYNEST ACCOUNT</p>
                <h1>
                  Good to see you,{' '}
                  {profile?.name?.split(' ')[0] ||
                    user?.name?.split(' ')[0] ||
                    'traveller'}
                  .
                </h1>
                <p>Manage your stays and account details in one place.</p>
              </div>
              <Link to="/hotels" className="account-outline-link">
                Find a stay <ChevronRight size={15} />
              </Link>
            </div>

            {notice && (
              <div className={`account-notice ${notice.type}`} role="status">
                {notice.type === 'success' ? (
                  <Check size={17} />
                ) : (
                  <X size={17} />
                )}
                <span>{notice.text}</span>
              </div>
            )}

            {section === 'overview' && (
              <>
                <div className="account-section-heading">
                  <div>
                    <p className="eyebrow">ACCOUNT OVERVIEW</p>
                    <h2>Your travel at a glance</h2>
                  </div>
                </div>

                <div className="account-stat-grid">
                  <article className="stat-card tone-blue">
                    <div className="stat-top">
                      <small>Total bookings</small>
                      <span className="stat-icon">
                        <CalendarDays size={18} />
                      </span>
                    </div>
                    <strong>{bookings.length}</strong>
                  </article>
                  <article className="stat-card tone-amber">
                    <div className="stat-top">
                      <small>Upcoming stays</small>
                      <span className="stat-icon">
                        <Clock3 size={18} />
                      </span>
                    </div>
                    <strong>{upcoming.length}</strong>
                  </article>
                  <article className="stat-card tone-rose">
                    <div className="stat-top">
                      <small>Pending payments</small>
                      <span className="stat-icon">
                        <CircleDollarSign size={18} />
                      </span>
                    </div>
                    <strong>{pending}</strong>
                  </article>
                  <article className="stat-card tone-green">
                    <div className="stat-top">
                      <small>Completed stays</small>
                      <span className="stat-icon">
                        <Check size={18} />
                      </span>
                    </div>
                    <strong>{past.length}</strong>
                  </article>
                </div>

                <div className="account-list-heading">
                  <div>
                    <h2>Next up</h2>
                    <p>Your upcoming reservations</p>
                  </div>
                  <button type="button" onClick={() => setSection('bookings')}>
                    All bookings <ChevronRight size={15} />
                  </button>
                </div>
                {bookingList(upcoming.slice(0, 3))}
              </>
            )}

            {section === 'bookings' && (
              <>
                <div className="account-section-heading">
                  <div>
                    <p className="eyebrow">YOUR RESERVATIONS</p>
                    <h2>My bookings</h2>
                    <p className="account-subtitle">
                      Reservations made with your account.
                    </p>
                  </div>
                </div>
                {bookings.length ? bookingList(bookings) : bookingList([])}
              </>
            )}

            {section === 'profile' && (
              <>
                <div className="account-section-heading">
                  <div>
                    <p className="eyebrow">ACCOUNT DETAILS</p>
                    <h2>Personal details</h2>
                    <p className="account-subtitle">
                      Keep your contact information up to date.
                    </p>
                  </div>
                </div>
                {profileLoading ? (
                  <div className="account-loading">Loading your profile…</div>
                ) : (
                  <form className="account-edit-form" onSubmit={saveProfile}>
                    <label>
                      Full name
                      <input
                        autoComplete="name"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Phone number <span>Optional</span>
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </label>
                    <button
                      className="account-primary-button"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </form>
                )}
              </>
            )}

            {section === 'security' && (
              <>
                <div className="account-section-heading">
                  <div>
                    <p className="eyebrow">ACCOUNT SECURITY</p>
                    <h2>Change password</h2>
                    <p className="account-subtitle">
                      Choose a password with at least 8 characters.
                    </p>
                  </div>
                </div>
                <form className="account-edit-form" onSubmit={savePassword}>
                  <label>
                    Current password
                    <input
                      type="password"
                      autoComplete="current-password"
                      minLength="8"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </label>
                  <button
                    className="account-primary-button"
                    disabled={saving}
                  >
                    {saving ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>

      {reviewBooking && (
        <Modal
          onClose={() => {
            if (!reviewSaving) setReviewBooking(null);
          }}
          title={`Review your stay at ${reviewBooking.hotelName}`}
        >
          <form className="account-review-form" onSubmit={submitReview}>
            <label>
              Rating
              <select
                value={reviewRating}
                onChange={(event) =>
                  setReviewRating(Number(event.target.value))
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your review
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows="5"
                maxLength="2000"
                required
                placeholder="Share what you liked about your stay."
              />
            </label>
            {reviewError && (
              <p className="account-review-error" role="alert">
                {reviewError}
              </p>
            )}
            <div className="account-review-actions">
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                disabled={reviewSaving}
              >
                Cancel
              </button>
              <button
                className="account-primary-button"
                type="submit"
                disabled={reviewSaving}
              >
                {reviewSaving ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {roomServiceBooking && (
        <RoomService
          booking={roomServiceBooking}
          onClose={() => setRoomServiceBooking(null)}
        />
      )}
    </SiteLayout>
  );
};

export default CustomerDashboard;