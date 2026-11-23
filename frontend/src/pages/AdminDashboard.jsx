// import React, { useContext, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowDownRight, ArrowUpRight, BadgePercent, BedDouble, Bell, Building2, CalendarCheck, CalendarDays, CircleDollarSign, Clock3, LayoutDashboard, LogOut, Plus, RefreshCw, Search, Sparkles, Tags, WalletCards, X, Utensils } from 'lucide-react';
// import { AdminContext } from '../context/AdminContext';
// import { useAuth } from '../context/AuthContext';
// import HotelForm from '../components/admin/HotelForm';
// import RoomForm from '../components/admin/RoomForm';
// import CategoryForm from '../components/admin/CategoryForm';
// import AmenityForm from '../components/admin/AmenityForm';
// import BookingManagement from '../components/admin/BookingManagement';
// import HotelMenuManager from '../components/admin/HotelMenuManager';
// import FoodOrdersManagement from '../components/admin/FoodOrdersManagement';
// import CouponsManagement from '../components/admin/CouponsManagement';
// import './AdminDashboard.css';

// const sections = [
//   { id: 'overview', label: 'Overview', icon: LayoutDashboard },
//   { id: 'hotels', label: 'Hotels', icon: Building2 },
//   { id: 'rooms', label: 'Rooms', icon: BedDouble },
//   { id: 'bookings', label: 'Bookings', icon: CalendarDays },
//   { id: 'coupons', label: 'Coupons', icon: BadgePercent },
//   { id: 'dining', label: 'Room service', icon: Utensils },
//   { id: 'categories', label: 'Categories', icon: Tags },
//   { id: 'amenities', label: 'Amenities', icon: Sparkles },
//   { id: 'refunds', label: 'Refund requests', icon: WalletCards },
// ];

// const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
// const date = (value) => value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
// const textOf = (value) => typeof value === 'object' && value !== null ? value.name || value.email || '—' : value ?? '—';

// function MetricCard({ label, value, icon: Icon, tone = 'blue', note }) {
//   return <article className={`admin-metric metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div><strong>{value ?? '—'}</strong>{note && <small>{note}</small>}</article>;
// }

// function RevenueChart({ data = [] }) {
//   const width = 680, height = 210, padX = 22, padY = 22;
//   const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
//   const points = data.map((item, index) => ({ ...item, x: data.length < 2 ? width / 2 : padX + index * (width - padX * 2) / (data.length - 1), y: height - padY - ((Number(item.value) || 0) / max) * (height - padY * 2) }));
//   const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
//   return <div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly revenue chart" className="line-chart">
//     {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={width} y1={padY + line * (height - padY * 2) / 3} y2={padY + line * (height - padY * 2) / 3} className="chart-gridline" />)}
//     {points.length > 1 && <path d={`${path} L ${points.at(-1).x} ${height - padY} L ${points[0].x} ${height - padY} Z`} className="chart-area" />}
//     <path d={path} className="chart-line" />
//     {points.map((point) => <g key={`${point.label}-${point.x}`}><circle cx={point.x} cy={point.y} r="4" className="chart-point" /><title>{point.label}: {money(point.value)}</title></g>)}
//   </svg><div className="chart-x-labels">{points.map((point) => <span key={`${point.label}-${point.x}`}>{point.label}</span>)}</div></div>;
// }

// function BookingChart({ data = [] }) {
//   const max = Math.max(...data.flatMap((item) => [item.booked || 0, item.cancelled || 0, item.completed || 0]), 1);
//   return <div className="booking-chart" role="img" aria-label="Monthly booking statistics chart">
//     {data.map((month, index) => <div className="booking-chart-month" key={`${month.label}-${index}`} title={`${month.label}: ${month.booked || 0} booked, ${month.completed || 0} completed, ${month.cancelled || 0} cancelled`}>
//       <div className="booking-bars"><i className="bar-booked" style={{ height: `${Math.max((month.booked || 0) / max * 100, 2)}%` }} /><i className="bar-completed" style={{ height: `${Math.max((month.completed || 0) / max * 100, 2)}%` }} /><i className="bar-cancelled" style={{ height: `${Math.max((month.cancelled || 0) / max * 100, 2)}%` }} /></div><small>{month.label}</small>
//     </div>)}
//   </div>;
// }

// function DataTable({ columns, rows, onEdit, onDelete, onMenu, empty }) {
//   return <div className="admin-table-wrap"><table className="admin-data-table"><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}{(onEdit || onDelete || onMenu) && <th>Actions</th>}</tr></thead>
//     <tbody>{rows.map((row) => <tr key={row._id}>{columns.map((column) => <td key={column.label}>{column.render ? column.render(row) : textOf(row[column.key])}</td>)}{(onEdit || onDelete || onMenu) && <td><div className="table-actions">{onMenu && <button className="icon-action" onClick={() => onMenu(row)}><span>Menu</span></button>}{onEdit && <button className="icon-action" onClick={() => onEdit(row)} aria-label="Edit"><span>Edit</span></button>}{onDelete && <button className="icon-action danger" onClick={() => onDelete(row)} aria-label="Delete"><span>Delete</span></button>}</div></td>}</tr>)}{rows.length === 0 && <tr><td className="table-empty" colSpan={columns.length + (onEdit || onDelete || onMenu ? 1 : 0)}>{empty || 'No records yet.'}</td></tr>}</tbody>
//   </table></div>;
// }

// const AdminDashboard = () => {
//   const {
//     summary, fetchSummary, refunds, fetchRefunds, uploadRoomImage,
//     notifications, markBookingNotificationsRead, foodNotifications, fetchFoodNotifications,
//     hotels, fetchHotels, createHotel, updateHotel, updateHotelMenu, deleteHotel,
//     rooms, fetchRooms, createRoom, updateRoom, deleteRoom,
//     categories, fetchCategories, createCategory, updateCategory, deleteCategory,
//     amenities, fetchAmenities, createAmenity, updateAmenity, deleteAmenity,
//   } = useContext(AdminContext);
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('overview');
//   const [modal, setModal] = useState(null);
//   const [query, setQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [notificationsOpen, setNotificationsOpen] = useState(false);
//   const metrics = summary?.metrics || {};

//   const refresh = async () => {
//     setRefreshing(true);
//     try { await Promise.all([fetchSummary(), fetchHotels(), fetchRooms(), fetchCategories(), fetchAmenities(), fetchRefunds(), fetchFoodNotifications()]); }
//     catch (err) { window.alert(err.message || 'Could not refresh admin data.'); }
//     finally { setRefreshing(false); }
//   };
//   const filtered = (rows, fields) => rows.filter((row) => fields.some((field) => String(field(row) ?? '').toLowerCase().includes(query.toLowerCase())));
//   const open = (type, item = null) => setModal({ type, item });
//   const remove = async (item, label, handler) => {
//     if (!window.confirm(`Delete ${label}?`)) return;
//     try { await handler(item._id); }
//     catch (err) { window.alert(err.message || `Could not delete ${label}.`); }
//   };
//   const title = sections.find((section) => section.id === activeTab)?.label || 'Overview';
//   const recent = summary?.recentBookings || [];
//   const tableBookings = useMemo(() => recent, [recent]);
//   const showBookings = <DataTable rows={tableBookings} empty="No bookings have been recorded." columns={[
//     { label: 'Guest', render: (row) => row.guestInfo?.name || row.user?.name || row.user?.email || 'Guest' },
//     { label: 'Stay', render: (row) => `${textOf(row.hotel)} · ${textOf(row.room)}` },
//     { label: 'Check-in', render: (row) => date(row.checkIn) },
//     { label: 'Check-out', render: (row) => date(row.checkOut) },
//     { label: 'Amount', render: (row) => money(row.totalPrice) },
//     { label: 'Status', render: (row) => <span className={`status-pill status-${row.status}`}>{row.status}</span> },
//   ]} />;

//   return <><main className="admin-app">
//     <aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark">S</span><div><strong>StayNest</strong><small>ADMIN CONSOLE</small></div></div>
//       <p className="sidebar-caption">WORKSPACE</p><nav>{sections.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActiveTab(id); setQuery(''); }} className={activeTab === id ? 'active' : ''}><Icon size={18} /><span>{label}</span>{id === 'refunds' && refunds.length > 0 && <b>{refunds.length}</b>}{id === 'bookings' && notifications.count > 0 && <b>{notifications.count}</b>}{id === 'dining' && foodNotifications.count > 0 && <b>{foodNotifications.count}</b>}</button>)}</nav>
//       <div className="sidebar-user"><span className="user-avatar">{(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{user?.name || 'Administrator'}</strong><small>{user?.email}</small></div><button title="Sign out" onClick={() => { logout(); navigate('/admin/login'); }}><LogOut size={17} /></button></div>
//     </aside>
//     <section className="admin-main"><header className="admin-topbar"><div><p>STAYNEST / ADMIN</p><h1>{title}</h1></div><div className="admin-top-actions"><span className="admin-today"><CalendarCheck size={16} />{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</span><div className="booking-notification-wrap"><button className="booking-notification-button" type="button" aria-label={`${notifications.count + foodNotifications.count} new notifications`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={17} />{notifications.count + foodNotifications.count > 0 && <b>{notifications.count + foodNotifications.count > 99 ? '99+' : notifications.count + foodNotifications.count}</b>}</button>{notificationsOpen && <div className="booking-notification-popover"><div className="notification-popover-heading"><div><strong>New activity</strong><small>{notifications.count} bookings · {foodNotifications.count} room service orders</small></div><button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={15} /></button></div>{notifications.bookings.length ? <div className="notification-list">{notifications.bookings.map((booking) => <article key={booking._id}><span className="notification-dot" /><div><strong>{booking.guestInfo?.name || booking.user?.name || 'Guest booking'}</strong><small>{booking.hotel?.name || 'Property'} · {new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></article>)}</div> : null}{foodNotifications.orders.length ? <div className="notification-list">{foodNotifications.orders.map((order) => <article key={order._id}><span className="notification-dot food-dot" /><div><strong>Room {order.roomNumber || order.room?.roomNumber || '—'} · {order.hotel?.name || 'Hotel'}</strong><small>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</small></div></article>)}</div> : null}{!notifications.bookings.length && !foodNotifications.orders.length && <p className="notification-empty">No unread activity.</p>}{notifications.count > 0 && <button className="notification-view-all" type="button" onClick={async () => { await markBookingNotificationsRead(); await fetchBookings(); setActiveTab('bookings'); setNotificationsOpen(false); }}>Review bookings</button>}{foodNotifications.count > 0 && <button className="notification-view-all" type="button" onClick={() => { setActiveTab('dining'); setNotificationsOpen(false); }}>Review room service orders</button>}</div>}</div><button className="refresh-button" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh</button></div></header>
//       {activeTab === 'overview' && <div className="admin-content">
//         <div className="admin-welcome"><div><span>PROPERTY OVERVIEW</span><h2>Welcome back, {user?.name || 'Admin'}</h2><p>Here’s how your property is performing today.</p></div><div className="occupancy-ring" style={{ '--occupancy': `${metrics.roomOccupancyRate || 0}%` }}><div><strong>{metrics.roomOccupancyRate ?? 0}%</strong><small>OCCUPANCY</small></div></div></div>
//         <div className="metrics-grid">
//           <MetricCard label="Total bookings" value={metrics.totalBookings ?? '—'} icon={CalendarDays} tone="blue" />
//           <MetricCard label="Today's check-ins" value={metrics.todayCheckIns ?? '—'} icon={ArrowDownRight} tone="green" />
//           <MetricCard label="Today's check-outs" value={metrics.todayCheckOuts ?? '—'} icon={ArrowUpRight} tone="violet" />
//           <MetricCard label="Upcoming bookings" value={metrics.upcomingBookings ?? '—'} icon={Clock3} tone="amber" />
//           <MetricCard label="Available rooms" value={metrics.availableRooms ?? '—'} icon={BedDouble} tone="green" />
//           <MetricCard label="Occupied rooms" value={metrics.occupiedRooms ?? '—'} icon={Building2} tone="blue" />
//           <MetricCard label="Total revenue" value={summary ? money(metrics.totalRevenue) : '—'} icon={CircleDollarSign} tone="green" note="Captured payments" />
//           <MetricCard label="Pending payments" value={summary ? money(metrics.pendingPayments) : '—'} icon={WalletCards} tone="amber" />
//           <MetricCard label="Cancelled bookings" value={metrics.cancelledBookings ?? '—'} icon={X} tone="rose" />
//           <MetricCard label="Refund requests" value={metrics.refundRequests ?? '—'} icon={RefreshCw} tone="violet" />
//         </div>
//         <div className="admin-chart-grid"><article className="admin-panel"><div className="panel-heading"><div><span>REVENUE</span><h3>Monthly revenue</h3></div><small>Last 12 months · INR</small></div><RevenueChart data={summary?.monthlyRevenue || []} /></article>
//           <article className="admin-panel"><div className="panel-heading"><div><span>RESERVATIONS</span><h3>Booking statistics</h3></div><div className="chart-legend"><i className="bar-booked" />Booked<i className="bar-completed" />Completed<i className="bar-cancelled" />Cancelled</div></div><BookingChart data={summary?.bookingStatistics || []} /></article></div>
//         <article className="admin-panel recent-panel"><div className="panel-heading"><div><span>LATEST ACTIVITY</span><h3>Recent bookings</h3></div><button className="text-action" onClick={() => setActiveTab('bookings')}>View all bookings <ArrowUpRight size={15} /></button></div>{showBookings}</article>
//       </div>}
//       {activeTab === 'hotels' && <div className="admin-content"><div className="section-toolbar"><div><h2>Hotel properties</h2><p>Manage your property details and listing content.</p></div><button className="primary-action" onClick={() => open('hotel')}><Plus size={17} />Add hotel</button></div><div className="table-toolbar"><label><Search size={17} /><input placeholder="Search hotels" value={query} onChange={(e) => setQuery(e.target.value)} /></label><span>{hotels.length} properties</span></div><DataTable rows={filtered(hotels, [(row) => row.name, (row) => row.city, (row) => row.country])} columns={[{ label: 'Property', render: (row) => <div className="property-cell"><strong>{row.name}</strong><small>{row.propertyType || 'Stay'} · {row.address}</small></div> }, { label: 'Location', render: (row) => `${row.city}, ${row.country}` }, { label: 'Category', render: (row) => `${row.starCategory || '—'} star` }, { label: 'Menu', render: (row) => `${row.menu?.length || 0} dishes` }, { label: 'From / night', render: (row) => money(row.pricePerNight) }]} onMenu={(row) => open('menu', row)} onEdit={(row) => open('hotel', row)} onDelete={(row) => remove(row, row.name, deleteHotel)} empty="Add your first property to get started." /></div>}
//       {activeTab === 'rooms' && <div className="admin-content"><div className="section-toolbar"><div><h2>Room inventory</h2><p>Manage room numbers, status, pricing, facilities, and availability.</p></div><button className="primary-action" onClick={() => open('room')}><Plus size={17} />Add room</button></div><div className="table-toolbar"><label><Search size={17} /><input placeholder="Search rooms" value={query} onChange={(e) => setQuery(e.target.value)} /></label><span>{rooms.length} rooms</span></div><DataTable rows={filtered(rooms, [(row) => row.roomNumber, (row) => row.type, (row) => row.name, (row) => row.hotel?.name, (row) => row.category?.name, (row) => row.status])} columns={[{ label: 'Room', render: (row) => <div className="property-cell"><strong>{row.roomNumber ? `#${row.roomNumber} · ` : ''}{row.type || row.name}</strong><small>{textOf(row.category) || 'Uncategorized'} · {row.capacity || 2} guests{row.size ? ` · ${row.size}` : ''}</small></div> }, { label: 'Hotel', render: (row) => textOf(row.hotel) }, { label: 'Facilities', render: (row) => (row.amenities || []).map(textOf).join(', ') || '—' }, { label: 'Price / night', render: (row) => <>{row.discountPrice != null && Number(row.discountPrice) < Number(row.pricePerNight) ? <><strong>{money(row.discountPrice)}</strong> <del>{money(row.pricePerNight)}</del></> : money(row.pricePerNight)}</> }, { label: 'Status', render: (row) => <span className={`status-pill room-status-${String(row.status || 'Available').toLowerCase()}`}>{row.status || 'Available'}</span> }]} onEdit={(row) => open('room', row)} onDelete={(row) => remove(row, row.name, deleteRoom)} empty="Add a hotel first, then create its rooms." /></div>}
//       {activeTab === 'bookings' && <BookingManagement rooms={rooms} />}
//       {activeTab === 'coupons' && <CouponsManagement />}
//       {activeTab === 'dining' && <FoodOrdersManagement />}
//       {activeTab === 'categories' && <div className="admin-content"><div className="section-toolbar"><div><h2>Room categories</h2><p>Organize room types for your listings.</p></div><button className="primary-action" onClick={() => open('category')}><Plus size={17} />Add category</button></div><DataTable rows={categories} columns={[{ label: 'Name', key: 'name' }, { label: 'Description', key: 'description' }]} onEdit={(row) => open('category', row)} onDelete={(row) => remove(row, row.name, deleteCategory)} /></div>}
//       {activeTab === 'amenities' && <div className="admin-content"><div className="section-toolbar"><div><h2>Amenities</h2><p>Manage amenities guests can find in rooms.</p></div><button className="primary-action" onClick={() => open('amenity')}><Plus size={17} />Add amenity</button></div><DataTable rows={amenities} columns={[{ label: 'Name', key: 'name' }, { label: 'Icon reference', key: 'icon' }]} onEdit={(row) => open('amenity', row)} onDelete={(row) => remove(row, row.name, deleteAmenity)} /></div>}
//       {activeTab === 'refunds' && <div className="admin-content"><div className="section-toolbar"><div><h2>Refund requests</h2><p>Payments flagged for refund review after booking cancellation.</p></div><span className="count-chip">{refunds.length} pending</span></div><DataTable rows={refunds} empty="There are no pending refund requests." columns={[{ label: 'Guest', render: (row) => row.user?.name || row.user?.email || 'Guest' }, { label: 'Payment', render: (row) => row.paymentId || row.orderId }, { label: 'Booking', render: (row) => row.booking ? `${textOf(row.booking.hotel)} · ${textOf(row.booking.room)}` : '—' }, { label: 'Amount', render: (row) => money((row.amount || 0) / 100) }, { label: 'Requested', render: (row) => date(row.updatedAt) }]} /></div>}
//     </section>
//   </main>
//   {modal?.type === 'hotel' && <HotelForm initialData={modal.item} onClose={() => setModal(null)} onSave={modal.item ? updateHotel : createHotel} />}
//   {modal?.type === 'menu' && <HotelMenuManager hotel={modal.item} onClose={() => setModal(null)} onUpdated={(menu, menuCategories) => { updateHotelMenu(modal.item._id, menu, menuCategories); setModal((current) => ({ ...current, item: { ...current.item, menu, menuCategories } })); }} />}
//   {modal?.type === 'room' && <RoomForm initialData={modal.item} hotels={hotels} categories={categories} amenities={amenities} onClose={() => setModal(null)} onSave={modal.item ? updateRoom : createRoom} onCreateCategory={createCategory} onCreateAmenity={createAmenity} onUploadImage={uploadRoomImage} />}
//   {modal?.type === 'category' && <CategoryForm initialData={modal.item} onClose={() => setModal(null)} onSave={modal.item ? updateCategory : createCategory} />}
//   {modal?.type === 'amenity' && <AmenityForm initialData={modal.item} onClose={() => setModal(null)} onSave={modal.item ? updateAmenity : createAmenity} />}
//   </>;
// };

// export default AdminDashboard;




import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  BedDouble,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  WalletCards,
  X,
  Utensils,
} from 'lucide-react';
import { AdminContext } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import HotelForm from '../components/admin/HotelForm';
import RoomForm from '../components/admin/RoomForm';
import CategoryForm from '../components/admin/CategoryForm';
import AmenityForm from '../components/admin/AmenityForm';
import BookingManagement from '../components/admin/BookingManagement';
import HotelMenuManager from '../components/admin/HotelMenuManager';
import FoodOrdersManagement from '../components/admin/FoodOrdersManagement';
import CouponsManagement from '../components/admin/CouponsManagement';
import './AdminDashboard.css';

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'hotels', label: 'Hotels', icon: Building2 },
  { id: 'rooms', label: 'Rooms', icon: BedDouble },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'coupons', label: 'Coupons', icon: BadgePercent },
  { id: 'dining', label: 'Room service', icon: Utensils },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'amenities', label: 'Amenities', icon: Sparkles },
  { id: 'refunds', label: 'Refund requests', icon: WalletCards },
];

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : '—';

const textOf = (value) =>
  typeof value === 'object' && value !== null
    ? value.name || value.email || '—'
    : value ?? '—';

function MetricCard({ label, value, icon: Icon, tone = 'blue', note }) {
  return (
    <article className={`admin-metric metric-${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value ?? '—'}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function RevenueChart({ data = [] }) {
  const width = 680;
  const height = 210;
  const padX = 22;
  const padY = 22;
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  const points = data.map((item, index) => ({
    ...item,
    x:
      data.length < 2
        ? width / 2
        : padX + (index * (width - padX * 2)) / (data.length - 1),
    y:
      height -
      padY -
      ((Number(item.value) || 0) / max) * (height - padY * 2),
  }));
  const path = points
    .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Monthly revenue chart"
        className="line-chart"
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={padY + (line * (height - padY * 2)) / 3}
            y2={padY + (line * (height - padY * 2)) / 3}
            className="chart-gridline"
          />
        ))}
        {points.length > 1 && (
          <path
            d={`${path} L ${points.at(-1).x} ${height - padY} L ${points[0].x} ${height - padY} Z`}
            className="chart-area"
          />
        )}
        <path d={path} className="chart-line" />
        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="4" className="chart-point" />
            <title>
              {point.label}: {money(point.value)}
            </title>
          </g>
        ))}
      </svg>
      <div className="chart-x-labels">
        {points.map((point) => (
          <span key={`${point.label}-${point.x}`}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function BookingChart({ data = [] }) {
  const max = Math.max(
    ...data.flatMap((item) => [
      item.booked || 0,
      item.cancelled || 0,
      item.completed || 0,
    ]),
    1
  );

  return (
    <div
      className="booking-chart"
      role="img"
      aria-label="Monthly booking statistics chart"
    >
      {data.map((month, index) => (
        <div
          className="booking-chart-month"
          key={`${month.label}-${index}`}
          title={`${month.label}: ${month.booked || 0} booked, ${month.completed || 0} completed, ${month.cancelled || 0} cancelled`}
        >
          <div className="booking-bars">
            <i
              className="bar-booked"
              style={{
                height: `${Math.max(((month.booked || 0) / max) * 100, 2)}%`,
              }}
            />
            <i
              className="bar-completed"
              style={{
                height: `${Math.max(((month.completed || 0) / max) * 100, 2)}%`,
              }}
            />
            <i
              className="bar-cancelled"
              style={{
                height: `${Math.max(((month.cancelled || 0) / max) * 100, 2)}%`,
              }}
            />
          </div>
          <small>{month.label}</small>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, onEdit, onDelete, onMenu, empty }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
            {(onEdit || onDelete || onMenu) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((column) => (
                <td key={column.label}>
                  {column.render ? column.render(row) : textOf(row[column.key])}
                </td>
              ))}
              {(onEdit || onDelete || onMenu) && (
                <td>
                  <div className="table-actions">
                    {onMenu && (
                      <button className="icon-action" onClick={() => onMenu(row)}>
                        <span>Menu</span>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="icon-action"
                        onClick={() => onEdit(row)}
                        aria-label="Edit"
                      >
                        <span>Edit</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="icon-action danger"
                        onClick={() => onDelete(row)}
                        aria-label="Delete"
                      >
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                className="table-empty"
                colSpan={columns.length + (onEdit || onDelete || onMenu ? 1 : 0)}
              >
                {empty || 'No records yet.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const AdminDashboard = () => {
  const {
    summary,
    fetchSummary,
    fetchBookings,
    refunds,
    fetchRefunds,
    uploadRoomImage,
    notifications,
    markBookingNotificationsRead,
    foodNotifications,
    fetchFoodNotifications,
    hotels,
    fetchHotels,
    createHotel,
    updateHotel,
    updateHotelMenu,
    deleteHotel,
    rooms,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    amenities,
    fetchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
  } = useContext(AdminContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const metrics = summary?.metrics || {};

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchHotels(),
        fetchRooms(),
        fetchCategories(),
        fetchAmenities(),
        fetchRefunds(),
        fetchFoodNotifications(),
      ]);
    } catch (err) {
      window.alert(err.message || 'Could not refresh admin data.');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = (rows, fields) =>
    rows.filter((row) =>
      fields.some((field) =>
        String(field(row) ?? '').toLowerCase().includes(query.toLowerCase())
      )
    );

  const open = (type, item = null) => setModal({ type, item });

  const remove = async (item, label, handler) => {
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      await handler(item._id);
    } catch (err) {
      window.alert(err.message || `Could not delete ${label}.`);
    }
  };

  const title =
    sections.find((section) => section.id === activeTab)?.label || 'Overview';
  const recent = summary?.recentBookings || [];
  const tableBookings = useMemo(() => recent, [recent]);
  const unreadTotal = (notifications?.count || 0) + (foodNotifications?.count || 0);

  const showBookings = (
    <DataTable
      rows={tableBookings}
      empty="No bookings have been recorded."
      columns={[
        {
          label: 'Guest',
          render: (row) =>
            row.guestInfo?.name || row.user?.name || row.user?.email || 'Guest',
        },
        {
          label: 'Stay',
          render: (row) => `${textOf(row.hotel)} · ${textOf(row.room)}`,
        },
        { label: 'Check-in', render: (row) => date(row.checkIn) },
        { label: 'Check-out', render: (row) => date(row.checkOut) },
        { label: 'Amount', render: (row) => money(row.totalPrice) },
        {
          label: 'Status',
          render: (row) => (
            <span className={`status-pill status-${row.status}`}>
              {row.status}
            </span>
          ),
        },
      ]}
    />
  );

  return (
    <>
      <main className="admin-app">
        {sidebarOpen && (
          <div
            className="admin-sidebar-backdrop"
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="admin-brand">
            <span className="brand-mark">S</span>
            <div>
              <strong>StayNest</strong>
              <small>ADMIN CONSOLE</small>
            </div>
            <button
              type="button"
              className="mobile-sidebar-close"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <p className="sidebar-caption">WORKSPACE</p>
          <nav aria-label="Admin sections">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  setQuery('');
                  setSidebarOpen(false);
                }}
                className={activeTab === id ? 'active' : ''}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === 'refunds' && refunds.length > 0 && (
                  <b>{refunds.length}</b>
                )}
                {id === 'bookings' && notifications.count > 0 && (
                  <b>{notifications.count}</b>
                )}
                {id === 'dining' && foodNotifications.count > 0 && (
                  <b>{foodNotifications.count}</b>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-user">
            <span className="user-avatar">
              {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name || 'Administrator'}</strong>
              <small>{user?.email}</small>
            </div>
            <button
              type="button"
              title="Sign out"
              aria-label="Sign out"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </aside>

        <section className="admin-main">
          <header className="admin-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="mobile-menu-btn"
                aria-label="Open navigation"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={19} />
              </button>
              <div>
                <p>STAYNEST / ADMIN</p>
                <h1>{title}</h1>
              </div>
            </div>

            <div className="admin-top-actions">
              <span className="admin-today">
                <CalendarCheck size={16} />
                {new Intl.DateTimeFormat('en-IN', {
                  dateStyle: 'medium',
                }).format(new Date())}
              </span>

              <div className="booking-notification-wrap">
                <button
                  className="booking-notification-button"
                  type="button"
                  aria-label={`${unreadTotal} new notifications`}
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                >
                  <Bell size={17} />
                  {unreadTotal > 0 && (
                    <b>{unreadTotal > 99 ? '99+' : unreadTotal}</b>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="booking-notification-popover">
                    <div className="notification-popover-heading">
                      <div>
                        <strong>New activity</strong>
                        <small>
                          {notifications.count} bookings · {foodNotifications.count}{' '}
                          room service orders
                        </small>
                      </div>
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {notifications.bookings?.length ? (
                      <div className="notification-list">
                        {notifications.bookings.map((booking) => (
                          <article key={booking._id}>
                            <span className="notification-dot" />
                            <div>
                              <strong>
                                {booking.guestInfo?.name ||
                                  booking.user?.name ||
                                  'Guest booking'}
                              </strong>
                              <small>
                                {booking.hotel?.name || 'Property'} ·{' '}
                                {new Date(booking.createdAt).toLocaleString(
                                  'en-IN',
                                  { dateStyle: 'medium', timeStyle: 'short' }
                                )}
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {foodNotifications.orders?.length ? (
                      <div className="notification-list">
                        {foodNotifications.orders.map((order) => (
                          <article key={order._id}>
                            <span className="notification-dot food-dot" />
                            <div>
                              <strong>
                                Room{' '}
                                {order.roomNumber ||
                                  order.room?.roomNumber ||
                                  '—'}{' '}
                                · {order.hotel?.name || 'Hotel'}
                              </strong>
                              <small>
                                {order.items
                                  .map((item) => `${item.quantity}× ${item.name}`)
                                  .join(', ')}
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {!notifications.bookings?.length &&
                      !foodNotifications.orders?.length && (
                        <p className="notification-empty">No unread activity.</p>
                      )}

                    {notifications.count > 0 && (
                      <button
                        className="notification-view-all"
                        type="button"
                        onClick={async () => {
                          await markBookingNotificationsRead();
                          if (typeof fetchBookings === 'function') {
                            await fetchBookings();
                          }
                          setActiveTab('bookings');
                          setNotificationsOpen(false);
                        }}
                      >
                        Review bookings
                      </button>
                    )}

                    {foodNotifications.count > 0 && (
                      <button
                        className="notification-view-all"
                        type="button"
                        onClick={() => {
                          setActiveTab('dining');
                          setNotificationsOpen(false);
                        }}
                      >
                        Review room service orders
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="refresh-button"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'spin' : ''}
                />
                <span>Refresh</span>
              </button>
            </div>
          </header>

          {activeTab === 'overview' && (
            <div className="admin-content">
              <div className="admin-welcome">
                <div>
                  <span>PROPERTY OVERVIEW</span>
                  <h2>Welcome back, {user?.name || 'Admin'}</h2>
                  <p>Here’s how your property is performing today.</p>
                </div>
                <div
                  className="occupancy-ring"
                  style={{ '--occupancy': `${metrics.roomOccupancyRate || 0}%` }}
                >
                  <div>
                    <strong>{metrics.roomOccupancyRate ?? 0}%</strong>
                    <small>OCCUPANCY</small>
                  </div>
                </div>
              </div>

              <div className="metrics-grid">
                <MetricCard
                  label="Total bookings"
                  value={metrics.totalBookings ?? '—'}
                  icon={CalendarDays}
                  tone="blue"
                />
                <MetricCard
                  label="Today's check-ins"
                  value={metrics.todayCheckIns ?? '—'}
                  icon={ArrowDownRight}
                  tone="green"
                />
                <MetricCard
                  label="Today's check-outs"
                  value={metrics.todayCheckOuts ?? '—'}
                  icon={ArrowUpRight}
                  tone="violet"
                />
                <MetricCard
                  label="Upcoming bookings"
                  value={metrics.upcomingBookings ?? '—'}
                  icon={Clock3}
                  tone="amber"
                />
                <MetricCard
                  label="Available rooms"
                  value={metrics.availableRooms ?? '—'}
                  icon={BedDouble}
                  tone="green"
                />
                <MetricCard
                  label="Occupied rooms"
                  value={metrics.occupiedRooms ?? '—'}
                  icon={Building2}
                  tone="blue"
                />
                <MetricCard
                  label="Total revenue"
                  value={summary ? money(metrics.totalRevenue) : '—'}
                  icon={CircleDollarSign}
                  tone="green"
                  note="Captured payments"
                />
                <MetricCard
                  label="Pending payments"
                  value={summary ? money(metrics.pendingPayments) : '—'}
                  icon={WalletCards}
                  tone="amber"
                />
                <MetricCard
                  label="Cancelled bookings"
                  value={metrics.cancelledBookings ?? '—'}
                  icon={X}
                  tone="rose"
                />
                <MetricCard
                  label="Refund requests"
                  value={metrics.refundRequests ?? '—'}
                  icon={RefreshCw}
                  tone="violet"
                />
              </div>

              <div className="admin-chart-grid">
                <article className="admin-panel">
                  <div className="panel-heading">
                    <div>
                      <span>REVENUE</span>
                      <h3>Monthly revenue</h3>
                    </div>
                    <small>Last 12 months · INR</small>
                  </div>
                  <RevenueChart data={summary?.monthlyRevenue || []} />
                </article>

                <article className="admin-panel">
                  <div className="panel-heading">
                    <div>
                      <span>RESERVATIONS</span>
                      <h3>Booking statistics</h3>
                    </div>
                    <div className="chart-legend">
                      <i className="bar-booked" />
                      Booked
                      <i className="bar-completed" />
                      Completed
                      <i className="bar-cancelled" />
                      Cancelled
                    </div>
                  </div>
                  <BookingChart data={summary?.bookingStatistics || []} />
                </article>
              </div>

              <article className="admin-panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <span>LATEST ACTIVITY</span>
                    <h3>Recent bookings</h3>
                  </div>
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => setActiveTab('bookings')}
                  >
                    View all bookings <ArrowUpRight size={15} />
                  </button>
                </div>
                {showBookings}
              </article>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div className="admin-content">
              <div className="section-toolbar">
                <div>
                  <h2>Hotel properties</h2>
                  <p>Manage your property details and listing content.</p>
                </div>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => open('hotel')}
                >
                  <Plus size={17} />
                  Add hotel
                </button>
              </div>
              <div className="table-toolbar">
                <label>
                  <Search size={17} />
                  <input
                    placeholder="Search hotels"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <span>{hotels.length} properties</span>
              </div>
              <DataTable
                rows={filtered(hotels, [
                  (row) => row.name,
                  (row) => row.city,
                  (row) => row.country,
                ])}
                columns={[
                  {
                    label: 'Property',
                    render: (row) => (
                      <div className="property-cell">
                        <strong>{row.name}</strong>
                        <small>
                          {row.propertyType || 'Stay'} · {row.address}
                        </small>
                      </div>
                    ),
                  },
                  {
                    label: 'Location',
                    render: (row) => `${row.city}, ${row.country}`,
                  },
                  {
                    label: 'Category',
                    render: (row) => `${row.starCategory || '—'} star`,
                  },
                  {
                    label: 'Menu',
                    render: (row) => `${row.menu?.length || 0} dishes`,
                  },
                  {
                    label: 'From / night',
                    render: (row) => money(row.pricePerNight),
                  },
                ]}
                onMenu={(row) => open('menu', row)}
                onEdit={(row) => open('hotel', row)}
                onDelete={(row) => remove(row, row.name, deleteHotel)}
                empty="Add your first property to get started."
              />
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="admin-content">
              <div className="section-toolbar">
                <div>
                  <h2>Room inventory</h2>
                  <p>
                    Manage room numbers, status, pricing, facilities, and
                    availability.
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => open('room')}
                >
                  <Plus size={17} />
                  Add room
                </button>
              </div>
              <div className="table-toolbar">
                <label>
                  <Search size={17} />
                  <input
                    placeholder="Search rooms"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <span>{rooms.length} rooms</span>
              </div>
              <DataTable
                rows={filtered(rooms, [
                  (row) => row.roomNumber,
                  (row) => row.type,
                  (row) => row.name,
                  (row) => row.hotel?.name,
                  (row) => row.category?.name,
                  (row) => row.status,
                ])}
                columns={[
                  {
                    label: 'Room',
                    render: (row) => (
                      <div className="property-cell">
                        <strong>
                          {row.roomNumber ? `#${row.roomNumber} · ` : ''}
                          {row.type || row.name}
                        </strong>
                        <small>
                          {textOf(row.category) || 'Uncategorized'} ·{' '}
                          {row.capacity || 2} guests
                          {row.size ? ` · ${row.size}` : ''}
                        </small>
                      </div>
                    ),
                  },
                  { label: 'Hotel', render: (row) => textOf(row.hotel) },
                  {
                    label: 'Facilities',
                    render: (row) =>
                      (row.amenities || []).map(textOf).join(', ') || '—',
                  },
                  {
                    label: 'Price / night',
                    render: (row) => (
                      <>
                        {row.discountPrice != null &&
                        Number(row.discountPrice) < Number(row.pricePerNight) ? (
                          <>
                            <strong>{money(row.discountPrice)}</strong>{' '}
                            <del>{money(row.pricePerNight)}</del>
                          </>
                        ) : (
                          money(row.pricePerNight)
                        )}
                      </>
                    ),
                  },
                  {
                    label: 'Status',
                    render: (row) => (
                      <span
                        className={`status-pill room-status-${String(row.status || 'Available').toLowerCase()}`}
                      >
                        {row.status || 'Available'}
                      </span>
                    ),
                  },
                ]}
                onEdit={(row) => open('room', row)}
                onDelete={(row) => remove(row, row.name, deleteRoom)}
                empty="Add a hotel first, then create its rooms."
              />
            </div>
          )}

          {activeTab === 'bookings' && <BookingManagement rooms={rooms} />}
          {activeTab === 'coupons' && <CouponsManagement />}
          {activeTab === 'dining' && <FoodOrdersManagement />}

          {activeTab === 'categories' && (
            <div className="admin-content">
              <div className="section-toolbar">
                <div>
                  <h2>Room categories</h2>
                  <p>Organize room types for your listings.</p>
                </div>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => open('category')}
                >
                  <Plus size={17} />
                  Add category
                </button>
              </div>
              <DataTable
                rows={categories}
                columns={[
                  { label: 'Name', key: 'name' },
                  { label: 'Description', key: 'description' },
                ]}
                onEdit={(row) => open('category', row)}
                onDelete={(row) => remove(row, row.name, deleteCategory)}
              />
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="admin-content">
              <div className="section-toolbar">
                <div>
                  <h2>Amenities</h2>
                  <p>Manage amenities guests can find in rooms.</p>
                </div>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => open('amenity')}
                >
                  <Plus size={17} />
                  Add amenity
                </button>
              </div>
              <DataTable
                rows={amenities}
                columns={[
                  { label: 'Name', key: 'name' },
                  { label: 'Icon reference', key: 'icon' },
                ]}
                onEdit={(row) => open('amenity', row)}
                onDelete={(row) => remove(row, row.name, deleteAmenity)}
              />
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="admin-content">
              <div className="section-toolbar">
                <div>
                  <h2>Refund requests</h2>
                  <p>
                    Payments flagged for refund review after booking cancellation.
                  </p>
                </div>
                <span className="count-chip">{refunds.length} pending</span>
              </div>
              <DataTable
                rows={refunds}
                empty="There are no pending refund requests."
                columns={[
                  {
                    label: 'Guest',
                    render: (row) =>
                      row.user?.name || row.user?.email || 'Guest',
                  },
                  {
                    label: 'Payment',
                    render: (row) => row.paymentId || row.orderId,
                  },
                  {
                    label: 'Booking',
                    render: (row) =>
                      row.booking
                        ? `${textOf(row.booking.hotel)} · ${textOf(row.booking.room)}`
                        : '—',
                  },
                  {
                    label: 'Amount',
                    render: (row) => money((row.amount || 0) / 100),
                  },
                  {
                    label: 'Requested',
                    render: (row) => date(row.updatedAt),
                  },
                ]}
              />
            </div>
          )}
        </section>
      </main>

      {modal?.type === 'hotel' && (
        <HotelForm
          initialData={modal.item}
          onClose={() => setModal(null)}
          onSave={modal.item ? updateHotel : createHotel}
        />
      )}
      {modal?.type === 'menu' && (
        <HotelMenuManager
          hotel={modal.item}
          onClose={() => setModal(null)}
          onUpdated={(menu, menuCategories) => {
            updateHotelMenu(modal.item._id, menu, menuCategories);
            setModal((current) => ({
              ...current,
              item: { ...current.item, menu, menuCategories },
            }));
          }}
        />
      )}
      {modal?.type === 'room' && (
        <RoomForm
          initialData={modal.item}
          hotels={hotels}
          categories={categories}
          amenities={amenities}
          onClose={() => setModal(null)}
          onSave={modal.item ? updateRoom : createRoom}
          onCreateCategory={createCategory}
          onCreateAmenity={createAmenity}
          onUploadImage={uploadRoomImage}
        />
      )}
      {modal?.type === 'category' && (
        <CategoryForm
          initialData={modal.item}
          onClose={() => setModal(null)}
          onSave={modal.item ? updateCategory : createCategory}
        />
      )}
      {modal?.type === 'amenity' && (
        <AmenityForm
          initialData={modal.item}
          onClose={() => setModal(null)}
          onSave={modal.item ? updateAmenity : createAmenity}
        />
      )}
    </>
  );
};

export default AdminDashboard;