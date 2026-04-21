import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { byId } = useCatalog();
  const items = ids.map((id) => byId(id)).filter(Boolean);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 800,
            marginBottom: 6,
          }}>Your Wishlist</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
            {items.length} saved item{items.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {items.length === 0 ? (
          <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <Heart size={42} color="#ff6a9a" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
              No favourites yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Tap the heart on any product to save it for later.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/men" className="btn btn-primary" style={{ textDecoration: 'none' }}>Shop Men <ArrowRight size={16} /></Link>
              <Link to="/women" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Shop Women <ArrowRight size={16} /></Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 22,
          }}>
            <AnimatePresence>
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
