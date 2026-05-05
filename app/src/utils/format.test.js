import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inr, shortDate, relTime, addDays, orderId } from './format';

describe('inr()', () => {
  it('formats a whole number with rupee symbol', () => {
    expect(inr(1000)).toBe('₹1,000');
  });

  it('formats zero', () => {
    expect(inr(0)).toBe('₹0');
  });

  it('formats a large amount', () => {
    expect(inr(100000)).toBe('₹1,00,000');
  });

  it('returns ₹0 for NaN', () => {
    expect(inr(NaN)).toBe('₹0');
  });

  it('returns ₹0 for a string', () => {
    expect(inr('abc')).toBe('₹0');
  });

  it('returns ₹0 for null', () => {
    expect(inr(null)).toBe('₹0');
  });
});

describe('shortDate()', () => {
  it('formats a Date object', () => {
    const d = new Date('2024-01-15');
    const result = shortDate(d);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });

  it('formats an ISO date string', () => {
    const result = shortDate('2024-06-20');
    expect(result).toMatch(/Jun/);
  });
});

describe('relTime()', () => {
  let now;

  beforeEach(() => {
    now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for times less than 30 seconds ago', () => {
    const d = new Date(now - 10_000); // 10 s → Math.round(10/60) = 0 → "just now"
    expect(relTime(d)).toBe('just now');
  });

  it('returns minutes ago for < 1 hour', () => {
    const d = new Date(now - 10 * 60_000);
    expect(relTime(d)).toBe('10m ago');
  });

  it('returns hours ago for < 24 hours', () => {
    const d = new Date(now - 3 * 3_600_000);
    expect(relTime(d)).toBe('3h ago');
  });

  it('returns days ago for < 30 days', () => {
    const d = new Date(now - 5 * 86_400_000);
    expect(relTime(d)).toBe('5d ago');
  });

  it('returns formatted date for >= 30 days', () => {
    const d = new Date(now - 40 * 86_400_000);
    const result = relTime(d);
    // Should not contain "ago"
    expect(result).not.toMatch(/ago/);
  });
});

describe('addDays()', () => {
  it('adds positive days', () => {
    const base = new Date('2024-01-01');
    const result = addDays(base, 5);
    expect(result.getDate()).toBe(6);
    expect(result.getMonth()).toBe(0); // January
  });

  it('adds days crossing a month boundary', () => {
    const base = new Date('2024-01-30');
    const result = addDays(base, 3);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // February
  });

  it('does not mutate the original date', () => {
    const base = new Date('2024-01-01');
    addDays(base, 10);
    expect(base.getDate()).toBe(1);
  });

  it('handles negative days (subtraction)', () => {
    const base = new Date('2024-01-10');
    const result = addDays(base, -3);
    expect(result.getDate()).toBe(7);
  });
});

describe('orderId()', () => {
  it('starts with SHN-', () => {
    expect(orderId()).toMatch(/^SHN-/);
  });

  it('contains the current year', () => {
    const year = new Date().getFullYear().toString();
    expect(orderId()).toContain(year);
  });

  it('ends with a 6-digit number', () => {
    expect(orderId()).toMatch(/SHN-\d{4}-\d{6}$/);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, orderId));
    expect(ids.size).toBeGreaterThan(1);
  });
});
