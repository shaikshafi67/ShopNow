import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANGLES = [
  { key: 'front', label: 'Front',  deg: 0   },
  { key: 'right', label: 'Right',  deg: 90  },
  { key: 'back',  label: 'Back',   deg: 180 },
  { key: 'left',  label: 'Left',   deg: 270 },
];

export default function TryOn3DViewer({ images, isLoading, statusMsg, clothingName }) {
  const [rotY, setRotY]         = useState(0);
  const [isUserDragging, setIsUserDragging] = useState(false);
  const isDragging  = useRef(false);
  const lastX       = useRef(0);
  const rafRef      = useRef(null);
  const rotRef      = useRef(0);   // live rotation value for RAF

  // ── Auto-rotate until user drags ─────────────────────────────────────────
  useEffect(() => {
    let stopped = false;
    const tick = () => {
      if (!stopped) {
        if (!isDragging.current) {
          rotRef.current -= 0.25;
          setRotY(rotRef.current);
        }
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDown = (e) => {
    isDragging.current = true;
    setIsUserDragging(true);
    lastX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };
  const onMove = (e) => {
    if (!isDragging.current) return;
    const x  = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - lastX.current;
    rotRef.current += dx * 0.4;
    setRotY(rotRef.current);
    lastX.current = x;
  };
  const onUp = () => { isDragging.current = false; };

  // ── Which angle is currently facing the camera ────────────────────────────
  const normalized = ((-rotY % 360) + 360) % 360;   // convert to 0-360
  const activeIdx  = Math.round(normalized / 90) % 4;
  const activeKey  = ANGLES[activeIdx]?.key ?? 'front';

  // ── How many angles have images loaded ───────────────────────────────────
  const loadedCount = ANGLES.filter(a => images?.[a.key]).length;

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: 'linear-gradient(160deg, #07071a 0%, #0d0d20 100%)',
        borderRadius: 24, overflow: 'hidden',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      {/* ── Particle dots (pure CSS, no Three.js) ─────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2, height: 2, borderRadius: '50%',
            background: 'rgba(124,106,255,0.5)',
            left:  `${Math.random() * 100}%`,
            top:   `${Math.random() * 100}%`,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      {/* ── CSS 3D spinning box ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        perspective: '700px',
        perspectiveOrigin: '50% 48%',
      }}>
        <div style={{
          position: 'relative',
          width:  '58%',
          aspectRatio: '3/4',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotY}deg)`,
        }}>
          {ANGLES.map(({ key, deg }) => (
            <div
              key={key}
              style={{
                position: 'absolute', inset: 0,
                transform: `rotateY(${deg}deg) translateZ(110px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#0a0a1a',
                boxShadow: '0 0 40px rgba(0,0,0,0.6)',
              }}
            >
              {images?.[key] ? (
                <img
                  src={images[key]}
                  alt={key}
                  draggable={false}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'contain', display: 'block',
                    pointerEvents: 'none',
                    background: '#0a0a1a',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'linear-gradient(160deg, #0f0f22, #1a1a3e)',
                }}>
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: 36, height: 36, borderRadius: '50%',
                          border: '3px solid rgba(124,106,255,0.15)',
                          borderTopColor: 'var(--accent)',
                        }}
                      />
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>
                        {key}
                      </p>
                    </>
                  ) : (
                    <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>{key}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid floor reflection ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
        background: 'linear-gradient(to bottom, transparent, rgba(124,106,255,0.04))',
        pointerEvents: 'none',
      }} />

      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 18px',
        background: 'linear-gradient(to bottom, rgba(5,5,8,0.95) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isLoading ? 'var(--accent)' : '#00c864',
            boxShadow: `0 0 8px ${isLoading ? 'var(--accent)' : '#00c864'}`,
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isLoading ? 'Generating...' : 'LIVE 3D PREVIEW'}
          </span>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--accent)', fontWeight: 700,
          background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)',
          borderRadius: 20, padding: '3px 10px',
        }}>
          {ANGLES[activeIdx]?.label ?? 'Front'} View
        </div>
      </div>

      {/* ── Angle dots ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 52, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'center', gap: 6,
        pointerEvents: 'none',
      }}>
        {ANGLES.map((a, i) => (
          <div key={a.key} style={{
            width: i === activeIdx ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i === activeIdx
              ? 'var(--accent)'
              : images?.[a.key] ? 'rgba(124,106,255,0.4)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ── Loading overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5,5,8,0.75)', gap: 20,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '3px solid rgba(124,106,255,0.15)',
                borderTopColor: 'var(--accent)',
              }}
            />
            <div style={{ textAlign: 'center', padding: '0 32px' }}>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                Building Your 3D Try-On
              </p>
              <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
                {statusMsg || 'Processing...'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                {loadedCount}/4 angles ready
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ANGLES.map((a, i) => (
                <motion.div
                  key={a.key}
                  animate={{ opacity: images?.[a.key] ? 1 : [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: images?.[a.key] ? 0 : Infinity, delay: i * 0.4 }}
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: images?.[a.key] ? '#00c864' : 'var(--text-muted)',
                    background: 'var(--bg-glass)', border: `1px solid ${images?.[a.key] ? 'rgba(0,200,100,0.3)' : 'var(--border-glass)'}`,
                    borderRadius: 20, padding: '4px 10px',
                  }}
                >
                  {images?.[a.key] ? '✓ ' : ''}{a.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 18px 14px',
        background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Wearing</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{clothingName}</p>
        </div>
        <div style={{
          background: 'rgba(5,5,8,0.8)', border: '1px solid var(--border-glass)',
          borderRadius: 50, padding: '5px 12px', fontSize: 11, color: 'var(--text-muted)',
        }}>
          ⬅️ Drag to rotate ➡️
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
