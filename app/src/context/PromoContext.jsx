import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PromoContext = createContext(null);
export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used within PromoProvider');
  return ctx;
}

const DEFAULTS = {
  home:   { active: false, badge: 'Flash Sale', headline: '50% OFF', subline: 'SELECTED STYLES', code: '', btn1Label: 'Shop Men', btn1Link: '/men', btn2Label: 'Shop Women', btn2Link: '/women' },
  men:    { active: false, title: "Men's Sale", subtitle: 'Limited time offer', code: '', btnLabel: 'Shop Now' },
  women:  { active: false, title: "Women's Sale", subtitle: 'Limited time offer', code: '', btnLabel: 'Shop Now' },
};

export function PromoProvider({ children }) {
  const [promos, setPromos] = useState(DEFAULTS);

  useEffect(() => {
    supabase.from('promos').select('*').then(({ data }) => {
      if (!data) return;
      const next = { ...DEFAULTS };
      data.forEach(row => { if (next[row.id] !== undefined) next[row.id] = { ...DEFAULTS[row.id], ...row.data, active: row.is_active }; });
      setPromos(next);
    });
  }, []);

  const savePromos = useCallback(async (newPromos) => {
    const rows = Object.entries(newPromos).map(([id, promo]) => {
      const { active, ...data } = promo;
      return { id, is_active: active, data, updated_at: new Date().toISOString() };
    });
    await supabase.from('promos').upsert(rows);
    setPromos(newPromos);
  }, []);

  const updatePromo = useCallback(async (page, updates) => {
    const updated = { ...promos, [page]: { ...promos[page], ...updates } };
    await savePromos(updated);
  }, [promos, savePromos]);

  return (
    <PromoContext.Provider value={{ promos, savePromos, updatePromo }}>
      {children}
    </PromoContext.Provider>
  );
}
