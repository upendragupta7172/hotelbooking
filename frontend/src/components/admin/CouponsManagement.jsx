import React, { useEffect, useState } from 'react';
import { BadgePercent, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '../../utils/api';
import './CouponsManagement.css';

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minBookingAmount: '0',
  maxDiscountAmount: '0',
  applicableHotel: '',
  applicableCategory: '',
  usageLimit: '0',
  expiryDate: '',
};

const toLocalDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(value) || 0);

const offerLabel = (coupon) => coupon.discountType === 'percentage'
  ? `${coupon.discountValue}% off${coupon.maxDiscountAmount ? ` · up to ${money(coupon.maxDiscountAmount)}` : ''}`
  : `${money(coupon.discountValue)} off`;

function CouponsManagement() {
  const [coupons, setCoupons] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [occupancyError, setOccupancyError] = useState('');
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [loadingOccupancy, setLoadingOccupancy] = useState(true);

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      setCoupons(await api.get('/api/coupons/admin'));
    } catch (err) {
      setError(err.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    setLoadingReferences(true);
    setReferenceError('');
    const [hotelResult, categoryResult] = await Promise.allSettled([
      api.get('/api/admin/hotels'),
      api.get('/api/categories'),
    ]);
    if (hotelResult.status === 'fulfilled') setHotels(hotelResult.value);
    else setReferenceError(hotelResult.reason.message || 'Could not load hotels from the database.');
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
    else setReferenceError((current) => [current, categoryResult.reason.message || 'Could not load room categories from the database.'].filter(Boolean).join(' '));
    setLoadingReferences(false);
  };

  const loadOccupancy = async () => {
    setLoadingOccupancy(true);
    setOccupancyError('');
    try {
      setOccupancy(await api.get('/api/coupons/admin/occupancy'));
    } catch (err) {
      setOccupancyError(err.message || 'Could not load current occupancy.');
    } finally {
      setLoadingOccupancy(false);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadReferenceData();
    loadOccupancy();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(loadOccupancy, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
    setError('');
    setNotice('');
  };

  const editCoupon = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minBookingAmount: String(coupon.minBookingAmount),
      maxDiscountAmount: String(coupon.maxDiscountAmount),
      applicableHotel: coupon.applicableHotel || '',
      applicableCategory: coupon.applicableCategory || '',
      usageLimit: String(coupon.usageLimit),
      expiryDate: toLocalDateTime(coupon.expiryDate),
    });
    setError('');
    setNotice('');
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minBookingAmount: Number(form.minBookingAmount),
        maxDiscountAmount: Number(form.maxDiscountAmount || 0),
        applicableHotel: form.applicableHotel || null,
        applicableCategory: form.applicableCategory || null,
        usageLimit: Number(form.usageLimit || 0),
        expiryDate: new Date(form.expiryDate).toISOString(),
      };
      const saved = editingId
        ? await api.put(`/api/coupons/admin/${editingId}`, payload)
        : await api.post('/api/coupons/admin', payload);
      setCoupons((current) => editingId
        ? current.map((coupon) => coupon._id === editingId ? saved : coupon)
        : [saved, ...current]);
      if (form.applicableHotel) await loadOccupancy();
      setNotice(editingId ? 'Coupon updated.' : 'Coupon created.');
      setForm(emptyForm);
      setEditingId('');
    } catch (err) {
      setError(err.message || 'Could not save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    setDeletingId(coupon._id);
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/coupons/admin/${coupon._id}`);
      setCoupons((current) => current.filter((item) => item._id !== coupon._id));
      if (editingId === coupon._id) resetForm();
      setNotice(`${coupon.code} deleted.`);
    } catch (err) {
      setError(err.message || 'Could not delete coupon.');
    } finally {
      setDeletingId('');
    }
  };

  const minExpiry = toLocalDateTime(Date.now() + 60000);
  const hotelNameById = new Map(hotels.map((hotel) => [String(hotel._id), hotel.name]));
  const categoryNameById = new Map(categories.map((category) => [String(category._id), category.name]));
  const refresh = () => Promise.all([loadCoupons(), loadReferenceData(), loadOccupancy()]);

  return (
    <div className="admin-content coupon-admin">
      <div className="section-toolbar">
        <div><h2>Promo codes</h2><p>Create and manage checkout discounts.</p></div>
        <button className="refresh-button" type="button" onClick={refresh} disabled={loading || loadingOccupancy || loadingReferences}><RefreshCw size={15} /> Refresh</button>
      </div>
      {(error || notice) && <p className={`coupon-admin-message ${error ? 'is-error' : 'is-success'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}

      <section className="coupon-occupancy-strip" aria-label="Current hotel room occupancy">
        <div className="coupon-occupancy-title"><BadgePercent size={16} /><strong>Occupancy insight</strong><span>Live room inventory</span></div>
        {loadingOccupancy && <p className="coupon-occupancy-note">Loading current room inventory…</p>}
        {occupancyError && <p className="coupon-occupancy-note coupon-occupancy-error" role="alert">{occupancyError}</p>}
        {!loadingOccupancy && !occupancyError && occupancy.length === 0 && <p className="coupon-occupancy-note">No room inventory is available to summarize yet.</p>}
        {!loadingOccupancy && !occupancyError && occupancy.length > 0 && (
          <div className="coupon-occupancy-list">
            {occupancy.map((item) => (
              <p key={item.hotelId}>
                <strong>{item.hotelName}</strong> has <b>{item.availableRooms}/{item.totalRooms} rooms available</b>
                {item.bookedRooms > 0 && <> · {item.bookedRooms} currently booked/occupied</>}
                {item.availableRooms > 0 ? ' — consider a targeted discount.' : ' — no currently available inventory for a discount.'}
              </p>
            ))}
          </div>
        )}
      </section>
      {referenceError && <p className="coupon-admin-message is-error" role="alert">{referenceError} Targeting choices require database data; “All” remains available.</p>}

      <div className="coupon-admin-layout">
        <form className="coupon-admin-form" onSubmit={saveCoupon}>
          <div className="coupon-admin-form-heading">
            <div><BadgePercent size={17} /><strong>{editingId ? 'Edit coupon' : 'Create coupon'}</strong></div>
            {editingId && <button type="button" aria-label="Cancel edit" onClick={resetForm}><X size={15} /></button>}
          </div>
          <label>Coupon code<input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} minLength="3" maxLength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" placeholder="e.g. WELCOME500" required /></label>
          <div className="coupon-admin-form-row">
            <label>Discount type<select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}><option value="percentage">Percentage</option><option value="flat">Flat amount</option></select></label>
            <label>{form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}<input type="number" min="0.01" max={form.discountType === 'percentage' ? '100' : undefined} step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} required /></label>
          </div>
          <label>Minimum booking amount (₹)<input type="number" min="0" step="1" value={form.minBookingAmount} onChange={(event) => setForm((current) => ({ ...current, minBookingAmount: event.target.value }))} required /></label>
          {form.discountType === 'percentage' && <label>Maximum discount cap (₹)<input type="number" min="0" step="1" value={form.maxDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maxDiscountAmount: event.target.value }))} /><small>Set to 0 for no cap.</small></label>}
          <div className="coupon-admin-form-row">
            <label>Applicable Hotel<select value={form.applicableHotel} onChange={(event) => setForm((current) => ({ ...current, applicableHotel: event.target.value }))}><option value="">All Hotels</option>{hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.name}</option>)}</select>{loadingReferences && <small>Loading hotels from the database…</small>}</label>
            <label>Applicable Room Category<select value={form.applicableCategory} onChange={(event) => setForm((current) => ({ ...current, applicableCategory: event.target.value }))}><option value="">All Categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>{loadingReferences && <small>Loading categories from the database…</small>}</label>
          </div>
          <div className="coupon-admin-form-row coupon-admin-limit-expiry-row">
            <label>Usage limit<input type="number" min="0" step="1" value={form.usageLimit} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))} /><small>0 means unlimited.</small></label>
            <label>Expires at<input className="coupon-admin-expiry-input" type="datetime-local" min={minExpiry} value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} required /></label>
          </div>
          <button className="primary-action coupon-admin-save" type="submit" disabled={saving}>{saving ? 'Saving…' : <><Plus size={15} />{editingId ? 'Save changes' : 'Create coupon'}</>}</button>
        </form>

        <section className="coupon-admin-list">
          <div className="coupon-admin-list-heading"><h3>Coupons</h3><span>{coupons.length} total</span></div>
          {loading && <p className="coupon-admin-empty">Loading coupons…</p>}
          {!loading && coupons.length === 0 && <p className="coupon-admin-empty">No coupons yet. Create one to make it available at checkout.</p>}
          {!loading && coupons.length > 0 && (
            <div className="coupon-admin-table-wrap">
              <table className="coupon-admin-table">
                <thead><tr><th>Code</th><th>Offer</th><th>Applies to</th><th>Minimum</th><th>Expires</th><th>Uses</th><th>Actions</th></tr></thead>
                <tbody>{coupons.map((coupon) => {
                  const expired = new Date(coupon.expiryDate) <= new Date();
                  const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
                  return (
                    <tr key={coupon._id}>
                      <td><strong>{coupon.code}</strong><small className={expired || limitReached ? 'coupon-status-inactive' : 'coupon-status-active'}>{expired ? 'Expired' : limitReached ? 'Limit reached' : 'Active'}</small></td>
                      <td>{offerLabel(coupon)}</td>
                      <td>{[hotelNameById.get(coupon.applicableHotel) || (coupon.applicableHotel ? 'Hotel unavailable' : ''), categoryNameById.get(coupon.applicableCategory) || (coupon.applicableCategory ? 'Category unavailable' : '')].filter(Boolean).join(' · ') || 'All hotels & categories'}</td>
                      <td>{money(coupon.minBookingAmount)}</td>
                      <td>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(coupon.expiryDate))}</td>
                      <td>{coupon.usedCount}/{coupon.usageLimit || '∞'}</td>
                      <td><div className="coupon-admin-actions"><button type="button" aria-label={`Edit ${coupon.code}`} onClick={() => editCoupon(coupon)}><Pencil size={14} /></button><button type="button" aria-label={`Delete ${coupon.code}`} onClick={() => deleteCoupon(coupon)} disabled={deletingId === coupon._id}><Trash2 size={14} /></button></div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CouponsManagement;
