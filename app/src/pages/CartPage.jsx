import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, Tag, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../utils/format';

export default function CartPage() {
  const { items, updateQty, remove, clear, totals } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '60px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <ShoppingBag size={42} color="var(--accent)" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              Your bag is empty
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 28 }}>
              Add a few pieces, try them on in 3D, and check out in seconds.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/men" className="btn btn-primary" style={{ textDecoration: 'none' }}>Shop Men <ArrowRight size={16} /></Link>
              <Link to="/women" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Shop Women <ArrowRight size={16} /></Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '36px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 38px)',
          fontWeight: 800,
          marginBottom: 6,
        }}>Your Bag</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          {totals.count} item{totals.count !== 1 ? 's' : ''} · {inr(totals.subtotal)}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }} className="cart-grid">
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {items.map((it) => (
                <motion.div
                  layout
                  key={it._key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 16,
                    padding: 14,
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr auto',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <Link to={`/product/${it.productId}`} style={{ display: 'block' }}>
                    <div style={{
                      width: 110, height: 130, borderRadius: 10,
                      background: 'var(--bg-glass)',
                      backgroundImage: it.image ? `url(${it.image})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                  </Link>

                  <div style={{ minWidth: 0 }}>
                    <Link to={`/product/${it.productId}`} style={{
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: 15,
                      display: 'block',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{it.name}</Link>
                    <div style={{ display: 'flex', gap: 14, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10, flexWrap: 'wrap' }}>
                      {it.size && <span>Size: <strong style={{ color: 'var(--text-primary)' }}>{it.size}</strong></span>}
                      {it.colorHex && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          Color: <span style={{ width: 14, height: 14, borderRadius: '50%', background: it.colorHex, border: '1px solid var(--border-glass)' }} />
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 50,
                      }}>
                        <button onClick={() => updateQty(it._key, it.qty - 1)}
                          style={{ background: 'transparent', border: 'none', padding: '6px 10px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{it.qty}</span>
                        <button onClick={() => updateQty(it._key, it.qty + 1)}
                          style={{ background: 'transparent', border: 'none', padding: '6px 10px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => { remove(it._key); toast.info('Removed from bag.'); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{inr(it.price * it.qty)}</div>
                    {it.originalPrice && it.originalPrice > it.price && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'line-through' }}>
                        {inr(it.originalPrice * it.qty)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={() => { clear(); toast.info('Bag cleared.'); }}
              className="btn btn-ghost"
              style={{ alignSelf: 'flex-start', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <Trash2 size={14} /> Clear bag
            </button>
          </div>

          {/* Summary */}
          <aside style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 18,
            padding: 22,
            position: 'sticky',
            top: 'calc(var(--nav-height) + 16px)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Price details</h3>
            <Row label={`Subtotal (${totals.count} item${totals.count !== 1 ? 's' : ''})`} value={inr(totals.subtotal)} />
            {totals.savings > 0 && <Row label="Discount" value={`- ${inr(totals.savings)}`} accent="#22c55e" />}
            <Row label="Shipping" value={totals.shipping === 0 ? 'FREE' : inr(totals.shipping)} accent={totals.shipping === 0 ? '#22c55e' : undefined} />
            <Row label="Tax (5%)" value={inr(totals.tax)} />
            <div style={{ borderTop: '1px solid var(--border-glass)', margin: '14px 0' }} />
            <Row label="Total" value={inr(totals.total)} bold />

            {totals.subtotal < 999 && (
              <div style={{
                marginTop: 12, padding: '10px 12px',
                background: 'rgba(124,106,255,0.08)',
                border: '1px solid rgba(124,106,255,0.25)',
                borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Tag size={14} color="var(--accent)" /> Add {inr(999 - totals.subtotal)} more for free shipping
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
              onClick={() => navigate('/checkout')}
            >
              Checkout <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Trust icon={Truck} text="Free delivery on orders ₹999+" />
              <Trust icon={ShieldCheck} text="Secure payments via Razorpay" />
              <Trust icon={ArrowRight} text="30-day easy returns" />
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: bold ? 17 : 14,
      fontWeight: bold ? 800 : 500,
      color: 'var(--text-primary)',
    }}>
      <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: accent || 'inherit' }}>{value}</span>
    </div>
  );
}

function Trust({ icon: Icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={14} color="var(--accent)" /> {text}
    </span>
  );
}
