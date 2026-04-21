import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { relTime } from '../utils/format';

function StarRating({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ background: 'transparent', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 2 }}
        >
          <Star
            size={size}
            fill={(hover || value) >= n ? '#FFD700' : 'none'}
            color={(hover || value) >= n ? '#FFD700' : 'var(--border-glass-hover)'}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ count, total, label }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)', width: 16, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--bg-glass)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'var(--accent)', transition: 'width 0.4s' }} />
      </div>
      <span style={{ color: 'var(--text-muted)', width: 28 }}>{count}</span>
    </div>
  );
}

export default function ReviewsSection({ productId }) {
  const { forProduct, summary, submit, remove, hasPurchased } = useReviews();
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const reviews = forProduct(productId);
  const { count, avg, breakdown } = summary(productId);
  const purchased = hasPurchased(productId);

  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      submit({ productId, rating, title, body });
      toast.success('Review submitted. Thank you!');
      setWriting(false);
      setRating(0);
      setTitle('');
      setBody('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Ratings & Reviews
      </h2>

      {/* Summary */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
        borderRadius: 18, padding: '20px 24px', marginBottom: 20,
        display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
            {count > 0 ? avg.toFixed(1) : '—'}
          </div>
          <StarRating value={Math.round(avg)} size={18} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>{count} review{count !== 1 ? 's' : ''}</div>
        </div>

        {count > 0 && (
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <RatingBar key={star} label={star} count={breakdown[star - 1]} total={count} />
            ))}
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <button
              onClick={() => setWriting((v) => !v)}
              className="btn btn-primary"
              style={{ gap: 8 }}
            >
              <Edit3 size={15} /> {writing ? 'Cancel' : 'Write a review'}
            </button>
          ) : (
            <a href="/login" className="btn btn-ghost" style={{ fontSize: 13, textDecoration: 'none' }}>
              Sign in to review
            </a>
          )}
        </div>
      </div>

      {/* Write review form */}
      <AnimatePresence>
        {writing && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--accent)',
              borderRadius: 18, padding: '20px 24px', marginBottom: 20, overflow: 'hidden',
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Your review</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Overall rating *</div>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title (optional)"
              style={inputStyle()}
            />
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Tell us about your experience…"
              rows={4}
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
            {purchased && (
              <div style={{
                fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 12,
              }}>
                <ShieldCheck size={13} /> Your review will show a verified purchase badge.
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Review list */}
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 16, padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--gradient-1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, color: 'white',
                    }}>
                      {r.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {r.userName}
                        {r.verified && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, color: '#22c55e', fontWeight: 600,
                            background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 20,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <ShieldCheck size={11} /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{relTime(r.createdAt)}</div>
                    </div>
                  </div>
                  <StarRating value={r.rating} size={15} />
                  {r.title && <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8 }}>{r.title}</div>}
                </div>
                {(isAdmin || user?.id === r.userId) && (
                  <button
                    onClick={() => { remove(r.id); toast.info('Review deleted.'); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{r.body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

const inputStyle = () => ({
  display: 'block', width: '100%', marginBottom: 12,
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 10, padding: '10px 14px',
  color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
});
