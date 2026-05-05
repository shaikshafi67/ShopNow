import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { read, write, remove } from '../utils/storage';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const cartKey = (uid) => (uid ? `cart:${uid}` : 'cart:guest');

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = cartKey(user?.id);
  const [items, setItems] = useState(() => read(key, []));

  // reload when user changes
  useEffect(() => { setItems(read(key, [])); /* eslint-disable-next-line */ }, [key]);
  useEffect(() => { write(key, items); }, [key, items]);

  const lineKey = (productId, size, color) => `${productId}::${size || ''}::${color ?? ''}`;

  const add = useCallback((product, { size = null, color = 0, qty = 1 } = {}) => {
    setItems((arr) => {
      const k = lineKey(product.id, size, color);
      const existing = arr.find((it) => it._key === k);
      if (existing) {
        return arr.map((it) => it._key === k ? { ...it, qty: Math.min(99, it.qty + qty) } : it);
      }
      return [...arr, {
        _key: k,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images?.[0],
        size,
        color,
        colorHex: product.colors?.[color] || null,
        freeShipping: product.freeShipping === true,
        qty,
        addedAt: new Date().toISOString(),
      }];
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((arr) => arr.map((it) => it._key === key ? { ...it, qty: Math.max(1, Math.min(99, qty)) } : it));
  }, []);

  const remove = useCallback((key) => {
    setItems((arr) => arr.filter((it) => it._key !== key));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    remove(key); // directly remove from localStorage to survive quota edge cases
  }, [key]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const original = items.reduce((s, it) => s + (it.originalPrice || it.price) * it.qty, 0);
    const savings = original - subtotal;
    const allFreeShipping = items.length > 0 && items.every((it) => it.freeShipping);
    const shipping = subtotal === 0 ? 0 : allFreeShipping || subtotal >= 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;
    const count = items.reduce((s, it) => s + it.qty, 0);
    return { subtotal, original, savings, shipping, tax, total, count };
  }, [items]);

  const value = { items, add, updateQty, remove, clear, totals };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
