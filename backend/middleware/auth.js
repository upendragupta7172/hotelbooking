// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/auth');

// Protect routes – verify JWT and attach user to request
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    // Invalid/expired tokens are expected after a secret change or stale browser
    // session. Keep the server log quiet; the client will clear the saved token.
    return res.status(401).json({
      message: err.name === 'TokenExpiredError'
        ? 'Session expired. Please sign in again.'
        : 'Session is invalid. Please sign in again.',
    });
  }
};

exports.optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(authorization.slice(7), config.jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Session is invalid. Please sign in again.' });
    return next();
  } catch (err) {
    return res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Session is invalid. Please sign in again.' });
  }
};
