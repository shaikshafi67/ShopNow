import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Save, Package, AlertTriangle, Upload, ImagePlus, XCircle } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';
import { inr } from '../../utils/format';

const EMPTY_FORM = {
  name: '', price: '', originalPrice: '', category: 'T-Shirts', gender: 'men',
  brand: 'ShopNow', tag: 'New', description: '', stock: '25',
  sizes: 'S,M,L,XL', colors: '#1a1a1a', images: [], tryOnReady: false,
};

// Convert a File object to a base64 data URL
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress image slightly to fit within massive IndexedDB limits without noticeable loss
function compressImage(dataUrl, maxSize = 2000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // High quality JPEG (0.95)
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataUrl;
  });
}

export default function AdminProducts() {
  const { products, create, update, remove } = useCatalog();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ ...EMPTY_FORM, images: [] }); setEditingId(null); setFormOpen(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name, price: String(p.price), originalPrice: String(p.originalPrice || p.price),
      category: p.category, gender: p.gender, brand: p.brand || '', tag: p.tag || 'New',
      description: p.description || '', stock: String(p.stock ?? 25),
      sizes: (p.sizes || []).join(','), colors: (p.colors || []).join(','),
      images: [...(p.images || [])], tryOnReady: Boolean(p.tryOnReady),
    });
    setEditingId(p.id);
    setFormOpen(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newImages = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64);
        newImages.push(compressed);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded`);
    } catch {
      toast.error('Failed to process image');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) { toast.error('Name and price are required.'); return; }
    const data = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || form.price),
      stock: Number(form.stock) || 0,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      images: form.images,
      discount: form.originalPrice
        ? Math.max(0, Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100))
        : 0,
    };
    if (editingId) { update(editingId, data); toast.success('Product updated.'); }
    else { create(data); toast.success('Product created.'); }
    setFormOpen(false);
  };

  const confirmDelete = (id) => { setDeleteId(id); };
  const doDelete = () => { remove(deleteId); toast.info('Product deleted.'); setDeleteId(null); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Products</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{products.length} products in catalog</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ gap: 8 }}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
        borderRadius: 50, padding: '10px 16px', maxWidth: 400,
      }}>
        <Search size={15} color="var(--text-muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)' }}>
                {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{
                      width: 44, height: 52, borderRadius: 8,
                      background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                    }} />
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{p.brand}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{p.category}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{p.gender}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                    {inr(p.price)}
                    {p.discount > 0 && <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>{p.discount}% off</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: (p.stock ?? 25) <= 5 ? '#ef4444' : (p.stock ?? 25) <= 10 ? '#ea580c' : '#22c55e',
                    }}>
                      {p.stock ?? 25}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => confirmDelete(p.id)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No products found.</div>
          )}
        </div>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <Modal onClose={() => setFormOpen(false)} title={editingId ? 'Edit product' : 'Add product'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Product name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} full />
              <Field label="Price (₹) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              <Field label="Original price (₹)" type="number" value={form.originalPrice} onChange={(v) => setForm({ ...form, originalPrice: v })} />
              <Field label="Stock quantity" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
              <SelectField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={['T-Shirts', 'Shirts', 'Jeans', 'Tops', 'Dresses', 'Kurtis', 'Sarees', 'Co-ords', 'Jackets', 'Shorts']} />
              <SelectField label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={['men', 'women', 'unisex']} />
              <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <SelectField label="Tag" value={form.tag} onChange={(v) => setForm({ ...form, tag: v })} options={['New', 'Bestseller', 'Trending', 'Hot', 'Sale', 'Premium']} />
              <Field label="Sizes (comma-separated)" value={form.sizes} onChange={(v) => setForm({ ...form, sizes: v })} placeholder="XS,S,M,L,XL" full />
              <Field label="Colors (hex, comma-separated)" value={form.colors} onChange={(v) => setForm({ ...form, colors: v })} placeholder="#ff0000,#00ff00" full />

              {/* IMAGE UPLOAD SECTION */}
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                  Product Images
                </span>

                {/* Uploaded images preview */}
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    {form.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: 80, height: 96, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                        <img src={img} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeImage(i)}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'rgba(239,68,68,0.9)', border: 'none',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 0,
                          }}
                        >
                          <XCircle size={14} />
                        </button>
                        {i === 0 && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(124,106,255,0.9)', color: 'white',
                            fontSize: 9, fontWeight: 700, textAlign: 'center',
                            padding: '2px 0', textTransform: 'uppercase',
                          }}>Main</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    if (files.length > 0) {
                      const fakeEvent = { target: { files } };
                      await handleFileUpload(fakeEvent);
                    }
                  }}
                  style={{
                    border: '2px dashed var(--border-glass)',
                    borderRadius: 12,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-glass)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  {uploading ? (
                    <div style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>
                      Processing images...
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(124,106,255,0.1)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 10,
                      }}>
                        <ImagePlus size={22} color="var(--accent)" />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Click to upload or drag & drop
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        JPG, PNG, WebP — multiple files allowed
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline full />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={form.tryOnReady} onChange={(e) => setForm({ ...form, tryOnReady: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                Try-On ready
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={handleSave} className="btn btn-primary"><Save size={15} /> Save</button>
              <button onClick={() => setFormOpen(false)} className="btn btn-ghost"><X size={15} /> Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <Modal onClose={() => setDeleteId(null)} title="Delete product">
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
              <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                This will permanently delete the product and all its data. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={doDelete} style={{ ...dangerBtn }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 26px', width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const fieldBase = {
  width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)',
  fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
};

function Field({ label, value, onChange, type = 'text', multiline, placeholder, full }) {
  const style = { ...fieldBase, gridColumn: full ? '1 / -1' : 'auto' };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} style={{ ...style, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...fieldBase, cursor: 'pointer' }}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

const dangerBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
  borderRadius: 50, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', border: 'none', background: '#ef4444', color: 'white',
};
