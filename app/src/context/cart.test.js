/**
 * Tests for the cart totals calculation logic extracted from CartContext.
 * The formula: subtotal, savings, shipping (free >= ₹999), 5% GST, and grand total.
 */
import { describe, it, expect } from 'vitest';

// Pure totals function mirrored from CartContext (no React dependency)
function computeTotals(items) {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const original = items.reduce((s, it) => s + (it.originalPrice || it.price) * it.qty, 0);
  const savings = original - subtotal;
  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;
  const count = items.reduce((s, it) => s + it.qty, 0);
  return { subtotal, original, savings, shipping, tax, total, count };
}

describe('cart totals', () => {
  it('returns all zeros for an empty cart', () => {
    const t = computeTotals([]);
    expect(t).toEqual({ subtotal: 0, original: 0, savings: 0, shipping: 0, tax: 0, total: 0, count: 0 });
  });

  it('charges ₹49 shipping for orders below ₹999', () => {
    const items = [{ price: 500, originalPrice: 500, qty: 1 }];
    const t = computeTotals(items);
    expect(t.shipping).toBe(49);
  });

  it('gives free shipping at exactly ₹999', () => {
    const items = [{ price: 999, originalPrice: 999, qty: 1 }];
    const t = computeTotals(items);
    expect(t.shipping).toBe(0);
  });

  it('gives free shipping above ₹999', () => {
    const items = [{ price: 1500, originalPrice: 1500, qty: 1 }];
    const t = computeTotals(items);
    expect(t.shipping).toBe(0);
  });

  it('calculates 5% GST on subtotal', () => {
    const items = [{ price: 1000, originalPrice: 1000, qty: 1 }];
    const t = computeTotals(items);
    expect(t.tax).toBe(50);
    expect(t.total).toBe(1050); // 1000 + 0 shipping + 50 tax
  });

  it('aggregates multiple line items', () => {
    const items = [
      { price: 400, originalPrice: 400, qty: 2 },
      { price: 300, originalPrice: 500, qty: 1 },
    ];
    const t = computeTotals(items);
    expect(t.subtotal).toBe(1100); // 800 + 300
    expect(t.original).toBe(1300); // 800 + 500
    expect(t.savings).toBe(200);
    expect(t.shipping).toBe(0); // >= 999
    expect(t.count).toBe(3);
  });

  it('uses item.price when originalPrice is absent', () => {
    const items = [{ price: 200, qty: 1 }]; // no originalPrice
    const t = computeTotals(items);
    expect(t.savings).toBe(0);
  });

  it('counts total quantity across all line items', () => {
    const items = [
      { price: 100, originalPrice: 100, qty: 3 },
      { price: 200, originalPrice: 200, qty: 2 },
    ];
    expect(computeTotals(items).count).toBe(5);
  });
});
