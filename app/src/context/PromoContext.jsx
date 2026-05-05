import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, set } from '../utils/idb';

const PromoContext = createContext(null);
export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be inside PromoProvider');
  return ctx;
}

const KEY = 'shopnow:promos';

const DEFAULT = {
  home: {
    active: true,
    badge: 'Flash Sale · Limited Time',
    headline: '50% OFF',
    subline: 'SELECTED STYLES',
    code: 'SAVE10',
    btn1Label: 'Shop Sale Now',
    btn1Link: '/sale',
    btn2Label: 'New Arrivals →',
    btn2Link: '/new-arrivals',
  },
  men: {
    active: true,
    title: "Men's Sale — Up to 40% Off",
    subtitle: 'Limited stock · Code',
    code: 'SAVE10',
    btnLabel: 'Shop Sale',
  },
  women: {
    active: true,
    title: "Women's Sale — Up to 50% Off",
    subtitle: 'Limited stock · Code',
    code: 'SAVE10',
    btnLabel: 'Shop Sale',
  },
};

export function PromoProvider({ children }) {
  const [promos, setPromos] = useState(DEFAULT);

  useEffect(() => {
    get(KEY).then(stored => {
      if (stored) setPromos(prev => ({
        home:   { ...prev.home,   ...(stored.home   || {}) },
        men:    { ...prev.men,    ...(stored.men    || {}) },
        women:  { ...prev.women,  ...(stored.women  || {}) },
      }));
    }).catch(() => {});
  }, []);

  const updatePromo = useCallback((page, patch) => {
    setPromos(prev => {
      const next = { ...prev, [page]: { ...prev[page], ...patch } };
      set(KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <PromoContext.Provider value={{ promos, updatePromo }}>
      {children}
    </PromoContext.Provider>
  );
}
