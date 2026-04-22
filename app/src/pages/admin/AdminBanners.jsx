import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Plus, Trash2, ChevronUp, ChevronDown, Edit3, Eye, EyeOff, X, Check, Link } from 'lucide-react';
import { useBanners } from '../../context/BannersContext';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { image: '', title: '', subtitle: '', link: '/', active: true };

function BannerForm({ initial = EMPTY_FORM, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => set('image', e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    readFile(e.dataTransfer.files[0]);
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--border-glass)', background: 'var(--bg-glass)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Image upload */}
      <div>
        <span style={labelStyle}>Banner image *</span>
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-glass)'}`,
            borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
            background: dragOver ? 'rgba(124,106,255,0.05)' : 'var(--bg-glass)',
            transition: 'all 0.2s', position: 'relative',
          }}
        >
          {form.image ? (
            <>
              <img src={form.image} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
              >
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Click to change</span>
              </div>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Image size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Click or drag image here</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>PNG, JPG, WebP — any size</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => readFile(e.target.files[0])} />
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>Title (optional)</label>
        <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Summer Sale 2026" />
      </div>

      {/* Subtitle */}
      <div>
        <label style={labelStyle}>Subtitle (optional)</label>
        <input style={inputStyle} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Up to 50% off on all items" />
      </div>

      {/* Link */}
      <div>
        <label style={labelStyle}>CTA link</label>
        <div style={{ position: 'relative' }}>
          <Link size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={{ ...inputStyle, paddingLeft: 34 }} value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="/sale" />
        </div>
      </div>

      {/* Active toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div
          onClick={() => set('active', !form.active)}
          style={{
            width: 40, height: 22, borderRadius: 11, position: 'relative',
            background: form.active ? 'var(--accent)' : 'var(--border-glass)',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: form.active ? 21 : 3,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Active (visible on homepage)</span>
      </label>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}><X size={15} /> Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!form.image}
          onClick={() => onSave(form)}
        >
          <Check size={15} /> Save banner
        </button>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const { banners, loading, addBanner, updateBanner, removeBanner, moveBanner } = useBanners();
  const toast = useToast();
  const [mode, setMode] = useState(null); // null | 'add' | { edit: banner }

  function handleAdd(form) {
    addBanner(form);
    toast.success('Banner added!');
    setMode(null);
  }

  function handleEdit(form) {
    updateBanner(mode.edit.id, form);
    toast.success('Banner updated!');
    setMode(null);
  }

  function handleRemove(id) {
    removeBanner(id);
    toast.info('Banner removed.');
  }

  function handleToggle(b) {
    updateBanner(b.id, { active: !b.active });
  }

  const cardStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 16,
    padding: 20,
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, margin: 0 }}>Hero Banners</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>Manage the auto-sliding banner images on your homepage</p>
        </div>
        {mode === null && (
          <button className="btn btn-primary" onClick={() => setMode('add')}>
            <Plus size={16} /> Add banner
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ ...cardStyle, marginBottom: 24, border: '1.5px solid rgba(124,106,255,0.3)' }}
          >
            <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 18 }}>{mode === 'add' ? 'Add new banner' : 'Edit banner'}</h2>
            <BannerForm
              initial={mode === 'add' ? EMPTY_FORM : mode.edit}
              onSave={mode === 'add' ? handleAdd : handleEdit}
              onCancel={() => setMode(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>
      ) : banners.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
          <Image size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No banners yet. Add one to display on the homepage.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {banners.map((b, i) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...cardStyle, display: 'flex', gap: 16, alignItems: 'center', opacity: b.active ? 1 : 0.55 }}
            >
              {/* Reorder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <button
                  className="btn btn-ghost"
                  disabled={i === 0}
                  onClick={() => moveBanner(b.id, 'up')}
                  style={{ padding: '4px 6px', opacity: i === 0 ? 0.3 : 1 }}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={i === banners.length - 1}
                  onClick={() => moveBanner(b.id, 'down')}
                  style={{ padding: '4px 6px', opacity: i === banners.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Thumbnail */}
              <div style={{
                width: 120, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
              }}>
                <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.title || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(no title)</span>}
                </p>
                {b.subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.subtitle}</p>}
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Link: {b.link}</p>
              </div>

              {/* Status badge */}
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: b.active ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.15)',
                color: b.active ? '#16a34a' : 'var(--text-muted)',
              }}>
                {b.active ? 'Active' : 'Hidden'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-ghost" onClick={() => handleToggle(b)} title={b.active ? 'Hide' : 'Show'} style={{ padding: '7px 9px' }}>
                  {b.active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button className="btn btn-ghost" onClick={() => setMode({ edit: b })} style={{ padding: '7px 9px' }}>
                  <Edit3 size={16} />
                </button>
                <button className="btn btn-ghost" onClick={() => handleRemove(b.id)} style={{ padding: '7px 9px', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {banners.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          {banners.filter(b => b.active).length} of {banners.length} banners active · drag order with arrows
        </p>
      )}
    </div>
  );
}
