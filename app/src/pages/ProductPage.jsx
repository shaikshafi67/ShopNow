import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles, Star, ChevronLeft, ChevronRight, RotateCcw, Shield, Truck, Share2, Minus, Plus, CheckCircle, Bell, BellRing, Camera, Upload, X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import ReviewsSection from '../components/ReviewsSection';
import SizeChartModal from '../components/SizeChartModal';
import { useReviews } from '../context/ReviewsContext';
import { inr } from '../utils/format';

export default function ProductPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { byId, products } = useCatalog();
  const { add: addToCart } = useCart();
  const { user } = useAuth();
  const { summary: reviewSummary } = useReviews();
  const { has, toggle: toggleWishlist } = useWishlist();
  const toast = useToast();

  const product = byId(id);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);
  const [notified, setNotified] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem('shopnow:notifications') || '[]');
      return list.some(n => n.productId === id);
    } catch { return false; }
  });

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
  // Per-color per-size data from selected color's sizeVariants
  const colorSizeData = useMemo(() => {
    const cv = product.colorVariants?.[selectedColor];
    if (!cv?.sizeVariants?.length) return null;
    const map = {};
    cv.sizeVariants.forEach(sv => { map[sv.size] = sv; }); // { size → { size, price, stock, sku } }
    return map;
  }, [product.colorVariants, selectedColor]);

  // Convenience: just stock per size
  const colorSizeStock = useMemo(() => {
    if (!colorSizeData) return null;
    const map = {};
    Object.entries(colorSizeData).forEach(([s, sv]) => { map[s] = sv.stock; });
    return map;
  }, [colorSizeData]);

  // Price for the currently selected size (per-color sizeVariants OR global variants)
  const selectedSizePrice = useMemo(() => {
    if (!selectedSize) return null;
    // 1. Per-color sizeVariants (multi-color products)
    if (colorSizeData) {
      const sv = colorSizeData[selectedSize];
      if (sv?.price && sv.price !== product.price) return sv.price;
    }
    // 2. Global variants (single-color products)
    const gv = product.variants?.find(v => v.size === selectedSize);
    if (gv?.price && gv.price !== product.price) return gv.price;
    return null;
  }, [colorSizeData, selectedSize, product.price, product.variants]);

  // Out-of-stock: if selected color has sizeVariants, check if ANY size has stock
  const colorHasAnyStock = useMemo(() => {
    if (!colorSizeStock) return null; // unknown, rely on global
    return Object.values(colorSizeStock).some(s => s > 0);
  }, [colorSizeStock]);

  const outOfStock = colorHasAnyStock !== null
    ? !colorHasAnyStock // use per-color stock
    : (product.stock === 0
       || product.availability === 'out_of_stock'
       || product.availability === 'Out of Stock');

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

  const handleNotifyMe = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return;
    }
    try {
      const key = 'shopnow:notifications';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.some(n => n.productId === id)) {
        list.push({ productId: id, productName: product.name, userEmail: user.email, userName: user.name || user.email.split('@')[0], date: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(list));
      }
      setNotified(true);
      toast.success(`We'll notify you at ${user.email} when "${product.name}" is back in stock!`);
    } catch {
      toast.error('Could not set reminder. Please try again.');
    }
  };

  const baseImages = product.images?.length ? product.images : ['/images/placeholder.jpg'];
  // Resolve selected color's images (supports both new 'images[]' and legacy 'image')
  const selectedCv = product.colorVariants?.[selectedColor];
  const cvImages = selectedCv
    ? (selectedCv.images?.length ? selectedCv.images : (selectedCv.image ? [selectedCv.image] : []))
    : [];
  // Myntra behavior: when a color has its own images, show ONLY those — no mixing
  const images = cvImages.length ? cvImages : baseImages;

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

              {/* Rating — only shown when real reviews exist */}
              {(() => {
                const rv = reviewSummary(product.id);
                if (!rv || rv.count === 0) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ background: '#14958f', color: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {rv.avg} <Star size={12} fill="white" />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {rv.count.toLocaleString('en-IN')} {rv.count === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                );
              })()}

              {/* Price — updates when a size with different price is selected */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900 }}>
                  {inr(selectedSizePrice || product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18, textDecoration: 'line-through' }}>{inr(product.originalPrice)}</span>
                    <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{product.discount}% off</span>
                  </>
                )}
                {selectedSizePrice && selectedSizePrice !== product.price && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>for {selectedSize}</span>
                )}
              </div>

              {/* Colors */}
              {product.colorVariants?.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    MORE COLORS
                    {product.colorVariants[selectedColor]?.name && (
                      <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· {product.colorVariants[selectedColor].name}</span>
                    )}
                  </div>

                  {product.colorDisplayMode === 'image' ? (
                    /* ── Myntra-style: product photo per color ── */
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {product.colorVariants.map((cv, i) => {
                        const thumb = cv.images?.[0] || cv.image || null;
                        const isSelected = i === selectedColor;
                        return (
                          <button key={cv.id || i}
                            onClick={() => { setSelectedColor(i); setImgIdx(0); }}
                            title={cv.name}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              width: 72, height: 90, borderRadius: 6, overflow: 'hidden',
                              border: isSelected ? '2.5px solid var(--accent)' : '2px solid var(--border-glass)',
                              background: 'var(--bg-glass)', transition: 'border 0.15s',
                            }}>
                              {thumb
                                ? <img src={thumb} alt={cv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', background: cv.hex }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Swatch mode: color circles ── */
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {product.colorVariants.map((cv, i) => {
                        const isSelected = i === selectedColor;
                        return (
                          <button key={cv.id || i}
                            onClick={() => { setSelectedColor(i); setImgIdx(0); }}
                            title={cv.name}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', background: cv.hex,
                              outline: isSelected ? `2.5px solid var(--accent)` : '2px solid rgba(0,0,0,0.1)',
                              outlineOffset: 3, border: '1.5px solid rgba(0,0,0,0.08)',
                              transition: 'outline 0.15s',
                            }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : product.colors?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Color</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {product.colors.map((c, i) => (
                      <button key={i} onClick={() => setSelectedColor(i)}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                          outline: i === selectedColor ? `2px solid var(--accent)` : '2px solid transparent',
                          outlineOffset: 3,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Select size {selectedSize && !outOfStock && <span style={{ color: 'var(--accent)' }}>· {selectedSize}</span>}
                      {outOfStock && <span style={{ color: '#ef4444', marginLeft: 8, fontWeight: 700 }}>— OUT OF STOCK</span>}
                    </div>
                    <button onClick={() => setShowSizeChart(true)}
                      style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
                      📏 Size guide
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {product.sizes.map((s) => {
                      // Size disabled if: global out-of-stock OR per-color stock = 0
                      const colorStock = colorSizeStock ? (colorSizeStock[s] ?? null) : null;
                      const sizeOos = outOfStock || (colorStock !== null && colorStock === 0);
                      const isSelected = selectedSize === s && !sizeOos;
                      return (
                        <button key={s}
                          disabled={sizeOos}
                          onClick={() => !sizeOos && setSelectedSize(s)}
                          title={colorStock !== null ? `${colorStock} left` : undefined}
                          style={{
                            minWidth: 44, padding: '8px 12px', borderRadius: 10,
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-glass)'}`,
                            background: isSelected ? 'rgba(124,106,255,0.1)' : 'transparent',
                            color: sizeOos ? 'var(--text-muted)' : isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            fontWeight: 600, fontSize: 14,
                            cursor: sizeOos ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)',
                            textDecoration: sizeOos ? 'line-through' : 'none',
                            opacity: sizeOos ? 0.45 : 1,
                            transition: 'all var(--transition)',
                            position: 'relative',
                          }}>
                          {s}
                          {colorStock !== null && colorStock > 0 && colorStock <= 5 && (
                            <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 8, fontWeight: 700, color: '#ea580c', background: 'var(--bg-card)', borderRadius: 4, padding: '1px 3px', border: '1px solid rgba(234,88,12,0.3)' }}>{colorStock}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
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
              {outOfStock ? (
                /* ── OUT OF STOCK: single Notify Me button ── */
                <div style={{ marginBottom: 22 }}>
                  <motion.button
                    onClick={handleNotifyMe}
                    whileHover={{ scale: notified ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '15px 24px', borderRadius: 50,
                      background: notified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${notified ? '#22c55e' : '#ef4444'}`,
                      color: notified ? '#16a34a' : '#ef4444',
                      fontWeight: 700, fontSize: 15,
                      cursor: notified ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                    }}>
                    {notified ? <BellRing size={18} /> : <Bell size={18} />}
                    {notified ? `Reminder set — we'll email you when back in stock` : 'Notify Me When Back in Stock'}
                  </motion.button>
                  {!user && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                      <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to receive email notifications
                    </p>
                  )}
                </div>
              ) : (
                /* ── IN STOCK: normal Add to bag + Buy now ── */
                <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
                  <motion.button
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, minWidth: 140, padding: '14px 20px',
                      background: addedToCart ? '#22c55e' : 'var(--bg-glass)',
                      border: `1.5px solid ${addedToCart ? '#22c55e' : 'var(--accent)'}`,
                      borderRadius: 50, color: addedToCart ? 'white' : 'var(--accent)',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                    }}>
                    {addedToCart ? <CheckCircle size={16} /> : <ShoppingBag size={16} />}
                    {addedToCart ? 'Added to bag!' : 'Add to bag'}
                  </motion.button>
                  <motion.button
                    onClick={handleBuyNow}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}>
                    Buy now
                  </motion.button>
                </div>
              )}

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
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTryOnModalOpen(true)}
                  style={{
                    flex: 1, padding: '11px 16px', borderRadius: 50,
                    background: 'transparent', border: '1px solid var(--accent)',
                    color: 'var(--accent)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Sparkles size={16} /> Try in 3D
                </motion.button>
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

      {showSizeChart && (
        <SizeChartModal
          product={product}
          gender={product.gender}
          category={product.category}
          onClose={() => setShowSizeChart(false)}
        />
      )}

      {/* ── Try-On Mode Selection Modal ── */}
      <AnimatePresence>
        {tryOnModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTryOnModalOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)', zIndex: 3000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 24, padding: 32, maxWidth: 480, width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--gradient-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Try On in 3D</h3>
                </div>
                <button onClick={() => setTryOnModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Choose how you'd like to try on <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Live Camera */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setTryOnModalOpen(false); navigate('/tryon/live', { state: { product } }); }}
                  style={{
                    width: '100%', padding: '20px 24px',
                    background: 'var(--gradient-1)', border: 'none', borderRadius: 16,
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 6px 24px var(--accent-glow)',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Camera size={24} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Live Camera 3D View</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
                      Open your camera — auto-captures 4 angles as you turn. Just like Lenskart!
                    </p>
                  </div>
                </motion.button>

                {/* Upload Photos */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setTryOnModalOpen(false); navigate('/tryon/live', { state: { product, startPhase: 'upload' } }); }}
                  style={{
                    width: '100%', padding: '20px 24px',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(124,106,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Upload size={22} color="var(--accent)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Upload Photos</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
                      Manually upload 4 photos from different angles for 3D reconstruction.
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
