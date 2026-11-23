import React, { useContext, useEffect, useState } from 'react';
import { ArrowDownToLine, CalendarDays, Check, ChevronLeft, ChevronRight, Eye, FileText, MapPin, Pencil, Phone, RefreshCw, Search, UserRound, X } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import './BookingManagement.css';

const statusLabels = { booked: 'Confirmed', confirmed: 'Confirmed', pending: 'Pending', 'checked-in': 'Checked-in', 'checked-out': 'Checked-out', cancelled: 'Cancelled', rejected: 'Rejected', 'no-show': 'No-show', completed: 'Completed' };
const statusOptions = ['all', 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'rejected', 'no-show', 'completed'];
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const prettyDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const roomLabel = (room) => room ? [room.roomNumber && `#${room.roomNumber}`, room.type || room.name].filter(Boolean).join(' · ') : 'Room not assigned';

function StatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  return <span className={`booking-admin-status status-${normalized}`}>{statusLabels[normalized] || normalized}</span>;
}

function makeInvoice(booking) {
  const escape = (value) => String(value ?? '—').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const reference = String(booking._id).slice(-8).toUpperCase();
  const printWindow = window.open('', '_blank', 'width=840,height=900');
  if (!printWindow) { window.alert('Allow pop-ups to open the invoice for download.'); return; }
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>StayNest invoice ${reference}</title><style>body{font:14px Arial,sans-serif;color:#263a44;margin:0;padding:48px}main{max-width:760px;margin:auto}.brand{font:30px Georgia,serif;color:#18394f}.muted{color:#687780}.head{display:flex;justify-content:space-between;border-bottom:2px solid #18394f;padding-bottom:22px}.box{margin:28px 0;padding:18px;background:#f7f6f2}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e0d6}.total{font-size:18px;font-weight:bold}.foot{margin-top:45px;color:#687780;font-size:12px}@media print{body{padding:0}button{display:none}}</style></head><body><main><header class="head"><div><div class="brand">StayNest</div><p class="muted">Hotel reservation invoice</p></div><div><strong>INVOICE</strong><p>Reference: ${reference}</p><p>Date: ${prettyDate(booking.createdAt)}</p></div></header><section class="box"><strong>${escape(booking.hotel?.name)}</strong><p>${escape([booking.hotel?.address, booking.hotel?.city, booking.hotel?.country].filter(Boolean).join(', '))}</p><p>Room: ${escape(roomLabel(booking.room))}</p><p>Guest: ${escape(booking.guestInfo?.name || booking.user?.name)}</p><p>Email: ${escape(booking.guestInfo?.email || booking.user?.email)}</p><p>Phone: ${escape(booking.guestInfo?.phone || booking.user?.phone)}</p></section><div class="row"><span>Check-in</span><strong>${prettyDate(booking.checkIn)}</strong></div><div class="row"><span>Check-out</span><strong>${prettyDate(booking.checkOut)}</strong></div><div class="row"><span>Guests</span><strong>${escape(booking.guests)}</strong></div><div class="row"><span>Accommodation</span><strong>${money(booking.totalPrice)}</strong></div><div class="row"><span>Payment</span><strong>${booking.paymentMethod === 'online' ? 'Prepaid online' : 'Pay at hotel'} · ${escape(booking.paymentStatus)}</strong></div>${booking.roomServiceTotal > 0 ? `<div class="row"><span>Room service${booking.roomServiceSettledAt ? ' (settled)' : ' (due at checkout)'}</span><strong>${money(booking.roomServiceTotal)}</strong></div>` : ''}<div class="row total"><span>Balance due</span><strong>${money((booking.paymentMethod === 'online' && booking.paymentStatus === 'paid' ? 0 : Number(booking.totalPrice || 0)) + (booking.roomServiceSettledAt ? 0 : Number(booking.roomServiceTotal || 0)))}</strong></div><p class="foot">Thank you for choosing StayNest. Please present this invoice and a valid photo ID at check-in.</p><button onclick="window.print()">Print / Save as PDF</button><script>window.onload=()=>window.print()</script></main></body></html>`);
  printWindow.document.close();
}

const BookingManagement = ({ rooms = [] }) => {
  const { bookings, bookingTotal, bookingPages, fetchBookings, fetchBooking, updateBookingStatus, modifyBooking, assignBookingRoom, settleRoomServiceBill, notifications, markBookingNotificationsRead } = useContext(AdminContext);
  const [filters, setFilters] = useState({ id: '', name: '', phone: '', bookingFrom: '', bookingTo: '', checkInFrom: '', checkInTo: '', status: 'all' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1, name: '', email: '', phone: '' });
  const [roomId, setRoomId] = useState('');

  const load = async (nextPage = page, nextFilters = filters) => {
    setLoading(true); setError('');
    try { await fetchBookings({ ...nextFilters, status: nextFilters.status === 'all' ? '' : nextFilters.status, page: nextPage, limit: 25 }); setPage(nextPage); }
    catch (err) { setError(err.message || 'Unable to load bookings.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(1, filters); /* initial database load */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetails = async (booking) => {
    setError(''); setActionLoading(true);
    try { setSelected(await fetchBooking(booking._id)); setDialog('details'); }
    catch (err) { setError(err.message || 'Unable to load booking details.'); }
    finally { setActionLoading(false); }
  };
  const openEdit = (booking) => {
    setSelected(booking);
    setForm({ checkIn: dateInput(booking.checkIn), checkOut: dateInput(booking.checkOut), guests: booking.guests || 1, name: booking.guestInfo?.name || booking.user?.name || '', email: booking.guestInfo?.email || booking.user?.email || '', phone: booking.guestInfo?.phone || booking.user?.phone || '' });
    setDialog('edit'); setError('');
  };
  const openAssignRoom = (booking) => {
    setSelected(booking); setRoomId(booking.room?._id || ''); setDialog('room'); setError('');
  };
  const runStatus = async (booking, status) => {
    const label = statusLabels[status];
    if (['cancelled', 'rejected'].includes(status) && !window.confirm(`${label} this booking? Prepaid bookings will be added to the refund review queue.`)) return;
    setActionLoading(true); setError('');
    try { await updateBookingStatus(booking._id, status); await load(page); if (selected?._id === booking._id) setSelected(await fetchBooking(booking._id)); }
    catch (err) { setError(err.message || `Unable to ${label.toLowerCase()} booking.`); }
    finally { setActionLoading(false); }
  };
  const settleDiningBill = async (booking) => {
    setActionLoading(true); setError('');
    try { const updated = await settleRoomServiceBill(booking._id); setSelected(updated); await load(page); }
    catch (err) { setError(err.message || 'Unable to settle this room dining bill.'); }
    finally { setActionLoading(false); }
  };
  const saveModification = async (event) => {
    event.preventDefault(); setActionLoading(true); setError('');
    try { await modifyBooking(selected._id, { checkIn: form.checkIn, checkOut: form.checkOut, guests: Number(form.guests), guestInfo: { name: form.name, email: form.email, phone: form.phone } }); setDialog(''); await load(page); }
    catch (err) { setError(err.message || 'Unable to update booking.'); }
    finally { setActionLoading(false); }
  };
  const saveRoom = async (event) => {
    event.preventDefault(); setActionLoading(true); setError('');
    try { await assignBookingRoom(selected._id, roomId); setDialog(''); await load(page); }
    catch (err) { setError(err.message || 'Unable to assign this room.'); }
    finally { setActionLoading(false); }
  };
  const clearFilters = () => { const next = { id: '', name: '', phone: '', bookingFrom: '', bookingTo: '', checkInFrom: '', checkInTo: '', status: 'all' }; setFilters(next); load(1, next); };
  const viewAllNotifications = async () => {
    try {
      await markBookingNotificationsRead();
      await load(1, filters);
    } catch (err) {
      setError(err.message || 'Unable to mark booking notifications as read.');
    }
  };
  const listLabel = (booking) => booking.guestInfo?.name || booking.user?.name || 'Guest';

  return <div className="admin-content booking-management">
    {notifications.count > 0 && <div className="booking-notice"><span className="booking-notice-icon"><CalendarDays size={18} /></span><div><strong>{notifications.count} new booking{notifications.count === 1 ? '' : 's'}</strong><p>New reservations have arrived. Review the guest and stay details.</p></div><button type="button" onClick={viewAllNotifications}>Mark as read</button></div>}
    <div className="section-toolbar"><div><h2>All bookings</h2><p>Search reservations, review details, and update booking operations.</p></div><button className="refresh-button" type="button" onClick={() => load(page)} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button></div>
    <form className="booking-filters" onSubmit={(event) => { event.preventDefault(); load(1); }}>
      <label className="booking-filter-search"><span>Booking ID</span><div><Search size={15} /><input placeholder="Enter full booking ID" value={filters.id} onChange={(e) => setFilters({ ...filters, id: e.target.value })} /></div></label>
      <label><span>Customer name</span><input placeholder="Search name" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} /></label>
      <label><span>Phone number</span><input type="tel" placeholder="Search phone" value={filters.phone} onChange={(e) => setFilters({ ...filters, phone: e.target.value })} /></label>
      <label><span>Booking date from</span><input type="date" value={filters.bookingFrom} onChange={(e) => setFilters({ ...filters, bookingFrom: e.target.value })} /></label>
      <label><span>Booking date to</span><input type="date" value={filters.bookingTo} onChange={(e) => setFilters({ ...filters, bookingTo: e.target.value })} /></label>
      <label><span>Check-in from</span><input type="date" value={filters.checkInFrom} onChange={(e) => setFilters({ ...filters, checkInFrom: e.target.value })} /></label>
      <label><span>Check-in to</span><input type="date" value={filters.checkInTo} onChange={(e) => setFilters({ ...filters, checkInTo: e.target.value })} /></label>
      <label><span>Booking status</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>{statusOptions.map((status) => <option key={status} value={status}>{status === 'all' ? 'All statuses' : statusLabels[status]}</option>)}</select></label>
      <div className="booking-filter-actions"><button className="primary-action" type="submit" disabled={loading}><Search size={15} />Apply filters</button><button className="booking-clear-filter" type="button" onClick={clearFilters}>Clear</button></div>
    </form>
    {error && <p className="booking-admin-error" role="alert">{error}</p>}
    <div className="booking-admin-table-wrap"><table className="admin-data-table booking-admin-table"><thead><tr><th>Booking / Guest</th><th>Hotel & room</th><th>Stay dates</th><th>Amount / payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {bookings.map((booking) => <tr key={booking._id}><td><strong>{String(booking._id).slice(-8).toUpperCase()}</strong><small>{listLabel(booking)} · {booking.guestInfo?.phone || booking.user?.phone || 'No phone'}</small></td><td><strong>{booking.hotel?.name || 'Property'}</strong><small>{roomLabel(booking.room)}</small></td><td><strong>{prettyDate(booking.checkIn)}</strong><small>to {prettyDate(booking.checkOut)}</small></td><td><strong>{money(booking.totalPrice)}</strong><small>{booking.paymentMethod === 'online' ? `Online · ${booking.paymentStatus}` : 'Pay at hotel'}{booking.roomServiceTotal > 0 ? ` · Room dining ${money(booking.roomServiceTotal)}${booking.roomServiceSettledAt ? ' settled' : ' due'}` : ''}</small></td><td><StatusPill status={booking.status} /></td><td><div className="booking-row-actions"><button title="View booking" onClick={() => openDetails(booking)}><Eye size={15} /></button><button title="Modify booking" disabled={!['pending','booked','confirmed'].includes(booking.status)} onClick={() => openEdit(booking)}><Pencil size={15} /></button><button title="Download invoice" onClick={() => makeInvoice(booking)}><ArrowDownToLine size={15} /></button></div></td></tr>)}
      {!bookings.length && <tr><td colSpan="6" className="booking-admin-empty">{loading ? 'Loading bookings…' : 'No bookings match these filters.'}</td></tr>}
    </tbody></table></div>
    <div className="booking-pagination"><span>{bookingTotal ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, bookingTotal)} of ${bookingTotal} bookings` : '0 bookings'}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => load(page - 1)}><ChevronLeft size={16} />Previous</button><span>Page {page} of {Math.max(bookingPages, 1)}</span><button type="button" disabled={page >= bookingPages || loading} onClick={() => load(page + 1)}>Next<ChevronRight size={16} /></button></div></div>

    {dialog && <div className="booking-dialog-backdrop" role="presentation" onClick={() => setDialog('')}><section className="booking-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <header><div><p>STAYNEST RESERVATION</p><h2>{dialog === 'details' ? 'Booking details' : dialog === 'edit' ? 'Modify booking' : 'Assign a room'}</h2></div><button type="button" aria-label="Close" onClick={() => setDialog('')}><X size={20} /></button></header>
      {dialog === 'details' && selected && <><div className="booking-detail-ref">BOOKING ID <strong>{selected._id}</strong><StatusPill status={selected.status} /></div><div className="booking-detail-grid"><div><span><UserRound size={15} /> Guest</span><strong>{selected.guestInfo?.name || selected.user?.name || 'Guest'}</strong><small>{selected.guestInfo?.email || selected.user?.email}</small><small><Phone size={12} /> {selected.guestInfo?.phone || selected.user?.phone || '—'}</small></div><div><span><MapPin size={15} /> Property & room</span><strong>{selected.hotel?.name}</strong><small>{[selected.hotel?.address, selected.hotel?.city, selected.hotel?.country].filter(Boolean).join(', ')}</small><small>{roomLabel(selected.room)}</small></div><div><span><CalendarDays size={15} /> Stay</span><strong>{prettyDate(selected.checkIn)} – {prettyDate(selected.checkOut)}</strong><small>{selected.guests} guests</small></div><div><span><FileText size={15} /> Payment</span><strong>{money(selected.totalPrice)}</strong><small>{selected.paymentMethod === 'online' ? `Prepaid online · ${selected.paymentStatus}` : `Pay at hotel · ${selected.paymentStatus}`}</small><small>Created {prettyDate(selected.createdAt)}</small></div></div>{selected.roomServiceTotal > 0 && <div className="booking-requests"><span>Room dining bill</span><p>{money(selected.roomServiceTotal)} · {selected.roomServiceSettledAt ? `Settled ${prettyDate(selected.roomServiceSettledAt)}` : 'Outstanding at checkout'} · Balance due {money((selected.paymentMethod === 'online' && selected.paymentStatus === 'paid' ? 0 : Number(selected.totalPrice || 0)) + (selected.roomServiceSettledAt ? 0 : Number(selected.roomServiceTotal || 0)))}</p></div>}{selected.guestInfo?.requests && <div className="booking-requests"><span>Guest requests</span><p>{selected.guestInfo.requests}</p></div>}
        <div className="booking-dialog-actions"><button disabled={actionLoading} onClick={() => makeInvoice(selected)}><ArrowDownToLine size={15} />Download invoice</button>{selected.status === 'pending' && <button className="confirm" disabled={actionLoading} onClick={() => runStatus(selected, 'confirmed')}><Check size={15} />Confirm booking</button>}{['confirmed','booked'].includes(selected.status) && <button disabled={actionLoading} onClick={() => runStatus(selected, 'checked-in')}>Check in</button>}{selected.status === 'checked-in' && <button disabled={actionLoading} onClick={() => runStatus(selected, 'checked-out')}>Check out</button>}{selected.roomServiceTotal > 0 && !selected.roomServiceSettledAt && ['checked-in','checked-out','completed'].includes(selected.status) && <button disabled={actionLoading} onClick={() => settleDiningBill(selected)}>Settle room dining · {money(selected.roomServiceTotal)}</button>}{selected.status === 'checked-out' && <button disabled={actionLoading} onClick={() => runStatus(selected, 'completed')}>Complete stay</button>}{['pending','booked','confirmed'].includes(selected.status) && <><button disabled={actionLoading} onClick={() => runStatus(selected, 'no-show')}>Mark no-show</button><button className="danger" disabled={actionLoading} onClick={() => runStatus(selected, 'rejected')}>Reject</button><button className="danger" disabled={actionLoading} onClick={() => runStatus(selected, 'cancelled')}>Cancel</button></>}</div></>}
      {dialog === 'edit' && selected && <form className="booking-edit-form" onSubmit={saveModification}><p className="booking-edit-hint">Paid reservations can only be changed when the updated total matches the captured amount.</p><label>Check-in<input required type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></label><label>Check-out<input required type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></label><label>Guest count<input required type="number" min="1" max={selected.room?.capacity || 10} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} /></label><label>Guest name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Phone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><div className="booking-dialog-actions"><button type="button" onClick={() => setDialog('')}>Cancel</button><button className="confirm" type="submit" disabled={actionLoading}>{actionLoading ? 'Saving…' : 'Save booking'}</button></div></form>}
      {dialog === 'room' && selected && <form className="booking-edit-form" onSubmit={saveRoom}><p className="booking-edit-hint">Choose an available room from {selected.hotel?.name || 'this hotel'}. Dates and capacity will be checked before assignment.</p><label className="booking-room-select">Room<select required value={roomId} onChange={(e) => setRoomId(e.target.value)}><option value="">Choose a room</option>{rooms.filter((room) => String(room.hotel?._id || room.hotel) === String(selected.hotel?._id || selected.hotel) && !['Maintenance','Inactive','Cleaning'].includes(room.status)).map((room) => <option key={room._id} value={room._id}>{roomLabel(room)} · {money(room.discountPrice ?? room.pricePerNight)}/night</option>)}</select></label><div className="booking-dialog-actions"><button type="button" onClick={() => setDialog('')}>Cancel</button><button className="confirm" type="submit" disabled={actionLoading || !roomId}>{actionLoading ? 'Assigning…' : 'Assign room'}</button></div></form>}
      {error && dialog && <p className="booking-admin-error" role="alert">{error}</p>}
      {dialog === 'details' && selected && ['pending','booked','confirmed'].includes(selected.status) && <div className="booking-secondary-actions"><button onClick={() => openEdit(selected)}><Pencil size={14} />Modify stay</button><button onClick={() => openAssignRoom(selected)}><RefreshCw size={14} />Assign room</button></div>}
    </section></div>}
    {actionLoading && !dialog && <span className="booking-admin-loading" role="status">Updating booking…</span>}
  </div>;
};

export default BookingManagement;
