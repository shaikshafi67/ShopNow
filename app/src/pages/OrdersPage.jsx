import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Search, Filter, X } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { inr, shortDate } from '../utils/format';

const STATUS_COLORS = {
  placed: { bg: 'rgba(124,106,255,0.12)', color: '#7c6aff' },
  confirmed: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  packed: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  shipped: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  out_for_delivery: { bg: 'rgba(234,88,12,0.12)', color: '#ea580c' },
  delivered: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
};

export default function OrdersPage() {
  const { myOrders } = useOrders();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = myOrders.filter((o) => {
    const q = search.toLowerCase();
    const matchQ = !q || o.number.toLowerCase().includes(q) || o.items.some((it) => it.name.toLowerCase().includes(q));
    const matchF = filter === 'all' || o.status === filter;
    return matchQ && matchF;
  });

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '36px 24px 80px', maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, marginBottom: 6 }}>
            My Orders
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {myOrders.length} order{myOrders.length !== 1 ? 's' : ''} placed
          </p>
        </motion.div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
            borderRadius: 50, padding: '10px 16px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders or products…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>}
          </div>
          <select
            value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              borderRadius: 50, padding: '10px 16px', color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {myOrders.length === 0 ? (
          <EmptyOrders />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            No orders match your search.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {filtered.map((o, i) => (
                <OrderCard key={o.id} order={o} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, index }) {
  const { bg, color } = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
        borderRadius: 16, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', align: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{order.number}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{shortDate(order.createdAt)}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{inr(order.totals.total)}</span>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: bg, color }}>
          {order.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Items preview */}
      <div style={{ padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {order.items.slice(0, 3).map((it) => (
          <div key={it._key || it.productId} style={{
            width: 52, height: 62, borderRadius: 8,
            background: it.image ? `url(${it.image}) center/cover` : 'var(--bg-glass)',
            border: '1px solid var(--border-glass)', flexShrink: 0,
          }} />
        ))}
        {order.items.length > 3 && (
          <div style={{
            width: 52, height: 62, borderRadius: 8,
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
          }}>+{order.items.length - 3}</div>
        )}
        <div style={{ flex: 1, minWidth: 120, marginLeft: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
            {order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Link
          to={`/orders/${order.id}`}
          className="btn btn-ghost"
          style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          View details <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

function EmptyOrders() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24, background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <Package size={36} color="var(--accent)" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 10 }}>No orders yet</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your placed orders will appear here.</p>
      <Link to="/men" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start shopping</Link>
    </div>
  );
}
