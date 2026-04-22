import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Layers, Trash2, Search, ChevronRight, ArrowLeft,
  Eye, Image, CheckCircle, Save, PackagePlus,
} from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { useCollections } from '../../context/CollectionsContext';
import { useToast } from '../../context/ToastContext';

/* ── shared styles ───────────────────────────────────────────── */
const inp = {
  width: '100%', background: 'var(--bg-glass)', border: '1.5px solid var(--border-glass)',
  borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
};
const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 };
const card = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
  borderRadius: 14, padding: 20, marginBottom: 18,
};

/* ── Add Products Modal ──────────────────────────────────────── */
function AddProductsModal({ allProducts, already, onAdd, onClose }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState([]);
  const filtered = allProducts.filter((p) =>
    !already.includes(p.id) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.category || '').toLowerCase().includes(q.toLowerCase()))
  );
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const allChecked = filtered.length > 0 && filtered.every((p) => picked.includes(p.id));
  const toggleAll = () => allChecked ? setPicked([]) : setPicked(filtered.map((p) => p.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>Add products</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '8px 12px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Select all row */}
          {filtered.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-glass)', cursor: 'pointer', background: 'var(--bg-glass)' }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Select all ({filtered.length})</span>
            </label>
          )}
          {filtered.length === 0
            ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No products found</p>
            : filtered.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-glass)', cursor: 'pointer' }}>
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                  {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{p.category} · ₹{p.price?.toLocaleString()}</p>
                </div>
              </label>
            ))}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={picked.length === 0} onClick={() => { onAdd(picked); onClose(); }}>
            Add {picked.length > 0 ? `${picked.length} ` : ''}product{picked.length !== 1 ? 's' : ''}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Collection Detail ───────────────────────────────────────── */
function CollectionDetail({ col, allProducts, onBack, onSave }) {
  const fileRef = useRef(null);
  const [title, setTitle] = useState(col.title || '');
  const [image, setImage] = useState(col.image || null);
  const [active, setActive] = useState(col.active !== false);
  const [productIds, setProductIds] = useState(
    col.auto
      ? allProducts.filter((p) => (p.category || '') === col.title && !(col.excludedIds || []).includes(p.id)).map((p) => p.id)
      : (col.productIds || [])
  );
  const [selectedPids, setSelectedPids] = useState([]); // checkboxes in product list
  const [showAddModal, setShowAddModal] = useState(false);
  const [dirty, setDirty] = useState(false);

  const mark = () => setDirty(true);

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target.result); mark(); };
    reader.readAsDataURL(file);
  }

  const displayProducts = allProducts.filter((p) => productIds.includes(p.id));

  // product checkboxes
  const allPChecked = displayProducts.length > 0 && displayProducts.every((p) => selectedPids.includes(p.id));
  const togglePAll = () => allPChecked ? setSelectedPids([]) : setSelectedPids(displayProducts.map((p) => p.id));
  const toggleP = (id) => setSelectedPids((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  function handleRemoveSelected() {
    setProductIds((prev) => prev.filter((id) => !selectedPids.includes(id)));
    setSelectedPids([]);
    mark();
  }

  function handleAddProducts(ids) {
    setProductIds((prev) => [...new Set([...prev, ...ids])]);
    mark();
  }

  function handleSave() {
    if (col.auto) {
      const allCatIds = allProducts.filter((p) => (p.category || '') === col.title).map((p) => p.id);
      const excluded = allCatIds.filter((id) => !productIds.includes(id));
      onSave({ ...col, image, active, excludedIds: excluded });
    } else {
      onSave({ ...col, title, image, active, productIds });
    }
    setDirty(false);
  }

  return (
    <>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)', padding: 0 }}>
            <ArrowLeft size={16} /> Collections
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href={`/search?category=${encodeURIComponent(col.title)}`} target="_blank" rel="noreferrer"
              className="btn btn-ghost" style={{ gap: 6, textDecoration: 'none' }}>
              <Eye size={14} /> View
            </a>
            <button className="btn btn-primary" style={{ gap: 6 }} onClick={handleSave}>
              <Save size={14} /> {dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>

        {col.auto
          ? <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 24 }}>{col.title}</h1>
          : (
            <div style={card}>
              <label style={lbl}>Collection title</label>
              <input style={inp} value={title} onChange={(e) => { setTitle(e.target.value); mark(); }} placeholder="e.g. Summer Sale" />
            </div>
          )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* LEFT — Products */}
          <div style={card}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Products</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0' }}>{displayProducts.length} products</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedPids.length > 0 && (
                  <button className="btn btn-ghost" style={{ gap: 6, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={handleRemoveSelected}>
                    <Trash2 size={14} /> Remove {selectedPids.length} selected
                  </button>
                )}
                <button className="btn btn-ghost" style={{ gap: 6 }} onClick={() => setShowAddModal(true)}>
                  <PackagePlus size={15} /> Add products
                </button>
              </div>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: 12, marginTop: 12 }}>
              <select style={{ ...inp, width: 'auto', fontSize: 13, padding: '7px 12px' }}>
                <option>Sort: Best selling</option>
                <option>Sort: Newest</option>
                <option>Sort: Price low–high</option>
                <option>Sort: Price high–low</option>
              </select>
            </div>

            {/* Select-all row */}
            {displayProducts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-glass)', marginBottom: 4 }}>
                <input type="checkbox" checked={allPChecked} onChange={togglePAll}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {allPChecked ? 'Deselect all' : 'Select all'}
                </span>
              </div>
            )}

            {displayProducts.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <Layers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No products. Click "Add products" to start.</p>
                </div>
              )
              : displayProducts.map((p, i) => {
                const checked = selectedPids.includes(p.id);
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-glass)',
                    background: checked ? 'rgba(124,106,255,0.05)' : 'transparent',
                    borderRadius: checked ? 8 : 0,
                    transition: 'background 0.15s',
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleP(p.id)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ width: 22, textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                      {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{p.brand} · {p.category}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#16a34a', flexShrink: 0 }}>Active</span>
                    <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, minWidth: 56, textAlign: 'right' }}>₹{p.price?.toLocaleString()}</span>
                    <button onClick={() => { setProductIds((prev) => prev.filter((x) => x !== p.id)); setSelectedPids((s) => s.filter((x) => x !== p.id)); mark(); }}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
          </div>

          {/* RIGHT */}
          <div>
            {/* Publishing */}
            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Publishing</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                <div onClick={() => { setActive((v) => !v); mark(); }} style={{
                  width: 40, height: 22, borderRadius: 11, position: 'relative',
                  background: active ? 'var(--accent)' : 'var(--border-glass)', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{ position: 'absolute', top: 3, left: active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 14 }}>{active ? 'Visible' : 'Hidden'}</span>
              </label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Sales channels</p>
              {['Online Store', 'Point of Sale'].map((ch) => (
                <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle size={15} color="#16a34a" />
                  <span style={{ fontSize: 13 }}>{ch}</span>
                </div>
              ))}
            </div>

            {/* Collection image */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Collection image</p>
                {image && (
                  <button onClick={() => fileRef.current?.click()}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Edit</button>
                )}
              </div>
              <div onClick={() => fileRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                style={{ border: '2px dashed var(--border-glass)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-glass)', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {image
                  ? <img src={image} alt="" style={{ width: '100%', objectFit: 'contain', maxHeight: 220, display: 'block' }} />
                  : (
                    <div style={{ textAlign: 'center', padding: 28 }}>
                      <Image size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Click or drag image here</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Shows on homepage</p>
                    </div>
                  )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => readFile(e.target.files[0])} />
              {image && (
                <button onClick={() => { setImage(null); mark(); }}
                  style={{ marginTop: 10, background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddProductsModal
            allProducts={allProducts}
            already={productIds}
            onAdd={handleAddProducts}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main List ───────────────────────────────────────────────── */
export default function AdminCollections() {
  const { products } = useCatalog();
  const { autoImages, autoExclusions, setAutoImage, setAutoExclusion, hiddenAutoIds, hideAutoCollections, customCollections, addCustom, updateCustom, removeCustom } = useCollections();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]); // bulk-select in list

  const autoCollections = useMemo(() => {
    const catMap = {};
    products.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(p);
    });
    return Object.entries(catMap)
      .filter(([cat]) => !hiddenAutoIds.includes(cat))
      .map(([cat, prods]) => {
        const excluded = autoExclusions[cat] || [];
        const visibleProds = prods.filter((p) => !excluded.includes(p.id));
        return {
          id: `col_${cat}`,
          title: cat,
          image: autoImages[cat] || prods.find((p) => p.images?.[0])?.images?.[0] || null,
          active: true,
          auto: true,
          products: visibleProds,
          productIds: visibleProds.map((p) => p.id),
          excludedIds: excluded,
          conditionField: 'Product type',
          conditionOp: 'is equal to',
          conditionValue: cat,
        };
      });
  }, [products, autoImages, autoExclusions, hiddenAutoIds]);

  const allCollections = [...autoCollections, ...customCollections];
  const filtered = allCollections.filter((c) =>
    (!search || c.title.toLowerCase().includes(search.toLowerCase())) &&
    (activeTab === 'All' || c.title === activeTab)
  );

  const tabs = ['All', ...autoCollections.slice(0, 3).map((c) => c.title)];

  // Bulk-select — all collections selectable
  const allChecked = filtered.length > 0 && filtered.every((c) => checkedIds.includes(c.id));
  const toggleAll = () => allChecked ? setCheckedIds([]) : setCheckedIds(filtered.map((c) => c.id));
  const toggleCheck = (id) => setCheckedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  function handleBulkDelete() {
    const autoToHide = filtered.filter((c) => c.auto && checkedIds.includes(c.id)).map((c) => c.title);
    const customToDelete = checkedIds.filter((id) => !id.startsWith('col_'));
    if (autoToHide.length) hideAutoCollections(autoToHide);
    if (customToDelete.length) removeCustom(customToDelete);
    const total = checkedIds.length;
    setCheckedIds([]);
    toast.info(`${total} collection${total > 1 ? 's' : ''} deleted`);
  }

  function handleSave(form) {
    if (form.auto) {
      if (form.image) setAutoImage(form.title, form.image);
      setAutoExclusion(form.title, form.excludedIds || []);
      toast.success('Collection saved! Changes visible on homepage.');
    } else if (form.id) {
      updateCustom(form.id, form);
      toast.success('Collection updated');
    } else {
      addCustom(form);
      toast.success('Collection created');
    }
    setSelected(null);
  }

  function openNew() {
    setSelected({ id: null, title: '', image: null, active: true, auto: false, productIds: [] });
  }

  if (selected !== null) {
    return (
      <CollectionDetail
        col={selected}
        allProducts={products}
        onBack={() => setSelected(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Collections</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {checkedIds.length > 0 && (
            <button className="btn btn-ghost" style={{ gap: 6, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={handleBulkDelete}>
              <Trash2 size={15} /> Delete {checkedIds.length} selected
            </button>
          )}
          <button onClick={openNew} className="btn btn-primary" style={{ gap: 8 }}>
            <Plus size={16} /> Add collection
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{tab}</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collections…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', width: 160 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ width: 40, padding: '10px 12px' }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  title="Select all custom collections" />
              </th>
              {['Title', 'Products', 'Product conditions', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((col, i) => {
              const isChecked = checkedIds.includes(col.id);
              return (
                <motion.tr key={col.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(col)}
                  style={{ borderTop: '1px solid var(--border-glass)', cursor: 'pointer', background: isChecked ? 'rgba(124,106,255,0.05)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? 'rgba(124,106,255,0.05)' : 'transparent'; }}
                >
                  <td style={{ padding: '12px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(col.id)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {col.image
                        ? <img src={col.image} alt={col.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-glass)', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Layers size={18} color="var(--text-muted)" /></div>
                      }
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{col.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{col.auto ? 'Auto collection' : 'Custom collection'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px', fontWeight: 600 }}>
                    {col.auto ? col.products?.length : (col.productIds?.length || 0)}
                  </td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>
                    {col.auto ? `Product type is equal to ${col.title}` : (col.productIds?.length ? `${col.productIds.length} manually added` : '—')}
                  </td>
                  <td style={{ padding: '12px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (col.auto) { hideAutoCollections([col.title]); }
                          else { removeCustom([col.id]); }
                          toast.info('Collection deleted');
                        }}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Layers size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
            <p>No collections found</p>
          </div>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Learn more about collections
        </div>
      </div>
    </div>
  );
}
