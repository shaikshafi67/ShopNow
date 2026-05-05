import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, set } from '../utils/idb';

const BrandContext = createContext(null);

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}

const BRAND_KEY = 'shopnow:brand';
const DEFAULT = {
  logoUrl: '/Logo.png',
  brandName: 'ShopNow',
  socials: { facebook: '', instagram: '', youtube: '' },
};

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT);

  useEffect(() => {
    get(BRAND_KEY).then(stored => {
      if (stored) setBrand(prev => ({ ...DEFAULT, ...prev, ...stored, socials: { ...DEFAULT.socials, ...(stored.socials || {}) } }));
    }).catch(() => {});
  }, []);

  const save = useCallback((next) => {
    setBrand(next);
    set(BRAND_KEY, next).catch(err => console.error('Failed to save brand', err));
  }, []);

  const setLogo = useCallback((dataUrl) => {
    setBrand(prev => { const next = { ...prev, logoUrl: dataUrl }; set(BRAND_KEY, next).catch(() => {}); return next; });
  }, []);

  const clearLogo = useCallback(() => {
    setBrand(prev => { const next = { ...prev, logoUrl: null }; set(BRAND_KEY, next).catch(() => {}); return next; });
  }, []);

  const setBrandName = useCallback((name) => {
    setBrand(prev => { const next = { ...prev, brandName: name || 'ShopNow' }; set(BRAND_KEY, next).catch(() => {}); return next; });
  }, []);

  const setSocials = useCallback((patch) => {
    setBrand(prev => {
      const next = { ...prev, socials: { ...prev.socials, ...patch } };
      set(BRAND_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <BrandContext.Provider value={{ ...brand, setLogo, clearLogo, setBrandName, setSocials }}>
      {children}
    </BrandContext.Provider>
  );
}
