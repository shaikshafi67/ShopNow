import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingCart, BarChart2, PieChart } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { inr, shortDate } from '../../utils/format';

/* ── Tiny SVG chart components ─────────────────────────────────────────────── */

function BarChart({ data, height = 180 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(12, Math.min(36, 600 / data.length - 4));
  const w = data.length * (barW + 4) + 40;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <svg width={Math.max(w, 300)} height={height + 40} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = 30 + i * (barW + 4);
          const y = height - barH + 10;
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`bar-g-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c6aff" />
                  <stop offset="100%" stopColor="#ff6a9a" />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={`url(#bar-g-${i})`} opacity={0.85}>
                <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={height + 10} to={y} dur="0.6s" fill="freeze" />
              </rect>
              <title>{d.label}: {inr(d.value)}</title>
              {data.length <= 15 && (
                <text x={x + barW / 2} y={height + 26} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ segments, size = 160 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={size} height={size}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={18}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'all 0.5s' }}
            >
              <title>{seg.label}: {seg.value}</title>
            </circle>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={900} fill="var(--text-primary)" fontFamily="var(--font-display)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">orders</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{seg.label.replace(/_/g, ' ')}</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function AdminAnalytics() {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const { allUsers } = useAuth();

  // Revenue summary
  const revenue = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelled');
    const total = valid.reduce((s, o) => s + (o.totals?.total || 0), 0);
    const thisMonth = valid.filter((o) => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, o) => s + (o.totals?.total || 0), 0);
    return { total, thisMonth, orderCount: valid.length };
  }, [orders]);

  // Daily revenue (last 14 days)
  const dailyRevenue = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dayOrders = orders.filter((o) => o.status !== 'cancelled' && o.createdAt?.slice(0, 10) === key);
      const value = dayOrders.reduce((s, o) => s + (o.totals?.total || 0), 0);
      days.push({ label, value });
    }
    return days;
  }, [orders]);

  // Order status breakdown
  const statusBreakdown = useMemo(() => {
    const map = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    const colors = {
      placed: '#7c6aff', confirmed: '#3b82f6', packed: '#f59e0b',
      shipped: '#ea580c', out_for_delivery: '#f97316', delivered: '#22c55e', cancelled: '#ef4444',
    };
    return Object.entries(map).map(([label, value]) => ({ label, value, color: colors[label] || '#888' }));
  }, [orders]);

  // Top products by order count
  const topProducts = useMemo(() => {
    const map = {};
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
      o.items.forEach((it) => {
        if (!map[it.productId]) map[it.productId] = { name: it.name, count: 0, revenue: 0, image: it.image };
        map[it.productId].count += it.qty;
        map[it.productId].revenue += it.price * it.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  // Category revenue
  const categoryRevenue = useMemo(() => {
    const map = {};
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
      o.items.forEach((it) => {
        const product = products.find((p) => p.id === it.productId);
        const cat = product?.category || 'Other';
        map[cat] = (map[cat] || 0) + it.price * it.qty;
      });
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);

  const summaryCards = [
    { label: 'Total Revenue', value: inr(revenue.total), icon: TrendingUp, color: '#22c55e', sub: `${revenue.orderCount} orders` },
    { label: 'This Month', value: inr(revenue.thisMonth), icon: BarChart2, color: '#7c6aff', sub: 'current month' },
    { label: 'Products', value: products.length, icon: Package, color: '#f59e0b', sub: `${products.filter((p) => (p.stock ?? 25) <= 5).length} low stock` },
    { label: 'Customers', value: allUsers.filter((u) => u.role === 'user').length, icon: ShoppingCart, color: '#3b82f6', sub: `${allUsers.length} total users` },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Sales performance and business insights.</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {summaryCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '18px 20px' }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: s.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, marginBottom: 20 }} className="analytics-grid">
        {/* Revenue chart */}
        <ChartCard title="Revenue (Last 14 Days)" icon={BarChart2}>
          {dailyRevenue.some((d) => d.value > 0) ? (
            <BarChart data={dailyRevenue} />
          ) : (
            <EmptyChart message="No revenue data yet. Place some orders to see the chart." />
          )}
        </ChartCard>

        {/* Status donut */}
        <ChartCard title="Order Status" icon={PieChart}>
          {statusBreakdown.length > 0 ? (
            <DonutChart segments={statusBreakdown} />
          ) : (
            <EmptyChart message="No orders yet." />
          )}
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="analytics-grid">
        {/* Top products */}
        <ChartCard title="Top Products" icon={Package}>
          {topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 20 }}>#{i + 1}</span>
                  <div style={{
                    width: 36, height: 44, borderRadius: 6, flexShrink: 0,
                    background: p.image ? `url(${p.image}) center/cover` : 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.count} sold</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#22c55e' }}>{inr(p.revenue)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="No sales data yet." />
          )}
        </ChartCard>

        {/* Category breakdown */}
        <ChartCard title="Revenue by Category" icon={BarChart2}>
          {categoryRevenue.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryRevenue.map((c, i) => {
                const maxVal = categoryRevenue[0]?.value || 1;
                const pct = Math.round((c.value / maxVal) * 100);
                return (
                  <div key={c.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{inr(c.value)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-glass)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        style={{ height: '100%', borderRadius: 3, background: 'var(--gradient-1)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart message="No category data yet." />
          )}
        </ChartCard>
      </div>

      <style>{`
        @media(max-width:900px){
          .analytics-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '18px 20px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
        <Icon size={16} color="var(--accent)" /> {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
      {message}
    </div>
  );
}
