import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, ShoppingCart, Package, Info, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '../context/NotifContext';
import { relTime } from '../utils/format';
import { Link } from 'react-router-dom';

const TYPE_META = {
  info: { icon: Info, color: '#3b82f6' },
  success: { icon: Check, color: '#22c55e' },
  warning: { icon: AlertTriangle, color: '#f59e0b' },
  order: { icon: Package, color: '#7c6aff' },
  cart: { icon: ShoppingCart, color: '#ff6a9a' },
};

export default function NotificationsPage() {
  const { items, unreadCount, markRead, markAllRead, remove, clear } = useNotifications();

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 720 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 800,
                marginBottom: 6,
              }}>Notifications</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: 13 }}>
                    <CheckCheck size={15} /> Mark all read
                  </button>
                )}
                <button onClick={clear} className="btn btn-ghost" style={{ fontSize: 13, color: '#ef4444' }}>
                  <Trash2 size={15} /> Clear all
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <Bell size={42} color="var(--accent)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              No notifications yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto' }}>
              When you place orders or interact with the shop, notifications will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {items.map((n, i) => {
                const meta = TYPE_META[n.type] || TYPE_META.info;
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !n.read && markRead(n.id)}
                    style={{
                      background: n.read ? 'var(--bg-card)' : 'rgba(124,106,255,0.05)',
                      border: `1px solid ${n.read ? 'var(--border-glass)' : 'rgba(124,106,255,0.2)'}`,
                      borderRadius: 14, padding: '14px 18px',
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: meta.color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</span>
                        {!n.read && (
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
                        {n.body}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{relTime(n.createdAt)}</span>
                        {n.link && (
                          <Link to={n.link} style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
