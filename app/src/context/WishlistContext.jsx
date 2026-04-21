import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { read, write } from '../utils/storage';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

const wlKey = (uid) => (uid ? `wishlist:${uid}` : 'wishlist:guest');

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const key = wlKey(user?.id);
  const [ids, setIds] = useState(() => read(key, []));

  useEffect(() => { setIds(read(key, [])); /* eslint-disable-next-line */ }, [key]);
  useEffect(() => { write(key, ids); }, [key, ids]);

  const has = useCallback((productId) => ids.includes(productId), [ids]);
  const add = useCallback((productId) => setIds((arr) => arr.includes(productId) ? arr : [...arr, productId]), []);
  const remove = useCallback((productId) => setIds((arr) => arr.filter((id) => id !== productId)), []);
  const toggle = useCallback((productId) => {
    let added = false;
    setIds((arr) => {
      if (arr.includes(productId)) return arr.filter((id) => id !== productId);
      added = true;
      return [...arr, productId];
    });
    return added;
  }, []);
  const clear = useCallback(() => setIds([]), []);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, has, add, remove, toggle, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}
