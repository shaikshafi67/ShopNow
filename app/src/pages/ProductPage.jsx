import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles, Star, ChevronLeft, ChevronRight, RotateCcw, Shield, Truck, Share2, Minus, Plus, CheckCircle } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import ReviewsSection from '../components/ReviewsSection';
import { inr } from '../utils/format';

export default function ProductPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { byId, products } = useCatalog();
  const { add: addToCart } = useCart();
  const { user } = useAuth();
  const { has, toggle: toggleWishlist } = useWishlist();
  const toast = useToast();

  const product = byId(id);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!product) {
    return (
      <div style={{ paddingTop: 120, textAlign: 'center', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Product not found</h2>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>Go Home</Link>
      </div>
    );
  }

  const wished = has(product.id);
  const similar = products.filter((p) => p.id !== id && p.category === product.category).slice(0, 4);
  const outOfStock = product.stock === 0;

  const handleWishlist = () => {
    const added = toggleWishlist(product.id);
    toast[added ? 'success' : 'info'](added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return;
    }
    if (!selectedSize && product.sizes?.length) {
      toast.error('Please select a size first.');
      return;
    }
    addToCart(product, { size: selectedSize, color: selectedColor, qty });
    toast.success(`${product.name} added to bag`);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize && product.sizes?.length) {
      toast.error('Please select a size first.');
      return;
    }
    addToCart(product, { size: selectedSize, color: selectedColor, qty });
    navigate('/checkout');
  };

  const images = product.images?.length ? product.images : ['/images/placeholder.jpg'];

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '28px 24px 60px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to={`/${product.gender}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', textTransform: 'capitalize' }}>{product.gender}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 40, alignItems: 'start' }} className="product-grid">
          {/* Gallery */}
          <div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', aspectRatio: '3/4' }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={imgIdx}
                  src={images[imgIdx]}
                  alt={product.name}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    style={arrowBtn('left')}><ChevronLeft size={20} /></button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    style={arrowBtn('right')}><ChevronRight size={20} /></button>
                </>
              )}
              {product.tag && (
                <div style={{ position: 'absolute', top: 14, left: 14 }}>
                  <span className={`tag tag-${product.tag}`}>{product.tag}</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }} className="scroll-x">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    style={{
                      width: 66, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                      border: `2px solid ${i === imgIdx ? 'var(--accent)' : 'var(--border-glass)'}`,
                      background: 'var(--bg-glass)', cursor: 'pointer', padding: 0,
                    }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {product.brand || product.category}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#14958f', color: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {product.rating} <Star size={12} fill="white" />
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    {product.reviews?.toLocaleString('en-IN')} ratings
                  </span>
                </div>
              )}

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900 }}>{inr(product.price)}</span>
                {product.originalPrice > product.price && (
                  <>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18, textDecoration: 'line-through' }}>{inr(product.originalPrice)}</span>
                    <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{product.discount}% off</span>
                  </>
                )}
              </div>

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Color</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {product.colors.map((c, i) => (
                      <button key={i} onClick={() => setSelectedColor(i)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                          outline: i === selectedColor ? `2px solid var(--accent)` : '2px solid transparent',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Select size {selectedSize && <span style={{ color: 'var(--accent)' }}>· {selectedSize}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {product.sizes.map((s) => (
                      <button key={s} onClick={() => setSelectedSize(s)}
                        style={{
                          minWidth: 44, padding: '8px 12px', borderRadius: 10,
                          border: `1.5px solid ${selectedSize === s ? 'var(--accent)' : 'var(--border-glass)'}`,
                          background: selectedSize === s ? 'rgba(124,106,255,0.1)' : 'transparent',
                          color: selectedSize === s ? 'var(--accent)' : 'var(--text-primary)',
                          fontWeight: 600, fontSize: 14, cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          transition: 'all var(--transition)',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <Link to="/size-guide" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
                    Size guide
                  </Link>
                </div>
              )}

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Qty</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 50,
                }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ background: 'transparent', border: 'none', padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <Minus size={15} />
                  </button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(99, q + 1))}
                    style={{ background: 'transparent', border: 'none', padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <Plus size={15} />
                  </button>
                </div>
                {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
                  <span style={{ fontSize: 13, color: '#ea580c', fontWeight: 600 }}>Only {product.stock} left</span>
                )}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
                <motion.button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, minWidth: 140, padding: '14px 20px',
                    background: addedToCart ? '#22c55e' : 'var(--bg-glass)',
                    border: `1.5px solid ${addedToCart ? '#22c55e' : 'var(--accent)'}`,
                    borderRadius: 50, color: addedToCart ? 'white' : 'var(--accent)',
                    fontWeight: 700, fontSize: 14, cursor: outOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                    opacity: outOfStock ? 0.5 : 1,
                  }}
                >
                  {addedToCart ? <CheckCircle size={16} /> : <ShoppingBag size={16} />}
                  {outOfStock ? 'Out of stock' : addedToCart ? 'Added to bag!' : 'Add to bag'}
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: 140, justifyContent: 'center', opacity: outOfStock ? 0.5 : 1 }}
                >
                  Buy now
                </motion.button>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <button onClick={handleWishlist}
                  style={{
                    flex: 1, padding: '11px 16px', borderRadius: 50,
                    background: 'transparent', border: '1px solid var(--border-glass)',
                    color: wished ? '#ff6a9a' : 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
                  }}>
                  <Heart size={16} fill={wished ? '#ff6a9a' : 'none'} />
                  {wished ? 'Wishlisted' : 'Wishlist'}
                </button>
                <Link to="/tryon/live" state={{ productId: product.id }}
                  className="btn btn-ghost"
                  style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', gap: 8 }}>
                  <Sparkles size={16} /> Try-On
                </Link>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: Truck, text: 'Free delivery on orders above ₹999' },
                  { icon: RotateCcw, text: '30-day easy returns — no questions asked' },
                  { icon: Shield, text: 'Secure payment · 100% authentic' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Icon size={15} color="var(--accent)" /> {text}
                  </div>
                ))}
              </div>

              {/* Description */}
              {product.description && (
                <div style={{ marginTop: 22, padding: '14px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{product.description}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={product.id} />

        {/* Similar */}
        {similar.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Similar products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
              {similar.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      <style>{`@media(max-width:768px){.product-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

const arrowBtn = (side) => ({
  position: 'absolute', top: '50%', [side]: 12, transform: 'translateY(-50%)',
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
  border: 'none', color: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
});
