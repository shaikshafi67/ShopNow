import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenPage from './pages/MenPage';
import WomenPage from './pages/WomenPage';
import ProductPage from './pages/ProductPage';
import LiveTryOnPage from './pages/LiveTryOnPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import NotificationsPage from './pages/NotificationsPage';
import RequireAuth from './components/RequireAuth';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCollections from './pages/admin/AdminCollections';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminBanners from './pages/admin/AdminBanners';
import {
  SizeGuidePage,
  ShippingInfoPage,
  ReturnsPage,
  TrackOrderPage,
  ContactPage,
  AboutPage,
  CareersPage,
  PressPage,
  PrivacyPage,
  TermsPage,
  NewArrivalsPage,
  SalePage,
} from './pages/InfoPages';

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isTryOn = location.pathname === '/tryon' || location.pathname === '/tryon/live';
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/men" element={<PageWrapper><MenPage /></PageWrapper>} />
          <Route path="/women" element={<PageWrapper><WomenPage /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductPage /></PageWrapper>} />
          <Route path="/tryon/live" element={<PageWrapper><LiveTryOnPage /></PageWrapper>} />
          <Route path="/tryon" element={<Navigate to="/tryon/live" replace />} />

          {/* Auth */}
          <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />

          {/* Cart, Wishlist, Search */}
          <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
          <Route path="/wishlist" element={<PageWrapper><WishlistPage /></PageWrapper>} />
          <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
          <Route path="/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />

          {/* User (protected) */}
          <Route path="/profile" element={<RequireAuth><PageWrapper><ProfilePage /></PageWrapper></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><PageWrapper><OrdersPage /></PageWrapper></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><PageWrapper><OrderDetailPage /></PageWrapper></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><PageWrapper><CheckoutPage /></PageWrapper></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="banners" element={<AdminBanners />} />
          </Route>

          {/* Shop helpers */}
          <Route path="/new-arrivals" element={<PageWrapper><NewArrivalsPage /></PageWrapper>} />
          <Route path="/sale" element={<PageWrapper><SalePage /></PageWrapper>} />

          {/* Help */}
          <Route path="/size-guide" element={<PageWrapper><SizeGuidePage /></PageWrapper>} />
          <Route path="/shipping" element={<PageWrapper><ShippingInfoPage /></PageWrapper>} />
          <Route path="/returns" element={<PageWrapper><ReturnsPage /></PageWrapper>} />
          <Route path="/track-order" element={<PageWrapper><TrackOrderPage /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />

          {/* Company */}
          <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
          <Route path="/careers" element={<PageWrapper><CareersPage /></PageWrapper>} />
          <Route path="/press" element={<PageWrapper><PressPage /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />

          <Route path="*" element={
            <PageWrapper>
              <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 900, opacity: 0.1 }}>404</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
                <a href="/" className="btn btn-primary">Go Home</a>
              </div>
            </PageWrapper>
          } />
        </Routes>
      </AnimatePresence>
      {!isTryOn && !isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
