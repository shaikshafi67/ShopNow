import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { uid } from '../utils/storage';
import { get, set } from '../utils/idb';

const BannersContext = createContext(null);

export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error('useBanners must be used within BannersProvider');
  return ctx;
}

const HERO_KEY = 'shopnow:heroImages';
const BANNER_SETTINGS_KEY = 'shopnow:bannerSettings';

export const BANNER_HEIGHT_PRESETS = [
  { id: 'fullscreen', label: 'Full Screen',  vh: null,  css: 'calc(100vh - var(--nav-height, 64px))' },
  { id: 'large',      label: 'Large (80vh)', vh: 80,   css: '80vh' },
  { id: 'medium',     label: 'Medium (60vh)',vh: 60,   css: '60vh' },
  { id: 'small',      label: 'Small (40vh)', vh: 40,   css: '40vh' },
  { id: 'custom',     label: 'Custom',       vh: null,  css: null },
];

const DEFAULT_SETTINGS = { preset: 'fullscreen', customVh: 70 };

export function BannersProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const ready = useRef(false);
  const shouldBroadcast = useRef(false);
  const [heroImages, setHeroImages] = useState({ men: null, women: null });
  const [bannerSettings, setBannerSettings] = useState(DEFAULT_SETTINGS);

  const setBannerHeight = useCallback((patch) => {
    setBannerSettings(prev => {
      const next = { ...prev, ...patch };
      set(BANNER_SETTINGS_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setHeroImage = useCallback((side, dataUrl) => {
    setHeroImages(prev => {
      const next = { ...prev, [side]: dataUrl };
      set(HERO_KEY, next).catch(err => {
        console.error('Hero image IDB save failed — trying without the other side:', err);
        const minimal = { men: null, women: null, [side]: dataUrl };
        set(HERO_KEY, minimal).catch(() => {
          window.dispatchEvent(new CustomEvent('hero-save-error', { detail: { side } }));
        });
      });
      try {
        const bc = new BroadcastChannel('shopnow-hero');
        bc.postMessage({ type: 'heroUpdate', side, dataUrl });
        bc.close();
      } catch {}
      return next;
    });
  }, []);

  const clearHeroImage = useCallback((side) => {
    setHeroImages(prev => {
      const next = { ...prev, [side]: null };
      set(HERO_KEY, next).catch(() => {});
      try {
        const bc = new BroadcastChannel('shopnow-hero');
        bc.postMessage({ type: 'heroUpdate', side, dataUrl: null });
        bc.close();
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [stored, storedHero, storedSettings] = await Promise.all([get('banners'), get(HERO_KEY), get(BANNER_SETTINGS_KEY)]);
        if (!cancelled) {
          if (stored && Array.isArray(stored)) setBanners(stored);
          if (storedHero) setHeroImages(storedHero);
          if (storedSettings) setBannerSettings(s => ({ ...s, ...storedSettings }));
          ready.current = true;
          setLoading(false);
        }
      } catch {
        if (!cancelled) { ready.current = true; setLoading(false); }
      }
    }
    init();

    let bcHero, bcBanners;
    try {
      bcHero = new BroadcastChannel('shopnow-hero');
      bcHero.onmessage = (e) => {
        if (e.data?.type === 'heroUpdate') {
          setHeroImages(prev => ({ ...prev, [e.data.side]: e.data.dataUrl }));
        }
      };
    } catch {}

    try {
      bcBanners = new BroadcastChannel('shopnow-banners');
      bcBanners.onmessage = (e) => {
        if (e.data?.type === 'bannersUpdate' && Array.isArray(e.data.banners)) {
          // Received from another tab — update but do NOT re-broadcast
          shouldBroadcast.current = false;
          setBanners(e.data.banners);
        }
      };
    } catch {}

    const onFocus = () => {
      Promise.all([get('banners'), get(HERO_KEY)]).then(([b, h]) => {
        if (b && Array.isArray(b)) {
          shouldBroadcast.current = false;
          setBanners(b);
        }
        if (h) setHeroImages(h);
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      bcHero?.close();
      bcBanners?.close();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Save to IDB on every change; broadcast only for local mutations
  useEffect(() => {
    if (ready.current) {
      set('banners', banners).catch((err) => console.error('Failed to save banners', err));
      if (shouldBroadcast.current) {
        try {
          const bc = new BroadcastChannel('shopnow-banners');
          bc.postMessage({ type: 'bannersUpdate', banners });
          bc.close();
        } catch {}
        shouldBroadcast.current = false;
      }
    }
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
    shouldBroadcast.current = true;
    setBanners((arr) => [...arr, banner]);
    return banner;
  }, []);

  const updateBanner = useCallback((id, patch) => {
    shouldBroadcast.current = true;
    setBanners((arr) => arr.map((b) => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const removeBanner = useCallback((id) => {
    shouldBroadcast.current = true;
    setBanners((arr) => arr.filter((b) => b.id !== id));
  }, []);

  const moveBanner = useCallback((id, dir) => {
    shouldBroadcast.current = true;
    setBanners((arr) => {
      const idx = arr.findIndex((b) => b.id === id);
      const swap = idx + (dir === 'up' ? -1 : 1);
      if (idx === -1 || swap < 0 || swap >= arr.length) return arr;
      const next = [...arr];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const activeBanners = banners.filter((b) => b.active && b.image);

  return (
    <BannersContext.Provider value={{ banners, loading, activeBanners, addBanner, updateBanner, removeBanner, moveBanner, heroImages, setHeroImage, clearHeroImage, bannerSettings, setBannerHeight }}>
      {children}
    </BannersContext.Provider>
  );
}
