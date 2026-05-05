import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotifContext = createContext(null);
export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifications must be used within NotifProvider');
  return ctx;
}

const toApp = (n) => ({
  id:        n.id,
  title:     n.title,
  body:      n.body,
  type:      n.type,
  link:      n.link,
  read:      n.is_read,
  createdAt: n.created_at,
});

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    supabase.from('notifications').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setNotifs((data ?? []).map(toApp)));
  }, [user]);

  const add = useCallback(async ({ title, body, type = 'info', link = null }) => {
    if (!user) return;
    const { data, error } = await supabase.from('notifications').insert({
      user_id: user.id, title, body, type, link, is_read: false,
    }).select().single();
    if (error) return;
    setNotifs(prev => [toApp(data), ...prev].slice(0, 50));
  }, [user]);

  const markRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifs([]);
  }, [user]);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{ notifs, unread, add, markRead, markAllRead, clearAll }}>
      {children}
    </NotifContext.Provider>
  );
}
