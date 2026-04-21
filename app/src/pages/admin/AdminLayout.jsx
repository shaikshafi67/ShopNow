import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart2, LogOut, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 'var(--nav-height)', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-glass)',
        position: 'sticky', top: 'var(--nav-height)',
        height: 'calc(100vh - var(--nav-height))',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Sparkles size={16} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>Admin Panel</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ShopNow management</span>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(124,106,255,0.1)' : 'transparent',
                transition: 'all var(--transition)',
              })}
              onMouseEnter={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--bg-glass)'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => { logout(); toast.info('Signed out.'); navigate('/'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, background: 'transparent', border: 'none',
              color: '#ef4444', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 28px 60px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
