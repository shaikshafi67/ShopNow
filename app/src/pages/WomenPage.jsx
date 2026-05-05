import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronDown, ArrowRight, Flame, Heart,
  Star, Sparkles, SlidersHorizontal, Gift, Package, Zap
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AnnouncementBar from '../components/AnnouncementBar';
import FilterSidebar, { hexToColorFamily } from '../components/FilterSidebar';
import { useCatalog } from '../context/CatalogContext';
import { useBanners } from '../context/BannersContext';
import { usePromo } from '../context/PromoContext';
import { useCollections } from '../context/CollectionsContext';

const SORT_OPTIONS = [
  { label: 'Featured',           value: 'featured'   },
  { label: 'Price: Low → High',  value: 'price_asc'  },
  { label: 'Price: High → Low',  value: 'price_desc' },
  { label: 'Top Rated',          value: 'rating'     },
  { label: 'Best Discount',      value: 'discount'   },
];


export default function WomenPage() {
  const { byGender } = useCatalog();
  const allWomen = useMemo(() => byGender('women'), [byGender]);
  const { heroImages } = useBanners();
  const { promos } = usePromo();
  const womenPromo = promos.women;
  const { hiddenAutoIds } = useCollections();

  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort]       = useState('featured');
  const [searchQ, setSearchQ] = useState('');
  const gridRef               = useRef(null);
  const [sideFilters, setSideFilters] = useState({ categories: [], brands: [], colors: [], minDiscount: 0, priceMin: 0, priceMax: 99999 });

  const dynamicCats = useMemo(() => {
    const cats = new Set(allWomen.map(p => p.category));
    return ['All', ...Array.from(cats).filter(c => !hiddenAutoIds.includes(c))];
  }, [allWomen, hiddenAutoIds]);

  const filtered = useMemo(() => {
    let list = allWomen;
    if (sideFilters.categories?.length) {
      list = list.filter(p => sideFilters.categories.includes(p.category));
    } else if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQ) list = list.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()));
    if (sideFilters.brands?.length) list = list.filter(p => sideFilters.brands.includes(p.brand));
    if (sideFilters.colors?.length) {
      list = list.filter(p =>
        (p.colors || []).some(hex => sideFilters.colors.includes(hexToColorFamily(hex)))
      );
    }
    if (sideFilters.minDiscount > 0) list = list.filter(p => (p.discount || 0) >= sideFilters.minDiscount);
    if (sideFilters.priceMin > 0) list = list.filter(p => p.price >= sideFilters.priceMin);
    if (sideFilters.priceMax < 99999) list = list.filter(p => p.price <= sideFilters.priceMax);
    if (sort === 'price_asc')  list = [...list].sort((a,b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a,b) => b.price - a.price);
    if (sort === 'rating')     list = [...list].sort((a,b) => b.rating - a.rating);
    if (sort === 'discount')   list = [...list].sort((a,b) => b.discount - a.discount);
    return list;
  }, [allWomen, activeCategory, sort, searchQ, sideFilters]);

  const onSale   = useMemo(() => allWomen.filter(p => p.discount > 15).length, [allWomen]);
  const topRated = useMemo(() => allWomen.filter(p => p.rating >= 4.5).length, [allWomen]);

  return (
    <div style={{ paddingTop:'var(--nav-height)', minHeight:'100vh', background:'var(--bg-primary)' }}>

      {/* ══════════ FULL-BLEED HERO ══════════ */}
      {heroImages?.women?.startsWith('data:video/') ? (
        /* ── VIDEO HERO — full natural size ── */
        <div style={{ position:'relative', width:'100%', background:'#000', lineHeight:0 }}>
          <video src={heroImages.women} autoPlay muted loop playsInline
            style={{ width:'100%', height:'auto', display:'block', maxHeight:'95vh' }} />
        </div>
      ) : (
      <div style={{ position:'relative', height:'80vh', minHeight:560, maxHeight:800, overflow:'hidden', background:'#0f0408' }}>

        {/* Admin-uploaded hero photo / video */}
        {heroImages?.women && (
          <div style={{ position:'absolute', inset:0, zIndex:0 }}>
            <img src={heroImages.women} alt="Women's hero"
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }} />
            <div style={{ position:'absolute', inset:0, background:'rgba(15,4,8,0.45)' }} />
          </div>
        )}

        {/* Grid — hide when photo uploaded */}
        {!heroImages?.women && <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,106,154,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,154,0.055) 1px,transparent 1px)', backgroundSize:'70px 70px' }} />}

        {/* Glows — hide when photo uploaded */}
        {!heroImages?.women && <>
          <motion.div animate={{ scale:[1,1.35,1], rotate:[0,-60,0] }} transition={{ duration:22, repeat:Infinity, ease:'linear' }}
            style={{ position:'absolute', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,106,154,0.22) 0%,transparent 60%)', top:-250, left:-150, pointerEvents:'none' }} />
          <motion.div animate={{ scale:[1,1.2,1] }} transition={{ duration:16, repeat:Infinity }}
            style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(251,146,60,0.12) 0%,transparent 65%)', bottom:-150, right:-100, pointerEvents:'none' }} />
          {/* Diagonal accent lines */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
            style={{ position:'absolute', top:'20%', left:0, right:0, height:1, background:'linear-gradient(to right,transparent 0%,rgba(255,106,154,0.18) 30%,rgba(255,106,154,0.18) 70%,transparent 100%)', pointerEvents:'none' }} />
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
            style={{ position:'absolute', top:'75%', left:0, right:0, height:1, background:'linear-gradient(to right,transparent 0%,rgba(251,146,60,0.12) 30%,rgba(251,146,60,0.12) 70%,transparent 100%)', pointerEvents:'none' }} />
          {/* Watermark text */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', pointerEvents:'none' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'clamp(120px,20vw,280px)', fontWeight:800, color:'rgba(255,106,154,0.04)', letterSpacing:'-8px', whiteSpace:'nowrap', userSelect:'none' }}>
              WOMENSWEAR
            </span>
          </div>
        </>}

        {/* Content */}
        <div className="container" style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative' }}>
          {!heroImages?.women && (
          <motion.div initial={{ opacity:0, y:36 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}>
            {/* Badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,106,154,0.1)', border:'1px solid rgba(255,106,154,0.28)', borderRadius:6, padding:'5px 16px', marginBottom:26 }}>
              <Heart size={11} color="#ff6a9a" />
              <span style={{ fontSize:10, fontWeight:700, color:'#ff6a9a', letterSpacing:'3px', textTransform:'uppercase' }}>Women's Collection · Summer 2026</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, letterSpacing:'-4px', lineHeight:0.87, color:'white', marginBottom:28 }}>
              <motion.span style={{ display:'block', fontSize:'clamp(54px,10vw,128px)' }} initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>REDEFINE</motion.span>
              <motion.span style={{ display:'block', fontSize:'clamp(54px,10vw,128px)', background:'linear-gradient(135deg,#ff6a9a,#fb923c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>FEMININE</motion.span>
              <motion.span style={{ display:'block', fontSize:'clamp(54px,10vw,128px)' }} initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>POWER.</motion.span>
            </h1>

            {/* Sub row */}
            <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:15, maxWidth:340, lineHeight:1.8 }}>
                Dresses, ethnic wear, tops, sarees & more — curated for the bold modern woman.
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <Link to="/tryon/live" style={{ textDecoration:'none' }}>
                  <motion.button whileHover={{ scale:1.05, y:-3 }} whileTap={{ scale:0.96 }}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 26px', borderRadius:50, background:'linear-gradient(135deg,#ff6a9a,#fb923c)', border:'none', color:'white', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', boxShadow:'0 0 30px rgba(255,106,154,0.4)' }}>
                    <Sparkles size={15} /> 3D Try-On
                  </motion.button>
                </Link>
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }}
                  onClick={() => gridRef.current?.scrollIntoView({ behavior:'smooth' })}
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 26px', borderRadius:50, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.16)', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  Shop Now <ArrowRight size={15} />
                </motion.button>
              </div>
            </div>
          </motion.div>
          )}

          {/* Stats — bottom right — hidden when hero image uploaded */}
          {!heroImages?.women && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
            style={{ position:'absolute', bottom:36, right:0, display:'flex', gap:10 }}>
            {[
              { v:allWomen.length, l:'Products', c:'#ff6a9a' },
              { v:onSale,          l:'On Sale',  c:'#ef4444' },
              { v:topRated,        l:'Top Rated',c:'#f59e0b' },
            ].map((s,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'14px 20px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px' }}>{s.l}</div>
              </div>
            ))}
          </motion.div>
          )}
        </div>
      </div>
      )} {/* end image/default hero */}

      {/* ══════════ ANIMATED TICKER ══════════ */}
      <AnnouncementBar page="women" />

      {/* ══════════ QUICK CATEGORY SPOTLIGHTS ══════════ */}
      <div style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-glass)', padding:'18px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'2px', display:'flex', alignItems:'center', marginRight:6 }}>Quick Shop:</span>
              {[
                { label:'🌸 New Season', action:() => { setActiveCategory('All'); setSort('featured'); } },
                { label:'🔥 On Sale',    action:() => setSort('discount')  },
                { label:'⭐ Top Rated',  action:() => setSort('rating')    },
                { label:'💎 Premium',    action:() => setSort('price_desc') },
              ].map((btn, i) => (
                <motion.button key={i} whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.96 }} onClick={btn.action}
                  style={{ padding:'8px 18px', borderRadius:50, border:'1px solid rgba(255,106,154,0.22)', background:'rgba(255,106,154,0.07)', color:'#ff6a9a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,106,154,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,106,154,0.07)'; }}>
                  {btn.label}
                </motion.button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Heart size={14} color="#ff6a9a" />
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Updated daily by our style team</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ EDITORIAL PROMO STRIP ══════════ */}
      <div style={{ background:'linear-gradient(135deg,rgba(255,106,154,0.06) 0%,rgba(251,146,60,0.04) 100%)', borderBottom:'1px solid var(--border-glass)', padding:'22px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,106,154,0.14)', border:'1px solid rgba(255,106,154,0.26)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Zap size={22} color="#ff6a9a" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#ff6a9a', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom:4 }}>This Week's Drop</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:800, letterSpacing:'-0.5px' }}>Fresh Women's Arrivals — Just Landed</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <motion.button whileHover={{ scale:1.04, y:-2 }} onClick={() => setActiveCategory('All')}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:50, background:'linear-gradient(135deg,#ff6a9a,#fb923c)', border:'none', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                See All New <ArrowRight size={14} />
              </motion.button>
              <Link to="/tryon/live" style={{ textDecoration:'none' }}>
                <motion.button whileHover={{ scale:1.04, y:-2 }}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:50, background:'rgba(255,106,154,0.1)', border:'1px solid rgba(255,106,154,0.24)', color:'#ff6a9a', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  <Sparkles size={13} /> Try 3D
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PRODUCTS SECTION ══════════ */}
      <div ref={gridRef} className="container" style={{ padding:'28px 24px 80px', display:'flex', gap:32, alignItems:'flex-start' }}>

        {/* FILTER SIDEBAR */}
        <FilterSidebar products={allWomen} filters={sideFilters} onChange={setSideFilters} accentColor="#ff6a9a" hiddenCategories={hiddenAutoIds} />

        <div style={{ flex:1, minWidth:0 }}>
        {/* Search + Sort */}
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:22, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:10, background:'var(--bg-card)', border:'1px solid var(--border-glass)', borderRadius:14, padding:'11px 16px', transition:'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor='rgba(255,106,154,0.4)'}
            onBlur={e => e.currentTarget.style.borderColor='var(--border-glass)'}>
            <Search size={15} color="var(--text-muted)" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search women's styles…"
              style={{ background:'transparent', border:'none', outline:'none', color:'var(--text-primary)', fontSize:14, fontFamily:'var(--font-body)', width:'100%' }} />
            {searchQ && <button onClick={() => setSearchQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0 }}><X size={14} /></button>}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border-glass)', borderRadius:14, padding:'11px 16px' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ appearance:'none', background:'transparent', border:'none', color:'var(--text-primary)', fontSize:14, fontFamily:'var(--font-body)', cursor:'pointer', outline:'none' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} color="var(--text-muted)" style={{ pointerEvents:'none' }} />
          </div>

          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-glass)', borderRadius:14, padding:'11px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>
            {filtered.length} products
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
          {dynamicCats.map(cat => (
            <motion.button key={cat} whileTap={{ scale:0.95 }} onClick={() => { setActiveCategory(cat); setSideFilters(prev => ({ ...prev, categories: [] })); }}
              style={{
                padding:'8px 20px', borderRadius:50, border:'1px solid', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:activeCategory===cat?700:500,
                borderColor:activeCategory===cat?'#ff6a9a':'var(--border-glass)',
                background:activeCategory===cat?'rgba(255,106,154,0.12)':'var(--bg-card)',
                color:activeCategory===cat?'#ff6a9a':'var(--text-secondary)',
                transition:'all 0.2s',
              }}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Inline Sale Banner */}
        {womenPromo?.active && (
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,rgba(255,106,154,0.07) 0%,rgba(251,146,60,0.04) 100%)', border:'1px solid rgba(255,106,154,0.18)', borderRadius:20, padding:'22px 26px', marginBottom:32, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <motion.div animate={{ scale:[1,1.5,1] }} transition={{ duration:4, repeat:Infinity }}
            style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,106,154,0.12) 0%,transparent 65%)', right:-80, top:-100, pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
            <div style={{ width:46, height:46, borderRadius:13, background:'rgba(255,106,154,0.14)', border:'1px solid rgba(255,106,154,0.28)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Flame size={22} color="#ff6a9a" />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:800, letterSpacing:'-0.5px', color:'var(--text-primary)' }}>{womenPromo.title}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                {womenPromo.subtitle} <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--text-primary)', background:'rgba(255,255,255,0.07)', padding:'1px 7px', borderRadius:4 }}>{womenPromo.code}</span>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale:1.04 }} onClick={() => setSort('discount')}
            style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:50, background:'linear-gradient(135deg,#ff6a9a,#fb923c)', border:'none', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            {womenPromo.btnLabel} <ArrowRight size={14} />
          </motion.button>
        </motion.div>
        )}

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeCategory+sort+searchQ}
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.28 }}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:24 }}>
            {filtered.length > 0
              ? filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              : (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'90px 0', color:'var(--text-muted)' }}>
                  <Package size={52} style={{ opacity:0.2, display:'block', margin:'0 auto 18px' }} />
                  <p style={{ fontSize:20, fontWeight:700, marginBottom:8, color:'var(--text-secondary)' }}>No products found</p>
                  <p style={{ fontSize:14, marginBottom:24 }}>Try adjusting your filters or search term</p>
                  <button onClick={() => { setSearchQ(''); setActiveCategory('All'); setSideFilters({ categories:[], brands:[], colors:[], minDiscount:0, priceMin:0, priceMax:99999 }); }}
                    style={{ padding:'11px 28px', borderRadius:50, background:'linear-gradient(135deg,#ff6a9a,#fb923c)', border:'none', color:'white', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Clear All Filters
                  </button>
                </div>
              )}
          </motion.div>
        </AnimatePresence>

        </div> {/* ── end flex:1 content ── */}
      </div>  {/* ── end flex container ── */}

      {/* ══════════ BOTTOM CTA ══════════ */}
      <div style={{ background:'linear-gradient(135deg,rgba(255,106,154,0.08) 0%,rgba(251,146,60,0.05) 100%)', borderTop:'1px solid var(--border-glass)', padding:'70px 0' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:28 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#ff6a9a', textTransform:'uppercase', letterSpacing:'3px', marginBottom:12 }}>Virtual Try-On</p>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,4vw,48px)', fontWeight:800, letterSpacing:'-2px', marginBottom:12, lineHeight:0.95 }}>Try It On Before<br/>You Buy It</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:15, lineHeight:1.7, maxWidth:380 }}>Upload your photo, pick any outfit, see it on you in real-time 3D. Zero risk, total confidence.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Link to="/tryon/live" style={{ textDecoration:'none' }}>
              <motion.button whileHover={{ scale:1.05, y:-4 }} whileTap={{ scale:0.96 }}
                style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 40px', borderRadius:50, background:'linear-gradient(135deg,#ff6a9a,#fb923c)', border:'none', color:'white', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', boxShadow:'0 0 40px rgba(255,106,154,0.35)', whiteSpace:'nowrap' }}>
                <Sparkles size={17} /> Start 3D Try-On — Free
              </motion.button>
            </Link>
            <Link to="/women" style={{ textDecoration:'none' }}>
              <button style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'13px 32px', borderRadius:50, background:'transparent', border:'1px solid var(--border-glass)', color:'var(--text-secondary)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', width:'100%' }}>
                Back to Top ↑
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
