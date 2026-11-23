const express = require('express');
const Razorpay = require('razorpay');
const config = require('../config/razorpay');
const { getBookingQuote } = require('../utils/bookingQuote');

const router = express.Router();

router.get('/config', (req, res) => {
  const keyId = config.keyId();
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: 'Online payment is not configured.' });
  return res.json({ keyId });
});

router.post('/create', async (req, res) => {
  try {
    const quote = await getBookingQuote(req.body || {});
    const credentials = config.getCredentials();
    const razorpay = new Razorpay(credentials);
    const receipt = `stay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const order = await razorpay.orders.create({
      amount: Math.round(quote.total * 100),
      currency: 'INR',
      receipt,
      notes: {
        roomId: String(quote.room._id),
        checkIn: new Date(req.body.checkIn).toISOString(),
        checkOut: new Date(req.body.checkOut).toISOString(),
        guestCount: String(quote.guests),
        roomCount: String(quote.rooms),
        packageId: req.body.packageId ? String(req.body.packageId) : '',
        couponCode: quote.couponCode || '',
        couponDiscount: String(quote.discountAmount || 0),
        guestEmail: String(req.body.guestInfo?.email || '').trim().toLowerCase(),
      },
    });
    return res.status(201).json({ order, keyId: credentials.key_id, quote: { nights: quote.nights, subtotal: quote.subtotal, taxes: quote.taxes, discountAmount: quote.discountAmount, total: quote.total } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Razorpay order creation failed:', err.message);
    return res.status(502).json({ message: 'Unable to start online payment. Please try again.' });
  }
});

module.exports = router;
