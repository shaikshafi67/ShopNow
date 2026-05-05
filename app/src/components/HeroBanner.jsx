import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBanners } from '../context/BannersContext';

const INTERVAL = 4000;

export default function HeroBanner() {
  const { activeBanners } = useBanners();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef(null);

  const count = activeBanners.length;

  const go = useCallback((next, direction) => {
    setDir(direction);
    setIdx((next + count) % count);
  }, [count]);

  const next = useCallback(() => go(idx + 1, 1), [go, idx]);
  const prev = useCallback(() => go(idx - 1, -1), [go, idx]);

  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [count, next]);

  function resetTimer() {
    clearInterval(timerRef.current);
    if (count > 1) timerRef.current = setInterval(next, INTERVAL);
  }

  if (count === 0) return null;

  const banner = activeBanners[idx];

  const variants = {
    enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - var(--nav-height, 64px))',
        maxHeight: '860px',
        minHeight: '400px',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
      }}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={banner.id}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: banner.link && banner.link !== '/' ? 'pointer' : 'default',
          }}
          onClick={() => { if (banner.link) navigate(banner.link); }}
        >
          <img
            src={banner.image}
            alt={banner.title || 'Banner'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              userSelect: 'none',
            }}
            draggable={false}
          />

          {/* Text overlay */}
          {(banner.title || banner.subtitle) && (
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              padding: '40px 32px 28px',
              pointerEvents: 'none',
            }}>
              {banner.title && (
                <h2 style={{
                  margin: 0, fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 3.5vw, 42px)',
                  fontWeight: 800, color: '#fff',
                  textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}>
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p style={{
                  margin: '6px 0 0', fontSize: 'clamp(13px, 1.6vw, 18px)',
                  color: 'rgba(255,255,255,0.85)',
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                }}>
                  {banner.subtitle}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Arrows — only when multiple banners */}
      {count > 1 && (
        <>
          <button
            onClick={() => { prev(); resetTimer(); }}
            aria-label="Previous banner"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => { next(); resetTimer(); }}
            aria-label="Next banner"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 7, zIndex: 10,
        }}>
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => { go(i, i > idx ? 1 : -1); resetTimer(); }}
              aria-label={`Go to banner ${i + 1}`}
              style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 4, border: 'none',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer', padding: 0, transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
