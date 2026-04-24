import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'shopnow:discounts';

const SEED = [
  {
    id: 'disc_first100',
    title: 'FIRST100',
    code: 'FIRST100',
    type: 'amount_off_order',
    method: 'code',
    value: 100,
    status: 'active',
    minOrderValue: 500,
    usageLimit: null,
    usedCount: 1,
    startsAt: null,
    endsAt: null,
    combinations: { products: false, orders: false, shipping: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'disc_save10',
    title: 'SAVE10',
    code: 'SAVE10',
    type: 'percentage_off_order',
    method: 'code',
    value: 10,
    status: 'active',
    minOrderValue: 0,
    usageLimit: null,
    usedCount: 0,
    startsAt: null,
    endsAt: null,
    combinations: { products: true, orders: true, shipping: true },
    createdAt: new Date().toISOString(),
  },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED;
  } catch {
    return SEED;
  }
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const DiscountsContext = createContext(null);

export function DiscountsProvider({ children }) {
  const [discounts, setDiscounts] = useState(load);

  const save = useCallback((next) => {
    const updated = typeof next === 'function' ? next(discounts) : next;
    setDiscounts(updated);
    persist(updated);
  }, [discounts]);

  const addDiscount = useCallback((data) => {
    const disc = {
      ...data,
      id: 'disc_' + Date.now(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    setDiscounts((prev) => {
      const next = [disc, ...prev];
      persist(next);
      return next;
    });
    return disc;
  }, []);

  const updateDiscount = useCallback((id, data) => {
    setDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...data } : d));
      persist(next);
      return next;
    });
  }, []);

  const removeDiscount = useCallback((id) => {
    setDiscounts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const applyCode = useCallback((code, cartTotal) => {
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
    if (disc.type === 'amount_off_order' || disc.type === 'amount_off_product') {
      amount = Math.min(disc.value, cartTotal);
    } else if (disc.type === 'percentage_off_order') {
      amount = Math.round((cartTotal * disc.value) / 100);
    }

    return { valid: true, discount: disc, amount };
  }, [discounts]);

  const incrementUsed = useCallback((id) => {
    setDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, usedCount: d.usedCount + 1 } : d));
      persist(next);
      return next;
    });
  }, []);

  return (
    <DiscountsContext.Provider value={{ discounts, addDiscount, updateDiscount, removeDiscount, applyCode, incrementUsed }}>
      {children}
    </DiscountsContext.Provider>
  );
}

export function useDiscounts() {
  return useContext(DiscountsContext);
}
