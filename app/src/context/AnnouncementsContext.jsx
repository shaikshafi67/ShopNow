import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, set } from '../utils/idb';

const AnnouncementsContext = createContext(null);

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error('useAnnouncements must be inside AnnouncementsProvider');
  return ctx;
}

const KEY = 'shopnow:announcements';

const DEFAULT = {
  home: {
    active: true,
    bgFrom: '#7c6aff', bgTo: '#ff6a9a', bgDir: '135deg',
    textColor: '#ffffff', speed: 30, separator: '✦',
    items: ['NEW ARRIVALS SS26', 'FREE SHIPPING ₹999+', 'UP TO 50% OFF', '3D VIRTUAL TRY-ON', 'PREMIUM QUALITY', 'EASY 30-DAY RETURNS'],
  },
  men: {
    active: true,
    bgFrom: '#7c6aff', bgTo: '#3b82f6', bgDir: '135deg',
    textColor: '#ffffff', speed: 22, separator: '·',
    items: ['FREE SHIPPING ON ₹999+', 'NEW ARRIVALS DAILY', 'UP TO 40% OFF MENSWEAR', '3D VIRTUAL TRY-ON', 'PREMIUM QUALITY FABRICS', 'EASY 30-DAY RETURNS'],
  },
  women: {
    active: true,
    bgFrom: '#ff6a9a', bgTo: '#fb923c', bgDir: '135deg',
    textColor: '#ffffff', speed: 24, separator: '✦',
    items: ['SUMMER COLLECTION 2026', 'UP TO 50% OFF WOMENSWEAR', 'FREE SHIPPING ₹999+', 'NEW STYLES DAILY', '3D VIRTUAL TRY-ON', 'EASY 30-DAY RETURNS'],
  },
};

export function AnnouncementsProvider({ children }) {
  const [bars, setBars] = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    get(KEY).then(stored => {
      if (stored) setBars(prev => ({
        home: { ...prev.home, ...stored.home },
        men:  { ...prev.men,  ...stored.men  },
        women:{ ...prev.women,...stored.women },
      }));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const updateBar = useCallback((page, patch) => {
    setBars(prev => {
      const next = { ...prev, [page]: { ...prev[page], ...patch } };
      set(KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <AnnouncementsContext.Provider value={{ bars, updateBar, loaded }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}
