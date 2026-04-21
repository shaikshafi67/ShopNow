import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { read, write, uid } from '../utils/storage';
import { useAuth } from './AuthContext';

const NotifContext = createContext(null);

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifications must be used within NotifProvider');
  return ctx;
}

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `notif:${user.id}` : 'notif:guest';
  const [items, setItems] = useState(() => read(key, []));

  useEffect(() => { setItems(read(key, [])); }, [key]);
  useEffect(() => { write(key, items); }, [key, items]);

  const unreadCount = items.filter((n) => !n.read).length;

  const add = useCallback(({ title, body, type = 'info', link = null }) => {
    const notif = {
      id: uid('ntf'),
      title,
      body,
      type, // info | success | warning | order
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setItems((arr) => [notif, ...arr].slice(0, 50));
    return notif;
  }, []);

  const markRead = useCallback((id) => {
    setItems((arr) => arr.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id) => {
    setItems((arr) => arr.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <NotifContext.Provider value={{ items, unreadCount, add, markRead, markAllRead, remove, clear }}>
      {children}
    </NotifContext.Provider>
  );
}
