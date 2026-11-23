import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { api } from '../../utils/api';
import './FoodOrdersManagement.css';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function FoodOrdersManagement() {
  const { foodNotifications, fetchFoodNotifications, markFoodNotificationsRead } = useContext(AdminContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const query = filter ? `?status=${encodeURIComponent(filter)}` : ''; const data = await api.get(`/api/admin/food-orders${query}`); setOrders(data); } catch (err) { setError(err.message || 'Could not load room service orders.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    if (!foodNotifications.orders.length) return;
    const ids = foodNotifications.orders.map((order) => order._id);
    (async () => {
      try { await markFoodNotificationsRead(ids); await fetchFoodNotifications(); }
      catch (err) { console.error('Could not mark room service notifications as read', err); }
    })();
  }, [foodNotifications.orders]);
  const update = async (order, status) => { setUpdating(order._id); setError(''); try { const result = await api.put(`/api/admin/food-orders/${order._id}/status`, { status }); setOrders((current) => current.map((item) => item._id === order._id ? result : item)); } catch (err) { setError(err.message || 'Could not update this order.'); } finally { setUpdating(''); } };
  return <div className="admin-content">
    <div className="section-toolbar"><div><h2>Room service orders</h2><p>Incoming guest orders with hotel, room, payment, and preparation status.</p></div><select aria-label="Filter food orders" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All orders</option>{['placed', 'preparing', 'ready', 'delivered', 'payment-pending', 'payment-failed'].map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}</select></div>
    {error && <p className="admin-form-error">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-data-table"><thead><tr><th>Order / guest</th><th>Hotel / room</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th><th>Action</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order._id}><td><div className="property-cell"><strong>#{order._id.slice(-8).toUpperCase()}</strong><small>{order.user?.name || order.user?.email || 'Guest'}</small></div></td><td><div className="property-cell"><strong>{order.hotel?.name || 'Hotel'}</strong><small>Room {order.roomNumber || order.room?.roomNumber || order.room?.name || '—'}</small></div></td><td><div className="food-order-lines">{order.items.map((item, index) => <span key={`${item.menuItemId}-${index}`}>{item.quantity}× {item.name}</span>)}</div></td><td>{money(order.total)}</td><td>{order.paymentMethod === 'room-bill' ? 'Room bill' : `${order.paymentStatus} · online`}</td><td><span className={`status-pill food-status-${order.status}`}>{order.status.replace('-', ' ')}</span></td><td>{dateTime(order.createdAt)}</td><td>{['placed', 'preparing', 'ready'].includes(order.status) && <select aria-label={`Update order ${order._id} status`} disabled={updating === order._id} value={order.status} onChange={(event) => update(order, event.target.value)}>{['placed', 'preparing', 'ready', 'delivered'].map((status) => <option key={status} value={status}>{status}</option>)}</select>}</td></tr>)}
      {!loading && !orders.length && <tr><td className="table-empty" colSpan="8">No room service orders found.</td></tr>}{loading && <tr><td className="table-empty" colSpan="8">Loading orders…</td></tr>}
    </tbody></table></div>
  </div>;
}
