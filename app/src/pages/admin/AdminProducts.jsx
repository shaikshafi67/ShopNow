import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft,
  Upload, XCircle, AlertTriangle, ChevronDown,
  Package, MoreHorizontal, Archive, Tag, CheckSquare,
  Download, FileSpreadsheet,
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

function StatusBadge({ tag }) {
  const MAP = {
    Bestseller: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    New:        { bg: 'rgba(59,130,246,0.12)',color: '#3b82f6' },
    Trending:   { bg: 'rgba(251,146,60,0.12)',color: '#f97316' },
    Hot:        { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    Sale:       { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
    Draft:      { bg: 'rgba(107,114,128,0.15)',color:'#6b7280' },
    Active:     { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
    Premium:    { bg: 'rgba(124,106,255,0.12)',color:'#7c6aff' },
    Featured:   { bg: 'rgba(124,106,255,0.12)',color:'#7c6aff' },
  };
  const s = MAP[tag] || { bg: 'var(--bg-glass)', color: 'var(--text-muted)' };
  return (
    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.color }}>
      {tag || 'Active'}
    </span>
  );
}

/* ── main component ──────────────────────────────────────────────────── */
export default function AdminProducts() {
  const { products, create, update, remove } = useCatalog();
  const toast = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

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

  const openAdd  = () => navigate('/admin/products/add');
  const openEdit = (p) => navigate(`/admin/products/edit/${p.id}`);

  /* ── LIST view ─────────────────────────────────────────────────────── */
  return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Products</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/admin/products/csv')}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1px solid var(--border-glass)', background:'var(--bg-glass)', color:'var(--text-secondary)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              <FileSpreadsheet size={15} /> Import / Export CSV
            </button>
            <button onClick={openAdd} className="btn btn-primary" style={{ gap: 8, borderRadius: 8 }}>
              <Plus size={16} /> Add Product
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
