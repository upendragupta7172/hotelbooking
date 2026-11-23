import React, { useEffect, useState } from 'react';
import { BadgePercent, Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { api } from '../../utils/api';
import { formatPrice } from '../../data/hotels';

const offerLabel = (coupon) => coupon.discountType === 'percentage'
  ? `${coupon.discountValue}% off${coupon.maxDiscountAmount ? ` up to ${formatPrice(coupon.maxDiscountAmount)}` : ''}`
  : `${formatPrice(coupon.discountValue)} off`;
const scopeLabel = (coupon) => [coupon.applicableHotelName, coupon.applicableCategoryName]
  .filter(Boolean)
  .join(' · ');

function CheckoutCoupons({ booking, appliedCoupon, onApply }) {
  const [code, setCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponListError, setCouponListError] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/api/coupons')
      .then((coupons) => { if (active) setAvailableCoupons(coupons); })
      .catch((err) => { if (active) setCouponListError(err.message || 'Could not load coupons.'); })
      .finally(() => { if (active) setLoadingCoupons(false); });
    return () => { active = false; };
  }, []);

  const applyCode = async (value = code) => {
    const candidate = value.trim();
    if (!candidate) {
      setError('Enter a coupon code.');
      setSuccess('');
      return;
    }
    if (appliedCoupon && candidate.toUpperCase() !== appliedCoupon.coupon.code) onApply(null);

    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.post('/api/coupons/validate', { ...booking, code: candidate });
      onApply(result);
      setCode(result.coupon.code);
      setSuccess(`Coupon applied successfully! You saved ${formatPrice(result.discountAmount)}.`);
    } catch (err) {
      setError(err.message || 'Could not apply this coupon.');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    onApply(null);
    setCode('');
    setError('');
    setSuccess('');
  };
  const isAppliedCode = appliedCoupon?.coupon.code === code.trim().toUpperCase();

  return (
    <section className="checkout-coupons" aria-label="Coupon and promo codes">
      <div className="checkout-coupon-heading"><span><BadgePercent size={17} /> Apply Coupon</span>{appliedCoupon && <span className="coupon-applied-label"><Check size={13} /> Applied</span>}</div>
      <div className="checkout-coupon-entry">
        <input
          aria-label="Coupon code"
          autoComplete="off"
          maxLength={32}
          placeholder="Enter promo code"
          value={code}
          onChange={(event) => {
            const nextCode = event.target.value;
            setCode(nextCode);
            setError('');
            setSuccess('');
            if (appliedCoupon && nextCode.trim().toUpperCase() !== appliedCoupon.coupon.code) onApply(null);
          }}
          disabled={applying}
        />
        {isAppliedCode ? (
          <button type="button" className="coupon-remove-button" onClick={removeCoupon} disabled={applying}><X size={14} /> Remove</button>
        ) : (
          <button type="button" className="button button-primary coupon-apply-button" onClick={() => applyCode()} disabled={applying || !code.trim()}>
            {applying ? <><LoaderCircle size={14} className="spin" /> Applying…</> : 'Apply'}
          </button>
        )}
      </div>
      {error && <p className="coupon-message coupon-error" role="alert">{error}</p>}
      {success && <p className="coupon-message coupon-success" role="status">{success}</p>}

      <details className="available-coupons">
        <summary><span>Available Coupons for You</span><ChevronDown size={15} /></summary>
        {loadingCoupons && <p className="coupon-list-note">Loading available coupons…</p>}
        {couponListError && <p className="coupon-message coupon-error" role="alert">{couponListError}</p>}
        {!loadingCoupons && !couponListError && availableCoupons.length === 0 && <p className="coupon-list-note">No active coupons are available right now.</p>}
        {!loadingCoupons && availableCoupons.length > 0 && (
          <ul>
            {availableCoupons.map((coupon) => (
              <li key={coupon._id}>
                <div><strong>{coupon.code}</strong><span>{offerLabel(coupon)}</span>{scopeLabel(coupon) && <small>For {scopeLabel(coupon)}</small>}{coupon.minBookingAmount > 0 && <small>Min. booking {formatPrice(coupon.minBookingAmount)}</small>}</div>
                <button type="button" onClick={() => { setCode(coupon.code); void applyCode(coupon.code); }} disabled={applying}>
                  {appliedCoupon?.coupon.code === coupon.code ? 'Applied' : 'Apply'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}

export default CheckoutCoupons;
