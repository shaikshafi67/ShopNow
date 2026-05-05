/**
 * TryOn3DPage.jsx  —  Phase 4 & 5: Full 3D Virtual Try-On Experience
 *
 * Flow:
 *   Step 1 "setup"    → choose garment + upload photo (or skip)
 *   Step 2 "analysis" → MediaPipe analyses body → measurements displayed
 *   Step 3 "tryon"    → interactive 3D scene + fit controls + buy
 *
 * Depends on:
 *   bodyAnalysis.js  —  analyzeBodyFromImage, defaultMeasurements, calcFitScore
 *   Avatar3D.jsx     —  Avatar3DScene
 */

import { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, ShoppingBag, X, RotateCcw,
  ChevronLeft, ChevronRight, Ruler, User,
  Zap, CheckCircle, ArrowRight, RefreshCw, Info,
  Maximize2, Sun,
} from 'lucide-react';
import { menProducts, womenProducts } from '../data/products';
import { Avatar3DScene } from '../components/Avatar3D';
import { analyzeBodyFromImage, defaultMeasurements, calcFitScore } from '../utils/bodyAnalysis';

// ─── Product pool ─────────────────────────────────────────────────────────────
const ALL = [
  ...menProducts.tshirts,
  ...menProducts.shirts,
  ...menProducts.jeans,
  ...womenProducts.tops,
  ...womenProducts.dresses,
  ...womenProducts.kurtis,
  ...womenProducts.coords,
].filter(p => p.tryOnReady !== false); // respect the tryOnReady flag

// ─── Skin tone options ────────────────────────────────────────────────────────
const SKIN_TONES = [
  { label: 'Fair',    hex: '#f5d5c0' },
  { label: 'Light',   hex: '#e8c0a0' },
  { label: 'Medium',  hex: '#c8956c' },
  { label: 'Tan',     hex: '#a0724a' },
  { label: 'Dark',    hex: '#6b4226' },
  { label: 'Deep',    hex: '#3d1f0d' },
];

const FIT_OPTIONS = [
  { id: 'tight',     label: 'Tight',       color: '#ff6b35' },
  { id: 'perfect',   label: 'Perfect',     color: '#00c864' },
  { id: 'loose',     label: 'Loose',       color: '#7ec8e3' },
  { id: 'very-loose',label: 'Very Loose',  color: '#b0b0d0' },
];

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function MeasureCard({ label, value, unit }) {
  return (
    <div style={{ background: 'rgba(124,106,255,0.07)', border: '1px solid rgba(124,106,255,0.14)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>{unit}</span></p>
    </div>
  );
}

function StepBadge({ n, label, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${done ? '#00c864' : active ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`, background: done ? '#00c864' : active ? 'rgba(124,106,255,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: done ? '#fff' : active ? 'var(--accent)' : 'rgba(255,255,255,0.25)', transition: 'all 0.3s', flexShrink: 0 }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function TryOn3DPage() {
  const location     = useLocation();
  const initProduct  = location.state?.product;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep]               = useState('setup');      // setup | analyzing | tryon
  const [product, setProduct]         = useState(initProduct || ALL[0]);
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoUrl, setPhotoUrl]       = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analyzeErr, setAnalyzeErr]   = useState(null);
  const [analyzeMsg, setAnalyzeMsg]   = useState('');
  const [fitType, setFitType]         = useState('perfect');
  const [skinColor, setSkinColor]     = useState('#c8956c');
  const [selectedSize, setSelectedSize] = useState(null);
  const [autoRotate, setAutoRotate]   = useState(false);
  const [garmentPage, setGarmentPage] = useState(0);
  const PER = 5;

  const fileRef = useRef(null);
  const pages   = Math.ceil(ALL.length / PER);
  const visible = ALL.slice(garmentPage * PER, (garmentPage + 1) * PER);

  // ── Photo select ────────────────────────────────────────────────────────────
  const selectPhoto = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setAnalyzeErr(null);
  }, []);

  // ── Analyse & build avatar ──────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!photoUrl) return;
    setStep('analyzing');
    setAnalyzing(true);
    setAnalyzeErr(null);

    const msgs = [
      'Loading TensorFlow.js & BodyPix model (~3 MB, once)…',
      'Running PoseNet body keypoint detection…',
      'Calculating shoulder & hip measurements…',
      'Estimating arm & leg proportions…',
      'Classifying body type & size…',
      'Building your 3D avatar…',
    ];
    let mi = 0;
    setAnalyzeMsg(msgs[mi]);
    const ticker = setInterval(() => {
      mi = Math.min(mi + 1, msgs.length - 1);
      setAnalyzeMsg(msgs[mi]);
    }, 1400);

    try {
      const { measurements: m } = await analyzeBodyFromImage(photoUrl);
      clearInterval(ticker);
      setMeasurements(m);
      setSelectedSize(m.recommendedSize);
      setAnalyzing(false);
      setStep('tryon');
    } catch (err) {
      clearInterval(ticker);
      setAnalyzeErr(err.message);
      setAnalyzing(false);
      setStep('setup');
    }
  }, [photoUrl]);

  // ── Skip analysis (use defaults) ────────────────────────────────────────────
  const skipAnalysis = useCallback(() => {
    const m = defaultMeasurements();
    setMeasurements(m);
    setSelectedSize(m.recommendedSize);
    setStep('tryon');
  }, []);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep('setup');
    setPhotoFile(null);
    setPhotoUrl(null);
    setMeasurements(null);
    setAnalyzeErr(null);
    setFitType('perfect');
    setAutoRotate(false);
  }, []);

  // ── Fit data ─────────────────────────────────────────────────────────────────
  const fitData   = measurements ? calcFitScore(measurements, product?.sizes, selectedSize) : null;
  const fitConfig = FIT_OPTIONS.find(f => f.id === fitType) || FIT_OPTIONS[1];

  const stepDone   = n => [true, step === 'analyzing' || step === 'tryon', step === 'tryon'][n - 1];
  const stepActive = n => [step === 'setup', step === 'analyzing', step === 'tryon'][n - 1];

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#07070e', color: '#fff', paddingTop: 'var(--nav-height)', fontFamily: 'var(--font-body)' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 0', background: 'linear-gradient(135deg, rgba(124,106,255,0.06), rgba(255,106,154,0.03))' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>
              AI · MediaPipe · Three.js
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,3.5vw,32px)', fontWeight: 900, letterSpacing: '-0.8px', margin: 0, background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              3D Virtual Try-On
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StepBadge n={1} label="Select & Upload" done={stepDone(1)} active={stepActive(1)} />
            <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <StepBadge n={2} label="Body Analysis"   done={stepDone(2)} active={stepActive(2)} />
            <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <StepBadge n={3} label="3D Try-On"       done={stepDone(3)} active={stepActive(3)} />
          </div>
        </div>
      </div>

      {/* ══════════════════════ STEP 1: SETUP ════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="container" style={{ padding: '32px 24px 80px' }}>

              {/* Garment picker */}
              <div style={{ marginBottom: 34 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                    Select Garment — {ALL.length} ready
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[{ d: -1, disabled: garmentPage === 0 }, { d: 1, disabled: garmentPage === pages - 1 }].map(({ d, disabled }, i) => (
                      <button key={i} onClick={() => setGarmentPage(p => p + d)} disabled={disabled}
                        style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d < 0 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }} className="garment-strip-3d">
                  {visible.map(item => {
                    const sel = product?.id === item.id;
                    return (
                      <motion.div key={item.id} whileHover={{ y: -4 }} onClick={() => setProduct(item)}
                        style={{ cursor: 'pointer', aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden', border: `2px solid ${sel ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`, background: '#111', position: 'relative', transition: 'border-color 0.2s' }}>
                        <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                        {sel && (
                          <div style={{ position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={10} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 5px 5px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Main 2-panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }} className="tryon3d-grid">

                {/* LEFT — Selected garment detail */}
                <div>
                  <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14 }}>Selected Item</p>
                  {product ? (
                    <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', background: '#111', marginBottom: 14, position: 'relative' }}>
                        <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {product.images[1] && (
                          <img src={product.images[1]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.3s' }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0} />
                        )}
                        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, letterSpacing: '2px', background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                          Hover for back view
                        </div>
                      </div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{product.name}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>{product.category}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ fontSize: 22, fontWeight: 800 }}>₹{product.price?.toLocaleString()}</p>
                        <Link to={`/product/${product.id}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: 20 }}>
                          View product
                        </Link>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(product.sizes || ['XS', 'S', 'M', 'L', 'XL']).map(s => (
                          <span key={s} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ aspectRatio: '3/4', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Select a garment above</p>
                    </div>
                  )}
                </div>

                {/* RIGHT — Photo upload */}
                <div>
                  <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14 }}>Your Photo</p>

                  {photoUrl ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
                        <img src={photoUrl} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,200,100,0.06)', border: '2px solid rgba(0,200,100,0.3)', borderRadius: 16 }} />
                        <button onClick={() => { setPhotoUrl(null); setPhotoFile(null); }} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                          <X size={13} />
                        </button>
                        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,200,100,0.15)', border: '1px solid rgba(0,200,100,0.3)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                          <CheckCircle size={11} color="#00c864" />
                          <span style={{ fontSize: 10, color: '#00c864', fontWeight: 700 }}>Photo ready</span>
                        </div>
                      </div>
                      {analyzeErr && (
                        <div style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, color: '#ff8080' }}>{analyzeErr}</p>
                        </div>
                      )}
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={runAnalysis}
                        style={{ width: '100%', padding: '15px', background: 'var(--gradient-1)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 8, boxShadow: '0 6px 24px var(--accent-glow)' }}>
                        <Ruler size={16} /> Analyse Body & Build Avatar
                      </motion.button>
                      <button onClick={skipAnalysis} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <ArrowRight size={13} /> Skip — use default proportions
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div onClick={() => fileRef.current?.click()}
                        onDrop={e => { e.preventDefault(); selectPhoto(e.dataTransfer.files[0]); }}
                        onDragOver={e => e.preventDefault()}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,255,0.5)'; e.currentTarget.style.background = '#0e0e1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = '#0b0b14'; }}
                        style={{ aspectRatio: '3/4', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)', background: '#0b0b14', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, transition: 'all 0.2s', marginBottom: 14 }}>
                        <div style={{ width: 66, height: 66, borderRadius: '50%', border: '1px solid rgba(124,106,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,106,255,0.06)' }}>
                          <User size={28} color="rgba(124,106,255,0.6)" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 5 }}>Upload your full-body photo</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.65 }}>
                            MediaPipe AI will detect 33 body<br />landmarks to build your personal avatar
                          </p>
                        </div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>JPG · PNG · WEBP</p>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => selectPhoto(e.target.files[0])} />

                      {/* Tips */}
                      <div style={{ background: 'rgba(124,106,255,0.05)', border: '1px solid rgba(124,106,255,0.12)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                        <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 9 }}>For accurate body analysis</p>
                        {[
                          'Stand facing the camera — full body visible',
                          'Feet shoulder-width apart, arms slightly out',
                          'Plain background, good overhead lighting',
                          'Wear fitted clothes (not baggy) for best results',
                        ].map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 3 ? 7 : 0 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(124,106,255,0.5)', marginTop: 6, flexShrink: 0 }} />
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>{t}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={skipAnalysis} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Sparkles size={12} /> Skip — try with default avatar
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ STEP 2: ANALYZING ═══════════════════════════ */}
        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '40px 24px' }}>
              {/* Landmark visualisation mockup */}
              <div style={{ position: 'relative', width: 200, height: 300 }}>
                <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, opacity: 0.55 }} />
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 150">
                  {/* Skeleton lines */}
                  {[[[50,15],[50,25]],[[50,25],[35,35]],[[50,25],[65,35]],[[35,35],[32,50]],[[65,35],[68,50]],[[50,55],[42,80]],[[50,55],[58,80]],[[42,80],[40,110]],[[58,80],[60,110]]].map(([[x1,y1],[x2,y2]], i) => (
                    <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(124,106,255,0.7)" strokeWidth="1.5" strokeLinecap="round"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }} />
                  ))}
                  {/* Landmark dots */}
                  {[[50,12],[50,25],[35,35],[65,35],[32,50],[68,50],[42,80],[58,80],[40,110],[60,110],[50,55]].map(([cx,cy], i) => (
                    <motion.circle key={i} cx={cx} cy={cy} r="2.5" fill="#7c6aff"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12, type: 'spring' }} />
                  ))}
                </svg>
              </div>

              <div style={{ textAlign: 'center', maxWidth: 340 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(124,106,255,0.15)', borderTopColor: 'var(--accent)' }} />
                </motion.div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                  Analysing Your Body
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 20 }}>
                  {analyzeMsg || 'Processing…'}
                </p>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {['Pose', 'Measure', 'Scale', 'Build'].map((s, i) => (
                    <motion.div key={s} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 20, padding: '4px 10px', fontWeight: 600 }}>
                      {s}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 33 Landmarks explainer */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 20px', maxWidth: 400, width: '100%' }}>
                <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 8 }}>What we detect</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {['Shoulder width', 'Hip width', 'Torso length', 'Arm length', 'Leg length', 'Body type'].map(m => (
                    <div key={m} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ STEP 3: TRY-ON ══════════════════════════════ */}
        {step === 'tryon' && measurements && (
          <motion.div key="tryon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 'calc(100vh - var(--nav-height) - 60px)', alignItems: 'stretch' }} className="tryon3d-viewer-grid">

              {/* ── 3D CANVAS ── */}
              <div style={{ position: 'relative', background: '#08080f', minHeight: 520 }}>
                <Avatar3DScene
                  product={product}
                  measurements={measurements}
                  fitType={fitType}
                  skinColor={skinColor}
                  fitColor={fitConfig.color}
                  showGrid={true}
                  autoRotate={autoRotate}
                />

                {/* Overlay hints */}
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, letterSpacing: '1.5px', background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.55)', padding: '5px 11px', borderRadius: 20, backdropFilter: 'blur(6px)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c864', boxShadow: '0 0 5px #00c864' }} />
                    LIVE 3D PREVIEW
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.28)', background: 'rgba(0,0,0,0.45)', padding: '5px 14px', borderRadius: 20, backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}>
                  Drag to rotate · Scroll to zoom
                </div>

                {/* Auto-rotate toggle */}
                <button onClick={() => setAutoRotate(r => !r)}
                  style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', background: autoRotate ? 'var(--accent)' : 'rgba(0,0,0,0.55)', border: `1px solid ${autoRotate ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* ── RIGHT CONTROL PANEL ── */}
              <div style={{ background: '#0d0d18', borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '24px 18px' }}>

                {/* Product summary */}
                {product && (
                  <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px' }}>
                    <img src={product.images[0]} alt="" style={{ width: 44, height: 54, objectFit: 'cover', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>₹{product.price?.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* ─── Body Measurements ─── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>Your Measurements</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    <MeasureCard label="Shoulder"  value={measurements.estShoulderCm} unit="cm" />
                    <MeasureCard label="Hip"       value={measurements.estHipCm}      unit="cm" />
                    <MeasureCard label="Waist"     value={measurements.estWaistCm}    unit="cm" />
                    <MeasureCard label="Chest"     value={measurements.estChestCm}    unit="cm" />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 7 }}>
                    <div style={{ flex: 1, background: 'rgba(124,106,255,0.07)', border: '1px solid rgba(124,106,255,0.14)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>Body Type</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{measurements.bodyType}</p>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,200,100,0.07)', border: '1px solid rgba(0,200,100,0.18)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>Rec. Size</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#00c864' }}>{measurements.recommendedSize}</p>
                    </div>
                  </div>
                </div>

                {/* ─── Size selector ─── */}
                {product?.sizes?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Size</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {product.sizes.map(s => {
                        const isRec = s === measurements.recommendedSize;
                        const isSel = s === selectedSize;
                        return (
                          <button key={s} onClick={() => setSelectedSize(s)}
                            style={{ padding: '7px 13px', borderRadius: 8, border: `1.5px solid ${isSel ? 'var(--accent)' : isRec ? 'rgba(0,200,100,0.4)' : 'rgba(255,255,255,0.10)'}`, background: isSel ? 'rgba(124,106,255,0.2)' : 'transparent', color: isSel ? 'var(--accent)' : isRec ? '#00c864' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: isSel || isRec ? 700 : 400, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                            {s}
                            {isRec && !isSel && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── Fit score ─── */}
                {fitData && selectedSize && (
                  <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${fitData.color}33`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Fit Analysis</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: fitData.color }}>{fitData.label}</p>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${fitData.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: fitData.color, borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>{fitData.score}% match</p>
                  </div>
                )}

                {/* ─── Fit type ─── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>3D Fit Preview</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {FIT_OPTIONS.map(f => (
                      <button key={f.id} onClick={() => setFitType(f.id)}
                        style={{ padding: '9px 8px', borderRadius: 8, border: `1.5px solid ${fitType === f.id ? f.color : 'rgba(255,255,255,0.08)'}`, background: fitType === f.id ? `${f.color}18` : 'transparent', color: fitType === f.id ? f.color : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: fitType === f.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Skin tone ─── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Avatar Skin Tone</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {SKIN_TONES.map(s => (
                      <button key={s.hex} onClick={() => setSkinColor(s.hex)} title={s.label}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: s.hex, border: `2.5px solid ${skinColor === s.hex ? '#fff' : 'transparent'}`, cursor: 'pointer', boxShadow: skinColor === s.hex ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </div>

                {/* ─── Garment switcher ─── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Switch Garment</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {ALL.slice(0, 8).map(item => (
                      <motion.div key={item.id} whileHover={{ y: -2 }} onClick={() => setProduct(item)}
                        style={{ aspectRatio: '2/3', borderRadius: 7, overflow: 'hidden', border: `1.5px solid ${product?.id === item.id ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', background: '#111', transition: 'border-color 0.2s' }}>
                        <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ─── CTA ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to={`/product/${product?.id}`} style={{ padding: '14px', background: 'var(--gradient-1)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxShadow: '0 6px 24px var(--accent-glow)' }}>
                    <ShoppingBag size={15} /> Buy Now — ₹{product?.price?.toLocaleString()}
                  </Link>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={reset} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <RotateCcw size={12} /> Reset
                    </button>
                    <Link to="/tryon" style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none' }}>
                      <Zap size={12} /> AI Try-On
                    </Link>
                  </div>
                </div>

                {/* Small disclaimer */}
                <div style={{ marginTop: 16, display: 'flex', gap: 6, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  <Info size={11} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', lineHeight: 1.55 }}>
                    Measurements are AI estimates from a single photo. For precise sizing, use the size chart on the product page.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) {
          .tryon3d-viewer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .tryon3d-grid        { grid-template-columns: 1fr !important; }
          .garment-strip-3d   { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 480px) {
          .garment-strip-3d   { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
