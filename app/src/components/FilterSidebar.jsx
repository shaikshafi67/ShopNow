import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

const DISCOUNT_OPTIONS = [
  { label: '10% and above',  value: 10 },
  { label: '20% and above',  value: 20 },
  { label: '30% and above',  value: 30 },
  { label: '40% and above',  value: 40 },
  { label: '50% and above',  value: 50 },
  { label: '60% and above',  value: 60 },
  { label: '70% and above',  value: 70 },
];

/* Map any hex color → a named color family using hue + lightness */
const COLOR_FAMILIES = [
  { name: 'Black',  hex: '#1a1a1a' },
  { name: 'White',  hex: '#e8e8e8' },
  { name: 'Grey',   hex: '#9ca3af' },
  { name: 'Red',    hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Green',  hex: '#22c55e' },
  { name: 'Cyan',   hex: '#06b6d4' },
  { name: 'Blue',   hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink',   hex: '#ec4899' },
  { name: 'Brown',  hex: '#92400e' },
  { name: 'Beige',  hex: '#d4b896' },
  { name: 'Navy',   hex: '#1e3a5f' },
  { name: 'Maroon', hex: '#800000' },
];

export function hexToColorFamily(raw) {
  if (!raw) return null;
  const hex = raw.replace('#', '').toLowerCase().trim();
  if (hex.length !== 6) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const avg = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Near-black / near-white / grey by luminance + saturation
  if (avg < 45 && diff < 25)  return 'Black';
  if (avg > 210 && diff < 30) return 'White';
  if (diff < 35)              return 'Grey';

  // Dark blues / navies
  if (r < 60 && g < 90 && b > 80 && avg < 90) return 'Navy';

  // Dark reds / maroons
  if (r > 100 && g < 60 && b < 60 && avg < 90) return 'Maroon';

  // Browns / beiges (r > g > b, warm, mid-luminance)
  if (r > g && g > b && avg > 100 && avg < 185 && diff < 100) {
    if (avg > 165) return 'Beige';
    return 'Brown';
  }

  // Hue calculation
  let h = 0;
  if (diff > 0) {
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / diff + 2) * 60;
    else h = ((r - g) / diff + 4) * 60;
  }

  const l = avg / 255;
  const s = diff / (255 - Math.abs(2 * avg - 255));

  if (h < 15  || h >= 345) return 'Red';
  if (h < 45)              return s > 0.5 ? 'Orange' : 'Brown';
  if (h < 70)              return 'Yellow';
  if (h < 155)             return 'Green';
  if (h < 195)             return 'Cyan';
  if (h < 255)             return l < 0.35 ? 'Navy' : 'Blue';
  if (h < 285)             return 'Purple';
  if (h < 345)             return 'Pink';
  return 'Red';
}

function Section({ title, children, defaultOpen = true, accent = '#7c6aff' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border-glass)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 0', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</span>
        {open
          ? <ChevronUp size={15} color="var(--text-muted)" />
          : <ChevronDown size={15} color="var(--text-muted)" />}
      </button>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </div>
  );
}

function Checkbox({ checked, onChange, label, count, accent }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }} onClick={onChange}>
      <div style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0, transition: 'all 0.15s',
        border: `1.5px solid ${checked ? accent : 'var(--border-glass)'}`,
        background: checked ? accent : 'var(--bg-glass)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, lineHeight: 1.3 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({count})</span>
      )}
    </label>
  );
}

/* ─── Dual-handle price range slider ─── */
function DualRangeSlider({ min, max, valueMin, valueMax, accent, onChange }) {
  const trackRef  = useRef(null);
  const dragRef   = useRef(null);          // 'min' | 'max' | null  — stable ref
  const stateRef  = useRef({});            // always-fresh values for drag handler

  // Keep stateRef in sync with latest props without recreating handlers
  stateRef.current = { valueMin, valueMax, min, max, onChange };

  const step = max > 0 ? Math.max(50, Math.round((max - min) / 100 / 50) * 50) : 100;

  function pct(v) {
    if (max <= min) return 0;
    return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  }

  function valueFromClientX(clientX) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw   = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }

  // Stable handlers — registered once, read fresh values via stateRef
  useEffect(() => {
    function handleMove(e) {
      if (!dragRef.current) return;
      const { valueMin: vMin, valueMax: vMax, min: mn, max: mx, onChange: cb } = stateRef.current;
      const v = valueFromClientX(e.clientX);
      if (dragRef.current === 'min') {
        cb({ priceMin: Math.max(mn, Math.min(v, vMax - step)) });
      } else {
        cb({ priceMax: Math.min(mx, Math.max(v, vMin + step)) });
      }
    }
    function handleUp() { dragRef.current = null; }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup',  handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup',  handleUp);
    };
  }, [step]);  // only re-register if step changes (rarely)

  function handleTrackClick(e) {
    if (dragRef.current) return;
    const v    = valueFromClientX(e.clientX);
    const dMin = Math.abs(v - valueMin);
    const dMax = Math.abs(v - valueMax);
    if (dMin <= dMax) onChange({ priceMin: Math.max(min, Math.min(v, valueMax - step)) });
    else              onChange({ priceMax: Math.min(max, Math.max(v, valueMin + step)) });
  }

  const pMin = pct(valueMin);
  const pMax = pct(valueMax);

  const thumbStyle = p => ({
    position: 'absolute', top: '50%', left: `${p}%`,
    transform: 'translate(-50%, -50%)',
    width: 18, height: 18, borderRadius: '50%',
    background: accent, border: '3px solid white',
    boxShadow: '0 1px 8px rgba(0,0,0,0.28)',
    cursor: 'grab', zIndex: 3, touchAction: 'none',
    transition: 'box-shadow 0.15s',
  });

  return (
    <div style={{ padding: '6px 4px 4px', userSelect: 'none' }}>
      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{ position: 'relative', height: 4, background: 'var(--border-glass)', borderRadius: 2, margin: '22px 9px 20px', cursor: 'pointer' }}
      >
        {/* Filled range */}
        <div style={{
          position: 'absolute', top: 0, height: '100%',
          background: accent, borderRadius: 2,
          left: `${pMin}%`, right: `${100 - pMax}%`,
        }} />

        {/* Min thumb */}
        <div
          style={thumbStyle(pMin)}
          onMouseDown={e => { e.preventDefault(); dragRef.current = 'min'; }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 6px ${accent}33`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.28)'}
        />

        {/* Max thumb */}
        <div
          style={thumbStyle(pMax)}
          onMouseDown={e => { e.preventDefault(); dragRef.current = 'max'; }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 6px ${accent}33`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.28)'}
        />
      </div>

      {/* Price label */}
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        ₹{valueMin.toLocaleString('en-IN')} — ₹{valueMax.toLocaleString('en-IN')}{valueMax >= max ? '+' : ''}
      </p>
    </div>
  );
}

function RadioBtn({ checked, onChange, label, accent }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }} onClick={onChange}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, transition: 'all 0.15s',
        border: `1.5px solid ${checked ? accent : 'var(--border-glass)'}`,
        background: 'var(--bg-glass)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{label}</span>
    </label>
  );
}

export default function FilterSidebar({ products, filters, onChange, accentColor = '#7c6aff', hiddenCategories = [] }) {
  const [brandSearch, setBrandSearch] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  /* ── Derived data from products ── */
  const categories = useMemo(() => {
    const map = {};
    products.forEach(p => { const c = p.category || 'Other'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map)
      .filter(([c]) => !hiddenCategories.includes(c))
      .sort((a, b) => b[1] - a[1]);
  }, [products, hiddenCategories]);

  const brands = useMemo(() => {
    const map = {};
    products.forEach(p => { if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const priceRange = useMemo(() => {
    const prices = products.map(p => p.price).filter(Boolean);
    if (!prices.length) return { min: 0, max: 10000 };
    return { min: 0, max: Math.ceil(Math.max(...prices) / 500) * 500 };
  }, [products]);

  const availableColors = useMemo(() => {
    // count how many products belong to each color family
    const familyCount = {};   // name → count
    const familyHex   = {};   // name → first real hex seen (for swatch)

    products.forEach(p => {
      const seen = new Set();
      (p.colors || []).forEach(hex => {
        const name = hexToColorFamily(hex);
        if (!name || seen.has(name)) return;
        seen.add(name);
        familyCount[name] = (familyCount[name] || 0) + 1;
        if (!familyHex[name]) familyHex[name] = hex;
      });
    });

    // order by COLOR_FAMILIES order, only include present ones
    return COLOR_FAMILIES
      .filter(cf => familyCount[cf.name])
      .map(cf => ({
        name:  cf.name,
        hex:   familyHex[cf.name] || cf.hex, // real product hex or fallback
        count: familyCount[cf.name],
      }));
  }, [products]);

  const curMin = Math.max(0, Math.min(filters.priceMin ?? 0, priceRange.max));
  const curMax = Math.max(curMin + 100, Math.min(filters.priceMax ?? priceRange.max, priceRange.max));

  const filteredBrands = brands.filter(([b]) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 8);
  const visibleColors = showAllColors ? availableColors : availableColors.slice(0, 8);

  const activeCount = [
    (filters.categories || []).length,
    (filters.brands || []).length,
    (filters.colors || []).length,
    (filters.minDiscount || 0) > 0 ? 1 : 0,
    curMin > 0 || curMax < priceRange.max ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function toggle(key, val) {
    const cur = filters[key] || [];
    onChange({ ...filters, [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
  }

  function clearAll() {
    onChange({ categories: [], brands: [], colors: [], minDiscount: 0, priceMin: 0, priceMax: priceRange.max });
  }

  return (
    <div style={{ width: 230, flexShrink: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '2px solid var(--border-glass)', marginBottom: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Filters
        </span>
        {activeCount > 0 && (
          <button onClick={clearAll}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: accentColor, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <X size={11} /> Clear All ({activeCount})
          </button>
        )}
      </div>

      {/* CATEGORY */}
      {categories.length > 1 && (
        <Section title="Category" accent={accentColor}>
          {categories.map(([cat, count]) => (
            <Checkbox key={cat}
              checked={(filters.categories || []).includes(cat)}
              onChange={() => toggle('categories', cat)}
              label={cat} count={count} accent={accentColor} />
          ))}
        </Section>
      )}

      {/* BRAND */}
      {brands.length > 0 && (
        <Section title="Brand" accent={accentColor}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--border-glass)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, background: 'var(--bg-glass)' }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              value={brandSearch}
              onChange={e => setBrandSearch(e.target.value)}
              placeholder="Search Brand"
              style={{ border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-primary)', background: 'transparent', width: '100%', fontFamily: 'inherit' }}
            />
          </div>
          {visibleBrands.map(([brand, count]) => (
            <Checkbox key={brand}
              checked={(filters.brands || []).includes(brand)}
              onChange={() => toggle('brands', brand)}
              label={brand} count={count} accent={accentColor} />
          ))}
          {filteredBrands.length > 8 && (
            <button onClick={() => setShowAllBrands(v => !v)}
              style={{ fontSize: 12, fontWeight: 700, color: accentColor, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 2px', fontFamily: 'inherit' }}>
              {showAllBrands ? '− Show Less' : `+ ${filteredBrands.length - 8} more`}
            </button>
          )}
        </Section>
      )}

      {/* PRICE */}
      <Section title="Price" accent={accentColor}>
        <DualRangeSlider
          min={0}
          max={priceRange.max}
          valueMin={curMin}
          valueMax={curMax}
          accent={accentColor}
          onChange={patch => onChange({ ...filters, ...patch })}
        />
      </Section>

      {/* COLOR */}
      {availableColors.length > 0 && (
        <Section title="Color" accent={accentColor}>
          {visibleColors.map(({ name, hex, count }) => (
            <label key={name}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }}
              onClick={() => toggle('colors', name)}>
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${(filters.colors || []).includes(name) ? accentColor : 'var(--border-glass)'}`,
                background: (filters.colors || []).includes(name) ? accentColor : 'var(--bg-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
                {(filters.colors || []).includes(name) && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({count})</span>
            </label>
          ))}
          {availableColors.length > 8 && (
            <button onClick={() => setShowAllColors(v => !v)}
              style={{ fontSize: 12, fontWeight: 700, color: accentColor, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 2px', fontFamily: 'inherit' }}>
              {showAllColors ? '− Show Less' : `+ ${availableColors.length - 8} more`}
            </button>
          )}
        </Section>
      )}

      {/* DISCOUNT RANGE */}
      <Section title="Discount Range" accent={accentColor}>
        {DISCOUNT_OPTIONS.map(({ label, value }) => (
          <RadioBtn key={value}
            checked={(filters.minDiscount || 0) === value}
            onChange={() => onChange({ ...filters, minDiscount: filters.minDiscount === value ? 0 : value })}
            label={label} accent={accentColor} />
        ))}
      </Section>

    </div>
  );
}
