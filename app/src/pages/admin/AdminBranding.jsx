import { useRef, useState } from 'react';
import { Upload, Trash2, Check, X, Sparkles, Type, Share2 } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useToast } from '../../context/ToastContext';

function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
}
function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
}
function YoutubeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>;
}

const SOCIAL_FIELDS = [
  { key: 'facebook',  label: 'Facebook',  Icon: FacebookIcon,  placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, placeholder: 'https://instagram.com/yourhandle' },
  { key: 'youtube',   label: 'YouTube',   Icon: YoutubeIcon,   placeholder: 'https://youtube.com/@yourchannel' },
];

const MAX_MB = 5;

function readImageFile(file, onResult) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please upload an image file (PNG, JPG, SVG, WebP).'); return; }
  if (file.size > MAX_MB * 1024 * 1024) { alert(`Logo must be under ${MAX_MB} MB.`); return; }
  const reader = new FileReader();
  reader.onload = (e) => onResult(e.target.result);
  reader.readAsDataURL(file);
}

export default function AdminBranding() {
  const { logoUrl, brandName, socials, setLogo, clearLogo, setBrandName, setSocials } = useBrand();
  const toast = useToast();
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [pendingLogo, setPendingLogo] = useState(null);
  const [nameInput, setNameInput] = useState(brandName);
  const [socialInputs, setSocialInputs] = useState(() => ({
    facebook: '', instagram: '', youtube: '', ...(socials || {}),
  }));

  function handleFile(file) { readImageFile(file, (url) => setPendingLogo(url)); }

  function handleSaveLogo() {
    setLogo(pendingLogo);
    setPendingLogo(null);
    toast.success('Logo updated!');
  }

  function handleCancelLogo() {
    setPendingLogo(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleRemoveLogo() {
    clearLogo();
    setPendingLogo(null);
    toast.info('Logo removed — using default.');
  }

  function handleSaveName() {
    setBrandName(nameInput.trim());
    toast.success('Brand name updated!');
  }

  const displayLogo = pendingLogo ?? logoUrl;

  const cardStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 20,
    padding: '24px 28px',
    marginBottom: 24,
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid var(--border-glass)', background: 'var(--bg-glass)',
    color: 'var(--text-primary)', fontSize: 15, fontFamily: 'var(--font-body)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, margin: 0 }}>Branding</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>Customize your store logo and brand name</p>
      </div>

      {/* ── LOGO UPLOAD ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={18} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>Store Logo</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Upload a PNG, SVG, or WebP logo. Recommended size: <strong style={{ color: 'var(--text-secondary)' }}>200×60px</strong>. Transparent backgrounds work best.
        </p>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Upload zone */}
          <div
            onClick={() => !displayLogo && fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            style={{
              width: 260, height: 130, borderRadius: 14, position: 'relative', overflow: 'hidden',
              border: `2px dashed ${drag ? 'var(--accent)' : displayLogo ? 'transparent' : 'var(--border-glass)'}`,
              background: displayLogo ? 'var(--bg-glass)' : drag ? 'rgba(124,106,255,0.06)' : 'var(--bg-glass)',
              cursor: displayLogo ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
          >
            {displayLogo ? (
              <>
                <img src={displayLogo} alt="Logo preview"
                  style={{ maxWidth: '85%', maxHeight: '80%', objectFit: 'contain', display: 'block' }} />

                {/* Pending overlay — always visible */}
                {pendingLogo && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>Preview — not saved</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSaveLogo}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 50, background: 'var(--accent)', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'white' }}>
                        <Check size={13} /> Save
                      </button>
                      <button onClick={handleCancelLogo}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 50, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'white' }}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved overlay — show on hover */}
                {!pendingLogo && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transition: 'opacity 0.2s', borderRadius: 12 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 50, background: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                      <Upload size={12} /> Replace
                    </button>
                    <button onClick={handleRemoveLogo}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 50, background: 'rgba(239,68,68,0.85)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'white' }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Click or drag to upload</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>PNG, SVG, WebP, JPG — up to {MAX_MB} MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* Live preview */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Navbar preview</p>
            <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {displayLogo ? (
                <img src={displayLogo} alt="logo" style={{ height: 32, maxWidth: 140, objectFit: 'contain' }} />
              ) : (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c6aff,#ff6a9a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="white" />
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg,#7c6aff,#ff6a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {nameInput || 'ShopNow'}
                  </span>
                </>
              )}
            </div>

            {logoUrl && !pendingLogo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Custom logo active</span>
              </div>
            )}
            {pendingLogo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Click "Save" to apply</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BRAND NAME ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Type size={18} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>Brand Name</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Shown in the navbar when no custom logo image is uploaded.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            style={inputStyle}
            value={nameInput}
            maxLength={32}
            onChange={e => setNameInput(e.target.value)}
            placeholder="e.g. ShopNow"
          />
          <button
            className="btn btn-primary"
            onClick={handleSaveName}
            disabled={nameInput.trim() === brandName}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Check size={15} /> Save Name
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Current: <strong style={{ color: 'var(--text-secondary)' }}>{brandName}</strong>
        </p>
      </div>

      {/* ── SOCIAL LINKS ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Share2 size={18} color="var(--accent)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>Social Media Links</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          These links appear as icons in the footer. Leave blank to hide.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SOCIAL_FIELDS.map(({ key, label, Icon, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Icon /> {label}
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={inputStyle}
                  value={socialInputs[key] || ''}
                  onChange={e => setSocialInputs(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSocials({ [key]: socialInputs[key] });
                    toast.success(`${label} link saved!`);
                  }}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Check size={15} /> Save
                </button>
              </div>
              {socials?.[key] && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  Active: <span style={{ color: 'var(--accent)' }}>{socials[key]}</span>
                  <button
                    onClick={() => { setSocials({ [key]: '' }); setSocialInputs(p => ({ ...p, [key]: '' })); toast.info(`${label} link removed.`); }}
                    style={{ marginLeft: 10, background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', padding: 0 }}
                  >
                    Remove
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
