import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../utils/format';

export default function ProductCard({ product, index = 0 }) {
  const { add: addToCart } = useCart();
  const { user } = useAuth();
  const { has, toggle: toggleWishlist } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const wished = has(product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    const added = toggleWishlist(product.id);
    toast[added ? 'success' : 'info'](added ? `Added to wishlist` : `Removed from wishlist`);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return;
    }
    addToCart(product, { size: product.sizes?.[0] || null, qty: 1 });
    toast.success('Added to bag');
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid',
        borderColor: hovered ? 'var(--border-glass-hover)' : 'var(--border-glass)',
        borderRadius: 8, overflow: 'hidden',
        transition: 'all var(--transition)',
        boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.12)' : 'none',
        cursor: 'pointer', position: 'relative',
      }}
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', paddingBottom: '130%', background: 'var(--bg-glass)' }}>
          {!imgError && product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              onError={() => setImgError(true)}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)', fontSize: 32,
            }}>
              <ShoppingBag size={40} opacity={0.3} />
            </div>
          )}

          {/* Myntra-style wishlist icon — always visible */}
          <motion.button
            onClick={handleWishlist}
            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
            style={{
              position: 'absolute', top: 10, right: 10, width: 32, height: 32,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
              border: 'none', borderRadius: '50%', cursor: 'pointer', zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Heart size={16} fill={wished ? '#ff3f6c' : 'none'} color={wished ? '#ff3f6c' : '#535766'} strokeWidth={2} />
          </motion.button>

          {/* Tag */}
          {product.tag && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: product.tag === 'Bestseller' ? '#ff3f6c' :
                product.tag === 'New' ? '#3b82f6' :
                product.tag === 'Trending' ? '#ff905a' :
                product.tag === 'Hot' ? '#ee5a24' :
                product.tag === 'Sale' ? '#14a085' :
                product.tag === 'Premium' ? '#7c6aff' : '#535766',
              color: 'white', borderRadius: 3, padding: '3px 8px',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>{product.tag}</div>
          )}

          {/* Try-on badge */}
          {product.tryOnReady && (
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              background: 'rgba(124,106,255,0.95)', borderRadius: 3,
              padding: '3px 8px', fontSize: 10, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', gap: 3,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <Sparkles size={10} /> 3D Try-On
            </div>
          )}
        </div>

        {/* Myntra-style Add to Bag bar on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            pointerEvents: hovered ? 'auto' : 'none',
          }}
        >
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%', padding: '10px 0',
              background: addedAnim ? '#14a085' : 'rgba(255,255,255,0.97)',
              color: addedAnim ? 'white' : '#ff3f6c',
              border: 'none', borderTop: '1px solid #eee',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'var(--font-body)',
              letterSpacing: 0.5, textTransform: 'uppercase',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <ShoppingBag size={14} />
            {addedAnim ? '✓ ADDED' : 'ADD TO BAG'}
          </button>
        </motion.div>
      </Link>

      {/* Info — Myntra style */}
      <div style={{ padding: '10px 10px 12px' }}>
        {/* Brand */}
        {product.brand && (
          <div style={{
            color: 'var(--text-primary)', fontSize: 13, fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 2,
          }}>
            {product.brand}
          </div>
        )}

        {/* Name */}
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            fontWeight: 400, fontSize: 13, color: 'var(--text-secondary)',
            lineHeight: 1.35, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.name}
          </div>
        </Link>

        {/* Price row — Myntra style */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            {inr(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'line-through' }}>
              {inr(product.originalPrice)}
            </span>
          )}
          {product.discount > 0 && (
            <span style={{ color: '#ff905a', fontSize: 12, fontWeight: 700 }}>
              ({product.discount}% OFF)
            </span>
          )}
        </div>


        {/* Stock warning */}
        {(product.stock !== undefined && product.stock <= 5 && product.stock > 0) && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#ff3f6c', fontWeight: 600 }}>
            Only {product.stock} left!
          </div>
        )}
        {product.stock === 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#94969f', fontWeight: 600 }}>Out of stock</div>
        )}
      </div>
    </motion.div>
  );
}
