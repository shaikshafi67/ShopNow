import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, ShoppingCart, Users, BarChart2, LogOut, Sparkles, ChevronRight, Image, Tag, FileText, PlusCircle, Upload, Download, Palette, Megaphone, Flame, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    label: 'Products', icon: Package, group: true,
    children: [
      { to: '/admin/products',     label: 'All Products' },
      { to: '/admin/products/add', label: '+ Add Product', highlight: true },
      { to: '/admin/products/csv', label: '↑↓ Import / Export' },
      { to: '/admin/collections',  label: 'Collections' },
    ],
  },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/discounts', label: 'Discounts', icon: Tag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/branding', label: 'Branding', icon: Palette },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/promo', label: 'Promo Banners', icon: Flame },
  { to: '/admin/pages', label: 'Pages', icon: FileText },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { toggle, isDark } = useTheme();

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
        <div style={{ padding: '16px 16px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>Admin Panel</span>
            </div>
            <button
              onClick={toggle}
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ShopNow management</span>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {LINKS.map((link) => {
            if (link.group) {
              return (
                <div key={link.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
                    <link.icon size={17} /> {link.label}
                  </div>
                  {link.children.map((child) => (
                    <NavLink key={child.to} to={child.to} end={child.to === '/admin/products'}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 12px 7px 36px', borderRadius: 10, marginBottom: 2,
                        textDecoration: 'none', fontSize: 12, fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--accent)' : child.highlight ? 'var(--accent)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(124,106,255,0.12)' : child.highlight ? 'rgba(124,106,255,0.05)' : 'transparent',
                        transition: 'all var(--transition)',
                        opacity: isActive ? 1 : 0.85,
                      })}
                    >{child.label}</NavLink>
                  ))}
                </div>
              );
            }
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                  textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(124,106,255,0.1)' : 'transparent',
                  transition: 'all var(--transition)',
                })}
              >
                <Icon size={17} /> {link.label}
              </NavLink>
            );
          })}
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
