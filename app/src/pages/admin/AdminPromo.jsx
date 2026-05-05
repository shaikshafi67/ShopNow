import { useState } from 'react';
import { Check, Eye, EyeOff, Flame, RotateCcw } from 'lucide-react';
import { usePromo } from '../../context/PromoContext';
import { useToast } from '../../context/ToastContext';

const PAGES = [
  { id: 'home',  label: 'Home — Flash Sale Banner', accent: '#ef4444' },
  { id: 'men',   label: 'Men — Inline Sale Strip',  accent: '#3b82f6' },
  { id: 'women', label: 'Women — Inline Sale Strip', accent: '#ff6a9a' },
];

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1.5px solid var(--border-glass)', background: 'var(--bg-glass)',
          color: 'var(--text-primary)', fontSize: mono ? 13 : 14,
          fontFamily: mono ? 'monospace' : 'var(--font-body)',
          outline: 'none', boxSizing: 'border-box',
          letterSpacing: mono ? '1px' : 'normal',
        }}
      />
    </div>
  );
}

function HomeEditor({ data, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Badge text"   value={data.badge}     onChange={v => onChange({ badge: v })}    placeholder="Flash Sale · Limited Time" />
        <Field label="Coupon code"  value={data.code}      onChange={v => onChange({ code: v })}     placeholder="SAVE10" mono />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Headline (big)"    value={data.headline}  onChange={v => onChange({ headline: v })} placeholder="50% OFF" />
        <Field label="Sub-headline"      value={data.subline}   onChange={v => onChange({ subline: v })}  placeholder="SELECTED STYLES" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Button 1 label" value={data.btn1Label} onChange={v => onChange({ btn1Label: v })} placeholder="Shop Sale Now" />
        <Field label="Button 1 link"  value={data.btn1Link}  onChange={v => onChange({ btn1Link: v })}  placeholder="/sale" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Button 2 label" value={data.btn2Label} onChange={v => onChange({ btn2Label: v })} placeholder="New Arrivals →" />
        <Field label="Button 2 link"  value={data.btn2Link}  onChange={v => onChange({ btn2Link: v })}  placeholder="/new-arrivals" />
      </div>
    </div>
  );
}

function InlineEditor({ data, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Field label="Title"        value={data.title}    onChange={v => onChange({ title: v })}    placeholder="Men's Sale — Up to 40% Off" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Subtitle"     value={data.subtitle} onChange={v => onChange({ subtitle: v })} placeholder="Limited stock · Code" />
        <Field label="Coupon code"  value={data.code}     onChange={v => onChange({ code: v })}     placeholder="SAVE10" mono />
      </div>
      <Field label="Button label" value={data.btnLabel} onChange={v => onChange({ btnLabel: v })} placeholder="Shop Sale" />
    </div>
  );
}

function Preview({ page, data }) {
  if (page === 'home') {
    return (
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#100500,#220a00)', border: '1px solid rgba(239,68,68,0.25)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 50, padding: '4px 12px', marginBottom: 12 }}>
            <Flame size={11} color="#ef4444" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '2px', textTransform: 'uppercase' }}>{data.badge || 'Flash Sale · Limited Time'}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 0.9, marginBottom: 10 }}>
            <div style={{ fontSize: 48, color: '#ef4444' }}>{data.headline || '50% OFF'}</div>
            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.85)' }}>{data.subline || 'SELECTED STYLES'}</div>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Code: </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'white', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{data.code || 'SAVE10'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '12px 28px', borderRadius: 50, background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{data.btn1Label || 'Shop Sale Now'} →</div>
          <div style={{ padding: '10px 24px', borderRadius: 50, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center' }}>{data.btn2Label || 'New Arrivals →'}</div>
        </div>
      </div>
    );
  }

  const accent = page === 'women' ? '#ff6a9a' : '#ef4444';
  const bg = page === 'women'
    ? 'linear-gradient(135deg,rgba(255,106,154,0.07),rgba(251,146,60,0.04))'
    : 'linear-gradient(135deg,rgba(239,68,68,0.07),rgba(239,68,68,0.03))';
  const border = page === 'women' ? 'rgba(255,106,154,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <div style={{ borderRadius: 16, background: bg, border: `1px solid ${border}`, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${page === 'women' ? '255,106,154' : '239,68,68'},0.14)`, border: `1px solid rgba(${page === 'women' ? '255,106,154' : '239,68,68'},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={20} color={accent} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{data.title || (page === 'men' ? "Men's Sale — Up to 40% Off" : "Women's Sale — Up to 50% Off")}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {data.subtitle || 'Limited stock · Code'}{' '}
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4 }}>{data.code || 'SAVE10'}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '9px 20px', borderRadius: 50, background: accent, color: 'white', fontSize: 13, fontWeight: 700 }}>{data.btnLabel || 'Shop Sale'} →</div>
    </div>
  );
}

export default function AdminPromo() {
  const { promos, updatePromo } = usePromo();
  const toast = useToast();
  const [activePage, setActivePage] = useState('home');
  const [draft, setDraft] = useState(() => ({ ...promos }));

  const current = PAGES.find(p => p.id === activePage);
  const pageData = draft[activePage];

  function handleChange(patch) {
    setDraft(prev => ({ ...prev, [activePage]: { ...prev[activePage], ...patch } }));
  }

  function handleSave() {
    updatePromo(activePage, draft[activePage]);
    toast.success('Promo banner saved!');
  }

  function handleToggle() {
    const next = !pageData.active;
    handleChange({ active: next });
    updatePromo(activePage, { ...draft[activePage], active: next });
    toast.success(next ? 'Banner shown.' : 'Banner hidden.');
  }

  function handleReset() {
    if (!window.confirm('Reset to default values?')) return;
    const defaults = {
      home:   { active: true, badge: 'Flash Sale · Limited Time', headline: '50% OFF', subline: 'SELECTED STYLES', code: 'SAVE10', btn1Label: 'Shop Sale Now', btn1Link: '/sale', btn2Label: 'New Arrivals →', btn2Link: '/new-arrivals' },
      men:    { active: true, title: "Men's Sale — Up to 40% Off", subtitle: 'Limited stock · Code', code: 'SAVE10', btnLabel: 'Shop Sale' },
      women:  { active: true, title: "Women's Sale — Up to 50% Off", subtitle: 'Limited stock · Code', code: 'SAVE10', btnLabel: 'Shop Sale' },
    };
    setDraft(prev => ({ ...prev, [activePage]: defaults[activePage] }));
    updatePromo(activePage, defaults[activePage]);
    toast.info('Reset to defaults.');
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, margin: 0 }}>Promo Banners</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>Edit the sale banners shown on Home, Men and Women pages</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {PAGES.map(p => {
          const isActive = activePage === p.id;
          const active = promos[p.id]?.active;
          return (
            <button key={p.id} onClick={() => setActivePage(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `2px solid ${isActive ? p.accent : 'var(--border-glass)'}`, background: isActive ? p.accent + '18' : 'var(--bg-glass)', color: isActive ? p.accent : 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {p.label}
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#22c55e' : '#6b7280' }} />
            </button>
          );
        })}
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '28px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: current?.accent }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>{current?.label}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleToggle}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {pageData?.active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
            </button>
            <button onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <RotateCcw size={13} /> Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={15} /> Save Changes
            </button>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: pageData?.active ? '#22c55e' : '#6b7280' }} />
          <span style={{ fontSize: 12, color: pageData?.active ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
            {pageData?.active ? 'Visible on site' : 'Hidden from site'}
          </span>
        </div>

        {/* Editor */}
        {activePage === 'home'
          ? <HomeEditor data={pageData} onChange={handleChange} />
          : <InlineEditor data={pageData} onChange={handleChange} />
        }

        {/* Live Preview */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Live Preview</p>
          <Preview page={activePage} data={pageData} />
        </div>
      </div>
    </div>
  );
}
