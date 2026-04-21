import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TryOn3DViewer from '../components/TryOn3DViewer';
import {
  Camera, RotateCcw, CheckCircle, Sparkles as SparklesIcon,
  ChevronLeft, ChevronRight, X,
  AlertCircle, ShoppingBag,
} from 'lucide-react';
import useCamera from '../hooks/useCamera';
import { menProducts, womenProducts } from '../data/products';
import { submitTryOn, checkHealth } from '../utils/tryon_client';

// ─── Pose definitions ──────────────────────────────────────────────────────────
const POSES = [
  {
    id: 'front',
    label: 'Front View',
    instruction: 'Face the camera directly',
    icon: '1',
    arrow: 'up',
  },
  {
    id: 'right',
    label: 'Right Side',
    instruction: 'Turn to show your right side',
    icon: '2',
    arrow: 'right',
  },
  {
    id: 'back',
    label: 'Back View',
    instruction: 'Turn your back to the camera',
    icon: '3',
    arrow: 'down',
  },
  {
    id: 'left',
    label: 'Left Side',
    instruction: 'Turn to show your left side',
    icon: '4',
    arrow: 'left',
  },
];

const COUNTDOWN_SECONDS = 5;

const CLOTHING_CAROUSEL = [
  ...menProducts.tshirts.slice(0, 3),
  ...menProducts.shirts.slice(0, 2),
  ...womenProducts.tops.slice(0, 3),
  ...womenProducts.dresses.slice(0, 2),
];

// ─── Countdown Ring SVG ────────────────────────────────────────────────────────

function CountdownRing({ seconds, total }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = ((total - seconds) / total) * circumference;

  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ filter: 'drop-shadow(0 0 12px rgba(124,106,255,0.5))' }}>
      {/* Background ring */}
      <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      {/* Progress ring */}
      <circle
        cx="45" cy="45" r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c6aff" />
          <stop offset="100%" stopColor="#ff6a9a" />
        </linearGradient>
      </defs>
      {/* Timer text */}
      <text x="45" y="49" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="var(--font-display)">
        {seconds}
      </text>
    </svg>
  );
}

// ─── Pose Guide SVG Overlay ────────────────────────────────────────────────────

function PoseGuide({ pose }) {
  return (
    <motion.div
      key={pose.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Full body dotted silhouette — tells user to fit whole body in frame */}
      <svg width="140" height="380" viewBox="0 0 140 380" style={{ opacity: 0.3 }}>
        {/* Head */}
        <circle cx="70" cy="28" r="22" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Neck */}
        <line x1="70" y1="50" x2="70" y2="68" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Shoulders */}
        <line x1="20" y1="80" x2="120" y2="80" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Left arm */}
        <line x1="20" y1="80" x2="8" y2="160" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Right arm */}
        <line x1="120" y1="80" x2="132" y2="160" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Torso */}
        <path d="M20,80 Q18,160 30,190 L110,190 Q122,160 120,80" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Hips */}
        <ellipse cx="70" cy="195" rx="42" ry="12" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Left leg */}
        <path d="M42,205 Q36,280 38,355" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Right leg */}
        <path d="M98,205 Q104,280 102,355" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Left foot */}
        <ellipse cx="36" cy="360" rx="14" ry="6" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
        {/* Right foot */}
        <ellipse cx="104" cy="360" rx="14" ry="6" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 3" />
      </svg>
      {/* "Fit full body" label */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(124,106,255,0.25)', border: '1px solid rgba(124,106,255,0.5)',
        borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'white',
        fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        Fit full body in frame
      </div>

      {/* Direction arrow */}
      <motion.div
        animate={pose.id === 'front' ? {} : { x: pose.id === 'right' ? [0, 10, 0] : pose.id === 'left' ? [0, -10, 0] : [0, 0, 0], y: pose.id === 'back' ? [0, -6, 0] : [0, 0, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 48,
          opacity: 0.8,
          color: 'white',
          fontWeight: 700,
        }}
      >
        {pose.arrow === 'up' ? '↑' : pose.arrow === 'right' ? '→' : pose.arrow === 'down' ? '↓' : '←'}
      </motion.div>
    </motion.div>
  );
}

// ─── Capture Flash Effect ──────────────────────────────────────────────────────

function CaptureFlash({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="capture-flash"
        />
      )}
    </AnimatePresence>
  );
}

// ─── Processing Bar ────────────────────────────────────────────────────────────

function ProcessingBar({ progress }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Generating 3D model...</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'var(--gradient-1)', borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

// ─── TryOnComposite — IDM-VTON via HuggingFace ────────────────────────────────

// Cache results so switching views doesn't re-run the model
const tryOnCache = new Map();

function TryOnComposite({ photoUrl, clothingUrl, view }) {
  const [resultUrl, setResultUrl] = useState(null);
  const [status, setStatus]       = useState('idle'); // idle | loading | done | error
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg]       = useState('');

  useEffect(() => {
    if (!photoUrl || !clothingUrl) return;

    // Only run HF for front view — side/back views just show the raw photo
    // (IDM-VTON works best with front-facing images)
    if (view !== 'front') {
      setStatus('raw');
      return;
    }

    const cacheKey = `${photoUrl}__${clothingUrl}`;
    if (tryOnCache.has(cacheKey)) {
      setResultUrl(tryOnCache.get(cacheKey));
      setStatus('done');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setErrMsg('');

    (async () => {
      try {
        const { runVirtualTryOn } = await import('../utils/tryon_hf.js');
        if (cancelled) return;

        // Convert photoUrl (object URL) to File
        const photoResp = await fetch(photoUrl);
        const photoBlob = await photoResp.blob();
        const photoFile = new File([photoBlob], 'person.jpg', { type: 'image/jpeg' });

        const url = await runVirtualTryOn({
          personFile:  photoFile,
          garmentUrl:  clothingUrl,
          onStatus:    (msg) => { if (!cancelled) setStatusMsg(msg); },
        });

        if (cancelled) return;
        tryOnCache.set(cacheKey, url);
        setResultUrl(url);
        setStatus('done');
      } catch (err) {
        console.error('[TryOnComposite]', err);
        if (!cancelled) {
          setErrMsg(err.message || 'Try-on failed');
          setStatus('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [photoUrl, clothingUrl, view]);

  const showRaw   = status === 'raw' || status === 'error';
  const showPhoto = showRaw ? photoUrl : (status === 'done' ? resultUrl : photoUrl);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a14' }}>
      {/* Always show photo (raw or result) */}
      {showPhoto && (
        <img
          src={showPhoto}
          alt={view}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.82)', gap: 16, padding: 24,
        }}>
          {/* Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid rgba(124,106,255,0.15)',
              borderTopColor: 'var(--accent)',
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              AI Virtual Try-On
            </p>
            <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
              {statusMsg || 'Starting...'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
              Try-on + HD enhancement · ~60–90 sec
            </p>
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['Fitting garment', 'Enhancing quality', 'Finalizing'].map((s, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 20, padding: '4px 10px',
                }}
              >
                {s}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          position: 'absolute', bottom: 60, left: 16, right: 16, zIndex: 10,
          background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ color: '#ff4646', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Try-On Error</p>
          <p style={{ color: 'rgba(255,100,100,0.8)', fontSize: 11 }}>{errMsg}</p>
        </div>
      )}

      {/* Side/back view label */}
      {status === 'raw' && (
        <div style={{
          position: 'absolute', top: 50, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 5,
        }}>
          <div style={{
            background: 'rgba(5,5,8,0.75)', border: '1px solid var(--border-glass)',
            borderRadius: 20, padding: '5px 14px', fontSize: 12, color: 'var(--text-muted)',
          }}>
            AI try-on available for Front view only
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Try-On Preview Panel ──────────────────────────────────────────────────────

const VIEW_POSES = [
  { id: 'front', label: 'Front' },
  { id: 'right', label: 'Right' },
  { id: 'back',  label: 'Back'  },
  { id: 'left',  label: 'Left'  },
];

function TryOnPreviewPanel({ phase, capturePreviewUrls, selectedClothing, progress }) {
  const [activeView, setActiveView] = useState('front');
  const [flipped, setFlipped] = useState(false);

  const photoUrl = capturePreviewUrls[activeView];
  const hasResult = phase === 'result';
  const hasPhotos = Object.keys(capturePreviewUrls).length > 0;

  // Auto-switch to front when result arrives
  useEffect(() => {
    if (hasResult) setActiveView('front');
  }, [hasResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Main preview card ── */}
      <div style={{
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card)',
        aspectRatio: '3 / 4',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        cursor: hasResult ? 'pointer' : 'default',
      }}
        onClick={() => hasResult && setFlipped(f => !f)}
      >
        {/* Header bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '14px 18px',
          background: 'linear-gradient(to bottom, rgba(5,5,8,0.95) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: hasResult ? '#00c864' : 'var(--accent)',
              boxShadow: `0 0 8px ${hasResult ? '#00c864' : 'var(--accent)'}`,
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {hasResult ? 'Virtual Try-On' : phase === 'processing' ? 'Processing...' : 'Preview'}
            </span>
          </div>
          {hasResult && (
            <div style={{
              fontSize: 11, color: 'var(--accent)', fontWeight: 600,
              background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Tap to flip
            </div>
          )}
        </div>

        {/* ── IDLE / WAITING STATE ── */}
        {!hasPhotos && phase !== 'processing' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 32,
            background: 'radial-gradient(ellipse at center, rgba(124,106,255,0.06) 0%, transparent 70%)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={32} color="var(--text-muted)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>
                No photos yet
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                {phase === 'intro'
                  ? 'Open the camera and capture 4 angles to see yourself in the outfit'
                  : 'Stand in position and wait for the auto-capture countdown'}
              </p>
            </div>
            {/* Clothing preview */}
            {selectedClothing && (
              <div style={{
                marginTop: 8, padding: '12px 16px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              }}>
                <img src={selectedClothing.images[0]} alt="" style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--accent)' }} onError={(e) => e.target.style.display='none'} />
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Will be wearing</p>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{selectedClothing.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROCESSING STATE ── */}
        {phase === 'processing' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 20, padding: 32,
            background: '#07071a',
          }}>
            {/* Show front photo with processing shimmer */}
            {capturePreviewUrls.front && (
              <div style={{ position: 'relative', width: '100%', flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                <img
                  src={capturePreviewUrls.front}
                  alt="Front"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                />
                {/* Scanning line animation */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    boxShadow: '0 0 20px var(--accent)',
                  }}
                />
                {/* Clothing overlay with blend */}
                {selectedClothing && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <motion.img
                      src={selectedClothing.images[0]}
                      alt="clothing"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        width: '55%',
                        objectFit: 'contain',
                        mixBlendMode: 'screen',
                        filter: 'hue-rotate(0deg) saturate(1.5)',
                        marginTop: '8%',
                      }}
                      onError={(e) => e.target.style.display='none'}
                    />
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px',
                  background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                    Analyzing & fitting outfit...
                  </p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                      style={{ height: '100%', background: 'var(--gradient-1)', borderRadius: 2 }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{progress}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT STATE: canvas composite ── */}
        {hasResult && photoUrl && (
          <motion.div
            key={`${activeView}-${flipped}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'absolute', inset: 0, background: '#0a0a14' }}
          >
            {!flipped
              ? <TryOnComposite photoUrl={photoUrl} clothingUrl={selectedClothing?.images[0]} view={activeView} />
              : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-card)', gap: 20, padding: 32,
                }}>
                  <img
                    src={selectedClothing?.images[0]}
                    alt="clothing detail"
                    style={{ width: '70%', objectFit: 'contain', borderRadius: 16, border: '1px solid var(--border-glass)' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{selectedClothing?.name}</p>
                    <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 22 }}>₹{selectedClothing?.price?.toLocaleString()}</p>
                  </div>
                </div>
              )
            }

            {/* Bottom gradient + view label */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '24px 20px 16px',
              background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                  {flipped ? 'Outfit Detail' : `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} View`}
                </p>
                {!flipped && selectedClothing && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{selectedClothing.name}</p>
                )}
              </div>
              {!flipped && (
                <div style={{
                  background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.3)',
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--accent)', fontWeight: 600,
                }}>
                  Virtual Try-On
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Capturing — live thumbnails progress */}

        {phase === 'capturing' && hasPhotos && !hasResult && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px',
            background: 'linear-gradient(to top, rgba(5,5,8,0.95) 60px, transparent)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {VIEW_POSES.map(p => {
                const url = capturePreviewUrls[p.id];
                return (
                  <div key={p.id} style={{
                    aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                    border: `1px solid ${url ? 'var(--accent)' : 'var(--border-glass)'}`,
                    background: 'var(--bg-glass)',
                  }}>
                    {url && <img src={url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── View selector tabs (only in result phase) ── */}
      {hasResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {VIEW_POSES.map(p => {
            const url = capturePreviewUrls[p.id];
            const isActive = activeView === p.id;
            return (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setActiveView(p.id); setFlipped(false); }}
                style={{
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border-glass)'}`,
                  borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4',
                  cursor: 'pointer', padding: 0, position: 'relative',
                  boxShadow: isActive ? '0 0 16px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s ease',
                  background: 'var(--bg-glass)',
                }}
              >
                {url && (
                  <img src={url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: isActive ? 'rgba(124,106,255,0.7)' : 'rgba(5,5,8,0.7)',
                  padding: '3px 0', textAlign: 'center',
                  fontSize: 10, fontWeight: 700, color: 'white',
                  transition: 'all 0.2s ease',
                }}>
                  {p.label}
                </div>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: 'white', fontWeight: 700,
                  }}>✓</div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Hint ── */}
      {hasResult && !flipped && (
        <div style={{
          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          borderRadius: 12, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          <span>For best results: stand 1.5–2m away, full body visible, bright lighting. Tap to see outfit detail.</span>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function LiveTryOnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product || CLOTHING_CAROUSEL[0];

  // Camera hook
  const { videoRef, canvasRef, isStreaming, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();

  // Capture state
  const [phase, setPhase] = useState('intro'); // intro | capturing | processing | result
  const [cameraReady, setCameraReady] = useState(false); // false during warmup
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [captures, setCaptures] = useState({});
  const [captureFlash, setCaptureFlash] = useState(false);
  const [capturePreviewUrls, setCapturePreviewUrls] = useState({});

  // Processing state
  const [progress, setProgress] = useState(0);
  const [meshUrl, setMeshUrl] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiOnline, setApiOnline] = useState(null);

  // Clothing selection
  const [selectedClothing, setSelectedClothing] = useState(product);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // 3D viewer state
  const [viewer3DImages, setViewer3DImages] = useState(null);   // { front, right, back, left }
  const [viewer3DLoading, setViewer3DLoading] = useState(false);
  const [viewer3DStatus, setViewer3DStatus] = useState('');

  // Single ref that owns the entire capture flow — avoids stale closure bugs
  const flowRef = useRef({
    active: false,
    captures: {},
    captureUrls: {},
    countdownTimer: null,
    skipCountdown: null,  // function: resolves current countdown promise immediately
  });

  // Ref to triggerGenerate so runPoseCapture can call it without circular deps
  const triggerGenerateRef = useRef(null);

  // Check API health
  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  // ── Core capture routine for a single pose (runs entirely through refs) ───
  const runPoseCapture = useCallback(async (poseIndex, existingCaptures, existingUrls) => {
    const pose = POSES[poseIndex];
    if (!pose || !flowRef.current.active) return;

    // Start countdown
    setCurrentPoseIndex(poseIndex);
    let secs = COUNTDOWN_SECONDS;
    setCountdown(secs);

    await new Promise((resolve) => {
      // Allow manual capture to skip countdown
      flowRef.current.skipCountdown = () => {
        clearInterval(flowRef.current.countdownTimer);
        flowRef.current.skipCountdown = null;
        setCountdown(0);
        resolve();
      };

      flowRef.current.countdownTimer = setInterval(() => {
        if (!flowRef.current.active) {
          clearInterval(flowRef.current.countdownTimer);
          resolve();
          return;
        }
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(flowRef.current.countdownTimer);
          flowRef.current.skipCountdown = null;
          resolve();
        }
      }, 1000);
    });

    if (!flowRef.current.active) return;

    // Wait until the video has actual frames (videoWidth > 0)
    let waited = 0;
    const vid = videoRef.current;
    while (vid && vid.videoWidth === 0 && waited < 5000) {
      await new Promise((r) => setTimeout(r, 200));
      waited += 200;
    }

    // Capture frame — retry once if still not ready
    let file = await captureFrame(`${pose.id}.jpg`);
    if (!file) {
      await new Promise((r) => setTimeout(r, 600));
      file = await captureFrame(`${pose.id}.jpg`);
    }
    if (!file || !flowRef.current.active) return;

    // Flash
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 400);

    // Store capture
    const url = URL.createObjectURL(file);
    const newCaptures = { ...existingCaptures, [pose.id]: file };
    const newUrls = { ...existingUrls, [pose.id]: url };
    flowRef.current.captures = newCaptures;
    flowRef.current.captureUrls = newUrls;
    setCaptures({ ...newCaptures });
    setCapturePreviewUrls({ ...newUrls });

    // Brief pause so the user sees the thumbnail appear
    await new Promise((r) => setTimeout(r, 700));

    if (poseIndex < POSES.length - 1) {
      // Next pose
      await runPoseCapture(poseIndex + 1, newCaptures, newUrls);
    } else {
      // All poses done
      stopCamera();
      if (triggerGenerateRef.current) triggerGenerateRef.current(newCaptures);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureFrame, stopCamera, videoRef]);

  // ── Start camera flow ──────────────────────────────────────────────────────
  const handleStartCapture = useCallback(async () => {
    // Reset everything
    flowRef.current = { active: true, captures: {}, captureUrls: {}, countdownTimer: null, skipCountdown: null };
    setCaptures({});
    setCapturePreviewUrls({});
    setCurrentPoseIndex(0);
    setProgress(0);
    setMeshUrl(null);
    setApiError(null);

    // Switch to capturing phase FIRST so the <video> element mounts
    setCameraReady(false);
    setPhase('capturing');

    // Wait one tick for React to render the video element into the DOM
    await new Promise((r) => setTimeout(r, 150));

    await startCamera();

    // Give camera ~1.5 s to warm up so first frames aren't black
    await new Promise((r) => setTimeout(r, 1500));

    if (!flowRef.current.active) return;
    setCameraReady(true);

    await runPoseCapture(0, {}, {});
  }, [startCamera, runPoseCapture]);

  // ── Manual capture — skip remaining countdown ──────────────────────────────
  const handleManualCapture = useCallback(() => {
    if (flowRef.current.skipCountdown) {
      flowRef.current.skipCountdown();
    }
  }, []);

  // ── Generate try-on + 3D ──────────────────────────────────────────────────
  const triggerGenerate = useCallback(async (allCaptures) => {
    setPhase('processing');
    setProgress(0);
    setApiError(null);
    setMeshUrl(null);
    setViewer3DImages(null);
    setViewer3DLoading(true);
    setViewer3DStatus('Starting AI try-on...');

    try {
      // ── Step 1: IDM-VTON — put the clothing on the front photo ────────────
      const { runVirtualTryOn } = await import('../utils/tryon_hf.js');

      const frontFile = allCaptures.front;
      const frontTryOnUrl = await runVirtualTryOn({
        personFile:  frontFile,
        garmentUrl:  selectedClothing.images[0],
        onStatus:    (msg) => { setViewer3DStatus(msg); setProgress(30); },
      });

      setProgress(50);

      // Show result immediately with front view while Gemini generates other angles
      setViewer3DImages({ front: frontTryOnUrl, right: allCaptures.right, back: allCaptures.back, left: allCaptures.left });
      setPhase('result');
      setProgress(60);

      // ── Step 2: Gemini — generate right, back, left AI views ─────────────
      setViewer3DStatus('Generating 3D angles with Gemini AI...');
      const { generateAllAngles } = await import('../utils/gemini3d.js');

      const allAngles = await generateAllAngles(
        frontTryOnUrl,
        (msg) => setViewer3DStatus(msg),
        { right: allCaptures.right ? URL.createObjectURL(allCaptures.right) : null,
          back:  allCaptures.back  ? URL.createObjectURL(allCaptures.back)  : null,
          left:  allCaptures.left  ? URL.createObjectURL(allCaptures.left)  : null,
        }
      );

      setViewer3DImages(allAngles);
      setProgress(100);
      setViewer3DLoading(false);
      setViewer3DStatus('');

    } catch (err) {
      console.warn('[LiveTryOn] pipeline error:', err.message);
      setApiError(err.message);
      setViewer3DLoading(false);

      // Fallback — show raw captured photos in 3D viewer
      const rawUrls = {};
      for (const [k, v] of Object.entries(allCaptures)) {
        if (v) rawUrls[k] = URL.createObjectURL(v);
      }
      setViewer3DImages(rawUrls);
      setPhase('result');
      setProgress(100);
    }
  }, [selectedClothing]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    // Mark flow as inactive so any in-progress runPoseCapture exits
    flowRef.current.active = false;
    clearInterval(flowRef.current.countdownTimer);
    flowRef.current.skipCountdown = null;
    stopCamera();
    setPhase('intro');
    setCurrentPoseIndex(0);
    setCountdown(COUNTDOWN_SECONDS);
    setCaptures({});
    setCapturePreviewUrls({});
    setProgress(0);
    setMeshUrl(null);
    setApiError(null);
    setCameraReady(false);
  }, [stopCamera]);

  // Keep triggerGenerateRef current so runPoseCapture can call it
  useEffect(() => { triggerGenerateRef.current = triggerGenerate; }, [triggerGenerate]);

  const currentPose = POSES[currentPoseIndex];
  const capturedCount = Object.keys(captures).length;

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--border-glass)',
        padding: '24px 0',
        background: 'linear-gradient(135deg, rgba(124,106,255,0.08) 0%, rgba(255,106,154,0.04) 100%)',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Camera size={22} color="var(--accent)" />
                </motion.div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, margin: 0 }}>
                  Live Camera Try-On
                </h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {phase === 'intro' && 'Open your camera • Auto-capture 4 angles • See your outfit in 3D'}
                {phase === 'capturing' && `Capturing ${currentPose?.label} — ${capturedCount}/${POSES.length} done`}
                {phase === 'processing' && 'Building your 3D avatar...'}
                {phase === 'result' && 'Your 3D avatar is ready! Rotate to explore.'}
              </p>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {['Camera Setup', 'Auto Capture', 'View in 3D'].map((step, i) => {
                const isActive =
                  (phase === 'intro' && i === 0) ||
                  (phase === 'capturing' && i === 1) ||
                  ((phase === 'processing' || phase === 'result') && i === 2);
                const isDone =
                  (phase === 'capturing' && i === 0) ||
                  ((phase === 'processing' || phase === 'result') && i <= 1);

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isDone ? '#00c864' : isActive ? 'var(--gradient-1)' : 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: isDone ? '#00c864' : isActive ? 'transparent' : 'var(--border-glass)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
                        transition: 'all 0.4s ease',
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {step}
                      </span>
                    </div>
                    {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--border-glass)' }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="tryon-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 32,
          alignItems: 'start',
        }}>

          {/* ══════ LEFT PANEL ══════ */}
          <div>
            <AnimatePresence mode="wait">
              {/* ── INTRO PHASE ─── */}
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Selected Product */}
                  <div style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    borderRadius: 20, padding: 20, marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <img
                      src={selectedClothing.images[0]}
                      alt={selectedClothing.name}
                      style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 14, border: '2px solid var(--accent)' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                        Try On This
                      </p>
                      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedClothing.name}
                      </p>
                      <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 18 }}>
                        ₹{selectedClothing.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* How it works */}
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                    How It Works
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                    {[
                      { step: '1', title: 'Open Camera', desc: 'We\u2019ll access your webcam for a quick photo session' },
                      { step: '2', title: 'Auto-Capture 4 Angles', desc: 'Stand still at each prompt — photos are taken automatically' },
                      { step: '3', title: 'See Your 3D Avatar', desc: 'Our AI builds a 3D model with the outfit on you' },
                    ].map((item) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.step * 0.1 }}
                        style={{
                          display: 'flex', gap: 14, alignItems: 'flex-start',
                          padding: '14px 18px',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 14,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--gradient-1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {item.step}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.title}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    borderRadius: 16, padding: '16px 20px', marginBottom: 28,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>
                      Tips for Best Results
                    </p>
                    {[
                      'Full body visible — head to toe in frame for best AI results',
                      'Stand 1.5–2m from camera so your whole body fits',
                      'Plain background (white wall) gives cleanest output',
                      'Good lighting — face a window or bright light source',
                      'Wear fitted clothes underneath for accurate body shape',
                    ].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ color: '#00c864', fontSize: 14, flexShrink: 0 }}>✓</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tip}</span>
                      </div>
                    ))}
                  </div>

                  {/* Camera error */}
                  {cameraError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)',
                        borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}
                    >
                      <AlertCircle size={18} color="#ff4646" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ color: '#ff4646', fontSize: 13, lineHeight: 1.5 }}>{cameraError}</p>
                    </motion.div>
                  )}

                  {/* Start button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartCapture}
                    style={{
                      width: '100%', padding: '18px',
                      background: 'var(--gradient-1)',
                      border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700,
                      color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      boxShadow: '0 6px 24px var(--accent-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    <Camera size={20} /> Open Camera & Start
                  </motion.button>

                  <button
                    onClick={() => navigate('/tryon', { state: { product: selectedClothing } })}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                  >
                    Or upload photos manually instead
                  </button>
                </motion.div>
              )}

              {/* ── CAPTURING PHASE ─── */}
              {phase === 'capturing' && (
                <motion.div
                  key="capturing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Camera viewport */}
                  <div
                    className="camera-viewport"
                    style={{
                      position: 'relative',
                      borderRadius: 24,
                      overflow: 'hidden',
                      aspectRatio: '3/4',
                      background: '#000',
                      border: '2px solid',
                      borderColor: 'var(--accent)',
                      boxShadow: '0 0 30px var(--accent-glow)',
                      marginBottom: 16,
                    }}
                  >
                    {/* Live video */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transform: 'scaleX(-1)', // mirror
                      }}
                    />

                    {/* Camera warmup overlay */}
                    {!cameraReady && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 20,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 16,
                        background: 'rgba(5,5,8,0.85)',
                      }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Camera size={40} color="var(--accent)" />
                        </motion.div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
                          Starting camera...
                        </p>
                        {cameraError && (
                          <p style={{ color: '#ff4646', fontSize: 13, textAlign: 'center', maxWidth: 260, padding: '0 16px' }}>
                            {cameraError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pose guide overlay */}
                    {cameraReady && (
                      <AnimatePresence mode="wait">
                        <PoseGuide pose={currentPose} />
                      </AnimatePresence>
                    )}

                    {/* Flash effect */}
                    <CaptureFlash show={captureFlash} />

                    {/* Corner frame borders */}
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                      <div
                        key={pos}
                        style={{
                          position: 'absolute',
                          width: 30, height: 30,
                          ...(pos.includes('top') ? { top: 16 } : { bottom: 16 }),
                          ...(pos.includes('left') ? { left: 16 } : { right: 16 }),
                          borderColor: 'var(--accent)',
                          borderStyle: 'solid',
                          borderWidth: 0,
                          ...(pos === 'top-left' && { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }),
                          ...(pos === 'top-right' && { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }),
                          ...(pos === 'bottom-left' && { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }),
                          ...(pos === 'bottom-right' && { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 }),
                          opacity: 0.6,
                        }}
                      />
                    ))}

                    {/* Top info bar */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                      padding: '16px 20px',
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', background: '#ff4646',
                          boxShadow: '0 0 8px #ff4646', animation: 'pulse 1.5s infinite',
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          REC
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                        {capturedCount}/{POSES.length} captured
                      </span>
                    </div>

                    {/* Center instruction + countdown */}
                    {cameraReady && <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
                      padding: '20px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}>
                      <CountdownRing seconds={countdown} total={COUNTDOWN_SECONDS} />
                      <motion.p
                        key={currentPose.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 18, fontWeight: 700, color: 'white',
                          textAlign: 'center', fontFamily: 'var(--font-display)',
                        }}
                      >
                        {currentPose.instruction}
                      </motion.p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        Photo captures automatically, or tap the button
                      </p>
                    </div>}
                  </div>

                  {/* Manual capture button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleManualCapture}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'var(--bg-glass)',
                      border: '2px solid var(--accent)',
                      borderRadius: 14, fontSize: 15, fontWeight: 700,
                      color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <Camera size={18} /> Capture Now
                  </motion.button>

                  {/* Captured thumbnail strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {POSES.map((pose) => {
                      const url = capturePreviewUrls[pose.id];
                      return (
                        <motion.div
                          key={pose.id}
                          initial={url ? { scale: 0.8, opacity: 0 } : {}}
                          animate={url ? { scale: 1, opacity: 1 } : {}}
                          style={{
                            aspectRatio: '3/4',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: url ? 'var(--accent)' : 'var(--border-glass)',
                            background: url ? 'none' : 'var(--bg-glass)',
                            position: 'relative',
                            boxShadow: url ? '0 0 12px var(--accent-glow)' : 'none',
                          }}
                        >
                          {url ? (
                            <>
                              <img src={url} alt={pose.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{
                                position: 'absolute', top: 4, right: 4,
                                width: 18, height: 18, borderRadius: '50%',
                                background: '#00c864', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <CheckCircle size={12} color="white" />
                              </div>
                            </>
                          ) : (
                            <div style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              height: '100%', gap: 4,
                            }}>
                              <span style={{ fontSize: 20, opacity: 0.4 }}>{pose.arrow}</span>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '0 4px' }}>
                                {pose.label}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Cancel button */}
                  <button
                    onClick={handleRestart}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                  >
                    <X size={15} /> Cancel
                  </button>
                </motion.div>
              )}

              {/* ── PROCESSING PHASE ─── */}
              {phase === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: 'center',
                    padding: '50px 32px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 24,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginBottom: 24 }}
                  >
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'var(--gradient-1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 40px var(--accent-glow)',
                    }}>
                      <SparklesIcon size={36} color="white" />
                    </div>
                  </motion.div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                    Building Your 3D Avatar
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
                    Analyzing your photos and constructing a personalized 3D model with{' '}
                    <strong style={{ color: 'var(--accent)' }}>{selectedClothing.name}</strong>
                  </p>

                  <ProcessingBar progress={progress} />

                  {/* Captured images strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 28 }}>
                    {POSES.map((pose) => {
                      const url = capturePreviewUrls[pose.id];
                      return (
                        <div key={pose.id} style={{
                          aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden',
                          border: '1px solid var(--border-glass)',
                        }}>
                          {url && <img src={url} alt={pose.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
                    {['Analyzing poses', 'Building mesh', 'Applying texture', 'Finalizing'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: progress > (i + 1) * 25 ? '#00c864' : progress > i * 25 ? 'var(--accent)' : 'var(--bg-card)',
                          transition: 'all 0.4s ease',
                          boxShadow: progress > i * 25 && progress <= (i + 1) * 25 ? '0 0 8px var(--accent)' : 'none',
                        }} />
                        <span style={{ fontSize: 12, color: progress > i * 25 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── RESULT PHASE ─── */}
              {phase === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Success banner */}
                  <div style={{
                    background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)',
                    borderRadius: 16, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
                  }}>
                    <CheckCircle size={22} color="#00c864" />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#00c864', marginBottom: 2 }}>3D Avatar Generated!</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Rotate and zoom the 3D stage to explore your look.</p>
                    </div>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                    Change Outfit
                  </h2>

                  {/* Clothing carousel */}
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {CLOTHING_CAROUSEL.slice(carouselOffset, carouselOffset + 4).map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedClothing(item)}
                          style={{
                            borderRadius: 14, overflow: 'hidden',
                            border: '2px solid',
                            borderColor: selectedClothing?.id === item.id ? 'var(--accent)' : 'var(--border-glass)',
                            cursor: 'pointer',
                            aspectRatio: '2/3',
                            background: 'var(--bg-card)',
                            position: 'relative',
                            boxShadow: selectedClothing?.id === item.id ? '0 0 20px var(--accent-glow)' : 'none',
                            transition: 'all var(--transition)',
                          }}
                        >
                          <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 60%)' }} />
                          <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1.3 }}>
                              {item.name.split(' ').slice(0, 3).join(' ')}
                            </p>
                          </div>
                          {selectedClothing?.id === item.id && (
                            <div style={{
                              position: 'absolute', top: 6, right: 6,
                              width: 20, height: 20, borderRadius: '50%',
                              background: 'var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, color: 'white', fontWeight: 700,
                            }}>✓</div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      <button
                        onClick={() => setCarouselOffset((o) => Math.max(0, o - 4))}
                        disabled={carouselOffset === 0}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          color: carouselOffset === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: carouselOffset === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setCarouselOffset((o) => Math.min(CLOTHING_CAROUSEL.length - 4, o + 4))}
                        disabled={carouselOffset + 4 >= CLOTHING_CAROUSEL.length}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          color: carouselOffset + 4 >= CLOTHING_CAROUSEL.length ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: carouselOffset + 4 >= CLOTHING_CAROUSEL.length ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Selected clothing info */}
                  {selectedClothing && (
                    <div style={{
                      background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                      borderRadius: 14, padding: '16px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <img src={selectedClothing.images[0]} alt="" style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 10 }} onError={(e) => e.target.style.display = 'none'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedClothing.name}
                        </p>
                        <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16 }}>
                          ₹{selectedClothing.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0 }}
                        onClick={() => setModalOpen(true)}
                      >
                        <ShoppingBag size={15} /> Buy Now
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleRestart}
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Camera size={16} /> Retake Photos
                    </button>
                    <button
                      onClick={() => navigate('/tryon', { state: { product: selectedClothing } })}
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <RotateCcw size={16} /> Upload Instead
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══════ RIGHT PANEL: Try-On Preview ══════ */}
          <motion.div
            className="tryon-right-panel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              position: 'sticky',
              top: 'calc(var(--nav-height) + 20px)',
              width: '100%',
            }}
          >
            {phase === 'result' && viewer3DImages ? (
              <div style={{
                borderRadius: 24,
                overflow: 'hidden',
                width: '100%',
                aspectRatio: '3/4',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                background: '#07071a',
              }}>
                <TryOn3DViewer
                  images={viewer3DImages}
                  isLoading={viewer3DLoading}
                  statusMsg={viewer3DStatus}
                  clothingName={selectedClothing?.name}
                />
              </div>
            ) : (
              <TryOnPreviewPanel
                phase={phase}
                capturePreviewUrls={capturePreviewUrls}
                selectedClothing={selectedClothing}
                progress={progress}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Buy Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && selectedClothing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
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
                borderRadius: 24, padding: 32, maxWidth: 420, width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Add to Cart</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <img src={selectedClothing.images[0]} alt="" style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 12 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{selectedClothing.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{selectedClothing.category}</p>
                  <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 22 }}>₹{selectedClothing.price.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalOpen(false)}>
                  Add to Cart
                </button>
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .capture-flash {
          position: absolute;
          inset: 0;
          background: white;
          z-index: 20;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .live-tryon-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
