import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { uid } from '../utils/storage';
import { get, set } from '../utils/idb';

const BannersContext = createContext(null);

export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error('useBanners must be used within BannersProvider');
  return ctx;
}

function persist(banners) {
  set('banners', banners).catch((err) => console.error('Failed to save banners', err));
}

export function BannersProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const ready = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stored = await get('banners');
        if (!cancelled) {
          if (stored && Array.isArray(stored)) setBanners(stored);
          ready.current = true;
          setLoading(false);
        }
      } catch {
        if (!cancelled) { ready.current = true; setLoading(false); }
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready.current) persist(banners);
  }, [banners]);

  const addBanner = useCallback((data) => {
    const banner = {
      id: uid('ban'),
      image: data.image || '',
      title: data.title || '',
      subtitle: data.subtitle || '',
      link: data.link || '/',
      active: data.active !== false,
      createdAt: new Date().toISOString(),
    };
    setBanners((arr) => { const next = [...arr, banner]; persist(next); return next; });
    return banner;
  }, []);

  const updateBanner = useCallback((id, patch) => {
    setBanners((arr) => { const next = arr.map((b) => b.id === id ? { ...b, ...patch } : b); persist(next); return next; });
  }, []);

  const removeBanner = useCallback((id) => {
    setBanners((arr) => { const next = arr.filter((b) => b.id !== id); persist(next); return next; });
  }, []);

  const moveBanner = useCallback((id, dir) => {
    setBanners((arr) => {
      const idx = arr.findIndex((b) => b.id === id);
      const swap = idx + (dir === 'up' ? -1 : 1);
      if (idx === -1 || swap < 0 || swap >= arr.length) return arr;
      const next = [...arr];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      persist(next);
      return next;
    });
  }, []);

  const activeBanners = banners.filter((b) => b.active && b.image);

  return (
    <BannersContext.Provider value={{ banners, loading, activeBanners, addBanner, updateBanner, removeBanner, moveBanner }}>
      {children}
    </BannersContext.Provider>
  );
}
