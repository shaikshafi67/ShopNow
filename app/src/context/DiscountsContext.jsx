import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DiscountsContext = createContext(null);
export function useDiscounts() {
  const ctx = useContext(DiscountsContext);
  if (!ctx) throw new Error('useDiscounts must be used within DiscountsProvider');
  return ctx;
}

const toApp = (d) => ({
  id:             d.id,
  title:          d.title,
  code:           d.code,
  type:           d.type,
  value:          Number(d.value),
  status:         d.status,
  minOrderValue:  d.min_order_value ? Number(d.min_order_value) : null,
  usageLimit:     d.usage_limit,
  usedCount:      d.used_count,
  startsAt:       d.starts_at,
  endsAt:         d.ends_at,
  combinations: {
    products: d.combine_products,
    orders:   d.combine_orders,
    shipping: d.combine_shipping,
  },
  createdAt: d.created_at,
});

export function DiscountsProvider({ children }) {
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    supabase.from('discounts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setDiscounts((data ?? []).map(toApp)));
  }, []);

  const applyCode = useCallback((code, subtotal) => {
    const disc = discounts.find(d =>
      d.code.toLowerCase() === code.toLowerCase() &&
      d.status === 'active' &&
      (!d.usageLimit || d.usedCount < d.usageLimit) &&
      (!d.startsAt || new Date(d.startsAt) <= new Date()) &&
      (!d.endsAt   || new Date(d.endsAt)   >= new Date())
    );
    if (!disc) return { valid: false, error: 'Invalid or expired coupon code' };
    if (disc.minOrderValue && subtotal < disc.minOrderValue)
      return { valid: false, error: `Minimum order value ₹${disc.minOrderValue} required` };

    let amount = 0;
    let freeShipping = false;
    if (disc.type === 'amount_off_order')      amount = Math.min(disc.value, subtotal);
    else if (disc.type === 'percentage_off_order') amount = Math.round(subtotal * disc.value / 100);
    else if (disc.type === 'free_shipping')    freeShipping = true;

    return { valid: true, discount: disc, amount, freeShipping };
  }, [discounts]);

  const incrementUsed = useCallback(async (discountId) => {
    const disc = discounts.find(d => d.id === discountId);
    if (!disc) return;
    const newCount = disc.usedCount + 1;
    await supabase.from('discounts').update({ used_count: newCount }).eq('id', discountId);
    setDiscounts(prev => prev.map(d => d.id === discountId ? { ...d, usedCount: newCount } : d));
  }, [discounts]);

  const addDiscount = useCallback(async (disc) => {
    const { data, error } = await supabase.from('discounts').insert({
      title: disc.title, code: disc.code.toUpperCase(), type: disc.type,
      value: disc.value, status: disc.status ?? 'active',
      min_order_value: disc.minOrderValue ?? null,
      usage_limit: disc.usageLimit ?? null, used_count: 0,
      starts_at: disc.startsAt ?? null, ends_at: disc.endsAt ?? null,
      combine_products: disc.combinations?.products ?? false,
      combine_orders:   disc.combinations?.orders   ?? false,
      combine_shipping: disc.combinations?.shipping  ?? false,
    }).select().single();
    if (error) throw new Error(error.message);
    setDiscounts(prev => [toApp(data), ...prev]);
    return toApp(data);
  }, []);

  const updateDiscount = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('discounts').update({
      title: updates.title, code: updates.code?.toUpperCase(), type: updates.type,
      value: updates.value, status: updates.status,
      min_order_value: updates.minOrderValue ?? null,
      usage_limit: updates.usageLimit ?? null,
      starts_at: updates.startsAt ?? null, ends_at: updates.endsAt ?? null,
      combine_products: updates.combinations?.products ?? false,
      combine_orders:   updates.combinations?.orders   ?? false,
      combine_shipping: updates.combinations?.shipping  ?? false,
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    setDiscounts(prev => prev.map(d => d.id === id ? toApp(data) : d));
  }, []);

  const deleteDiscount = useCallback(async (id) => {
    await supabase.from('discounts').delete().eq('id', id);
    setDiscounts(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <DiscountsContext.Provider value={{
      discounts, applyCode, incrementUsed,
      addDiscount, updateDiscount, deleteDiscount,
      removeDiscount: deleteDiscount, // alias
    }}>
      {children}
    </DiscountsContext.Provider>
  );
}
