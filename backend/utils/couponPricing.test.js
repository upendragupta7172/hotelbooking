const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCouponDiscount, normalizeCouponCode, validateCouponTarget } = require('./couponPricing');

const futureExpiry = new Date('2030-01-01T00:00:00.000Z');

test('normalizes coupon codes and calculates percentage discounts with a cap', () => {
  assert.equal(normalizeCouponCode('  staynest10 '), 'STAYNEST10');
  assert.equal(calculateCouponDiscount({
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 150,
    expiryDate: futureExpiry,
  }, 1000), 150);
});

test('calculates flat discounts without discounting more than the subtotal', () => {
  assert.equal(calculateCouponDiscount({
    discountType: 'flat',
    discountValue: 500,
    expiryDate: futureExpiry,
  }, 300), 300);
});

test('rejects coupons below their minimum booking amount or after expiry', () => {
  assert.throws(() => calculateCouponDiscount({
    discountType: 'flat',
    discountValue: 100,
    minBookingAmount: 1000,
    expiryDate: futureExpiry,
  }, 999), /Add items worth/);

  assert.throws(() => calculateCouponDiscount({
    discountType: 'percentage',
    discountValue: 10,
    expiryDate: new Date('2020-01-01T00:00:00.000Z'),
  }, 1000), /expired/);
});

test('restricts targeted coupons to their configured hotel and room category', () => {
  const coupon = { applicableHotel: 'hotel-1', applicableCategory: 'category-1' };
  validateCouponTarget(coupon, { hotel: 'hotel-1', category: 'category-1' });
  assert.throws(() => validateCouponTarget(coupon, { hotel: 'hotel-2', category: 'category-1' }), /selected hotel/);
  assert.throws(() => validateCouponTarget(coupon, { hotel: 'hotel-1', category: 'category-2' }), /room category/);
  assert.doesNotThrow(() => validateCouponTarget({}, { hotel: 'hotel-2', category: 'category-2' }));
});
