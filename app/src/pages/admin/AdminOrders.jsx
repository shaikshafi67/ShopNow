import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, Package, Truck, CheckCircle, XCircle, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { useOrders, ORDER_STATUS_OPTIONS } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { inr, shortDate } from '../../utils/format';

const STATUS_COLORS = {
  placed: '#7c6aff', confirmed: '#3b82f6', packed: '#f59e0b',
  shipped: '#f59e0b', out_for_delivery: '#ea580c', delivered: '#22c55e', cancelled: '#ef4444',
};

export default function AdminOrders() {
  const { orders, updateStatus, removeOrder } = useOrders();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.number?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(orderId, newStatus);
    toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const confirmDelete = () => {
    removeOrder(deleteId);
    toast.info('Order deleted.');
    setDeleteId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{orders.length} total orders</p>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '#7c6aff' },
          { label: 'Pending', value: stats.pending, color: '#f59e0b' },
          { label: 'Delivered', value: stats.delivered, color: '#22c55e' },
          { label: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order #, email…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
            borderRadius: 50, padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Orders table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)' }}>
                {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={expandedId === o.id}
                  onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  onStatusChange={handleStatusChange}
                  onDelete={() => setDeleteId(o.id)}
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No orders found.</div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 26px', maxWidth: 420 }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Delete order</h2>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
                <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                  This will permanently remove the order record. This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmDelete} style={dangerBtn}>Delete</button>
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderRow({ order, expanded, onToggle, onStatusChange, onDelete }) {
  const o = order;
  const c = STATUS_COLORS[o.status] || '#7c6aff';

  return (
    <>
      <tr style={{ borderTop: '1px solid var(--border-glass)', cursor: 'pointer' }} onClick={onToggle}>
        <td style={tdStyle}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{o.number}</span>
        </td>
        <td style={{ ...tdStyle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
          {o.userEmail}
        </td>
        <td style={tdStyle}>{o.items.length}</td>
        <td style={{ ...tdStyle, fontWeight: 700 }}>{inr(o.totals.total)}</td>
        <td style={tdStyle}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: c + '18', color: c, textTransform: 'capitalize',
          }}>{o.status.replace(/_/g, ' ')}</span>
        </td>
        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{shortDate(o.createdAt)}</td>
        <td style={tdStyle}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
              style={iconBtnStyle} title="View details">
              {expanded ? <ChevronUp size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ ...iconBtnStyle, color: '#ef4444', background: 'rgba(239,68,68,0.1)' }} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ padding: '16px 20px', background: 'var(--bg-glass)', borderTop: '1px solid var(--border-glass)' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Status change */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Update Status</div>
                  <select
                    value={o.status}
                    onChange={(e) => onStatusChange(o.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                      borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)',
                      fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                {/* Address */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Delivery Address</div>
                  {o.address ? (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.address.name}</div>
                      {o.address.line1}, {o.address.city} - {o.address.pincode}
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>N/A</span>}
                </div>
                {/* Payment */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Payment</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ textTransform: 'capitalize' }}>{o.payment?.method?.replace('_', ' ') || 'N/A'}</div>
                    <div style={{ color: o.payment?.status === 'paid' ? '#22c55e' : 'var(--text-muted)' }}>{o.payment?.status || 'pending'}</div>
                  </div>
                </div>
              </div>

              {/* Order items */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Items</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {o.items.map((it) => (
                  <div key={it._key || it.productId} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 40, height: 48, borderRadius: 6, flexShrink: 0,
                      background: it.image ? `url(${it.image}) center/cover` : 'var(--bg-card)',
                      border: '1px solid var(--border-glass)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Qty: {it.qty}{it.size ? ` · ${it.size}` : ''}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{inr(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

const thStyle = {
  padding: '12px 14px', textAlign: 'left', fontWeight: 700,
  color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: 0.8, whiteSpace: 'nowrap',
};

const tdStyle = { padding: '10px 14px' };

const iconBtnStyle = {
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center',
};

const dangerBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
  borderRadius: 50, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', border: 'none', background: '#ef4444', color: 'white',
};
