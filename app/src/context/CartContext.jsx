import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { read, write, remove } from '../utils/storage';

const CartContext = createContext(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const guestKey = () => 'cart:guest';

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

  // Load cart — Supabase for logged-in, localStorage for guest
  const load = useCallback(async () => {
    if (user) {
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
    } else {
      setItems(read(guestKey(), []));
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (product, { size = null, color = 0, qty = 1 } = {}) => {
    if (user) {
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
    } else {
      setItems(prev => {
        const k  = `${product.id}::${size ?? ''}::${color}`;
        const ex = prev.find(i => i._key === k);
        const next = ex
          ? prev.map(i => i._key === k ? { ...i, qty: Math.min(99, i.qty + qty) } : i)
          : [...prev, {
              _key: k, productId: product.id, name: product.name,
              price: product.price, originalPrice: product.originalPrice,
              image: product.images?.[color] ?? product.images?.[0],
              size, color, colorHex: product.colors?.[color] ?? null,
              freeShipping: product.freeShipping ?? false,
              qty, addedAt: new Date().toISOString(),
            }];
        write(guestKey(), next);
        return next;
      });
    }
  }, [user, load]);

  const updateQty = useCallback(async (key, qty) => {
    if (user) {
      const item = items.find(i => i._key === key);
      if (!item) return;
      await supabase.from('cart_items')
        .update({ qty: Math.max(1, Math.min(99, qty)) })
        .eq('user_id', user.id).eq('product_id', item.productId)
        .eq('size', item.size ?? null).eq('color_index', item.color);
      await load();
    } else {
      setItems(prev => {
        const next = prev.map(i => i._key === key ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i);
        write(guestKey(), next);
        return next;
      });
    }
  }, [user, items, load]);

  const removeItem = useCallback(async (key) => {
    if (user) {
      const item = items.find(i => i._key === key);
      if (!item) return;
      await supabase.from('cart_items')
        .delete().eq('user_id', user.id).eq('product_id', item.productId)
        .eq('color_index', item.color);
      await load();
    } else {
      setItems(prev => {
        const next = prev.filter(i => i._key !== key);
        write(guestKey(), next);
        return next;
      });
    }
  }, [user, items, load]);

  const clear = useCallback(async () => {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    } else {
      remove(guestKey());
    }
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
