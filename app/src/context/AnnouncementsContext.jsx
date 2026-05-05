import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AnnouncementsContext = createContext(null);
export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error('useAnnouncements must be used within AnnouncementsProvider');
  return ctx;
}

const DEFAULT_BAR = {
  active: false, bgFrom: '#7c6aff', bgTo: '#a78bfa', bgDir: '135deg',
  textColor: '#ffffff', speed: 25, separator: '✦', items: [],
};

const toApp = (row) => ({
  active:    row.is_active,
  bgFrom:    row.bg_from,
  bgTo:      row.bg_to,
  bgDir:     row.bg_dir,
  textColor: row.text_color,
  speed:     row.speed,
  separator: row.separator,
  items:     row.items ?? [],
});

export function AnnouncementsProvider({ children }) {
  const [bars, setBars] = useState({
    home: DEFAULT_BAR, men: DEFAULT_BAR, women: DEFAULT_BAR,
  });

  useEffect(() => {
    supabase.from('announcements').select('*').then(({ data }) => {
      if (!data) return;
      const next = { home: DEFAULT_BAR, men: DEFAULT_BAR, women: DEFAULT_BAR };
      data.forEach(row => { if (next[row.id] !== undefined) next[row.id] = toApp(row); });
      setBars(next);
    });
  }, []);

  const saveBars = useCallback(async (newBars) => {
    const rows = Object.entries(newBars).map(([id, bar]) => ({
      id,
      is_active:  bar.active,
      bg_from:    bar.bgFrom,
      bg_to:      bar.bgTo,
      bg_dir:     bar.bgDir,
      text_color: bar.textColor,
      speed:      bar.speed,
      separator:  bar.separator,
      items:      bar.items,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('announcements').upsert(rows);
    setBars(newBars);
  }, []);

  const updateBar = useCallback(async (page, updates) => {
    const updated = { ...bars, [page]: { ...bars[page], ...updates } };
    await saveBars(updated);
  }, [bars, saveBars]);

  return (
    <AnnouncementsContext.Provider value={{ bars, saveBars, updateBar }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}
