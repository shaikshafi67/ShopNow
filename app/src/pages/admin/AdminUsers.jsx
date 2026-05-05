import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Shield, ShieldCheck, UserCog, Mail, Calendar, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { shortDate, inr } from '../../utils/format';
import { read } from '../../utils/storage';

export default function AdminUsers() {
  const { allUsers, user: currentUser } = useAuth();
  const { orders } = useOrders();
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-read from localStorage on mount and on manual refresh
  const [liveUsers, setLiveUsers] = useState(() => {
    const stored = read('users', null);
    return stored && Array.isArray(stored) ? stored : allUsers;
  });

  useEffect(() => {
    const stored = read('users', null);
    if (stored && Array.isArray(stored)) setLiveUsers(stored);
  }, [refreshKey, allUsers]);

  const handleRefresh = () => {
    const stored = read('users', null);
    if (stored && Array.isArray(stored)) { setLiveUsers(stored); setRefreshKey(k => k + 1); }
    toast.success(`Refreshed — ${stored?.length || 0} users loaded`);
  };

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let list = liveUsers;
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [liveUsers, search, roleFilter]);

  const userOrders = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!map[o.userId]) map[o.userId] = { count: 0, total: 0 };
      map[o.userId].count++;
      map[o.userId].total += o.totals?.total || 0;
    });
    return map;
  }, [orders]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {liveUsers.length} registered user{liveUsers.length !== 1 ? 's' : ''} ·{' '}
            {liveUsers.filter((u) => u.role === 'admin').length} admin{liveUsers.filter((u) => u.role === 'admin').length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={handleRefresh}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1px solid var(--border-glass)', background:'var(--bg-glass)', color:'var(--text-secondary)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', flexShrink:0 }}>
          <RefreshCw size={14} /> Refresh Users
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: liveUsers.length, icon: UserCog, color: '#7c6aff' },
          { label: 'Admins', value: liveUsers.filter((u) => u.role === 'admin').length, icon: ShieldCheck, color: '#f59e0b' },
          { label: 'Customers', value: liveUsers.filter((u) => u.role === 'user').length, icon: Shield, color: '#3b82f6' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: 14, padding: '16px 18px',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: s.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          borderRadius: 50, padding: '10px 16px', flex: '1 1 260px', maxWidth: 400,
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
            borderRadius: 50, padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Customers</option>
        </select>
      </div>

      {/* Users table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)' }}>
                {['User', 'Email', 'Role', 'Joined', 'Orders', 'Spent'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const stats = userOrders[u.id] || { count: 0, total: 0 };
                const isExpanded = expandedId === u.id;
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ borderTop: '1px solid var(--border-glass)', cursor: 'pointer' }}
                    onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: u.role === 'admin' ? 'var(--gradient-1)' : 'var(--bg-glass)',
                          border: u.role === 'admin' ? 'none' : '1px solid var(--border-glass)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, color: u.role === 'admin' ? 'white' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}>
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                          {u.phone && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={12} /> {u.email}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                        background: u.role === 'admin' ? 'rgba(124,106,255,0.15)' : 'rgba(59,130,246,0.15)',
                        color: u.role === 'admin' ? '#7c6aff' : '#3b82f6',
                        textTransform: 'capitalize',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} /> {shortDate(u.createdAt)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={12} color="var(--text-muted)" /> {stats.count}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{inr(stats.total)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 14px', textAlign: 'left', fontWeight: 700,
  color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: 0.8, whiteSpace: 'nowrap',
};

const tdStyle = { padding: '10px 14px' };
