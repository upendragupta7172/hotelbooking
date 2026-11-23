// server.js - Express entry point (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import hotelsRouter from './routes/hotels.js';
import bookingsRouter from './routes/bookings.js';
import couponsRouter from './routes/coupons.js';
import reviewsRouter from './routes/reviews.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import roomsRouter from './routes/rooms.js';
import paymentsRouter from './routes/payments.js';
import categoriesRouter from './routes/categories.js';
import amenitiesRouter from './routes/amenities.js';
import adminAuthRouter from './routes/adminAuth.js';
import hotelsAdminRouter from './routes/hotelsAdmin.js';
import roomsAdminRouter from './routes/roomsAdmin.js';
import adminDashboardRouter from './routes/adminDashboard.js';
import adminBookingsRouter from './routes/adminBookings.js';
import adminFoodOrdersRouter from './routes/adminFoodOrders.js';
import inRoomDiningRouter from './routes/inRoomDining.js';

// __dirname shim for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/hotels', hotelsRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/amenities', amenitiesRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin', adminDashboardRouter);
app.use('/api/admin/bookings', adminBookingsRouter);
app.use('/api/admin/food-orders', adminFoodOrdersRouter);
app.use('/api/admin/hotels', hotelsAdminRouter);
app.use('/api/admin/rooms', roomsAdminRouter);
app.use('/api/in-room-dining', inRoomDiningRouter);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
