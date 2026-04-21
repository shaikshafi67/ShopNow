import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { inr, shortDate } from '../../utils/format';

export default function AdminDashboard() {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const { allUsers } = useAuth();

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totals.total, 0);
  const pendingOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const lowStock = products.filter((p) => (p.stock ?? 25) <= 5);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: inr(totalRevenue), icon: TrendingUp, color: '#22c55e', sub: `${orders.length} orders total` },
    { label: 'Products', value: products.length, icon: Package, color: '#7c6aff', sub: `${lowStock.length} low stock` },
    { label: 'Orders', value: orders.length, icon: ShoppingCart, color: '#f59e0b', sub: `${pendingOrders} pending` },
    { label: 'Users', value: allUsers.length, icon: Users, color: '#3b82f6', sub: `${allUsers.filter((u) => u.role === 'admin').length} admins` },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Welcome back. Here's what's happening with ShopNow today.</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: 16, padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: s.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="admin-dash-grid">
        {/* Recent orders */}
        <AdminCard title="Recent Orders" action={<Link to="/admin/orders" style={linkStyle}>View all <ArrowRight size={13} /></Link>}>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No orders yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <Link to={`/admin/orders?id=${o.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{o.number}</Link>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.userEmail}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>{inr(o.totals.total)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <StatusPill status={o.status} />
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{shortDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* Low stock */}
        <AdminCard title="Low Stock" action={<Link to="/admin/products" style={linkStyle}>Manage <ArrowRight size={13} /></Link>}>
          {lowStock.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All products well stocked.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStock.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.2)',
                }}>
                  <AlertTriangle size={14} color="#ea580c" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#ea580c' }}>{p.stock} left</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <style>{`@media(max-width:900px){.admin-dash-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

function AdminCard({ title, action, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    placed: '#7c6aff', confirmed: '#3b82f6', packed: '#f59e0b',
    shipped: '#f59e0b', out_for_delivery: '#ea580c', delivered: '#22c55e', cancelled: '#ef4444',
  };
  const c = colors[status] || '#7c6aff';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: c + '18', color: c, textTransform: 'capitalize',
    }}>{status.replace(/_/g, ' ')}</span>
  );
}

const linkStyle = {
  color: 'var(--accent)', textDecoration: 'none', fontSize: 13, fontWeight: 600,
  display: 'flex', alignItems: 'center', gap: 4,
};
