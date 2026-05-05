import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles, ArrowRight, ChevronRight, Zap, Shield,
  RotateCcw, Star, Truck, Flame, Gift,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import AnnouncementBar from '../components/AnnouncementBar';
import { useCatalog } from '../context/CatalogContext';
import { useBanners } from '../context/BannersContext';
import { useCollections } from '../context/CollectionsContext';
import { usePromo } from '../context/PromoContext';

/* ─── Features ─── */
const FEATURES = [
  { icon: Sparkles, label: '3D Try-On',      desc: 'See any outfit on you before buying.',    color: '#7c6aff' },
  { icon: Zap,      label: 'AI Sizing',       desc: 'Perfect fit recommended every time.',     color: '#3b82f6' },
  { icon: Shield,   label: 'Premium Quality', desc: 'Every item quality-checked by stylists.', color: '#10b981' },
  { icon: RotateCcw,label: 'Easy Returns',    desc: 'Free 30-day returns, zero hassle.',       color: '#ff6a9a' },
  { icon: Truck,    label: 'Fast Delivery',   desc: 'Ships in 24hrs, tracked to your door.',   color: '#f59e0b' },
  { icon: Star,     label: '4.9★ Rated',      desc: 'Loved by 2M+ customers.',                color: '#ef4444' },
];

/* ══════════════════════════════════════════════════
   PANEL IMAGE — shows real photo or premium placeholder
══════════════════════════════════════════════════ */
function PanelImage({ image, side }) {
  const isMen = side === 'men';
  const accent = isMen ? '#7c6aff' : '#ff6a9a';
  const accent2 = isMen ? '#3b82f6' : '#fb923c';

  if (image) {
    const isVideoUrl = image.startsWith('data:video/');
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {isVideoUrl ? (
          <video src={image} autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
        ) : (
          <img src={image} alt={isMen ? "Men's fashion" : "Women's fashion"}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
        )}
        {/* Gradient overlay — sides fade into panel bg, bottom has text readability */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${isMen ? 'rgba(4,4,14,0.7)' : 'transparent'} 0%, transparent 30%, transparent 70%, ${isMen ? 'transparent' : 'rgba(16,4,8,0.7)'} 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.15) 40%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,8,0.7) 0%, transparent 25%)' }} />
      </div>
    );
  }

  // Premium placeholder when no image uploaded
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Shopping bag silhouette */}
      <div style={{ textAlign: 'center', opacity: 0.35 }}>
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <rect x="10" y="40" width="100" height="90" rx="10" stroke={accent} strokeWidth="3" fill={accent + '10'} />
          <path d="M35,40 L35,24 C35,10 85,10 85,24 L85,40" stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none"/>
          <line x1="25" y1="78" x2="95" y2="78" stroke={accent} strokeWidth="2" strokeDasharray="4,4"/>
          <rect x="42" y="88" width="36" height="22" rx="4" stroke={accent} strokeWidth="2" fill={accent + '15'}/>
        </svg>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginTop: 12 }}>
          Upload Photo
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>
          Admin → Banners & Hero
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SVG — MALE FIGURE WALKING WITH SHOPPING BAG
══════════════════════════════════════════════════ */
function MaleFigure() {
  return (
    <svg viewBox="0 0 260 520" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 24px rgba(124,106,255,0.5))' }}>
      <defs>
        <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c6aff" stopOpacity="1"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85"/>
        </linearGradient>
        <linearGradient id="mg2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7"/>
        </linearGradient>
      </defs>

      {/* Head */}
      <ellipse cx="148" cy="44" rx="30" ry="34" stroke="url(#mg)" strokeWidth="3.5" fill="rgba(124,106,255,0.08)"/>
      {/* Hair top */}
      <path d="M120,26 C122,14 134,10 148,12 C162,10 174,14 176,26" stroke="url(#mg)" strokeWidth="5" strokeLinecap="round"/>
      {/* Ear left */}
      <path d="M118,44 C113,42 111,50 116,52" stroke="url(#mg)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Neck */}
      <path d="M140,76 L140,92" stroke="url(#mg)" strokeWidth="8" strokeLinecap="round"/>
      <path d="M156,76 L156,92" stroke="url(#mg)" strokeWidth="8" strokeLinecap="round"/>

      {/* Shirt collar */}
      <path d="M132,92 L148,108 L164,92" stroke="url(#mg)" strokeWidth="2.5" strokeLinejoin="round"/>

      {/* Jacket / torso */}
      <path d="M88,100 L108,88 L148,96 L188,88 L208,100 L214,210 L82,210 Z" stroke="url(#mg)" strokeWidth="3" strokeLinejoin="round" fill="rgba(124,106,255,0.06)"/>
      {/* Jacket pocket */}
      <rect x="100" y="148" width="22" height="14" rx="3" stroke="url(#mg)" strokeWidth="2" fill="rgba(124,106,255,0.05)"/>
      {/* Jacket button */}
      <circle cx="148" cy="155" r="4" stroke="url(#mg)" strokeWidth="2.5" fill="rgba(124,106,255,0.1)"/>
      <circle cx="148" cy="175" r="4" stroke="url(#mg)" strokeWidth="2.5" fill="rgba(124,106,255,0.1)"/>

      {/* LEFT ARM — extended forward holding bag */}
      <path d="M88,108 C72,132 56,162 42,196" stroke="url(#mg)" strokeWidth="14" strokeLinecap="round"/>
      {/* Left hand */}
      <circle cx="40" cy="200" r="8" stroke="url(#mg)" strokeWidth="3" fill="rgba(124,106,255,0.1)"/>

      {/* SHOPPING BAG */}
      {/* Bag body */}
      <rect x="2" y="210" width="60" height="74" rx="7" stroke="url(#mg)" strokeWidth="3" fill="rgba(124,106,255,0.07)"/>
      {/* Bag handle left */}
      <path d="M16,210 L16,192 C16,178 50,178 50,192 L50,210" stroke="url(#mg)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* Bag logo line */}
      <line x1="16" y1="240" x2="48" y2="240" stroke="url(#mg)" strokeWidth="1.5" strokeDasharray="3,3"/>
      {/* Bag brand text area */}
      <rect x="12" y="248" width="38" height="10" rx="3" stroke="url(#mg)" strokeWidth="1.5" fill="rgba(124,106,255,0.1)"/>
      {/* Bag star */}
      <path d="M32,260 L34,266 L40,266 L36,270 L38,276 L32,272 L26,276 L28,270 L24,266 L30,266 Z" stroke="url(#mg)" strokeWidth="1.5" fill="rgba(124,106,255,0.15)"/>

      {/* RIGHT ARM — swinging back naturally */}
      <path d="M208,108 C222,134 232,162 236,194" stroke="url(#mg)" strokeWidth="14" strokeLinecap="round"/>
      {/* Right hand */}
      <circle cx="237" cy="198" r="8" stroke="url(#mg)" strokeWidth="3" fill="rgba(124,106,255,0.1)"/>

      {/* Watch on right wrist */}
      <rect x="229" y="190" width="16" height="10" rx="3" stroke="url(#mg)" strokeWidth="2" fill="rgba(124,106,255,0.15)"/>

      {/* TROUSERS */}
      {/* Belt */}
      <path d="M84,210 L212,210" stroke="url(#mg)" strokeWidth="5" strokeLinecap="round"/>
      <rect x="140" y="207" width="18" height="9" rx="2" stroke="url(#mg)" strokeWidth="2.5" fill="rgba(124,106,255,0.15)"/>

      {/* Left trouser — forward stride */}
      <path d="M110,216 C104,272 98,320 90,370" stroke="url(#mg)" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Left trouser crease */}
      <path d="M106,240 C102,268 98,295 94,320" stroke="url(#mg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,4"/>

      {/* Right trouser — back stride */}
      <path d="M170,216 C178,272 188,320 196,368" stroke="url(#mg)" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Right trouser crease */}
      <path d="M174,240 C180,268 186,295 190,320" stroke="url(#mg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,4"/>

      {/* LEFT SHOE */}
      <path d="M90,370 C78,378 60,382 50,376" stroke="url(#mg)" strokeWidth="11" strokeLinecap="round"/>
      <path d="M50,376 C44,380 44,390 52,392 L80,390" stroke="url(#mg)" strokeWidth="5" strokeLinecap="round"/>

      {/* RIGHT SHOE */}
      <path d="M196,368 C208,374 228,376 238,370" stroke="url(#mg)" strokeWidth="11" strokeLinecap="round"/>
      <path d="M238,370 C244,374 244,384 236,386 L208,384" stroke="url(#mg)" strokeWidth="5" strokeLinecap="round"/>

      {/* Shadow under figure */}
      <ellipse cx="148" cy="410" rx="70" ry="8" fill="rgba(124,106,255,0.06)"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   SVG — FEMALE FIGURE WALKING WITH SHOPPING BAGS
══════════════════════════════════════════════════ */
function FemaleFigure() {
  return (
    <svg viewBox="0 0 280 540" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 24px rgba(255,106,154,0.5))' }}>
      <defs>
        <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6a9a" stopOpacity="1"/>
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.85"/>
        </linearGradient>
        <linearGradient id="fg2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#fdba74" stopOpacity="0.7"/>
        </linearGradient>
        <linearGradient id="dressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6a9a" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.06"/>
        </linearGradient>
      </defs>

      {/* Head */}
      <ellipse cx="140" cy="42" rx="28" ry="33" stroke="url(#fg)" strokeWidth="3" fill="rgba(255,106,154,0.06)"/>

      {/* HAIR */}
      {/* Hair top / fringe */}
      <path d="M114,28 C116,12 128,6 140,8 C152,6 164,12 166,28" stroke="url(#fg)" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Left flowing hair */}
      <path d="M114,28 C106,44 104,66 108,86 C106,100 102,114 98,128" stroke="url(#fg)" strokeWidth="10" strokeLinecap="round"/>
      {/* Right flowing hair behind shoulder */}
      <path d="M166,28 C174,44 176,68 172,88" stroke="url(#fg)" strokeWidth="8" strokeLinecap="round"/>
      {/* Hair highlight */}
      <path d="M126,14 C130,10 138,8 144,12" stroke="rgba(255,200,200,0.5)" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Ear */}
      <path d="M112,42 C107,40 105,50 110,53" stroke="url(#fg)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Earring */}
      <circle cx="110" cy="56" r="4" stroke="url(#fg)" strokeWidth="2" fill="rgba(255,106,154,0.2)"/>

      {/* Neck */}
      <path d="M133,73 L133,90" stroke="url(#fg)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M147,73 L147,90" stroke="url(#fg)" strokeWidth="6" strokeLinecap="round"/>
      {/* Necklace */}
      <path d="M128,90 C134,100 146,100 152,90" stroke="url(#fg)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="140" cy="101" r="3" stroke="url(#fg)" strokeWidth="2" fill="rgba(255,106,154,0.2)"/>

      {/* TOP / BLOUSE */}
      <path d="M100,96 L118,84 L140,92 L162,84 L180,96 L184,168 C174,178 106,178 96,168 Z" stroke="url(#fg)" strokeWidth="3" strokeLinejoin="round" fill="rgba(255,106,154,0.07)"/>
      {/* V-neckline */}
      <path d="M118,84 L140,108 L162,84" stroke="url(#fg)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>

      {/* DRESS SKIRT — A-line flowing */}
      <path d="M96,168 C82,210 70,250 66,308 L214,308 C210,250 198,210 184,168 Z" stroke="url(#fg)" strokeWidth="3" strokeLinejoin="round" fill="url(#dressGrad)"/>
      {/* Dress waist belt */}
      <path d="M98,168 L182,168" stroke="url(#fg)" strokeWidth="5" strokeLinecap="round"/>
      <rect x="128" y="164" width="24" height="10" rx="3" stroke="url(#fg)" strokeWidth="2" fill="rgba(255,106,154,0.18)"/>
      {/* Dress flow lines */}
      <path d="M110,200 C106,238 98,272 90,304" stroke="url(#fg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,5"/>
      <path d="M140,196 C140,240 140,272 140,304" stroke="url(#fg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,5"/>
      <path d="M170,200 C174,238 182,272 190,304" stroke="url(#fg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,5"/>

      {/* LEFT ARM — extended forward, holding bag */}
      <path d="M100,104 C82,130 64,162 50,196" stroke="url(#fg)" strokeWidth="11" strokeLinecap="round"/>
      {/* Left hand */}
      <circle cx="48" cy="200" r="8" stroke="url(#fg)" strokeWidth="3" fill="rgba(255,106,154,0.1)"/>
      {/* Bracelet */}
      <path d="M40,196 C40,204 56,204 56,196" stroke="url(#fg)" strokeWidth="2" strokeLinecap="round" fill="none"/>

      {/* LEFT SHOPPING BAG (big branded) */}
      <rect x="6" y="208" width="58" height="72" rx="8" stroke="url(#fg)" strokeWidth="3" fill="rgba(255,106,154,0.06)"/>
      {/* Handle */}
      <path d="M18,208 L18,190 C18,176 52,176 52,190 L52,208" stroke="url(#fg)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* Bag detail — ribbon */}
      <path d="M27,240 C35,234 35,246 27,240 C19,234 19,246 27,240" stroke="url(#fg)" strokeWidth="2" fill="rgba(255,106,154,0.15)"/>
      {/* Bag brand lines */}
      <line x1="16" y1="258" x2="50" y2="258" stroke="url(#fg)" strokeWidth="1.5" strokeDasharray="3,3"/>
      <rect x="14" y="264" width="38" height="8" rx="2" stroke="url(#fg)" strokeWidth="1.5" fill="rgba(255,106,154,0.1)"/>

      {/* RIGHT ARM — holds smaller bag, slightly bent */}
      <path d="M180,104 C198,132 212,162 220,196" stroke="url(#fg)" strokeWidth="11" strokeLinecap="round"/>
      {/* Right hand */}
      <circle cx="222" cy="200" r="8" stroke="url(#fg)" strokeWidth="3" fill="rgba(255,106,154,0.1)"/>

      {/* RIGHT SHOPPING BAG (smaller, boutique) */}
      <rect x="212" y="208" width="52" height="62" rx="7" stroke="url(#fg)" strokeWidth="3" fill="rgba(255,106,154,0.06)"/>
      <path d="M222,208 L222,194 C222,182 254,182 254,194 L254,208" stroke="url(#fg)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* Small bag ribbon */}
      <path d="M238,240 L246,232 L254,240 L246,248 Z" stroke="url(#fg)" strokeWidth="2" fill="rgba(255,106,154,0.15)"/>

      {/* LEGS */}
      {/* Left leg — forward stride */}
      <path d="M112,308 C108,352 104,390 102,430" stroke="url(#fg)" strokeWidth="14" strokeLinecap="round"/>
      {/* Right leg — back stride */}
      <path d="M168,308 C174,352 180,390 184,428" stroke="url(#fg)" strokeWidth="14" strokeLinecap="round"/>

      {/* LEFT HIGH HEEL */}
      <path d="M102,430 C90,438 72,442 66,436" stroke="url(#fg)" strokeWidth="10" strokeLinecap="round"/>
      {/* Heel spike left */}
      <line x1="78" y1="445" x2="78" y2="460" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round"/>
      {/* Left sole */}
      <path d="M66,436 C62,442 62,452 70,454 L100,452" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round"/>

      {/* RIGHT HIGH HEEL */}
      <path d="M184,428 C196,436 214,440 220,434" stroke="url(#fg)" strokeWidth="10" strokeLinecap="round"/>
      {/* Heel spike right */}
      <line x1="208" y1="443" x2="208" y2="458" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round"/>
      {/* Right sole */}
      <path d="M220,434 C224,440 224,450 216,452 L186,450" stroke="url(#fg)" strokeWidth="4" strokeLinecap="round"/>

      {/* Floor shadow */}
      <ellipse cx="142" cy="468" rx="80" ry="8" fill="rgba(255,106,154,0.05)"/>
    </svg>
  );
}

/* ─── Rotating word ─── */
const WORDS = ['STYLE', 'FASHION', 'LUXURY', 'CULTURE', 'IDENTITY'];
function HeroWord() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % WORDS.length), 2500); return () => clearInterval(t); }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span key={i}
        initial={{ y: 50, opacity: 0, filter: 'blur(10px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: -50, opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ display: 'block', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {WORDS[i]}
      </motion.span>
    </AnimatePresence>
  );
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const { byGender, products } = useCatalog();
  const { activeBanners, heroImages } = useBanners();
  const { autoImages, hiddenAutoIds, customCollections } = useCollections();
  const { promos } = usePromo();
  const homePromo = promos.home;
  const navigate = useNavigate();

  // No forced focus dispatch needed — contexts share state in the same tab,
  // and BroadcastChannel + natural focus events handle cross-tab sync.

  const featured  = useMemo(() => {
    const priority = products.filter(p => p.tag === 'Bestseller' || p.tag === 'Trending');
    // If not enough featured products, fill with newest ones
    if (priority.length >= 4) return priority.slice(0, 8);
    const rest = products.filter(p => p.tag !== 'Bestseller' && p.tag !== 'Trending' && p.tag !== 'Draft');
    return [...priority, ...rest].slice(0, 8);
  }, [products]);
  const menNew    = useMemo(() => byGender('men').slice(0, 4),   [byGender]);
  const womenNew  = useMemo(() => byGender('women').slice(0, 4), [byGender]);

  const cats = useMemo(() => {
    const COLS = ['#7c6aff','#ff6a9a','#3b82f6','#fb923c','#10b981','#f59e0b'];
    const productMap = {};
    products.forEach(p => { const c = p.category || 'Other'; if (!productMap[c]) productMap[c] = []; productMap[c].push(p); });

    // Auto-collections: categories derived from products (excluding hidden)
    const autoCats = Object.entries(productMap)
      .filter(([c]) => !hiddenAutoIds.includes(c))
      .map(([c, ps], i) => ({
        label: c, count: ps.length, color: COLS[i % COLS.length],
        img: autoImages[c] || ps.find(p => p.images?.[0])?.images?.[0] || null,
      }));

    const autoTitles = new Set(autoCats.map(c => c.label));

    // Custom collections: admin-created collections not already covered by auto
    const customCats = customCollections
      .filter(c => c.active !== false && !hiddenAutoIds.includes(c.title) && !autoTitles.has(c.title))
      .map((c, i) => ({
        label: c.title, count: (c.productIds || []).length,
        color: COLS[(autoCats.length + i) % COLS.length],
        img: c.image || null,
      }));

    return [...autoCats, ...customCats];
  }, [products, autoImages, hiddenAutoIds, customCollections]);

  // CSS animation handles infinite scroll — no JS loop needed

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: activeBanners.length > 0 ? 'var(--nav-height)' : 0 }}>

      {/* ══════════ BANNERS ══════════ */}
      {activeBanners.length > 0 && <HeroBanner />}

      {/* ══════════ PREMIUM SPLIT HERO ══════════ */}
      {activeBanners.length === 0 && (
        <section style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch', background: '#050508' }}>

          {/* ── LEFT PANEL — MEN ── */}
          <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg,#04040e 0%,#0a0a22 50%,#060616 100%)' }}>
            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,106,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.06) 1px,transparent 1px)', backgroundSize: '55px 55px' }} />
            {/* Real photo or placeholder */}
            <PanelImage image={heroImages?.men} side="men" />
            {/* Glow — only show when no photo */}
            {!heroImages?.men && (
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 6, repeat: Infinity }}
                style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,106,255,0.22) 0%,transparent 65%)', bottom: '5%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
            )}
            {/* MEN label */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', paddingTop: 'calc(var(--nav-height) + 28px)' }}>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(124,106,255,0.8)', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: 8 }}>Collection</p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,72px)', fontWeight: 800, letterSpacing: '-2px', color: 'white', lineHeight: 0.95 }}>MEN'S</h2>
              </motion.div>
            </div>
            {/* SVG figure only when no real photo */}
            {!heroImages?.men && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}
                style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: 320, height: '60%' }}>
                <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '100%', height: '100%' }}>
                  <MaleFigure />
                </motion.div>
              </motion.div>
            )}
            {/* Shop Men CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <Link to="/men" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 32px', borderRadius: 50, background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.4)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(10px)' }}>
                  Shop Men's <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── CENTER PANEL ── */}
          <motion.div style={{ opacity: heroOpacity }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
            className="hero-center-panel"
            style={{
              width: 'clamp(300px, 36%, 520px)', flexShrink: 0, position: 'relative', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '0 32px', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(124,106,255,0.12)', borderRight: '1px solid rgba(255,106,154,0.12)',
            }}>
            {/* Thin decorative lines */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.04),transparent)', pointerEvents: 'none' }} />

            <div style={{ textAlign: 'center', paddingTop: 'var(--nav-height)' }}>
              {/* Badge */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 50, padding: '6px 16px', marginBottom: 28 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}><Sparkles size={13} color="var(--accent)" /></motion.div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>3D Try-On · Now Live</span>
              </motion.div>

              {/* Heading */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 0.88, letterSpacing: '-3px', marginBottom: 6 }}>
                  <span style={{ display: 'block', fontSize: 'clamp(44px,5.5vw,80px)', color: 'rgba(255,255,255,0.9)' }}>WEAR</span>
                  <span style={{ display: 'block', fontSize: 'clamp(44px,5.5vw,80px)', color: 'rgba(255,255,255,0.9)' }}>YOUR</span>
                  <div style={{ fontSize: 'clamp(44px,5.5vw,80px)', height: 'clamp(50px,6.3vw,92px)', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    <HeroWord />
                  </div>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.75, maxWidth: 340, margin: '20px auto 28px' }}>
                The future of fashion shopping. Try any outfit on your body in real 3D before you buy.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <Link to="/tryon/live" style={{ textDecoration: 'none', width: '100%', maxWidth: 280 }}>
                  <motion.button whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.96 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px 28px', borderRadius: 50, background: 'var(--gradient-1)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%', boxShadow: '0 0 36px rgba(124,106,255,0.4)' }}>
                    <Sparkles size={16} /> Try On Free — 3D
                  </motion.button>
                </Link>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 280 }}>
                  <Link to="/men" style={{ textDecoration: 'none' }}>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', borderRadius: 50, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.28)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%' }}>
                      Men <ArrowRight size={13} />
                    </button>
                  </Link>
                  <Link to="/women" style={{ textDecoration: 'none' }}>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', borderRadius: 50, background: 'rgba(255,106,154,0.1)', border: '1px solid rgba(255,106,154,0.28)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%' }}>
                      Women <ArrowRight size={13} />
                    </button>
                  </Link>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
                {[{ n: '2M+', l: 'Customers' }, { n: '50K+', l: 'Products' }, { n: '4.9★', l: 'Rating' }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Season label */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              style={{ position: 'absolute', bottom: 28, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Summer / Spring 2026
            </motion.div>
          </motion.div>

          {/* ── RIGHT PANEL — WOMEN ── */}
          <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg,#100408 0%,#200a14 50%,#140610 100%)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,106,154,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,154,0.06) 1px,transparent 1px)', backgroundSize: '55px 55px' }} />
            {/* Real photo or placeholder */}
            <PanelImage image={heroImages?.women} side="women" />
            {/* Glow — only when no photo */}
            {!heroImages?.women && (
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 7, repeat: Infinity, delay: 1 }}
                style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,106,154,0.2) 0%,transparent 65%)', bottom: '5%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
            )}
            {/* WOMEN label */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', paddingTop: 'calc(var(--nav-height) + 28px)' }}>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,106,154,0.8)', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: 8 }}>Collection</p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,72px)', fontWeight: 800, letterSpacing: '-2px', color: 'white', lineHeight: 0.95 }}>WOMEN'S</h2>
              </motion.div>
            </div>
            {/* SVG figure only when no real photo */}
            {!heroImages?.women && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 1 }}
                style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '85%', maxWidth: 340, height: '62%' }}>
                <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} style={{ width: '100%', height: '100%' }}>
                  <FemaleFigure />
                </motion.div>
              </motion.div>
            )}
            {/* Shop Women CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <Link to="/women" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 32px', borderRadius: 50, background: 'rgba(255,106,154,0.15)', border: '1px solid rgba(255,106,154,0.4)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(10px)' }}>
                  Shop Women's <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'var(--text-muted)', zIndex: 20, pointerEvents: 'none' }}>
            <span style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom,var(--text-muted),transparent)' }} />
          </motion.div>
        </section>
      )}

      {/* ── ANNOUNCEMENT BAR ── */}
      <AnnouncementBar page="home" />

      {/* ── SHOP BY CATEGORY ── */}
      {cats.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-glass)', padding: '28px 0 32px', overflow: 'hidden' }}>
          {/* Keyframe injected inline so no external CSS file needed */}
          <style>{`
            @keyframes shopCatScroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .shop-cat-track { animation: shopCatScroll 28s linear infinite; }
            .shop-cat-track:hover { animation-play-state: paused; }
          `}</style>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Shop by Category</h2>
            </div>
            <div style={{ height: 1, background: 'var(--border-glass)', marginBottom: 20 }} />
          </div>
          {/* Full-width track — NOT constrained by .container so it scrolls edge-to-edge */}
          <div className="shop-cat-track" style={{ display: 'flex', gap: 14, width: 'max-content', paddingLeft: 24, paddingRight: 24 }}>
            {[...cats, ...cats].map((cat, idx) => (
              <div key={`${cat.label}_${idx}`} onClick={() => navigate(`/search?category=${encodeURIComponent(cat.label)}`)}
                style={{ flexShrink: 0, width: 184, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-glass)', position: 'relative', height: 220, background: 'var(--bg-card)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                {cat.img
                  ? <img src={cat.img} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${cat.color}44,${cat.color}18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 52, fontWeight: 900, color: cat.color, opacity: 0.6 }}>{cat.label[0]}</span>
                    </div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.82) 0%,transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px' }}>
                  <p style={{ margin: 0, color: 'white', fontSize: 14, fontWeight: 700 }}>{cat.label}</p>
                  <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{cat.count} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROMO BANNER ── */}
      {homePromo?.active && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', padding: '20px 0' }}>
          <div className="container">
            <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(120deg,#1a0a00 0%,#2d1000 60%,#1a0500 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, padding: '32px 40px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 85% 50%,rgba(239,68,68,0.18) 0%,transparent 55%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <span style={{ display: 'inline-block', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 3, marginBottom: 12 }}>
                  {homePromo.badge}
                </span>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1, marginBottom: 10 }}>
                  <div style={{ fontSize: 'clamp(36px,5vw,68px)', color: '#ef4444' }}>{homePromo.headline}</div>
                  <div style={{ fontSize: 'clamp(18px,2.5vw,32px)', color: 'rgba(255,255,255,0.88)' }}>{homePromo.subline}</div>
                </div>
                {homePromo.code && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                    Code: <code style={{ fontWeight: 700, color: 'white', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 3, fontSize: 13 }}>{homePromo.code}</code>
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', flexShrink: 0 }}>
                <Link to={homePromo.btn1Link || '/sale'} style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 32px', borderRadius: 3, background: '#ef4444', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {homePromo.btn1Label} →
                  </button>
                </Link>
                {homePromo.btn2Label && (
                  <Link to={homePromo.btn2Link || '/new-arrivals'} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '10px 28px', borderRadius: 3, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%' }}>
                      {homePromo.btn2Label}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDING NOW ── */}
      <div style={{ background: 'var(--bg-primary)', padding: '28px 0 36px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Trending Now</p>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Bestsellers</h2>
            </div>
            <Link to="/men" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, letterSpacing: '0.3px' }}>
              VIEW ALL <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ height: 1, background: 'var(--border-glass)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {featured.map((p, i) => (
              <div key={p.id} style={{ flexShrink: 0, width: 210 }}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MEN'S PICKS ── */}
      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', padding: '28px 0 36px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#7c6aff', fontWeight: 600 }}>Men's Fashion</p>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>New For Him</h2>
            </div>
            <Link to="/men" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#7c6aff', display: 'flex', alignItems: 'center', gap: 3 }}>
              VIEW ALL <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ height: 1, background: 'var(--border-glass)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {menNew.map((p, i) => (
              <div key={p.id} style={{ flexShrink: 0, width: 210 }}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3D TRY-ON STRIP ── */}
      <div style={{ background: 'linear-gradient(90deg,#7c6aff 0%,#a855f7 50%,#ff6a9a 100%)', padding: '28px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20, marginBottom: 10 }}>
              Exclusive · AI Powered
            </span>
            <h3 style={{ margin: 0, fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              Try Before You Buy — In 3D
            </h3>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              See exactly how any outfit fits on YOU before ordering.
            </p>
          </div>
          <Link to="/tryon/live" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button style={{ padding: '12px 28px', borderRadius: 3, background: 'white', border: 'none', color: '#7c6aff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.3px' }}>
              Start 3D Try-On →
            </button>
          </Link>
        </div>
      </div>

      {/* ── WOMEN'S PICKS ── */}
      <div style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-glass)', padding: '28px 0 36px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#ff6a9a', fontWeight: 600 }}>Women's Fashion</p>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>New For Her</h2>
            </div>
            <Link to="/women" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: '#ff6a9a', display: 'flex', alignItems: 'center', gap: 3 }}>
              VIEW ALL <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ height: 1, background: 'var(--border-glass)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {womenNew.map((p, i) => (
              <div key={p.id} style={{ flexShrink: 0, width: 210 }}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-glass)', padding: '16px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {[
              { icon: Truck,     label: 'Free Shipping',  sub: 'On orders above ₹999' },
              { icon: RotateCcw, label: '30-Day Returns', sub: 'No questions asked'   },
              { icon: Shield,    label: 'Secure Payment', sub: '100% safe checkout'   },
              { icon: Sparkles,  label: '3D Try-On',      sub: 'Before you buy'       },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 28px', borderRight: i < arr.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                <item.icon size={18} color="var(--accent)" strokeWidth={1.5} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:860px){
          .hero-center-panel{ width:100%!important; min-height:60vh; border-left:none!important; border-right:none!important; border-top:1px solid rgba(255,255,255,0.05)!important; }
          section:first-of-type{ flex-direction:column!important; }
        }
        *::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
