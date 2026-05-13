import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// Convert DB row → app cart item shape
const toItem = (row, product) => ({
  _key:          `${row.product_id}::${row.size ?? ''}::${row.color_index ?? 0}`,
  productId:     row.product_id,
  name:          product?.name          ?? row.name ?? '',
  price:         product?.price         ?? Number(row.price ?? 0),
  originalPrice: product?.originalPrice ?? Number(row.original_price ?? 0),
  image:         product?.images?.[row.color_index ?? 0] ?? product?.images?.[0] ?? '',
  size:          row.size,
  color:         row.color_index ?? 0,
  colorHex:      product?.colors?.[row.color_index ?? 0] ?? null,
  freeShipping:  product?.freeShipping ?? false,
  qty:           row.qty,
  addedAt:       row.added_at,
});

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Load cart from Supabase — only for logged-in users
  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id);
    setItems((data ?? []).map(row => toItem(row, row.products ? {
      ...row.products,
      price:         Number(row.products.price),
      originalPrice: Number(row.products.original_price),
      freeShipping:  row.products.free_shipping,
    } : null)));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (product, { size = null, color = 0, qty = 1 } = {}) => {
    if (!user) return; // must be logged in
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, qty')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .eq('size', size ?? '')
      .eq('color_index', color)
      .maybeSingle();

    if (existing) {
      await supabase.from('cart_items')
        .update({ qty: Math.min(99, existing.qty + qty) })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id, product_id: product.id,
        qty, size: size ?? null, color_index: color,
      });
    }
    await load();
  }, [user, load]);

  const updateQty = useCallback(async (key, qty) => {
    if (!user) return;
    const item = items.find(i => i._key === key);
    if (!item) return;
    await supabase.from('cart_items')
      .update({ qty: Math.max(1, Math.min(99, qty)) })
      .eq('user_id', user.id).eq('product_id', item.productId)
      .eq('size', item.size ?? null).eq('color_index', item.color);
    await load();
  }, [user, items, load]);

  const removeItem = useCallback(async (key) => {
    if (!user) return;
    const item = items.find(i => i._key === key);
    if (!item) return;
    await supabase.from('cart_items')
      .delete().eq('user_id', user.id).eq('product_id', item.productId)
      .eq('color_index', item.color);
    await load();
  }, [user, items, load]);

  const clear = useCallback(async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  }, [user]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const original = items.reduce((s, it) => s + (it.originalPrice || it.price) * it.qty, 0);
    const savings  = original - subtotal;
    const allFree  = items.length > 0 && items.every(it => it.freeShipping);
    const shipping  = subtotal === 0 ? 0 : (allFree || subtotal >= 999) ? 0 : 49;
    const tax       = Math.round(subtotal * 0.05);
    const total     = subtotal + shipping + tax;
    const count     = items.reduce((s, it) => s + it.qty, 0);
    return { subtotal, original, savings, shipping, tax, total, count };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove: removeItem, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}
