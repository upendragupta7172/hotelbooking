import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import Modal from '../common/Modal';
import './RoomService.css';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function RoomService({ booking, onClose }) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('room-bill');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const total = useMemo(
    () =>
      menu.reduce(
        (sum, item) => sum + Number(item.price) * Number(quantities[item._id] || 0),
        0
      ),
    [menu, quantities]
  );

  const loadOrders = async () =>
    setOrders(await api.get(`/api/in-room-dining/${booking.id}/orders`));

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/api/in-room-dining/${booking.id}/menu`),
      api.get(`/api/in-room-dining/${booking.id}/orders`),
    ])
      .then(([menuData, orderData]) => {
        if (active) {
          setMenu(menuData.menu || []);
          setOrders(orderData);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load the hotel menu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [booking.id]);

  const placeOrder = async () => {
    const items = Object.entries(quantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity: Number(quantity),
      }));
    if (!items.length) {
      setError('Choose at least one dish.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await api.post(`/api/in-room-dining/${booking.id}/orders`, {
        items,
        paymentMethod,
      });
      if (paymentMethod === 'room-bill') {
        setNotice(
          'Order placed and added to your room bill. It will be settled at checkout.'
        );
        setQuantities({});
        await loadOrders();
        setSubmitting(false);
        return;
      }
      const ready = await loadRazorpay();
      if (!ready)
        throw new Error(
          'Razorpay checkout could not load. Check your connection and try again.'
        );
      const checkout = new window.Razorpay({
        key: result.razorpay.keyId,
        amount: result.razorpay.order.amount,
        currency: result.razorpay.order.currency,
        name: 'StayNest',
        description: `Room service · ${booking.hotelName}`,
        order_id: result.razorpay.order.id,
        prefill: {
          name: booking.guestInfo?.name,
          email: booking.guestInfo?.email,
          contact: booking.guestInfo?.phone,
        },
        theme: { color: '#18394f' },
        handler: async (response) => {
          try {
            await api.post(
              `/api/in-room-dining/${booking.id}/orders/${result.order._id}/confirm-payment`,
              response
            );
            setNotice(
              'Payment confirmed. Your room service order has been placed.'
            );
            setQuantities({});
            await loadOrders();
          } catch (err) {
            setError(
              `${err.message || 'Payment confirmation is pending.'} Your order reference is ${String(result.order._id).slice(-8).toUpperCase()}.`
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      checkout.on('payment.failed', (response) => {
        setError(
          response.error?.description ||
            'Payment failed. You can try placing the order again.'
        );
        setSubmitting(false);
      });
      checkout.open();
    } catch (err) {
      setError(err.message || 'Could not place the order.');
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Order room service">
      <div className="room-service-modal">
        <p className="room-service-context">
          {booking.hotelName} · Room {booking.roomNumber || booking.roomName}
        </p>

        {error && (
          <p className="room-service-message error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="room-service-message success" role="status">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="room-service-empty">Loading this hotel's menu…</p>
        ) : error ? null : !menu.length ? (
          <p className="room-service-empty">
            This hotel hasn't added any available dishes to its menu yet.
          </p>
        ) : (
          <div className="room-service-dishes">
            {menu.map((item) => (
              <article className="room-service-dish" key={item._id}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="room-service-dish-placeholder">
                    {item.category}
                  </div>
                )}
                <div className="room-service-dish-info">
                  <span
                    className={`food-category ${item.category === 'Veg' ? 'veg' : 'nonveg'}`}
                  >
                    {item.category}
                  </span>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <b>{money(item.price)}</b>
                </div>
                <div className="food-quantity">
                  <button
                    type="button"
                    aria-label={`Remove one ${item.name}`}
                    disabled={!quantities[item._id]}
                    onClick={() =>
                      setQuantities((current) => ({
                        ...current,
                        [item._id]: Math.max(0, Number(current[item._id] || 0) - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <span>{quantities[item._id] || 0}</span>
                  <button
                    type="button"
                    aria-label={`Add one ${item.name}`}
                    onClick={() =>
                      setQuantities((current) => ({
                        ...current,
                        [item._id]: Math.min(20, Number(current[item._id] || 0) + 1),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!!orders.length && (
          <section className="room-service-history">
            <h3>Your room service orders</h3>
            {orders.map((order) => (
              <article key={order._id}>
                <div>
                  <strong>
                    {order.items
                      .map((item) => `${item.quantity}× ${item.name}`)
                      .join(', ')}
                  </strong>
                  <small>
                    {order.status.replace('-', ' ')} ·{' '}
                    {order.paymentMethod === 'room-bill'
                      ? `Room bill · ${order.paymentStatus === 'paid' ? 'settled' : 'due at checkout'}`
                      : `Online ${order.paymentStatus}`}
                  </small>
                </div>
                <b>{money(order.total)}</b>
              </article>
            ))}
          </section>
        )}

        <div className="room-service-checkout">
          <label className="room-service-payment-label">
            <span>Settle this order</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="room-bill">
                Add to room bill · pay at checkout
              </option>
              <option value="online">Pay online · Razorpay</option>
            </select>
          </label>
          <div className="room-service-checkout-actions">
            <div className="room-service-total">
              <span>Order total</span>
              <strong>{money(total)}</strong>
            </div>
            <button
              type="button"
              className="room-service-submit"
              disabled={loading || submitting || !menu.length || total <= 0}
              onClick={placeOrder}
            >
              {submitting
                ? 'Processing…'
                : paymentMethod === 'online'
                  ? 'Pay & place order'
                  : 'Place order to room bill'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}