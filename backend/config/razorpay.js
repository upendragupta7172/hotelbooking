// Keep credentials in backend/.env; only the public key id is sent to the browser.
const keyId = () => process.env.RAZORPAY_KEY_ID || '';
const keySecret = () => process.env.RAZORPAY_KEY_SECRET || '';

const getCredentials = () => {
  const id = keyId();
  const secret = keySecret();
  if (!id || !secret) throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  return { key_id: id, key_secret: secret };
};

module.exports = { keyId, getCredentials };
