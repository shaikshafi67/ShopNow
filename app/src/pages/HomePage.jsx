import { useRef, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronRight, Zap, Shield, RotateCcw, Star, TrendingUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import { useCatalog } from '../context/CatalogContext';
import { useBanners } from '../context/BannersContext';
import { useCollections } from '../context/CollectionsContext';

const HERO_WORDS = ['STYLE', 'FASHION', 'CULTURE', 'IDENTITY'];

function RotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HERO_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: -40, opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="gradient-text"
        style={{ display: 'block' }}
      >
        {HERO_WORDS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

const MARQUEE_ITEMS = ['NEW ARRIVALS', '·', 'SUMMER 2026', '·', '3D TRY-ON', '·', 'FREE SHIPPING ₹999+', '·', 'UPTO 50% OFF', '·', 'NEW ARRIVALS', '·', 'SUMMER 2026', '·', '3D TRY-ON', '·', 'FREE SHIPPING ₹999+', '·', 'UPTO 50% OFF', '·'];

const FEATURES = [
  { icon: Sparkles, title: '3D Virtual Try-On', desc: 'See exactly how any outfit looks on your body before purchasing.' },
  { icon: Zap, title: 'AI-Powered Sizing', desc: 'Our AI recommends your perfect size every time, eliminating returns.' },
  { icon: Shield, title: 'Premium Quality', desc: 'Every item curated and quality-checked by our expert fashion team.' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Not happy? Free returns within 30 days, no questions asked.' },
];

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const { byGender, products } = useCatalog();
  const { activeBanners } = useBanners();
  const { autoImages, hiddenAutoIds } = useCollections();
  const navigate = useNavigate();
  const catScrollRef = useRef(null);
  const featured = useMemo(() => products.filter((p) => p.tag === 'Bestseller' || p.tag === 'Trending').slice(0, 6), [products]);
  const newMen = useMemo(() => byGender('men').slice(0, 4), [byGender]);
  const newWomen = useMemo(() => byGender('women').filter((p) => p.category === 'Dresses' || p.category === 'Tops').slice(0, 4), [byGender]);

  // Build category cards from real catalog data
  const categoryCards = useMemo(() => {
    const ACCENT_COLORS = ['#7c6aff', '#3b82f6', '#ff6a9a', '#fb923c', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const catMap = {};
    products.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(p);
    });
    return Object.entries(catMap)
      .filter(([cat]) => !hiddenAutoIds.includes(cat))
      .map(([cat, prods], i) => ({
        label: cat,
        count: prods.length,
        accent: ACCENT_COLORS[i % ACCENT_COLORS.length],
        img: autoImages[cat] || prods.find((p) => p.images?.[0])?.images?.[0] || null,
      }));
  }, [products, autoImages, hiddenAutoIds]);

  // Auto-scroll category strip
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    let animId;
    let paused = false;
    const speed = 0.6;
    const step = () => {
      if (!paused) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) el.scrollLeft = 0;
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause);
    el.addEventListener('touchend', resume);
    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, []); // runs once after mount — ref is stable

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* HERO BANNERS */}
      {activeBanners.length > 0 && <HeroBanner />}

      {/* TEXT HERO — hidden when banners are active */}
      {activeBanners.length === 0 && <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Animated background blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%)',
            top: '10%',
            left: '-10%',
            pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,106,154,0.08) 0%, transparent 70%)',
            bottom: '5%',
            right: '-5%',
            pointerEvents: 'none',
          }}
        />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.3,
          mask: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMask: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container"
        >
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', paddingTop: 120, paddingBottom: 60 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(124,106,255,0.1)',
                border: '1px solid rgba(124,106,255,0.3)',
                borderRadius: 50,
                padding: '8px 18px',
                marginBottom: 32,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={16} color="var(--accent)" />
              </motion.div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                Introducing 3D Virtual Try-On Technology
              </span>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(52px, 8vw, 120px)',
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: '-3px',
                color: 'var(--text-primary)',
                marginBottom: 0,
              }}>
                WEAR YOUR
              </h1>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(52px, 8vw, 120px)',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-3px',
                height: 'clamp(60px, 9vw, 130px)',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <RotatingWord />
              </div>
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                color: 'var(--text-secondary)',
                fontSize: 18,
                maxWidth: 580,
                margin: '24px auto 40px',
                lineHeight: 1.7,
              }}
            >
              Upload your photo, choose your outfit, and see it on you in stunning 3D.
              The future of fashion shopping is here.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link to="/tryon/live" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary"
                  style={{ fontSize: 16, padding: '15px 36px' }}
                >
                  <Sparkles size={18} />
                  Try On Now — Free
                </motion.button>
              </Link>
              <Link to="/men" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary"
                  style={{ fontSize: 16, padding: '15px 36px' }}
                >
                  Shop Collection <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}
            >
              {[
                { value: '2M+', label: 'Happy Customers' },
                { value: '50K+', label: 'Products' },
                { value: '4.9★', label: 'App Rating' },
                { value: '30 Days', label: 'Free Returns' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }} />
        </motion.div>
      </section>}

      {/* MARQUEE */}
      <div style={{
        background: 'var(--gradient-1)',
        padding: '14px 0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', gap: 32, width: 'max-content', alignItems: 'center' }}
        >
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* CATEGORY CARDS */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, marginBottom: 12 }}>
              Shop by Category
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Curated collections for every style</p>
          </motion.div>

          {/* Horizontal auto-scroll strip */}
          <div
            ref={catScrollRef}
            style={{
              display: 'flex',
              gap: 20,
              overflowX: 'auto',
              paddingBottom: 16,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab',
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.style.cursor = 'grabbing';
              const startX = e.pageX - el.offsetLeft;
              const scrollLeft = el.scrollLeft;
              const onMove = (ev) => { el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX); };
              const onUp = () => { el.style.cursor = 'grab'; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            {categoryCards.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6, scale: 1.02 }}
                style={{ flexShrink: 0, width: 260, cursor: 'pointer' }}
                onClick={() => navigate(`/search?category=${encodeURIComponent(cat.label)}`)}
              >
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid var(--border-glass)',
                  position: 'relative',
                  height: 340,
                  background: 'var(--bg-card)',
                }}>
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: `radial-gradient(circle at 60% 40%, ${cat.accent}22, transparent 70%)` }} />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(5,5,8,0.88) 0%, rgba(5,5,8,0.15) 55%, transparent 100%)',
                  }} />
                  <div style={{ position: 'absolute', bottom: 22, left: 20, right: 20 }}>
                    <p style={{ color: cat.accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>
                      {cat.count} products
                    </p>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>
                      {cat.label}
                    </h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 50, padding: '6px 14px',
                      fontSize: 13, fontWeight: 600, color: 'white',
                    }}>
                      Shop Now <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D TRY-ON CTA */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, rgba(124,106,255,0.12) 0%, rgba(255,106,154,0.08) 100%)',
              border: '1px solid var(--border-glass)',
              borderRadius: 32,
              padding: '70px 60px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', width: 300, height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,106,255,0.15) 0%, transparent 70%)',
              top: -100, left: -100, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', width: 200, height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,106,154,0.12) 0%, transparent 70%)',
              bottom: -50, right: -50, pointerEvents: 'none',
            }} />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', marginBottom: 20 }}
            >
              <div style={{
                width: 70, height: 70, borderRadius: '50%',
                background: 'var(--gradient-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 0 40px var(--accent-glow)',
              }}>
                <Sparkles size={30} color="white" />
              </div>
            </motion.div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 56px)',
              fontWeight: 800,
              marginBottom: 16,
            }}>
              Try Before You Buy<br />
              <span className="gradient-text">In Stunning 3D</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Upload 4 photos of yourself and virtually try on any outfit from our collection instantly.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/tryon/live" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary"
                  style={{ fontSize: 16, padding: '15px 36px' }}
                >
                  <Sparkles size={18} />
                  Start 3D Try-On
                </motion.button>
              </Link>
              <Link to="/men" style={{ textDecoration: 'none' }}>
                <button className="btn btn-secondary" style={{ fontSize: 16, padding: '15px 36px' }}>
                  Browse Collection
                </button>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
              {['Upload Photos', 'Select Outfit', 'View in 3D', 'Buy Confident'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--gradient-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white',
                    flexShrink: 0,
                  }}>{i + 1}</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>{step}</span>
                  {i < 3 && <ChevronRight size={16} color="var(--text-muted)" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TrendingUp size={20} color="var(--accent)" />
                <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Trending Now</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 800 }}>
                Staff Picks
              </h2>
            </div>
            <Link to="/men" style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost">View All <ArrowRight size={16} /></button>
            </Link>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        padding: '80px 0 100px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-glass)',
        borderBottom: '1px solid var(--border-glass)',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 800, marginBottom: 12 }}>
              Why ShopNow?
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Built for the next generation of fashion lovers</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 20,
                  padding: '32px 28px',
                  transition: 'all var(--transition)',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-glass-hover)';
                  e.currentTarget.style.background = 'var(--bg-glass-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.background = 'var(--bg-glass)';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(124,106,255,0.12)',
                  border: '1px solid rgba(124,106,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <f.icon size={24} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WOMEN HIGHLIGHTS */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <p style={{ color: 'var(--accent-2)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>Women's Collection</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 800 }}>
                Dresses & Beyond
              </h2>
            </div>
            <Link to="/women" style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost">View All Women's <ArrowRight size={16} /></button>
            </Link>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {newWomen.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
