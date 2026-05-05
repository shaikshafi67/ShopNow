/**
 * Tests for the discount applyCode() logic extracted from DiscountsContext.
 */
import { describe, it, expect } from 'vitest';

// Pure applyCode function mirrored from DiscountsContext (no React dependency)
function applyCode(discounts, code, cartTotal) {
  const disc = discounts.find(
    (d) => d.code.toUpperCase() === code.toUpperCase() && d.method === 'code',
  );
  if (!disc) return { valid: false, error: 'Invalid discount code.' };
  if (disc.status !== 'active') return { valid: false, error: 'This discount is no longer active.' };
  if (disc.usageLimit !== null && disc.usedCount >= disc.usageLimit)
    return { valid: false, error: 'This discount has reached its usage limit.' };
  if (disc.minOrderValue && cartTotal < disc.minOrderValue)
    return { valid: false, error: `Minimum order of ₹${disc.minOrderValue} required.` };
  if (disc.endsAt && new Date(disc.endsAt) < new Date())
    return { valid: false, error: 'This discount has expired.' };
  if (disc.startsAt && new Date(disc.startsAt) > new Date())
    return { valid: false, error: 'This discount is not active yet.' };

  let amount = 0;
  if (disc.type === 'free_shipping') {
    return { valid: true, discount: disc, amount: 0, freeShipping: true };
  }
  if (disc.valueType === 'fixed' || disc.type === 'amount_off_order' || disc.type === 'amount_off_product') {
    amount = Math.min(disc.value, cartTotal);
  } else if (disc.valueType === 'percentage' || disc.type === 'percentage_off_order' || disc.type === 'amount_off_products') {
    amount = Math.round((cartTotal * disc.value) / 100);
  }

  return { valid: true, discount: disc, amount };
}

const baseDisc = {
  id: 'disc_1',
  code: 'SAVE10',
  method: 'code',
  type: 'percentage_off_order',
  value: 10,
  status: 'active',
  minOrderValue: 0,
  usageLimit: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
};

describe('applyCode()', () => {
  it('returns invalid for an unknown code', () => {
    const result = applyCode([baseDisc], 'UNKNOWN', 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid discount code.');
  });

  it('is case-insensitive', () => {
    const result = applyCode([baseDisc], 'save10', 1000);
    expect(result.valid).toBe(true);
  });

  it('rejects an inactive discount', () => {
    const disc = { ...baseDisc, status: 'expired' };
    const result = applyCode([disc], 'SAVE10', 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/no longer active/);
  });

  it('rejects when usage limit is reached', () => {
    const disc = { ...baseDisc, usageLimit: 5, usedCount: 5 };
    const result = applyCode([disc], 'SAVE10', 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/usage limit/);
  });

  it('rejects when cart is below minOrderValue', () => {
    const disc = { ...baseDisc, minOrderValue: 500 };
    const result = applyCode([disc], 'SAVE10', 300);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/₹500/);
  });

  it('accepts when cart equals minOrderValue', () => {
    const disc = { ...baseDisc, minOrderValue: 500 };
    const result = applyCode([disc], 'SAVE10', 500);
    expect(result.valid).toBe(true);
  });

  it('rejects an expired discount', () => {
    const disc = { ...baseDisc, endsAt: '2020-01-01T00:00:00Z' };
    const result = applyCode([disc], 'SAVE10', 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expired/);
  });

  it('rejects a discount that has not started yet', () => {
    const disc = { ...baseDisc, startsAt: '2099-01-01T00:00:00Z' };
    const result = applyCode([disc], 'SAVE10', 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not active yet/);
  });

  it('calculates 10% off a ₹1000 cart', () => {
    const result = applyCode([baseDisc], 'SAVE10', 1000);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(100);
  });

  it('calculates a flat amount_off_order discount', () => {
    const disc = { ...baseDisc, code: 'FLAT100', type: 'amount_off_order', value: 100 };
    const result = applyCode([disc], 'FLAT100', 800);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(100);
  });

  it('caps flat discount at the cart total', () => {
    const disc = { ...baseDisc, code: 'FLAT500', type: 'amount_off_order', value: 500 };
    const result = applyCode([disc], 'FLAT500', 200);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(200); // capped at cart total
  });

  it('returns freeShipping for a free_shipping discount', () => {
    const disc = { ...baseDisc, code: 'FREESHIP', type: 'free_shipping' };
    const result = applyCode([disc], 'FREESHIP', 500);
    expect(result.valid).toBe(true);
    expect(result.freeShipping).toBe(true);
    expect(result.amount).toBe(0);
  });

  it('allows unlimited use when usageLimit is null', () => {
    const disc = { ...baseDisc, usageLimit: null, usedCount: 9999 };
    const result = applyCode([disc], 'SAVE10', 1000);
    expect(result.valid).toBe(true);
  });
});
