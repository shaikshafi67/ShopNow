import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useAnnouncements } from '../../context/AnnouncementsContext';
import { useToast } from '../../context/ToastContext';

const PAGES = [
  { id: 'home',  label: 'Home Page',    accent: '#7c6aff' },
  { id: 'men',   label: 'Men Page',     accent: '#3b82f6' },
  { id: 'women', label: 'Women Page',   accent: '#ff6a9a' },
];

const SEPARATOR_OPTIONS = ['✦', '·', '•', '|', '→', '★', '♦', '/'];

function ColorSwatch({ value, onChange, label }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid var(--border-glass)', cursor: 'pointer', padding: 2, background: 'none' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{value}</span>
      </div>
    </label>
  );
}

function BarEditor({ page, bar, onUpdate }) {
  const [newItem, setNewItem] = useState('');

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    onUpdate({ items: [...bar.items, text.toUpperCase()] });
    setNewItem('');
  }

  function removeItem(i) {
    onUpdate({ items: bar.items.filter((_, idx) => idx !== i) });
  }

  function editItem(i, val) {
    const next = [...bar.items];
    next[i] = val.toUpperCase();
    onUpdate({ items: next });
  }

  function moveItem(i, dir) {
    const next = [...bar.items];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    onUpdate({ items: next });
  }

  // live preview gradient
  const previewBg = `linear-gradient(${bar.bgDir || '135deg'}, ${bar.bgFrom}, ${bar.bgTo})`;

  return (
    <div style={{ display: 'grid', gap: 24 }}>

      {/* Live preview */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Live Preview</p>
        <div style={{ background: previewBg, padding: '10px 20px', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', overflow: 'hidden' }}>
            {bar.items.slice(0, 5).map((item, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', color: bar.textColor || '#fff', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                {item} <span style={{ opacity: 0.6 }}>{bar.separator}</span>
              </span>
            ))}
            {bar.items.length === 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>No items added yet</span>}
          </div>
        </div>
      </div>

      {/* Active toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div
          onClick={() => onUpdate({ active: !bar.active })}
          style={{
            width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0,
            background: bar.active ? 'var(--accent)' : 'var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer',
          }}
        >
          <div style={{
            position: 'absolute', top: 4, left: bar.active ? 23 : 4,
            width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {bar.active ? 'Visible on site' : 'Hidden'}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Toggle to show or hide this bar</p>
        </div>
      </label>

      {/* Colors */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>Background Gradient</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <ColorSwatch label="From color" value={bar.bgFrom} onChange={v => onUpdate({ bgFrom: v })} />
          <ColorSwatch label="To color"   value={bar.bgTo}   onChange={v => onUpdate({ bgTo: v })} />
          <ColorSwatch label="Text color" value={bar.textColor || '#ffffff'} onChange={v => onUpdate({ textColor: v })} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Direction</span>
            <select
              value={bar.bgDir || '135deg'}
              onChange={e => onUpdate({ bgDir: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
            >
              {['90deg','135deg','180deg','45deg'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Separator & Speed */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Separator</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SEPARATOR_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => onUpdate({ separator: s })}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: `2px solid ${bar.separator === s ? 'var(--accent)' : 'var(--border-glass)'}`,
                  background: bar.separator === s ? 'rgba(124,106,255,0.15)' : 'var(--bg-glass)',
                  color: bar.separator === s ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 14, cursor: 'pointer', fontWeight: 700,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
            Scroll Speed — {bar.speed}s
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fast</span>
            <input
              type="range" min={8} max={60} value={bar.speed}
              onChange={e => onUpdate({ speed: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slow</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Announcement Items ({bar.items.length})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <AnimatePresence>
            {bar.items.map((item, i) => (
              <motion.div
                key={`${i}-${item}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 10, padding: '8px 10px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                    style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', padding: '1px 3px', opacity: i === 0 ? 0.3 : 0.7, color: 'var(--text-secondary)' }}>
                    <ChevronUp size={12} />
                  </button>
                  <button onClick={() => moveItem(i, 1)} disabled={i === bar.items.length - 1}
                    style={{ background: 'none', border: 'none', cursor: i === bar.items.length - 1 ? 'default' : 'pointer', padding: '1px 3px', opacity: i === bar.items.length - 1 ? 0.3 : 0.7, color: 'var(--text-secondary)' }}>
                    <ChevronDown size={12} />
                  </button>
                </div>

                <GripVertical size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.4 }} />

                <input
                  value={item}
                  onChange={e => editItem(i, e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                    color: 'var(--text-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-body)',
                  }}
                />

                <button onClick={() => removeItem(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: 6, flexShrink: 0, opacity: 0.7 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add new item */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Type announcement text and press Enter or +"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid var(--border-glass)', background: 'var(--bg-glass)',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
          <button
            className="btn btn-primary"
            onClick={addItem}
            disabled={!newItem.trim()}
            style={{ flexShrink: 0 }}
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const { bars, updateBar } = useAnnouncements();
  const toast = useToast();
  const [activePage, setActivePage] = useState('home');

  function handleUpdate(patch) {
    updateBar(activePage, patch);
    toast.success('Saved!');
  }

  const bar = bars[activePage];
  const current = PAGES.find(p => p.id === activePage);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, margin: 0 }}>Announcement Bars</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
          Customize the scrolling ticker shown on each page
        </p>
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {PAGES.map(p => {
          const isActive = activePage === p.id;
          const barData = bars[p.id];
          return (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12, border: `2px solid ${isActive ? p.accent : 'var(--border-glass)'}`,
                background: isActive ? p.accent + '18' : 'var(--bg-glass)',
                color: isActive ? p.accent : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {p.label}
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: barData?.active ? '#22c55e' : '#6b7280',
                flexShrink: 0,
              }} />
            </button>
          );
        })}
      </div>

      {/* Editor card */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: `1px solid var(--border-glass)`,
        borderRadius: 20, padding: '28px 28px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: current?.accent }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            {current?.label} Announcement Bar
          </h2>
          <span style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: bar?.active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.15)',
            color: bar?.active ? '#16a34a' : 'var(--text-muted)',
          }}>
            {bar?.active ? 'Active' : 'Hidden'}
          </span>
        </div>

        {bar && <BarEditor page={activePage} bar={bar} onUpdate={handleUpdate} />}
      </div>
    </div>
  );
}
