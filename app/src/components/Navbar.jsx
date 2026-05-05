import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, Sparkles, Heart, Sun, Moon, User, ChevronDown, Package, LogOut, Settings, Bell, Globe, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotifContext';
import { useLang } from '../context/LangContext';
import { useBrand } from '../context/BrandContext';
import { useCatalog } from '../context/CatalogContext';
import { scoreProduct } from '../utils/searchUtils';

const NAV_LINKS = [
  { label: 'home', path: '/' },
  { label: 'men', path: '/men' },
  { label: 'women', path: '/women' },
  { label: 'tryOn', path: '/tryon/live', special: true },
];

export default function Navbar() {
  const { totals } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { mode, toggle, isDark } = useTheme();
  const toast = useToast();
  const { logoUrl, brandName } = useBrand();
  const { unreadCount } = useNotifications();
  const { t, lang, cycle } = useLang();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const userMenuRef = useRef(null);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !searchOpen) return [];
    return products
      .map(p => ({ p, score: scoreProduct(p, searchQuery.trim()) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(r => r.p);
  }, [searchQuery, searchOpen, products]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handle = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setUserMenuOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const key = isAuthenticated && user ? `sn_searches_${user.id}` : 'sn_searches_guest';
      try { setRecentSearches(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setRecentSearches([]); }
    }
  }, [searchOpen, isAuthenticated, user?.id]);

  const getSearchKey = () => isAuthenticated && user ? `sn_searches_${user.id}` : 'sn_searches_guest';

  const saveSearch = (term) => {
    if (!term) return;
    const key = getSearchKey();
    let current = [];
    try { current = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const updated = [term, ...current.filter(s => s !== term)].slice(0, 8);
    localStorage.setItem(key, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const removeRecent = (term) => {
    const key = getSearchKey();
    const updated = recentSearches.filter(s => s !== term);
    localStorage.setItem(key, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const clearRecent = () => {
    localStorage.removeItem(getSearchKey());
    setRecentSearches([]);
  };

  const doSearch = (q) => {
    const term = (q !== undefined ? q : searchQuery).trim();
    if (!term) return;
    saveSearch(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out.');
    navigate('/');
  };

  const cartCount = totals.count;
  const navBg = isDark ? 'rgba(5,5,8,0.9)' : 'rgba(247,247,251,0.92)';

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 'var(--nav-height)',
          display: 'flex', alignItems: 'center',
          background: scrolled ? navBg : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-glass)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} style={{ height: 36, maxWidth: 160, objectFit: 'contain', display: 'block' }} />
              ) : (
                <>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px var(--accent-glow)',
                  }}>
                    <Sparkles size={18} color="white" />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                    background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{brandName}</span>
                </>
              )}
            </motion.div>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.02 }} style={{
                  padding: link.special ? '8px 18px' : '8px 16px',
                  borderRadius: 50, fontSize: 14,
                  fontWeight: link.special ? 700 : 500,
                  color: link.special ? 'white' : location.pathname === link.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: link.special ? 'var(--gradient-1)' : location.pathname === link.path ? 'var(--bg-glass)' : 'transparent',
                  border: link.special ? 'none' : location.pathname === link.path ? '1px solid var(--border-glass)' : 'none',
                  boxShadow: link.special ? '0 4px 16px var(--accent-glow)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all var(--transition)', cursor: 'pointer',
                }}>
                  {link.special && <Sparkles size={14} />}
                  {t(link.label)}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Language toggle */}
            <IconBtn onClick={cycle} title={t('language')}>
              <Globe size={17} />
              <span style={{ fontSize: 10, fontWeight: 800, marginLeft: -2 }}>{lang.toUpperCase()}</span>
            </IconBtn>

            {/* Theme toggle */}
            <IconBtn onClick={toggle} title={isDark ? t('lightMode') : t('darkMode')}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconBtn>

            {/* Notifications */}
            <Link to="/notifications" style={{ position: 'relative', display: 'flex' }}>
              <IconBtn as="div">
                <Bell size={19} />
              </IconBtn>
              {unreadCount > 0 && <Badge>{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
            </Link>

            {/* Search */}
            <IconBtn onClick={() => setSearchOpen(true)}>
              <Search size={20} />
            </IconBtn>

            {/* Wishlist */}
            <Link to="/wishlist" style={{ position: 'relative', display: 'flex' }}>
              <IconBtn as="div" style={{ color: wishlistCount > 0 ? '#ff6a9a' : undefined }}>
                <Heart size={20} fill={wishlistCount > 0 ? '#ff6a9a' : 'none'} />
              </IconBtn>
              {wishlistCount > 0 && <Badge>{wishlistCount}</Badge>}
            </Link>

            {/* Cart */}
            <Link to="/cart" style={{ position: 'relative', display: 'flex' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)', cursor: 'pointer', padding: '8px 16px',
                borderRadius: 50, display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600,
              }}>
                <ShoppingBag size={17} />
                {cartCount > 0 ? (
                  <span style={{
                    background: 'var(--gradient-1)', borderRadius: '50%', width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white',
                  }}>{cartCount}</span>
                ) : 'Bag'}
              </motion.div>
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    borderRadius: 50, padding: '6px 12px 6px 8px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12, color: 'white',
                  }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                        borderRadius: 14, padding: 8, minWidth: 200,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{user.email}</div>
                      </div>
                      <MenuItem to="/profile" icon={User} label={t('myProfile')} />
                      <MenuItem to="/orders" icon={Package} label={t('myOrders')} />
                      <MenuItem to="/wishlist" icon={Heart} label={t('wishlist')} />
                      <MenuItem to="/notifications" icon={Bell} label={t('notifications')} />
                      {isAdmin && <MenuItem to="/admin" icon={Settings} label={t('adminDashboard')} accent />}
                      <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: 6, paddingTop: 6 }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', background: 'transparent', border: 'none',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            color: '#ef4444', fontSize: 14, fontFamily: 'var(--font-body)', textAlign: 'left',
                          }}
                        >
                          <LogOut size={15} /> {t('signOut')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn btn-ghost" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 14 }}>
                <User size={16} /> {t('signIn')}
              </Link>
            )}

            {/* Mobile menu btn */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8, display: 'none' }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
          >
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 620, padding: '0 24px' }}
            >
              {/* Input */}
              <form onSubmit={handleSearch}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-glass-hover)',
                  borderRadius: (suggestions.length > 0 || (!searchQuery && recentSearches.length > 0)) ? '16px 16px 0 0' : 16,
                  display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12,
                }}>
                  <Search size={22} color="var(--accent)" />
                  <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, color, brand, category…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 18, fontFamily: 'var(--font-body)' }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>
                      <X size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
              </form>

              {/* Dropdown: recent searches or live product suggestions */}
              {(suggestions.length > 0 || (!searchQuery && recentSearches.length > 0)) && (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-glass-hover)',
                  borderTop: '1px solid var(--border-glass)', borderRadius: '0 0 16px 16px',
                  overflow: 'hidden', maxHeight: 380, overflowY: 'auto',
                }}>
                  {/* Recent searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 8px', borderBottom: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Recent</span>
                        <button onClick={clearRecent} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear all</button>
                      </div>
                      {recentSearches.map((s) => (
                        <div key={s} onClick={() => doSearch(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Clock size={15} color="var(--text-muted)" />
                          <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{s}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeRecent(s); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Live product suggestions */}
                  {searchQuery && suggestions.length > 0 && (
                    <>
                      {suggestions.map((p) => (
                        <div key={p.id}
                          onClick={() => { saveSearch(searchQuery.trim()); navigate(`/product/${p.id}`); setSearchOpen(false); setSearchQuery(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-glass)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{p.name?.[0]}</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{p.price} · {p.category}</div>
                          </div>
                        </div>
                      ))}
                      <div onClick={() => doSearch()}
                        style={{ padding: '11px 20px', borderTop: '1px solid var(--border-glass)', cursor: 'pointer', color: 'var(--accent)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Search size={15} /> See all results for "{searchQuery}"
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Popular / trending searches */}
              {!searchQuery && (
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {['T-Shirts', 'Jeans', 'Dresses', 'Kurtas', 'White shirt', 'Blue jeans', 'Sarees'].map((term) => (
                    <button key={term} onClick={() => doSearch(term)}
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                    >{term}</button>
                  ))}
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                Press Enter to search · Esc to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1400 }}
            />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '82%', maxWidth: 340,
                background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-glass)',
                zIndex: 1500, padding: '80px 20px 40px', display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              {NAV_LINKS.map((link, i) => (
                <motion.div key={link.path} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={link.path} style={{
                    display: 'block', padding: '14px 18px', borderRadius: 12, textDecoration: 'none',
                    fontSize: 18, fontWeight: 600, color: link.special ? 'var(--accent)' : 'var(--text-primary)',
                    background: location.pathname === link.path ? 'var(--bg-glass)' : 'transparent',
                  }}>{t(link.label)}</Link>
                </motion.div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-glass)', margin: '12px 0', paddingTop: 12 }}>
                <Link to="/notifications" style={mobileLink()}>{t('notifications')} {unreadCount > 0 && `(${unreadCount})`}</Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" style={mobileLink()}>{t('myProfile')}</Link>
                    <Link to="/orders" style={mobileLink()}>{t('myOrders')}</Link>
                    {isAdmin && <Link to="/admin" style={mobileLink()}>{t('adminDashboard')}</Link>}
                    <button onClick={handleLogout} style={{ ...mobileLink(), background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'block', width: '100%', textAlign: 'left' }}>{t('signOut')}</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={mobileLink()}>{t('signIn')}</Link>
                    <Link to="/register" style={mobileLink()}>Create account</Link>
                  </>
                )}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                <button onClick={toggle} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
                  {isDark ? <Sun size={15} /> : <Moon size={15} />} {isDark ? t('lightMode') : t('darkMode')}
                </button>
                <button onClick={cycle} className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 13 }}>
                  <Globe size={15} /> {lang.toUpperCase()}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:900px){.desktop-nav{display:none!important;}}
        @media(max-width:768px){.mobile-menu-btn{display:flex!important;}}
      `}</style>
    </>
  );
}

function IconBtn({ children, onClick, as: Tag = 'button', style = {}, title }) {
  return (
    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClick} title={title}
      style={{
        background: 'transparent', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color var(--transition)', ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = style.color || 'var(--text-secondary)')}
    >{children}</motion.button>
  );
}

function Badge({ children }) {
  return (
    <span style={{
      position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
      background: 'var(--accent)', borderRadius: '50%', fontSize: 10, padding: '0 3px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700,
    }}>{children}</span>
  );
}

function MenuItem({ to, icon: Icon, label, accent }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
      textDecoration: 'none', color: accent ? 'var(--accent)' : 'var(--text-primary)', fontSize: 14, fontWeight: 500,
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={15} /> {label}
    </Link>
  );
}

const mobileLink = () => ({
  display: 'block', padding: '12px 18px', borderRadius: 10,
  textDecoration: 'none', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)',
});
