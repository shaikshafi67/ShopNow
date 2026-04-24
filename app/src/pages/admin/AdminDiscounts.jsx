import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Trash2, Edit2, AlertTriangle,
  Tag, Percent, ShoppingBag, Package, Truck, RefreshCw, Copy, Check,
} from 'lucide-react';
import { useDiscounts } from '../../context/DiscountsContext';
import { useToast } from '../../context/ToastContext';

const TYPE_OPTIONS = [
  { value: 'amount_off_order', label: 'Amount off order' },
  { value: 'percentage_off_order', label: 'Percentage off order' },
  { value: 'amount_off_product', label: 'Amount off product' },
];

const METHOD_OPTIONS = [
  { value: 'code', label: 'Code' },
  { value: 'automatic', label: 'Automatic' },
];

const STATUS_COLORS = {
  active: '#22c55e',
  expired: '#ef4444',
  scheduled: '#f59e0b',
};

function randomCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const BLANK = {
  title: '',
  code: '',
  type: 'amount_off_order',
  method: 'code',
  value: '',
  status: 'active',
  minOrderValue: '',
  usageLimit: '',
  startsAt: '',
  endsAt: '',
  combinations: { products: true, orders: true, shipping: true },
};

export default function AdminDiscounts() {
  const { discounts, addDiscount, updateDiscount, removeDiscount } = useDiscounts();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(() => {
    let list = discounts;
    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.title?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
    }
    return list;
  }, [discounts, search, statusFilter]);

  const stats = useMemo(() => ({
    total: discounts.length,
    active: discounts.filter((d) => d.status === 'active').length,
    totalUsed: discounts.reduce((s, d) => s + (d.usedCount || 0), 0),
  }), [discounts]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...BLANK, code: randomCode() });
    setModalOpen(true);
  };

  const openEdit = (disc) => {
    setEditId(disc.id);
    setForm({
      title: disc.title || '',
      code: disc.code || '',
      type: disc.type || 'amount_off_order',
      method: disc.method || 'code',
      value: disc.value ?? '',
      status: disc.status || 'active',
      minOrderValue: disc.minOrderValue || '',
      usageLimit: disc.usageLimit || '',
      startsAt: disc.startsAt ? disc.startsAt.slice(0, 10) : '',
      endsAt: disc.endsAt ? disc.endsAt.slice(0, 10) : '',
      combinations: disc.combinations || { products: true, orders: true, shipping: true },
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    if (form.method === 'code' && !form.code.trim()) { toast.error('Discount code is required.'); return; }
    if (form.value === '' || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      toast.error('Enter a valid discount value.'); return;
    }

    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      value: Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };

    if (editId) {
      updateDiscount(editId, payload);
      toast.success('Discount updated.');
    } else {
      addDiscount(payload);
      toast.success('Discount created.');
    }
    closeModal();
  };

  const confirmDelete = () => {
    removeDiscount(deleteId);
    toast.info('Discount deleted.');
    setDeleteId(null);
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const setCombo = (key) => {
    setForm((f) => ({ ...f, combinations: { ...f.combinations, [key]: !f.combinations[key] } }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Discounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{discounts.length} discount{discounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 50, background: 'var(--accent)', color: 'white',
            border: 'none', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Create discount
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '#7c6aff' },
          { label: 'Active', value: stats.active, color: '#22c55e' },
          { label: 'Times Used', value: stats.totalUsed, color: '#3b82f6' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          borderRadius: 50, padding: '10px 16px', flex: '1 1 260px', maxWidth: 400,
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discounts…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
            borderRadius: 50, padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-glass)' }}>
                {['Title', 'Status', 'Method', 'Type', 'Combinations', 'Used', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  {/* Title + code */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>{d.title}</div>
                    {d.method === 'code' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 11,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          padding: '1px 6px', borderRadius: 4, color: 'var(--text-secondary)',
                        }}>{d.code}</span>
                        <button
                          onClick={() => copyCode(d.code, d.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                          title="Copy code"
                        >
                          {copied === d.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                    {d.minOrderValue > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Min ₹{d.minOrderValue}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: (STATUS_COLORS[d.status] || '#7c6aff') + '18',
                      color: STATUS_COLORS[d.status] || '#7c6aff',
                      textTransform: 'capitalize',
                    }}>{d.status}</span>
                  </td>

                  {/* Method */}
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                    {d.method === 'code' ? `1 code` : 'Automatic'}
                  </td>

                  {/* Type */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      {d.type === 'percentage_off_order' ? <Percent size={13} /> : <Tag size={13} />}
                      <span style={{ fontSize: 12 }}>
                        {d.type === 'amount_off_order' && `₹${d.value} off order`}
                        {d.type === 'percentage_off_order' && `${d.value}% off order`}
                        {d.type === 'amount_off_product' && `₹${d.value} off product`}
                      </span>
                    </div>
                  </td>

                  {/* Combinations */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span title="Products" style={{ opacity: d.combinations?.products ? 1 : 0.25 }}><Package size={14} color="var(--text-secondary)" /></span>
                      <span title="Orders" style={{ opacity: d.combinations?.orders ? 1 : 0.25 }}><ShoppingBag size={14} color="var(--text-secondary)" /></span>
                      <span title="Shipping" style={{ opacity: d.combinations?.shipping ? 1 : 0.25 }}><Truck size={14} color="var(--text-secondary)" /></span>
                    </div>
                  </td>

                  {/* Used */}
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{d.usedCount ?? 0}</td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(d)} style={iconBtn} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(d.id)}
                        style={{ ...iconBtn, color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Tag size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: 14 }}>No discounts found.</p>
              <button onClick={openCreate} style={{ marginTop: 12, ...accentBtn }}>
                <Plus size={14} /> Create your first discount
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 20, padding: '28px 28px 24px',
                width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
                  {editId ? 'Edit discount' : 'Create discount'}
                </h2>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                  <Label>Title</Label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Summer Sale"
                    style={inputStyle}
                  />
                </div>

                {/* Discount type */}
                <div>
                  <Label>Type</Label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Method */}
                <div>
                  <Label>Method</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {METHOD_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setForm({ ...form, method: o.value })}
                        style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${form.method === o.value ? 'var(--accent)' : 'var(--border-glass)'}`,
                          background: form.method === o.value ? 'rgba(124,106,255,0.08)' : 'var(--bg-glass)',
                          color: form.method === o.value ? 'var(--accent)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                          transition: 'all 0.2s',
                        }}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>

                {/* Code */}
                {form.method === 'code' && (
                  <div>
                    <Label>Discount code</Label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. SAVE20"
                        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: 1 }}
                      />
                      <button
                        onClick={() => setForm({ ...form, code: randomCode() })}
                        title="Generate code"
                        style={{ ...iconBtn, padding: '0 14px', borderRadius: 10, height: 42, flexShrink: 0 }}
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Value */}
                <div>
                  <Label>
                    {form.type === 'percentage_off_order' ? 'Percentage (%)' : 'Amount (₹)'}
                  </Label>
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === 'percentage_off_order' ? '10' : '100'}
                    style={inputStyle}
                  />
                </div>

                {/* Min order */}
                <div>
                  <Label>Minimum order value (₹) — optional</Label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    placeholder="0 = no minimum"
                    style={inputStyle}
                  />
                </div>

                {/* Usage limit */}
                <div>
                  <Label>Usage limit — optional</Label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    style={inputStyle}
                  />
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Label>Start date (optional)</Label>
                    <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <Label>End date (optional)</Label>
                    <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Combinations */}
                <div>
                  <Label>Can be combined with</Label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                      { key: 'products', label: 'Product discounts', icon: Package },
                      { key: 'orders', label: 'Order discounts', icon: ShoppingBag },
                      { key: 'shipping', label: 'Shipping discounts', icon: Truck },
                    ].map(({ key, label, icon: Icon }) => (
                      <label key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${form.combinations[key] ? 'var(--accent)' : 'var(--border-glass)'}`,
                        background: form.combinations[key] ? 'rgba(124,106,255,0.08)' : 'var(--bg-glass)',
                        fontSize: 13, fontWeight: 500,
                        color: form.combinations[key] ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                        <input
                          type="checkbox"
                          checked={!!form.combinations[key]}
                          onChange={() => setCombo(key)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <Icon size={13} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={handleSave} style={accentBtn}>
                  {editId ? 'Save changes' : 'Create discount'}
                </button>
                <button onClick={closeModal} className="btn btn-ghost">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 26px', maxWidth: 420 }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Delete discount</h2>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                  This will permanently remove the discount code. Customers who have already used it won't be affected.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmDelete} style={{ ...accentBtn, background: '#ef4444' }}>Delete</button>
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {children}
    </div>
  );
}

const thStyle = {
  padding: '12px 14px', textAlign: 'left', fontWeight: 700,
  color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: 0.8, whiteSpace: 'nowrap',
};

const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' };

const iconBtn = {
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const accentBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
  borderRadius: 50, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', border: 'none', background: 'var(--accent)', color: 'white',
};

const inputStyle = {
  width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
};
