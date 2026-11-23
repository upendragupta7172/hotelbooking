// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'your_secret_key'; // In production, use env var
const JWT_EXPIRES_IN = '1h';

// Middleware to protect routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ADMIN REGISTER (only one admin allowed)
app.post('/api/admin/register', async (req, res) => {
  const { email, password } = req.body;
  const adminExists = db.get('SELECT * FROM admin WHERE email = ?', [email]);
  if (adminExists) {
    return res.status(400).json({ message: 'Admin already exists' });
  }
  const count = db.get('SELECT COUNT(*) as cnt FROM admin');
  if (count.cnt >= 1) {
    return res.status(400).json({ message: 'Only one admin allowed' });
  }
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO admin (email, password) VALUES (?, ?)', [email, hashed]);
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token });
});

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = db.get('SELECT * FROM admin WHERE email = ?', [email]);
  if (!admin) return res.status(400).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token });
});

// PUBLIC HOTEL LIST
app.get('/api/hotels', (req, res) => {
  const hotels = db.all('SELECT * FROM hotels');
  res.json(hotels);
});

// PUBLIC HOTEL DETAIL
app.get('/api/hotels/:id', (req, res) => {
  const hotel = db.get('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  const rooms = db.all('SELECT * FROM rooms WHERE hotel_id = ?', [hotel.id]);
  hotel.rooms = rooms;
  res.json(hotel);
});

// CREATE HOTEL (protected)
app.post('/api/hotels', authenticateToken, (req, res) => {
  const { id, name, city, state, location, rating, propertyType, startingPrice, image, shortDescription, description, amenities } = req.body;
  try {
    db.run(`INSERT INTO hotels (id, name, city, state, location, rating, propertyType, startingPrice, image, shortDescription, description, amenities)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, city, state, location, rating, propertyType, startingPrice, image, shortDescription, description, JSON.stringify(amenities)]);
    res.status(201).json({ message: 'Hotel created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE HOTEL (protected)
app.put('/api/hotels/:id', authenticateToken, (req, res) => {
  const { name, city, state, location, rating, propertyType, startingPrice, image, shortDescription, description, amenities } = req.body;
  try {
    db.run(`UPDATE hotels SET name = ?, city = ?, state = ?, location = ?, rating = ?, propertyType = ?, startingPrice = ?, image = ?, shortDescription = ?, description = ?, amenities = ?
            WHERE id = ?`,
            [name, city, state, location, rating, propertyType, startingPrice, image, shortDescription, description, JSON.stringify(amenities), req.params.id]);
    res.json({ message: 'Hotel updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE HOTEL (protected)
app.delete('/api/hotels/:id', authenticateToken, (req, res) => {
  try {
    db.run('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    db.run('DELETE FROM rooms WHERE hotel_id = ?', [req.params.id]);
    res.json({ message: 'Hotel deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ROOM CRUD (protected)
app.post('/api/hotels/:hotelId/rooms', authenticateToken, (req, res) => {
  const { id, name, description, image, price, capacity, size, amenities } = req.body;
  try {
    db.run(`INSERT INTO rooms (id, hotel_id, name, description, image, price, capacity, size, amenities)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.params.hotelId, name, description, image, price, capacity, size, JSON.stringify(amenities)]);
    res.status(201).json({ message: 'Room created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/hotels/:hotelId/rooms/:roomId', authenticateToken, (req, res) => {
  const { name, description, image, price, capacity, size, amenities } = req.body;
  try {
    db.run(`UPDATE rooms SET name = ?, description = ?, image = ?, price = ?, capacity = ?, size = ?, amenities = ?
            WHERE id = ? AND hotel_id = ?`,
            [name, description, image, price, capacity, size, JSON.stringify(amenities), req.params.roomId, req.params.hotelId]);
    res.json({ message: 'Room updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/hotels/:hotelId/rooms/:roomId', authenticateToken, (req, res) => {
  try {
    db.run('DELETE FROM rooms WHERE id = ? AND hotel_id = ?', [req.params.roomId, req.params.hotelId]);
    res.json({ message: 'Room deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
