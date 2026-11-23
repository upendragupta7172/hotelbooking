import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, Landmark } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { api } from '../utils/api';
import { getBookingPrice } from '../utils/booking';
import BookingSummary from '../components/common/BookingSummary';
import CheckoutCoupons from '../components/common/CheckoutCoupons';
import SiteLayout from '../components/common/SiteLayout';

const paymentOptions = [
  { id: 'online', label: 'Prepaid · Razorpay', description: 'Pay securely online and confirm your booking now.', Icon: CreditCard },
  { id: 'hotel', label: 'Pay at Hotel', description: 'Reserve now and pay at the property during check-in.', Icon: Landmark },
];

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const existing = document.querySelector('script[data-razorpay-checkout]');
  if (existing) {
    existing.addEventListener('load', () => resolve(true), { once: true });
    existing.addEventListener('error', () => resolve(false), { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.dataset.razorpayCheckout = 'true';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

function CheckoutPage() {
  const { selectedHotel, selectedRoom, guestInfo, searchParams, addBooking, saveBooking } = useContext(BookingContext);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [recoveryPaymentId, setRecoveryPaymentId] = useState('');
  const [pendingPayment, setPendingPayment] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('staynest.pendingPaymentConfirmation') || 'null'); }
    catch { return null; }
  });
  const navigate = useNavigate();

  if (!selectedHotel || !selectedRoom || !guestInfo.name) return <Navigate to="/booking" replace />;

  const { nights, roomCount, subtotal, taxes, total } = getBookingPrice(selectedRoom, searchParams);
  const bookingPayload = {
    roomId: selectedRoom._id || selectedRoom.id,
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
    guests: Number(searchParams.adults || searchParams.guests || 1),
    rooms: 1,
    packageId: selectedRoom.packageId || undefined,
    couponCode: appliedCoupon?.coupon.code || undefined,
    guestInfo,
  };

  const confirm = (booking) => navigate(`/booking/success/${booking.id}`, { replace: true, state: { booking } });

  const retryConfirmation = async (paymentData = pendingPayment) => {
    if (!paymentData) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await api.post('/api/bookings/checkout', paymentData);
      sessionStorage.removeItem('staynest.pendingPaymentConfirmation');
      setPendingPayment(null);
      confirm(saveBooking(result.booking));
    } catch (err) {
      setError(err.message || 'Payment was received, but booking confirmation is still pending. Retry confirmation; do not pay again.');
      setIsSubmitting(false);
    }
  };

  const recoverByPaymentId = async () => {
    if (!recoveryPaymentId.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await api.post('/api/bookings/recover-payment', { ...bookingPayload, paymentId: recoveryPaymentId.trim() });
      sessionStorage.removeItem('staynest.pendingPaymentConfirmation');
      setPendingPayment(null);
      confirm(saveBooking(result.booking));
    } catch (err) {
      setError(err.message || 'Could not recover the paid booking. Check the payment ID and try again.');
      setIsSubmitting(false);
    }
  };

  const completeBooking = async (event) => {
    event.preventDefault();
    if (pendingPayment) return retryConfirmation();
    setIsSubmitting(true);
    setError('');
    if (paymentMethod === 'hotel') {
      try {
        const booking = await addBooking(bookingPayload);
        confirm(booking);
      } catch (err) {
        setError(err.message || 'Could not reserve this room. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const checkoutReady = await loadRazorpay();
      if (!checkoutReady) throw new Error('Razorpay checkout could not load. Check your internet connection and try again.');
      const { order, keyId } = await api.post('/api/payments/create', bookingPayload);
      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'StayNest',
        description: `${selectedHotel.name} · ${selectedRoom.name} · ${nights} ${nights === 1 ? 'night' : 'nights'}`,
        order_id: order.id,
        prefill: { name: guestInfo.name, email: guestInfo.email, contact: guestInfo.phone },
        theme: { color: '#6553d8' },
        handler: async (response) => {
          const paymentData = {
            ...bookingPayload,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          };
          sessionStorage.setItem('staynest.pendingPaymentConfirmation', JSON.stringify(paymentData));
          setPendingPayment(paymentData);
          await retryConfirmation(paymentData);
        },
        modal: { ondismiss: () => setIsSubmitting(false) },
      });
      checkout.open();
    } catch (err) {
      setError(err.message || 'Could not start online payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <main className="checkout-page">
        <div className="page-banner booking-banner">
          <div className="section-shell">
            <p className="eyebrow"><Link to="/booking">YOUR BOOKING</Link><span> / </span> CHECKOUT</p>
            <h1>One last detail.<br /><em>Then it’s yours.</em></h1>
          </div>
        </div>
        <div className="section-shell checkout-layout">
          <section className="checkout-panel">
            <p className="eyebrow">SECURE CHECKOUT</p>
            <h2>Choose how you’d like to pay.</h2>
            <p className="checkout-explainer"><BadgeCheck size={17} /> Online payments are handled securely by Razorpay. StayNest does not store card details.</p>
            <form onSubmit={completeBooking}>
              <CheckoutCoupons
                booking={{
                  roomId: bookingPayload.roomId,
                  checkIn: bookingPayload.checkIn,
                  checkOut: bookingPayload.checkOut,
                  guests: bookingPayload.guests,
                  rooms: bookingPayload.rooms,
                  packageId: bookingPayload.packageId,
                }}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
              />
              <fieldset className="payment-options">
                <legend className="sr-only">Payment method</legend>
                {paymentOptions.map(({ id, label, description, Icon }) => (
                  <label className={`payment-option ${paymentMethod === id ? 'payment-option-selected' : ''}`} key={id}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} />
                    <Icon size={20} />
                    <span><strong>{label}</strong><small>{description}</small></span>
                    <i aria-hidden="true" />
                  </label>
                ))}
              </fieldset>
              <div className="payment-method-note">
                {paymentMethod === 'online' && <p><strong>Prepaid booking selected.</strong> After Razorpay verifies payment, the hotel reviews and confirms your reservation.</p>}
                {paymentMethod === 'hotel' && <p><strong>Pay at hotel selected.</strong> Your reservation will be confirmed now; payment is due at check-in.</p>}
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {pendingPayment && <p className="payment-method-note" role="status">Payment was received. Retry booking confirmation below if needed; this will not charge you again.</p>}
              {!pendingPayment && paymentMethod === 'online' && <details className="payment-recovery"><summary>Already paid but booking is not confirmed?</summary><p>Enter the Razorpay payment ID from your payment receipt to verify it and recover the booking. This will not create another charge.</p><label>Razorpay payment ID<input value={recoveryPaymentId} onChange={(event) => setRecoveryPaymentId(event.target.value)} placeholder="pay_…" /></label><button type="button" className="button button-outline" onClick={recoverByPaymentId} disabled={isSubmitting || !recoveryPaymentId.trim()}>{isSubmitting ? 'Verifying payment…' : 'Recover booking'}</button></details>}
              <div className="checkout-actions">
                <Link className="button button-outline" to="/booking"><ArrowLeft size={15} /> Back to review</Link>
                <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : pendingPayment ? 'Retry confirmation (no new charge)' : paymentMethod === 'online' ? 'Pay & Confirm Booking' : 'Confirm & Pay at Hotel'} <ArrowRight size={15} /></button>
              </div>
            </form>
          </section>
          <BookingSummary
            hotel={selectedHotel}
            room={selectedRoom}
            guestInfo={guestInfo}
            searchParams={searchParams}
            couponCode={appliedCoupon?.coupon.code}
            couponDiscount={appliedCoupon?.discountAmount}
          />
        </div>
      </main>
    </SiteLayout>
  );
}

export default CheckoutPage;
