import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, ShoppingBag, X, RotateCcw,
  ChevronLeft, ChevronRight, CheckCircle, Info,
} from 'lucide-react';
import { menProducts, womenProducts } from '../data/products';

const ALL_GARMENTS = [
  ...menProducts.tshirts,
  ...menProducts.shirts,
  ...womenProducts.tops,
  ...womenProducts.dresses,
].slice(0, 24);

const TIPS = [
  'Stand facing the camera — full body visible',
  'Good lighting with a plain or light background',
  'Wear fitted clothing for the most accurate fit',
];

/* ── Comparison slider ─────────────────────────────────────── */
function CompareSlider({ before, after }) {
  const [pos, setPos] = useState(48);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const update = (clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', cursor: 'ew-resize', userSelect: 'none' }}
      onMouseDown={() => { dragging.current = true; }}
      onMouseMove={(e) => { if (dragging.current) update(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={() => { dragging.current = true; }}
      onTouchMove={(e) => { if (dragging.current) update(e.touches[0].clientX); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      {/* After — full width base */}
      <img src={after} alt="AI Result" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
      {/* Before — clipped left side */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)`, pointerEvents: 'none' }}>
        <img src={before} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* Divider line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, transform: 'translateX(-50%)', width: 2, background: 'white', pointerEvents: 'none', boxShadow: '0 0 8px rgba(0,0,0,0.6)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 34, height: 34, borderRadius: '50%', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#111', fontWeight: 700 }}>
          ⇔
        </div>
      </div>
      {/* Labels */}
      <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 9, letterSpacing: '2.5px', background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)', textTransform: 'uppercase', pointerEvents: 'none' }}>Before</div>
      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, letterSpacing: '2.5px', background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)', textTransform: 'uppercase', pointerEvents: 'none' }}>After</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function ZaraTryOnPage() {
  const location    = useLocation();
  const initProduct = location.state?.product;

  const [garment,    setGarment]    = useState(initProduct || ALL_GARMENTS[0]);
  const [personFile, setPersonFile] = useState(null);
  const [personUrl,  setPersonUrl]  = useState(null);
  const [resultUrl,  setResultUrl]  = useState(null);
  const [status,     setStatus]     = useState('idle'); // idle|processing|done|error|nokey
  const [statusMsg,  setStatusMsg]  = useState('');
  const [engine,     setEngine]     = useState(''); // which AI engine is running
  const [page,       setPage]       = useState(0);

  const fileRef = useRef(null);
  const PER_PAGE = 6;
  const totalPages = Math.ceil(ALL_GARMENTS.length / PER_PAGE);
  const visible = ALL_GARMENTS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const selectFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPersonFile(file);
    setPersonUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setStatus('idle');
  };

  const handleTryOn = async () => {
    if (!personFile || !garment) return;
    setStatus('processing');
    setStatusMsg('Connecting to AI…');
    setResultUrl(null);
    setEngine('');

    const opts = { personFile, garmentUrl: garment.images[0], product: garment };

    // ── Engine 1: Fashn.ai ────────────────────────────────────────────────
    const FASHN_KEY     = import.meta.env.VITE_FASHN_API_KEY;
    // ── Engine 2: Replicate ───────────────────────────────────────────────
    const REPLICATE_KEY = import.meta.env.VITE_REPLICATE_TOKEN;
    // ── Engine 3: HuggingFace IDM-VTON ───────────────────────────────────
    const HF_KEY        = import.meta.env.VITE_HF_TOKEN;

    const tryEngine = async (name, fn) => {
      setEngine(name);
      setStatusMsg(`Connecting to ${name}…`);
      return fn();
    };

    try {
      let url;

      if (FASHN_KEY) {
        const { runFashnTryOn } = await import('../utils/tryon_fashn.js');
        url = await tryEngine('Fashn.ai', () =>
          runFashnTryOn({ ...opts, onStatus: setStatusMsg })
        );
      } else if (REPLICATE_KEY) {
        const { runReplicateTryOn } = await import('../utils/tryon_replicate.js');
        url = await tryEngine('Replicate', () =>
          runReplicateTryOn({ ...opts, onStatus: setStatusMsg })
        );
      } else if (HF_KEY) {
        const { runVirtualTryOn } = await import('../utils/tryon_hf.js');
        url = await tryEngine('HuggingFace IDM-VTON', () =>
          runVirtualTryOn({ ...opts, onStatus: setStatusMsg })
        );
      } else {
        throw new Error('NO_KEY');
      }

      setResultUrl(url);
      setStatus('done');
    } catch (err) {
      if (err.message === 'NO_KEY') {
        setStatus('nokey');
      } else {
        setStatus('error');
        setStatusMsg(err.message || 'AI try-on failed. Please try again.');
      }
    }
  };

  const reset = () => {
    setPersonFile(null);
    setPersonUrl(null);
    setResultUrl(null);
    setStatus('idle');
    setStatusMsg('');
  };

  const stepDone  = (i) => [!!garment, !!personUrl, !!resultUrl][i];
  const stepActive = (i) => [!personUrl, personUrl && !resultUrl && status !== 'processing', status === 'processing' || status === 'done'][i];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', paddingTop: 'var(--nav-height)', fontFamily: 'var(--font-body)' }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '22px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '4px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>AI-Powered · IDM-VTON</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,4vw,38px)', fontWeight: 900, letterSpacing: '-1px', margin: 0, background: 'linear-gradient(90deg,#fff 60%,rgba(255,255,255,0.45))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Virtual Try-On
            </h1>
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Select', 'Upload', 'Result'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${stepDone(i) ? '#00c864' : stepActive(i) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)'}`, background: stepDone(i) ? '#00c864' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: stepDone(i) ? '#fff' : stepActive(i) ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}>
                  {stepDone(i) ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: stepActive(i) ? 700 : 400, color: stepActive(i) ? '#fff' : 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>{label}</span>
                {i < 2 && <div style={{ width: 18, height: 1, background: 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px 80px' }}>

        {/* ── GARMENT STRIP ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Choose Garment</p>
            <div style={{ display: 'flex', gap: 5 }}>
              {[{ dir: -1, Icon: ChevronLeft, dis: page === 0 }, { dir: 1, Icon: ChevronRight, dis: page === totalPages - 1 }].map(({ dir, Icon, dis }) => (
                <button key={dir} onClick={() => setPage(p => p + dir)} disabled={dis}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: dis ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)', cursor: dis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }} className="garment-strip">
            {visible.map(item => {
              const sel = garment?.id === item.id;
              return (
                <motion.div key={item.id} whileHover={{ y: -4 }} onClick={() => { setGarment(item); if (resultUrl) setResultUrl(null); }}
                  style={{ cursor: 'pointer', aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', border: `2px solid ${sel ? '#fff' : 'rgba(255,255,255,0.05)'}`, transition: 'border-color 0.2s', position: 'relative', background: '#111' }}>
                  <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  {sel && (
                    <div style={{ position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={11} color="#111" strokeWidth={3} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN 2-PANEL ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }} className="tryon-grid">

          {/* LEFT — Garment detail */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 16 }}>Selected Item</p>
            {garment ? (
              <motion.div key={garment.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', background: '#111', marginBottom: 16, position: 'relative' }}>
                  <img src={garment.images[0]} alt={garment.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {garment.images?.[1] && (
                    <img src={garment.images[1]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.35s' }}
                      onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0} />
                  )}
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, letterSpacing: '2px', background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)', textTransform: 'uppercase' }}>
                    Hover to see back
                  </div>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 3, letterSpacing: '-0.3px', color: '#fff' }}>{garment.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>{garment.category || 'Clothing'}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>₹{garment.price?.toLocaleString()}</p>
                  <Link to={`/product/${garment.id}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(255,255,255,0.12)', padding: '6px 13px', borderRadius: 20, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                    <ShoppingBag size={12} /> View product
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div style={{ aspectRatio: '3/4', borderRadius: 16, background: '#0e0e0e', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Select a garment above</p>
              </div>
            )}
          </div>

          {/* RIGHT — Upload / Processing / Result */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 16 }}>Your Photo</p>

            <AnimatePresence mode="wait">

              {/* RESULT — comparison slider */}
              {status === 'done' && resultUrl && (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <CompareSlider before={personUrl} after={resultUrl} />
                  <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, marginBottom: 14, letterSpacing: '0.5px' }}>Drag divider to compare before & after</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/product/${garment?.id}`} style={{ flex: 2, padding: '14px', background: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 800, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', letterSpacing: '-0.2px' }}>
                      <ShoppingBag size={14} /> Buy Now — ₹{garment?.price?.toLocaleString()}
                    </Link>
                    <button onClick={reset} style={{ flex: 1, padding: '14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <RotateCcw size={13} /> Retry
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PROCESSING */}
              {status === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ aspectRatio: '3/4', borderRadius: 16, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 36, marginBottom: 12 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={42} color="rgba(255,255,255,0.85)" />
                    </motion.div>
                    <div style={{ textAlign: 'center' }}>
                      {engine && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 20, padding: '3px 12px', marginBottom: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c6aff', boxShadow: '0 0 5px #7c6aff' }} />
                          <span style={{ fontSize: 10, color: '#a89aff', fontWeight: 700, letterSpacing: '0.5px' }}>{engine}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 7, color: '#fff' }}>AI is dressing you…</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>{statusMsg || 'Processing…'}</p>
                    </div>
                    {/* Shimmer bar */}
                    <div style={{ width: '80%', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                      <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                        style={{ height: '100%', width: '45%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px' }}>This may take 30 – 60 seconds</p>
                  </div>
                </motion.div>
              )}

              {/* NO KEY — setup guide */}
              {status === 'nokey' && (
                <motion.div key="nokey" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ borderRadius: 16, background: '#0d0d0d', border: '1px solid rgba(255,165,0,0.25)', padding: 24, marginBottom: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
                      ⚡ Connect an AI Engine
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 18, textAlign: 'center' }}>
                      Add one of these keys to your <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>app/.env</code> file
                    </p>
                    {[
                      {
                        name: 'Fashn.ai',
                        badge: 'Best quality',
                        badgeColor: '#00c864',
                        key: 'VITE_FASHN_API_KEY=fa-xxxxx',
                        note: 'Needs credits (~$5 min). Create key at app.fashn.ai/api',
                        url: 'https://app.fashn.ai/api',
                      },
                      {
                        name: 'Replicate',
                        badge: 'Free $5 credit',
                        badgeColor: '#7c6aff',
                        key: 'VITE_REPLICATE_TOKEN=r8_xxxxx',
                        note: 'Free on signup. Get token at replicate.com/account/api-tokens',
                        url: 'https://replicate.com/account/api-tokens',
                      },
                      {
                        name: 'HuggingFace',
                        badge: 'Free (limited)',
                        badgeColor: '#f5a623',
                        key: 'VITE_HF_TOKEN=hf_xxxxx',
                        note: 'Free tier with daily quota. Get token at huggingface.co/settings/tokens',
                        url: 'https://huggingface.co/settings/tokens',
                      },
                    ].map(({ name, badge, badgeColor, key, note, url }) => (
                      <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{name}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}40`, padding: '2px 7px', borderRadius: 20, letterSpacing: '0.5px' }}>{badge}</span>
                        </div>
                        <code style={{ display: 'block', fontSize: 10, color: '#7c6aff', background: 'rgba(124,106,255,0.08)', padding: '6px 10px', borderRadius: 6, marginBottom: 6, letterSpacing: '0.3px' }}>{key}</code>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{note}</p>
                      </div>
                    ))}
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                      After adding the key, save the file and restart Vite&nbsp;(<code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>npm run dev</code>)
                    </p>
                  </div>
                  <button onClick={() => setStatus('idle')} style={{ width: '100%', padding: '13px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
                    ← Back
                  </button>
                </motion.div>
              )}

              {/* ERROR */}
              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ aspectRatio: '3/4', borderRadius: 16, background: '#0d0d0d', border: '1px solid rgba(255,70,70,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, marginBottom: 12, textAlign: 'center' }}>
                    <X size={36} color="rgba(255,70,70,0.8)" />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                        {engine ? `${engine} Failed` : 'AI Try-On Failed'}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{statusMsg}</p>
                    </div>
                  </div>
                  <button onClick={() => setStatus('idle')} style={{ width: '100%', padding: '14px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Try Again
                  </button>
                </motion.div>
              )}

              {/* PHOTO UPLOADED — ready to try on */}
              {status === 'idle' && personUrl && (
                <motion.div key="ready" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
                    <img src={personUrl} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button onClick={reset} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
                      <X size={13} />
                    </button>
                  </div>
                  <motion.button
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={handleTryOn}
                    disabled={!garment}
                    style={{ width: '100%', padding: '16px', background: garment ? '#fff' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, color: garment ? '#111' : 'rgba(255,255,255,0.3)', cursor: garment ? 'pointer' : 'not-allowed', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
                    <Sparkles size={16} /> Try On Now
                  </motion.button>
                  {!garment && <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Select a garment above first</p>}
                </motion.div>
              )}

              {/* UPLOAD ZONE */}
              {status === 'idle' && !personUrl && (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }}
                    onDragOver={(e) => e.preventDefault()}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = '#111'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#0c0c0c'; }}
                    style={{ aspectRatio: '3/4', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', background: '#0c0c0c', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 36, transition: 'all 0.2s', marginBottom: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={26} color="rgba(255,255,255,0.4)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Upload your photo</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.65 }}>Full body, front-facing<br />Plain background works best</p>
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>JPG · PNG · WEBP</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => selectFile(e.target.files[0])} />

                  {/* Tips card */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px' }}>
                    <p style={{ fontSize: 9, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 10 }}>Tips for best results</p>
                    {TIPS.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: i < TIPS.length - 1 ? 8 : 0 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', marginTop: 6, flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.55 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* ── BOTTOM LINK to 360° Studio ── */}
        <div style={{ marginTop: 56, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Want to explore all angles?</p>
          <Link to="/tryon/live" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 20, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
            Open 360° Studio →
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .tryon-grid { grid-template-columns: 1fr !important; }
          .garment-strip { grid-template-columns: repeat(4,1fr) !important; }
        }
        @media (max-width: 480px) {
          .garment-strip { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
