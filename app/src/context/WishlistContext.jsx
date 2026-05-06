import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { read, write } from '../utils/storage';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

const guestKey = 'wishlist:guest';

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  // Load wishlist — Supabase for logged-in, localStorage for guest
  useEffect(() => {
    if (user) {
      supabase.from('wishlist_items').select('product_id').eq('user_id', user.id)
        .then(({ data }) => setIds((data ?? []).map(r => r.product_id)));
    } else {
      setIds(read(guestKey, []));
    }
  }, [user]);

  // Persist guest wishlist to localStorage
  useEffect(() => {
    if (!user) write(guestKey, ids);
  }, [ids, user]);

  const has = useCallback((productId) => ids.includes(productId), [ids]);

  const add = useCallback(async (productId) => {
    if (ids.includes(productId)) return;
    if (user) {
      await supabase.from('wishlist_items').upsert({ user_id: user.id, product_id: productId });
    }
    setIds((arr) => [...arr, productId]);
  }, [ids, user]);

  const remove = useCallback(async (productId) => {
    if (user) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
    }
    setIds((arr) => arr.filter((id) => id !== productId));
  }, [user]);

  const toggle = useCallback(async (productId) => {
    if (ids.includes(productId)) {
      await remove(productId);
      return false;
    } else {
      await add(productId);
      return true;
    }
  }, [ids, add, remove]);

  const clear = useCallback(async () => {
    if (user) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id);
    }
    setIds([]);
  }, [user]);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, has, add, remove, toggle, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}
