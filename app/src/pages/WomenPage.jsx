import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
  { label: 'Discount', value: 'discount' },
];

export default function WomenPage() {
  const { byGender } = useCatalog();
  const allWomenProducts = useMemo(() => byGender('women'), [byGender]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [searchQ, setSearchQ] = useState('');

  // Dynamically build categories from actual data
  const dynamicCategories = useMemo(() => {
    const cats = new Set(allWomenProducts.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, [allWomenProducts]);

  const filtered = useMemo(() => {
    let list = allWomenProducts;
    if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
    if (searchQ) list = list.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()));
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === 'discount') list = [...list].sort((a, b) => b.discount - a.discount);
    return list;
  }, [allWomenProducts, activeCategory, sort, searchQ]);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{
        position: 'relative',
        height: 260,
        background: 'linear-gradient(135deg, rgba(255,106,154,0.12) 0%, rgba(251,146,60,0.08) 100%)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
          style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,106,154,0.1) 0%, transparent 70%)',
            left: -100, bottom: -150, pointerEvents: 'none',
          }}
        />
        <div className="container">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <p style={{ color: '#ff6a9a', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 8 }}>
              Women's Collection
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1 }}>
              Redefine<br />
              <span style={{ background: 'linear-gradient(135deg, #ff6a9a, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Feminine Power</span>
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '10px 16px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search women's styles..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', width: '100%' }}
            />
            {searchQ && <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                appearance: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 12, padding: '10px 40px 10px 16px', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} products</span>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
          {dynamicCategories.map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '9px 20px', borderRadius: 50, border: '1px solid',
                borderColor: activeCategory === cat ? '#ff6a9a' : 'var(--border-glass)',
                background: activeCategory === cat ? 'rgba(255,106,154,0.12)' : 'transparent',
                color: activeCategory === cat ? '#ff6a9a' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: activeCategory === cat ? 700 : 500,
                cursor: 'pointer', transition: 'all var(--transition)', fontFamily: 'var(--font-body)',
              }}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + sort + searchQ}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}
          >
            {filtered.length > 0 ? (
              filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontSize: 18 }}>No products found</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
