import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft,
  Upload, XCircle, AlertTriangle, ChevronDown,
  Package, MoreHorizontal, Archive, Tag, CheckSquare,
} from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';
import { inr } from '../../utils/format';

/* ── helpers ─────────────────────────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxSize = 2000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  });
}

const EMPTY = {
  name: '', description: '', images: [],
  price: '', compareAt: '', cost: '',
  category: '', gender: 'men', brand: '', tag: 'Active',
  sku: '', barcode: '',
  stock: '0', trackInventory: true,
  sizes: [], colors: [],
  weight: '', physicalProduct: true,
  tryOnReady: false,
  type: '', vendor: '', tags: '',
};

const CATEGORIES = ['T-Shirts', 'Shirts', 'Jeans', 'Tops', 'Dresses', 'Kurtis', 'Sarees', 'Co-ords', 'Jackets', 'Shorts', 'Kurtas', 'Trousers', 'Sweatshirts', 'Blazers'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38'];
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', desc: 'Visible in store' },
  { value: 'Draft', label: 'Draft', desc: 'Not visible in store' },
  { value: 'New', label: 'New', desc: 'Marked as new arrival' },
  { value: 'Bestseller', label: 'Bestseller', desc: 'Marked as bestseller' },
  { value: 'Sale', label: 'Sale', desc: 'Marked on sale' },
];

/* ── main component ──────────────────────────────────────────────────── */
export default function AdminProducts() {
  const { products, create, update, remove } = useCatalog();
  const toast = useToast();

  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const fileRef = useRef(null);

  // bulk selection
  const [selected, setSelected] = useState(new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkField, setBulkField] = useState('tag');
  const [bulkValue, setBulkValue] = useState('');
  const moreRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));

  const bulkSetStatus = (tag) => {
    selected.forEach((id) => update(id, { tag }));
    toast.success(`${selected.size} product${selected.size > 1 ? 's' : ''} set to "${tag}"`);
    setSelected(new Set());
    setMoreOpen(false);
  };
  const bulkDelete = () => {
    selected.forEach((id) => remove(id));
    toast.info(`${selected.size} product${selected.size > 1 ? 's' : ''} deleted`);
    setSelected(new Set());
    setMoreOpen(false);
  };
  const applyBulkEdit = () => {
    selected.forEach((id) => update(id, { [bulkField]: bulkField === 'price' || bulkField === 'stock' ? Number(bulkValue) : bulkValue }));
    toast.success(`Updated ${selected.size} product${selected.size > 1 ? 's' : ''}`);
    setBulkEditOpen(false);
    setSelected(new Set());
  };

  const openAdd = () => {
    setForm({ ...EMPTY, images: [], sizes: [], colors: [] });
    setEditingId(null);
    setView('add');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      description: p.description || '',
      images: [...(p.images || [])],
      price: String(p.price || ''),
      compareAt: String(p.originalPrice && p.originalPrice !== p.price ? p.originalPrice : ''),
      cost: '',
      category: p.category || '',
      gender: p.gender || 'men',
      brand: p.brand || '',
      tag: p.tag || 'Active',
      sku: p.sku || '',
      barcode: p.barcode || '',
      stock: String(p.stock ?? 0),
      trackInventory: true,
      sizes: Array.isArray(p.sizes) ? [...p.sizes] : [],
      colors: Array.isArray(p.colors) ? [...p.colors] : [],
      weight: p.weight || '',
      physicalProduct: true,
      tryOnReady: Boolean(p.tryOnReady),
      type: p.type || '',
      vendor: p.brand || '',
      tags: p.tags || '',
    });
    setEditingId(p.id);
    setView('edit');
  };

  /* image upload */
  const handleFiles = async (files) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setUploading(true);
    try {
      const results = [];
      for (const file of images) {
        const b64 = await fileToBase64(file);
        results.push(await compressImage(b64));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...results] }));
      toast.success(`${results.length} image${results.length > 1 ? 's' : ''} added`);
    } catch { toast.error('Failed to process image'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Title is required.'); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price is required.'); return; }

    const price = Number(form.price);
    const originalPrice = form.compareAt ? Number(form.compareAt) : price;
    const discount = originalPrice > price
      ? Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100))
      : 0;

    const data = {
      name: form.name.trim(),
      description: form.description,
      images: form.images.length ? form.images : ['/images/placeholder.jpg'],
      price,
      originalPrice,
      discount,
      category: form.category || 'T-Shirts',
      gender: form.gender,
      brand: form.vendor || form.brand || 'ShopNow',
      tag: form.tag,
      sku: form.sku,
      barcode: form.barcode,
      stock: Number(form.stock) || 0,
      sizes: form.sizes.length ? form.sizes : ['S', 'M', 'L'],
      colors: form.colors.length ? form.colors : ['#000000'],
      weight: form.weight,
      tryOnReady: form.tryOnReady,
      type: form.type,
      tags: form.tags,
    };

    if (editingId) { update(editingId, data); toast.success('Product updated.'); }
    else { create(data); toast.success('Product created.'); }
    setView('list');
  };

  /* ── LIST view ─────────────────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Products</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={openAdd} className="btn btn-primary" style={{ gap: 8, borderRadius: 8 }}>
              <Plus size={16} /> Add product
            </button>
          </div>
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, overflow: 'hidden' }}>

          {/* Search + filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '8px 12px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
                placeholder="Search and filter"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>}
            </div>
          </div>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(124,106,255,0.06)', borderBottom: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', minWidth: 90 }}>
                  {selected.size} selected
                </span>
                <button onClick={() => setBulkEditOpen(true)} style={bulkBtn}>Bulk edit</button>
                <button onClick={() => bulkSetStatus('Draft')} style={bulkBtn}>Set as draft</button>
                <button onClick={() => bulkSetStatus('Active')} style={bulkBtn}>Set as active</button>

                {/* More actions */}
                <div ref={moreRef} style={{ position: 'relative' }}>
                  <button onClick={() => setMoreOpen((v) => !v)} style={{ ...bulkBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ··· <ChevronDown size={13} />
                  </button>
                  <AnimatePresence>
                    {moreOpen && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, minWidth: 220, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                        {[
                          { label: 'Archive products', icon: Archive, action: () => bulkSetStatus('Archived') },
                          { label: 'Unlist products', action: () => bulkSetStatus('Draft') },
                          { label: 'Delete products', icon: Trash2, action: bulkDelete, danger: true },
                          null,
                          { label: 'Add tags', icon: Tag, action: () => { setBulkField('tags'); setBulkValue(''); setBulkEditOpen(true); setMoreOpen(false); } },
                          { label: 'Remove tags', action: () => { selected.forEach((id) => update(id, { tags: '' })); setSelected(new Set()); setMoreOpen(false); toast.info('Tags cleared'); } },
                          null,
                          { label: 'Mark as Bestseller', action: () => bulkSetStatus('Bestseller') },
                          { label: 'Mark as Sale', action: () => bulkSetStatus('Sale') },
                          { label: 'Mark as New', action: () => bulkSetStatus('New') },
                        ].map((item, i) =>
                          item === null
                            ? <div key={i} style={{ height: 1, background: 'var(--border-glass)', margin: '4px 0' }} />
                            : (
                              <button key={item.label} onClick={item.action}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: item.danger ? '#ef4444' : 'var(--text-primary)', textAlign: 'left' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {item.icon && <item.icon size={15} />}
                                {!item.icon && <span style={{ width: 15 }} />}
                                {item.label}
                              </button>
                            )
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
                  Deselect all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '10px 12px', width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }} />
                  </th>
                  {['Product', 'Status', 'Inventory', 'Price', 'Category', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sel = selected.has(p.id);
                  return (
                    <tr key={p.id}
                      style={{ borderTop: '1px solid var(--border-glass)', background: sel ? 'rgba(124,106,255,0.04)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'var(--bg-glass)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = sel ? 'rgba(124,106,255,0.04)' : 'transparent'; }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleSelect(p.id)}
                          style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 48, borderRadius: 6, flexShrink: 0, background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : 'var(--bg-glass)', border: '1px solid var(--border-glass)' }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge tag={p.tag} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: (p.stock ?? 0) === 0 ? '#ef4444' : (p.stock ?? 0) <= 5 ? '#ea580c' : '#22c55e' }}>
                          {p.stock ?? 0} in stock
                        </span>
                        {(p.sizes?.length > 0) && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> for {p.sizes.length} variant{p.sizes.length > 1 ? 's' : ''}</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {inr(p.price)}
                        {p.discount > 0 && <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 500 }}>{p.discount}% off</div>}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>{p.category}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(p)}
                            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: 'var(--font-body)' }}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => setDeleteId(p.id)}
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                <p>No products found</p>
              </div>
            )}
          </div>

          {/* Pagination footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            <span>1–{filtered.length} of {filtered.length}</span>
            <span>{products.length} total products</span>
          </div>
        </div>

        {/* Bulk edit modal */}
        <AnimatePresence>
          {bulkEditOpen && (
            <Overlay onClick={() => setBulkEditOpen(false)}>
              <div style={{ ...dialogStyle, minWidth: 360 }}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Bulk Edit — {selected.size} product{selected.size > 1 ? 's' : ''}</h3>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Field to update</label>
                  <select value={bulkField} onChange={(e) => setBulkField(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                    <option value="tag">Status / Tag</option>
                    <option value="price">Price (₹)</option>
                    <option value="stock">Stock quantity</option>
                    <option value="category">Category</option>
                    <option value="gender">Gender</option>
                    <option value="brand">Brand</option>
                    <option value="tags">Tags</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>New value</label>
                  {bulkField === 'tag' ? (
                    <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                      <option value="">Select status…</option>
                      {['Active', 'Draft', 'New', 'Bestseller', 'Sale', 'Premium', 'Trending', 'Hot'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : bulkField === 'category' ? (
                    <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  ) : bulkField === 'gender' ? (
                    <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  ) : (
                    <input type={bulkField === 'price' || bulkField === 'stock' ? 'number' : 'text'}
                      value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
                      placeholder={bulkField === 'price' ? '₹ 0.00' : bulkField === 'stock' ? '0' : ''}
                      style={{ ...inputStyle, width: '100%' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={applyBulkEdit} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gradient-1)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    Apply to {selected.size} product{selected.size > 1 ? 's' : ''}
                  </button>
                  <button onClick={() => setBulkEditOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </Overlay>
          )}
        </AnimatePresence>

        {/* Delete confirm */}
        <AnimatePresence>
          {deleteId && (
            <Overlay onClick={() => setDeleteId(null)}>
              <div style={dialogStyle}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Delete product?</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                  <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                    This will permanently delete the product. This action cannot be undone.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { remove(deleteId); toast.info('Product deleted.'); setDeleteId(null); }}
                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    Delete
                  </button>
                  <button onClick={() => setDeleteId(null)}
                    style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </Overlay>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── ADD / EDIT view — Shopify-style ──────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontFamily: 'var(--font-body)', padding: 0 }}>
          <ChevronLeft size={18} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
          {view === 'add' ? 'Add product' : 'Edit product'}
        </h1>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="shopify-grid">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title + Description */}
          <Card>
            <Label>Title</Label>
            <SInput value={form.name} onChange={(v) => set('name', v)} placeholder="Short sleeve t-shirt" />

            <div style={{ marginTop: 14 }}>
              <Label>Description</Label>
              <div style={{
                border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden',
                background: 'var(--bg-glass)',
              }}>
                {/* Fake toolbar */}
                <div style={{
                  padding: '6px 10px', borderBottom: '1px solid var(--border-glass)',
                  display: 'flex', gap: 6, flexWrap: 'wrap',
                }}>
                  {['B', 'I', 'U', '≡', '•', '1.'].map((t) => (
                    <button key={t} style={{
                      padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-glass)',
                      background: 'var(--bg-card)', color: 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'serif',
                    }}>{t}</button>
                  ))}
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="Describe your product…"
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14,
                    fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Media */}
          <Card>
            <Label>Media</Label>
            {/* Image grid */}
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, marginBottom: 12 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border-glass)'}` }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(124,106,255,0.88)', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cover</div>
                    )}
                    <button onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async (e) => { e.preventDefault(); setDragOver(false); await handleFiles(e.dataTransfer.files); }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-glass)'}`,
                borderRadius: 10, padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(124,106,255,0.05)' : 'var(--bg-glass)',
                transition: 'all 0.2s',
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
              {uploading ? (
                <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>Processing…</p>
              ) : (
                <>
                  <Upload size={22} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Upload new</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accepts images, videos, or 3D models</p>
                </>
              )}
            </div>
          </Card>

          {/* Category */}
          <Card>
            <Label>Category</Label>
            <SSelect value={form.category} onChange={(v) => set('category', v)}>
              <option value="">Choose a product category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SSelect>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Determines tax rates and adds metafields to improve search and filters
            </p>
          </Card>

          {/* Price */}
          <Card>
            <Label>Price</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <SInput prefix="₹" type="number" value={form.price} onChange={(v) => set('price', v)} placeholder="0.00" />
              </div>
            </div>

            {/* Additional prices toggle */}
            <details style={{ marginTop: 14 }} open>
              <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                Additional display prices
                <ChevronDown size={14} />
              </summary>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={labelStyle}>Compare-at price</span>
                  <SInput prefix="₹" type="number" value={form.compareAt} onChange={(v) => set('compareAt', v)} placeholder="0.00" />
                </div>
                <div>
                  <span style={labelStyle}>Unit price</span>
                  <div style={{ ...inputStyle, color: 'var(--text-muted)' }}>—</div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Charge tax on this product</span>
              </label>
              <div style={{ marginTop: 10 }}>
                <span style={labelStyle}>Cost</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <SInput prefix="₹" type="number" value={form.cost} onChange={(v) => set('cost', v)} placeholder="—" />
                </div>
              </div>
            </details>
          </Card>

          {/* Inventory */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Label style={{ margin: 0 }}>Inventory</Label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Inventory tracked</span>
                <Toggle on={form.trackInventory} onToggle={() => set('trackInventory', !form.trackInventory)} />
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <span style={labelStyle}>Quantity</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0, border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderRight: '1px solid var(--border-glass)', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  ALL IN STORE
                </div>
                <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)}
                  style={{ width: 100, background: 'var(--bg-glass)', border: 'none', outline: 'none', padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', textAlign: 'right' }} />
              </div>
            </div>

            <details>
              <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent)' }}>SKU · Barcode · Sell when out of stock</span>
                <ChevronDown size={14} />
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <span style={labelStyle}>SKU (Stock Keeping Unit)</span>
                  <SInput value={form.sku} onChange={(v) => set('sku', v)} placeholder="e.g. SNW-TS-001" />
                </div>
                <div>
                  <span style={labelStyle}>Barcode (ISBN, UPC, GTIN, etc.)</span>
                  <SInput value={form.barcode} onChange={(v) => set('barcode', v)} placeholder="" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Sell when out of stock</span>
              </label>
            </details>
          </Card>

          {/* Shipping */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Label style={{ margin: 0 }}>Shipping</Label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Physical product</span>
                <Toggle on={form.physicalProduct} onToggle={() => set('physicalProduct', !form.physicalProduct)} />
              </label>
            </div>
            {form.physicalProduct && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                  <div>
                    <span style={labelStyle}>Package</span>
                    <SSelect value="" onChange={() => {}}>
                      <option>Store default · Sample box — 22 × 13.7 × 4.2 cm, 0 kg</option>
                    </SSelect>
                  </div>
                  <div>
                    <span style={labelStyle}>Weight</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <SInput type="number" value={form.weight} onChange={(v) => set('weight', v)} placeholder="0.0" style={{ width: 80 }} />
                      <SSelect value="kg" onChange={() => {}} style={{ width: 70 }}>
                        <option>kg</option><option>g</option><option>lb</option>
                      </SSelect>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={ghostPill}>Country of origin</button>
                  <button style={ghostPill}>HS Code</button>
                </div>
              </div>
            )}
          </Card>

          {/* Variants */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: form.sizes.length || form.colors.length ? 16 : 0 }}>
              <Label style={{ margin: 0 }}>Variants</Label>
            </div>

            {/* Size picker */}
            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Sizes</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {SIZE_OPTIONS.map((s) => (
                  <button key={s}
                    onClick={() => setForm((f) => ({
                      ...f,
                      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
                    }))}
                    style={{
                      padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      border: `1px solid ${form.sizes.includes(s) ? 'var(--accent)' : 'var(--border-glass)'}`,
                      background: form.sizes.includes(s) ? 'rgba(124,106,255,0.12)' : 'var(--bg-glass)',
                      color: form.sizes.includes(s) ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>{s}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sizeInput.trim()) {
                      setForm((f) => ({ ...f, sizes: [...f.sizes, sizeInput.trim()] }));
                      setSizeInput('');
                    }
                  }}
                  placeholder="Custom size, press Enter"
                  style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <span style={labelStyle}>Colors</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {form.colors.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '4px 10px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid var(--border-glass)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c}</span>
                    <button onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="color" value={colorInput || '#000000'} onChange={(e) => setColorInput(e.target.value)}
                  style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--border-glass)', padding: 2, cursor: 'pointer', background: 'var(--bg-glass)' }} />
                <input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && colorInput.trim()) {
                      setForm((f) => ({ ...f, colors: [...f.colors, colorInput.trim()] }));
                      setColorInput('');
                    }
                  }}
                  placeholder="#000000 — press Enter to add"
                  style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                />
                <button
                  onClick={() => {
                    if (colorInput.trim()) {
                      setForm((f) => ({ ...f, colors: [...f.colors, colorInput.trim()] }));
                      setColorInput('');
                    }
                  }}
                  style={{ padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Add
                </button>
              </div>
            </div>
          </Card>

          {/* Metafields */}
          <Card>
            <Label>Metafields</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>EasyReviews: Rating</span>
              <SInput value={form.rating || ''} onChange={(v) => set('rating', v)} placeholder="" style={{ width: 160 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.tryOnReady} onChange={(e) => set('tryOnReady', e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-primary)' }}>3D Try-On ready</span>
            </label>
          </Card>

          {/* Search engine listing */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Label style={{ margin: 0 }}>Search engine listing</Label>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}><Pencil size={15} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {form.name
                ? `${form.name} — ${form.description?.slice(0, 80) || 'Add a description to improve SEO'}…`
                : 'Add a title and description to see how this product might appear in a search engine listing'}
            </p>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Save actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setView('list')}
              style={{ flex: '0 0 auto', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Discard
            </button>
            <button onClick={handleSave}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--gradient-1)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Save
            </button>
          </div>

          {/* Status */}
          <Card>
            <Label>Status</Label>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setStatusOpen((v) => !v)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-glass)',
                  background: 'var(--bg-glass)', color: 'var(--text-primary)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                }}>
                {form.tag}
                <ChevronDown size={14} style={{ transform: statusOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              <AnimatePresence>
                {statusOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                      borderRadius: 10, overflow: 'hidden', zIndex: 50,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button key={opt.value}
                        onClick={() => { set('tag', opt.value); setStatusOpen(false); }}
                        style={{
                          width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
                          background: form.tag === opt.value ? 'var(--bg-glass)' : 'transparent',
                          textAlign: 'left', fontFamily: 'var(--font-body)',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>


          {/* Product organization */}
          <Card>
            <Label>Product organization</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={labelStyle}>Type</span>
                <SInput value={form.type} onChange={(v) => set('type', v)} placeholder="" />
              </div>
              <div>
                <span style={labelStyle}>Vendor</span>
                <SInput value={form.vendor} onChange={(v) => set('vendor', v)} placeholder="e.g. ShopNow" />
              </div>
              <div>
                <span style={labelStyle}>Gender</span>
                <SSelect value={form.gender} onChange={(v) => set('gender', v)}>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </SSelect>
              </div>
              <div>
                <span style={labelStyle}>Tags</span>
                <SInput value={form.tags} onChange={(v) => set('tags', v)} placeholder="vintage, summer, cotton…" />
              </div>
            </div>
          </Card>

          {/* Theme template */}
          <Card>
            <Label>Theme template</Label>
            <SSelect value="default" onChange={() => {}}>
              <option value="default">Default product</option>
              <option value="featured">Featured product</option>
            </SSelect>
          </Card>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .shopify-grid { grid-template-columns: 1fr !important; }
        }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}

/* ── small sub-components ────────────────────────────────────────────── */

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      {children}
    </div>
  );
}

function Label({ children, style = {} }) {
  return <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, ...style }}>{children}</p>;
}

function SInput({ value, onChange, placeholder, type = 'text', prefix, style: extraStyle = {} }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && (
        <span style={{ position: 'absolute', left: 12, fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          paddingLeft: prefix ? 28 : 12,
          width: '100%',
          ...extraStyle,
        }}
      />
    </div>
  );
}

function SSelect({ value, onChange, children, style: extraStyle = {} }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: 'pointer', width: '100%', ...extraStyle }}>
      {children}
    </select>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 0,
      background: on ? 'var(--accent)' : 'var(--border-glass)', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18,
        borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function StatusBadge({ tag }) {
  const colors = {
    Active: '#22c55e', New: '#3b82f6', Bestseller: '#ff3f6c',
    Trending: '#ff905a', Hot: '#ee5a24', Sale: '#14a085',
    Premium: '#7c6aff', Draft: '#94a3b8',
  };
  const c = colors[tag] || '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, color: c,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {tag || 'Draft'}
    </span>
  );
}

function Overlay({ children, onClick }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClick}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

const inputStyle = {
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
};

const ghostPill = {
  padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-glass)',
  background: 'var(--bg-glass)', color: 'var(--text-secondary)', fontSize: 13,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
};

const dialogStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 16, padding: '24px', maxWidth: 420, width: '100%',
};

const outlineBtn = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-glass)',
  background: 'var(--bg-glass)', color: 'var(--text-primary)', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14,
};

const bulkBtn = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-glass)',
  background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13,
};
