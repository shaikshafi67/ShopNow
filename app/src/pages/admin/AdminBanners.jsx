import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Edit3, Eye, EyeOff, X, Check, Link, Upload, UserSquare2, Maximize2, AlertTriangle } from 'lucide-react';
import { useBanners, BANNER_HEIGHT_PRESETS } from '../../context/BannersContext';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { image: '', title: '', subtitle: '', link: '/', active: true };

function isVideo(url) { return url && url.startsWith('data:video/'); }

// Hero images: images up to 10 MB, videos up to 30 MB (larger files can exceed IDB limits)
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 30;

// Compress image so base64 stays under ~2MB (safe for IndexedDB across all browsers)
function compressHeroImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Try progressively smaller until we get under 2MB
      const MAX_BYTES = 2 * 1024 * 1024;
      const tryCompress = (maxDim, quality) => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length <= MAX_BYTES || maxDim <= 400) return result;
        // Too large — reduce further
        if (quality > 0.4) return tryCompress(maxDim, quality - 0.15);
        return tryCompress(Math.round(maxDim * 0.75), 0.6);
      };
      resolve(tryCompress(1200, 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readMediaFile(file, onResult, onError) {
  if (!file) return;
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  if (!isImg && !isVid) return;

  const maxMB = isVid ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > maxMB * 1024 * 1024) {
    onError?.(`${isVid ? 'Video' : 'Image'} too large. Max ${maxMB} MB — please compress it first.`);
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    if (isImg) {
      // Compress images to fit within IDB limits
      const compressed = await compressHeroImage(dataUrl);
      onResult(compressed);
    } else {
      onResult(dataUrl);
    }
  };
  reader.readAsDataURL(file);
}

function BannerForm({ initial = EMPTY_FORM, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function readFile(file) { readMediaFile(file, (result) => set('image', result)); }

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
              {isVideo(form.image) ? (
                <video src={form.image} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} controls muted />
              ) : (
                <img src={form.image} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
              )}
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
              <ImageIcon size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Click or drag image / video here</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>PNG, JPG, WebP, MP4, WebM — up to {MAX_VIDEO_MB} MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => readFile(e.target.files[0])} />
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

/* ─── Hero Panel Image Upload ─── */
function HeroImageUpload({ side, label, accent, image, onUpload, onClear }) {
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState(null); // selected but not yet saved

  function readFile(file) {
    readMediaFile(
      file,
      (result) => setPending(result),
      (errMsg) => alert(errMsg)
    );
  }
  function handleSave() { onUpload(pending); setPending(null); }
  function handleCancelPending() { setPending(null); fileRef.current && (fileRef.current.value = ''); }

  const display = pending ?? image; // what to show in the preview box

  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
        {label}
      </div>
      <div
        onClick={() => !display && fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        style={{
          position: 'relative', height: 280, borderRadius: 16, overflow: 'hidden', cursor: display ? 'default' : 'pointer',
          border: `2px dashed ${drag ? accent : display ? 'transparent' : 'var(--border-glass)'}`,
          background: display ? 'transparent' : drag ? accent + '10' : 'var(--bg-glass)',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {display ? (
          <>
            {isVideo(display) ? (
              <video src={display} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 14 }} autoPlay muted loop playsInline />
            ) : (
              <img src={display} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 14 }} />
            )}

            {/* Pending state — always-visible save/cancel bar */}
            {pending ? (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>Preview — not saved yet</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 50, background: accent, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'white', boxShadow: `0 0 20px ${accent}55` }}>
                    <Check size={14} /> Save Photo
                  </button>
                  <button onClick={handleCancelPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 50, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white' }}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Saved state — show replace/remove on hover */
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0, transition: 'opacity 0.2s', borderRadius: 14 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <button onClick={() => fileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 50, background: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                  <Upload size={13} /> Replace
                </button>
                <button onClick={onClear}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 50, background: 'rgba(239,68,68,0.8)', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white' }}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <UserSquare2 size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Upload {label} Photo or Video</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>JPG, PNG, WebP, MP4, WebM — up to {MAX_VIDEO_MB} MB</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 50, background: accent + '18', border: `1px solid ${accent}44`, color: accent, fontSize: 13, fontWeight: 600 }}>
              <Upload size={13} /> Click or drag to upload
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0])} />
      </div>

      {/* Status line below the box */}
      {pending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
          <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>Click "Save Photo" to apply to homepage</span>
        </div>
      ) : image ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{isVideo(image) ? 'Video' : 'Image'} saved — showing on homepage</span>
          {isVideo(image) && (
            <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>⚠ Videos may not persist after page reload. Use images for best reliability.</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminBanners() {
  const { banners, loading, addBanner, updateBanner, removeBanner, moveBanner, heroImages, setHeroImage, clearHeroImage } = useBanners();
  const toast = useToast();
  const [mode, setMode] = useState(null);

  // Show warning if IDB save fails (e.g. video too large for browser storage)
  useEffect(() => {
    const handler = (e) => {
      toast.error(`Hero image saved in session only — file may be too large to persist after reload. Try a smaller file (images < 10 MB, videos < 30 MB).`);
    };
    window.addEventListener('hero-save-error', handler);
    return () => window.removeEventListener('hero-save-error', handler);
  }, [toast]);

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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, margin: 0 }}>Banners & Hero</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>Upload hero images and manage homepage banners</p>
        </div>
        {mode === null && (
          <button className="btn btn-primary" onClick={() => setMode('add')}>
            <Plus size={16} /> Add banner
          </button>
        )}

      {/* ── HERO PANEL IMAGES ── */}
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <UserSquare2 size={18} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>Homepage Hero Images</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>
          Upload real fashion photos for the Men's and Women's split-panel hero on the homepage. Best size: <strong style={{ color: 'var(--text-secondary)' }}>600×900px portrait</strong> or taller.
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <HeroImageUpload
            side="men" label="Men's Hero Photo" accent="#7c6aff"
            image={heroImages.men}
            onUpload={img => { setHeroImage('men', img); toast.success('Men\'s hero photo updated!'); }}
            onClear={() => { clearHeroImage('men'); toast.info('Men\'s hero photo removed.'); }}
          />
          <HeroImageUpload
            side="women" label="Women's Hero Photo" accent="#ff6a9a"
            image={heroImages.women}
            onUpload={img => { setHeroImage('women', img); toast.success('Women\'s hero photo updated!'); }}
            onClear={() => { clearHeroImage('women'); toast.info('Women\'s hero photo removed.'); }}
          />
        </div>
        <div style={{ marginTop: 18, padding: '12px 16px', background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.18)', borderRadius: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong> Use high-quality fashion photos with a person walking or posing. Dark or neutral backgrounds work best. The image will be shown with a gradient overlay matching the panel's color theme.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Slideshow Banners</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Auto-rotating banners shown when at least one active banner exists.</p>
        </div>
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
          <ImageIcon size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
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
                {isVideo(b.image) ? (
                  <video src={b.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
                ) : (
                  <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
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
