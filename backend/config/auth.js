// config/auth.js
module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'SuperSecretKeyForDev',
  jwtExpiresIn: '1d', // 1 day token
  // optionally refresh token settings could be added later
};
