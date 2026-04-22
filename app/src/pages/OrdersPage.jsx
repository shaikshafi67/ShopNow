import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Search, X, Truck, CheckCircle, ShoppingBag } from 'lucide-react';
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
  const { myOrders, loading } = useOrders();
  const { user } = useAuth();
  const location = useLocation();
  const placed = location.state?.justPlaced;
  const placedMethod = location.state?.paymentMethod;
  const placedNumber = location.state?.orderNumber;
  const placedTotal = location.state?.total;
  const [search, setSearch] = useState('');
  const listRef = useRef(null);

  const filtered = myOrders.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.number.toLowerCase().includes(q) || o.items.some((it) => it.name.toLowerCase().includes(q));
  });

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '36px 24px 80px', maxWidth: 900 }}>

        {/* ── Order Confirmed Banner ── */}
        <AnimatePresence>
          {placed && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                background: placedMethod === 'cod'
                  ? 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))'
                  : 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(22,163,74,0.04))',
                border: `1px solid ${placedMethod === 'cod' ? 'rgba(249,115,22,0.3)' : 'rgba(34,197,94,0.3)'}`,
                borderRadius: 20, padding: '28px 28px 24px', marginBottom: 28,
              }}
            >
              {/* Icon + heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                  style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: placedMethod === 'cod' ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {placedMethod === 'cod'
                    ? <Truck size={28} color="#f97316" />
                    : <CheckCircle size={28} color="#22c55e" />}
                </motion.div>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900,
                    color: placedMethod === 'cod' ? '#ea580c' : '#16a34a', marginBottom: 4,
                  }}>
                    {placedMethod === 'cod' ? 'Order Confirmed!' : 'Order Placed Successfully!'}
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                    Order <strong style={{ color: 'var(--text-primary)' }}>{placedNumber}</strong>
                    {placedTotal ? ` · ${inr(placedTotal)}` : ''}
                  </p>
                </div>
              </div>

              {/* COD payment notice */}
              {placedMethod === 'cod' && (
                <div style={{
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 18,
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 14, color: '#92400e',
                }}>
                  <Truck size={16} color="#f97316" />
                  <span>Payment Pending — Please keep <strong>{inr(placedTotal || 0)}</strong> ready to pay on delivery.</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  to="/"
                  className="btn btn-primary"
                  style={{
                    textDecoration: 'none',
                    background: placedMethod === 'cod' ? 'linear-gradient(135deg,#f97316,#ea580c)' : undefined,
                    border: placedMethod === 'cod' ? 'none' : undefined,
                  }}
                >
                  <ShoppingBag size={16} /> Continue Shopping
                </Link>
                <button
                  className="btn btn-ghost"
                  onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View order details <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} ref={listRef}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, marginBottom: 6 }}>
            My Orders
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {loading ? 'Loading…' : `${myOrders.length} order${myOrders.length !== 1 ? 's' : ''} placed`}
          </p>
        </motion.div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
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
        </div>

        {loading ? null : myOrders.length === 0 ? (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{order.number}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{shortDate(order.createdAt)}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{inr(order.totals.total)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {order.payment?.method === 'cod' && order.payment?.status === 'pending' && (
            <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Truck size={11} /> Payment Pending
            </span>
          )}
          <span style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: bg, color }}>
            {order.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
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
