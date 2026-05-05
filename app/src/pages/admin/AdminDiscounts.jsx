import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Trash2, Edit2, AlertTriangle,
  Tag, Percent, ShoppingBag, Package, Truck, RefreshCw,
  Copy, Check, ChevronRight, ArrowLeft, Settings2,
} from 'lucide-react';
import { useDiscounts } from '../../context/DiscountsContext';
import { useToast } from '../../context/ToastContext';

/* ─── constants ─────────────────────────────────────────── */

const DISCOUNT_TYPES = [
  { value: 'amount_off_products', label: 'Amount off products', desc: 'Discount specific products or collections of products', Icon: Tag },
  { value: 'buy_x_get_y',         label: 'Buy X get Y',         desc: 'Discount specific products or collections of products', Icon: ShoppingBag },
  { value: 'amount_off_order',    label: 'Amount off order',    desc: 'Discount the total order amount',                      Icon: Package },
  { value: 'free_shipping',       label: 'Free shipping',       desc: 'Offer free shipping on an order',                      Icon: Truck },
];

const STATUS_COLORS = { active: '#22c55e', expired: '#ef4444', scheduled: '#f59e0b' };

const BLANK = {
  title: '', code: '', method: 'code', type: '', status: 'active',
  valueType: 'percentage', value: '',
  appliesTo: 'all_products',
  buyQty: '', buyFrom: 'specific_products',
  getQty: '', getFrom: 'specific_products', getValueType: 'percentage', getValue: '',
  maxUsesPerOrder: false, maxUsesPerOrderCount: '',
  countries: 'all', excludeShippingOver: false, excludeShippingOverAmount: '',
  eligibility: 'all',
  minReq: 'none', minReqAmount: '', minReqQty: '',
  limitTotal: false, limitTotalCount: '',
  limitPerCustomer: false,
  combinations: { products: false, orders: false, shipping: false },
  startsAt: new Date().toISOString().slice(0, 10), startTime: '08:00 am',
  hasEndDate: false, endsAt: '', endTime: '',
};

function randomCode() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

/* ─── main component ────────────────────────────────────── */

export default function AdminDiscounts() {
  const { discounts, addDiscount, updateDiscount, removeDiscount } = useDiscounts();
  const toast = useToast();

  // 'list' | 'type-select' | 'form'
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...BLANK });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setCombo = (key) => setForm((f) => ({ ...f, combinations: { ...f.combinations, [key]: !f.combinations[key] } }));

  const openCreate = () => { setEditId(null); setForm({ ...BLANK, code: randomCode() }); setView('type-select'); };

  const openEdit = (disc) => {
    setEditId(disc.id);
    setForm({
      title: disc.title || '', code: disc.code || '', method: disc.method || 'code',
      type: disc.type || 'amount_off_order', status: disc.status || 'active',
      valueType: disc.valueType || 'percentage', value: disc.value ?? '',
      appliesTo: disc.appliesTo || 'all_products',
      buyQty: disc.buyQty || '', buyFrom: disc.buyFrom || 'specific_products',
      getQty: disc.getQty || '', getFrom: disc.getFrom || 'specific_products',
      getValueType: disc.getValueType || 'percentage', getValue: disc.getValue || '',
      maxUsesPerOrder: disc.maxUsesPerOrder || false, maxUsesPerOrderCount: disc.maxUsesPerOrderCount || '',
      countries: disc.countries || 'all', excludeShippingOver: disc.excludeShippingOver || false,
      excludeShippingOverAmount: disc.excludeShippingOverAmount || '',
      eligibility: disc.eligibility || 'all',
      minReq: disc.minReq || 'none', minReqAmount: disc.minReqAmount || '', minReqQty: disc.minReqQty || '',
      limitTotal: disc.limitTotal || false, limitTotalCount: disc.limitTotalCount || '',
      limitPerCustomer: disc.limitPerCustomer || false,
      combinations: disc.combinations || { products: false, orders: false, shipping: false },
      startsAt: disc.startsAt ? disc.startsAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      startTime: disc.startTime || '08:00 am',
      hasEndDate: !!disc.endsAt, endsAt: disc.endsAt ? disc.endsAt.slice(0, 10) : '', endTime: disc.endTime || '',
    });
    setView('form');
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    if (form.method === 'code' && !form.code.trim()) { toast.error('Discount code is required.'); return; }
    if (form.type !== 'free_shipping' && form.type !== 'buy_x_get_y') {
      if (form.value === '' || isNaN(Number(form.value)) || Number(form.value) <= 0) {
        toast.error('Enter a valid discount value.'); return;
      }
    }
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      value: Number(form.value) || 0,
      minOrderValue: form.minReq === 'amount' ? Number(form.minReqAmount) : 0,
      usageLimit: form.limitTotal ? Number(form.limitTotalCount) : null,
      endsAt: form.hasEndDate && form.endsAt ? form.endsAt : null,
    };
    if (editId) { updateDiscount(editId, payload); toast.success('Discount updated.'); }
    else { addDiscount(payload); toast.success('Discount created.'); }
    setView('list');
  };

  const confirmDelete = () => { removeDiscount(deleteId); toast.info('Discount deleted.'); setDeleteId(null); };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  /* ── type-select view ── */
  if (view === 'type-select') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <button onClick={() => setView('list')} style={ghostIconBtn}><ArrowLeft size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            <Settings2 size={14} />
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setView('list')}>Discounts</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Create discount</span>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Select discount type</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Choose the type of discount you want to create.</p>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden', maxWidth: 600 }}>
          {DISCOUNT_TYPES.map((t, i) => (
            <button
              key={t.value}
              onClick={() => { set('type', t.value); set('title', t.label); setView('form'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', background: 'transparent', border: 'none',
                borderTop: i > 0 ? '1px solid var(--border-glass)' : 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <t.Icon size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.desc}</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── form view ── */
  if (view === 'form') {
    return <DiscountForm
      form={form} set={set} setCombo={setCombo}
      editId={editId} onSave={handleSave}
      onBack={() => setView(editId ? 'list' : 'type-select')}
    />;
  }

  /* ── list view ── */
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Discounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{discounts.length} discount{discounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} style={accentBtn}><Plus size={16} /> Create discount</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[{ label: 'Total', value: stats.total, color: '#7c6aff' }, { label: 'Active', value: stats.active, color: '#22c55e' }, { label: 'Times Used', value: stats.totalUsed, color: '#3b82f6' }].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 50, padding: '10px 16px', flex: '1 1 260px', maxWidth: 400 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discounts…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 50, padding: '10px 16px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
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
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>{d.title}</div>
                    {d.method === 'code' && d.code && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{d.code}</span>
                        <button onClick={() => copyCode(d.code, d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                          {copied === d.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                    {d.minOrderValue > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Min ₹{d.minOrderValue}</div>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: (STATUS_COLORS[d.status] || '#7c6aff') + '18', color: STATUS_COLORS[d.status] || '#7c6aff', textTransform: 'capitalize' }}>{d.status}</span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{d.method === 'code' ? '1 code' : 'Automatic'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      {typeIcon(d.type)}
                      <span style={{ fontSize: 12 }}>{typeLabel(d)}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span title="Products" style={{ opacity: d.combinations?.products ? 1 : 0.2 }}><Package size={14} color="var(--text-secondary)" /></span>
                      <span title="Orders" style={{ opacity: d.combinations?.orders ? 1 : 0.2 }}><ShoppingBag size={14} color="var(--text-secondary)" /></span>
                      <span title="Shipping" style={{ opacity: d.combinations?.shipping ? 1 : 0.2 }}><Truck size={14} color="var(--text-secondary)" /></span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{d.usedCount ?? 0}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(d)} style={iconBtn} title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteId(d.id)} style={{ ...iconBtn, color: '#ef4444', background: 'rgba(239,68,68,0.08)' }} title="Delete"><Trash2 size={13} /></button>
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
              <button onClick={openCreate} style={{ marginTop: 12, ...accentBtn }}><Plus size={14} /> Create your first discount</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 26px', maxWidth: 420 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Delete discount</h2>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>This will permanently remove the discount code. Customers who already used it won't be affected.</p>
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

/* ─── full-page discount form ───────────────────────────── */

function DiscountForm({ form, set, setCombo, editId, onSave, onBack }) {
  const typeDef = DISCOUNT_TYPES.find((t) => t.value === form.type) || DISCOUNT_TYPES[0];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <button onClick={onBack} style={ghostIconBtn}><ArrowLeft size={16} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
          <Settings2 size={14} />
          <span style={{ cursor: 'pointer' }} onClick={onBack}>Discounts</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{editId ? 'Edit discount' : 'Create discount'}</span>
        </div>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{typeDef.label}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20, alignItems: 'start' }} className="discount-form-grid">

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title */}
          <Section title="Title">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Summer Sale 20%" style={inputStyle} />
            <p style={hint}>Customers will see this in their cart and at checkout.</p>
          </Section>

          {/* Method */}
          <Section title="Method">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: form.method === 'code' ? 14 : 0 }}>
              {[{ v: 'code', l: 'Discount code' }, { v: 'automatic', l: 'Automatic discount' }].map((o) => (
                <button key={o.v} onClick={() => set('method', o.v)} style={{
                  padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                  border: `2px solid ${form.method === o.v ? 'var(--accent)' : 'var(--border-glass)'}`,
                  background: form.method === o.v ? 'rgba(124,106,255,0.1)' : 'var(--bg-glass)',
                  color: form.method === o.v ? 'var(--accent)' : 'var(--text-secondary)',
                }}>{o.l}</button>
              ))}
            </div>
            {form.method === 'code' && (
              <>
                <Label>Discount code</Label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20" style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: 1 }} />
                  <button onClick={() => set('code', randomCode())} title="Generate random code"
                    style={{ ...iconBtn, padding: '0 14px', borderRadius: 10, height: 42, flexShrink: 0, gap: 6, fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    <RefreshCw size={13} /> Generate random code
                  </button>
                </div>
                <p style={hint}>Customers must enter this code at checkout.</p>
              </>
            )}
          </Section>

          {/* Discount value — not for buy_x_get_y or free_shipping */}
          {(form.type === 'amount_off_products' || form.type === 'amount_off_order') && (
            <Section title="Discount value">
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <select value={form.valueType} onChange={(e) => set('valueType', e.target.value)}
                  style={{ ...inputStyle, width: 200, flexShrink: 0 }}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type="number" min="0" value={form.value} onChange={(e) => set('value', e.target.value)}
                    placeholder={form.valueType === 'percentage' ? '0' : '0.00'}
                    style={{ ...inputStyle, paddingRight: 32 }} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>
                    {form.valueType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>
              {form.type === 'amount_off_products' && (
                <>
                  <Label>Applies to</Label>
                  <select value={form.appliesTo} onChange={(e) => set('appliesTo', e.target.value)} style={inputStyle}>
                    <option value="all_products">All products</option>
                    <option value="specific_collections">Specific collections</option>
                    <option value="specific_products">Specific products</option>
                  </select>
                  {(form.appliesTo === 'specific_collections' || form.appliesTo === 'specific_products') && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input placeholder={`Search ${form.appliesTo === 'specific_collections' ? 'collections' : 'products'}…`}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
                      </div>
                      <button style={outlineBtn}>Browse</button>
                    </div>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Buy X Get Y sections */}
          {form.type === 'buy_x_get_y' && (
            <>
              <Section title="Customer buys">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{ v: 'min_qty', l: 'Minimum quantity of items' }, { v: 'min_amount', l: 'Minimum purchase amount' }].map((o) => (
                    <Radio key={o.v} name="buyReq" checked={form.buyReqType === o.v || (!form.buyReqType && o.v === 'min_qty')}
                      onChange={() => set('buyReqType', o.v)} label={o.l} />
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 4 }}>
                    <div>
                      <Label>Quantity</Label>
                      <input type="number" min="1" value={form.buyQty} onChange={(e) => set('buyQty', e.target.value)} style={inputStyle} placeholder="1" />
                    </div>
                    <div>
                      <Label>Any items from</Label>
                      <select value={form.buyFrom} onChange={(e) => set('buyFrom', e.target.value)} style={inputStyle}>
                        <option value="specific_products">Specific products</option>
                        <option value="specific_collections">Specific collections</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px' }}>
                      <Search size={14} color="var(--text-muted)" />
                      <input placeholder="Search products…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
                    </div>
                    <button style={outlineBtn}>Browse</button>
                  </div>
                </div>
              </Section>

              <Section title="Customer gets">
                <p style={{ ...hint, marginBottom: 10 }}>Customers must add the quantity of items specified below to their cart.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
                  <div><Label>Quantity</Label><input type="number" min="1" value={form.getQty} onChange={(e) => set('getQty', e.target.value)} style={inputStyle} placeholder="1" /></div>
                  <div><Label>Any items from</Label>
                    <select value={form.getFrom} onChange={(e) => set('getFrom', e.target.value)} style={inputStyle}>
                      <option value="specific_products">Specific products</option>
                      <option value="specific_collections">Specific collections</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px' }}>
                    <Search size={14} color="var(--text-muted)" />
                    <input placeholder="Search products…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
                  </div>
                  <button style={outlineBtn}>Browse</button>
                </div>
                <Label>At a discounted value</Label>
                {[{ v: 'percentage', l: 'Percentage' }, { v: 'amount_off_each', l: 'Amount off each' }, { v: 'free', l: 'Free' }].map((o) => (
                  <div key={o.v} style={{ marginBottom: 8 }}>
                    <Radio name="getValueType" checked={form.getValueType === o.v} onChange={() => set('getValueType', o.v)} label={o.l} />
                    {form.getValueType === o.v && o.v !== 'free' && (
                      <div style={{ marginLeft: 26, marginTop: 8 }}>
                        <div style={{ position: 'relative', maxWidth: 200 }}>
                          <input type="number" min="0" value={form.getValue} onChange={(e) => set('getValue', e.target.value)}
                            style={{ ...inputStyle, paddingRight: 32 }} placeholder="0" />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>
                            {o.v === 'percentage' ? '%' : '₹'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.maxUsesPerOrder} onChange={() => set('maxUsesPerOrder', !form.maxUsesPerOrder)} style={{ accentColor: 'var(--accent)' }} />
                  Set a maximum number of uses per order
                </label>
                {form.maxUsesPerOrder && (
                  <input type="number" min="1" value={form.maxUsesPerOrderCount} onChange={(e) => set('maxUsesPerOrderCount', e.target.value)}
                    style={{ ...inputStyle, marginTop: 8, maxWidth: 200 }} placeholder="e.g. 1" />
                )}
              </Section>
            </>
          )}

          {/* Free shipping specific */}
          {form.type === 'free_shipping' && (
            <Section title="Countries">
              <Radio name="countries" checked={form.countries === 'all'} onChange={() => set('countries', 'all')} label="All countries" />
              <Radio name="countries" checked={form.countries === 'selected'} onChange={() => set('countries', 'selected')} label="Selected countries" />
              {form.countries === 'selected' && (
                <div style={{ marginLeft: 26, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px' }}>
                    <Search size={14} color="var(--text-muted)" />
                    <input placeholder="Search countries…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                <Label>Shipping rates</Label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.excludeShippingOver} onChange={() => set('excludeShippingOver', !form.excludeShippingOver)} style={{ accentColor: 'var(--accent)' }} />
                  Exclude shipping rates over a certain amount
                </label>
                {form.excludeShippingOver && (
                  <div style={{ marginTop: 8, position: 'relative', maxWidth: 200 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                    <input type="number" min="0" value={form.excludeShippingOverAmount} onChange={(e) => set('excludeShippingOverAmount', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 28 }} placeholder="0.00" />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Eligibility */}
          <Section title="Eligibility">
            <p style={hint}>Available on all sales channels</p>
            {[{ v: 'all', l: 'All customers' }, { v: 'segments', l: 'Specific customer segments' }, { v: 'specific', l: 'Specific customers' }].map((o) => (
              <Radio key={o.v} name="eligibility" checked={form.eligibility === o.v} onChange={() => set('eligibility', o.v)} label={o.l} />
            ))}
          </Section>

          {/* Minimum purchase requirements */}
          <Section title="Minimum purchase requirements">
            {[{ v: 'none', l: 'No minimum requirements' }, { v: 'amount', l: 'Minimum purchase amount (₹)' }, { v: 'quantity', l: 'Minimum quantity of items' }].map((o) => (
              <div key={o.v}>
                <Radio name="minReq" checked={form.minReq === o.v} onChange={() => set('minReq', o.v)} label={o.l} />
                {form.minReq === o.v && o.v === 'amount' && (
                  <div style={{ marginLeft: 26, marginTop: 8, position: 'relative', maxWidth: 220 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                    <input type="number" min="0" value={form.minReqAmount} onChange={(e) => set('minReqAmount', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 28 }} placeholder="0.00" />
                  </div>
                )}
                {form.minReq === o.v && o.v === 'quantity' && (
                  <input type="number" min="1" value={form.minReqQty} onChange={(e) => set('minReqQty', e.target.value)}
                    style={{ ...inputStyle, marginLeft: 26, marginTop: 8, maxWidth: 220 }} placeholder="1" />
                )}
              </div>
            ))}
          </Section>

          {/* Maximum discount uses */}
          <Section title="Maximum discount uses">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
              <input type="checkbox" checked={form.limitTotal} onChange={() => set('limitTotal', !form.limitTotal)} style={{ accentColor: 'var(--accent)' }} />
              Limit number of times this discount can be used in total
            </label>
            {form.limitTotal && (
              <input type="number" min="1" value={form.limitTotalCount} onChange={(e) => set('limitTotalCount', e.target.value)}
                style={{ ...inputStyle, marginLeft: 26, marginBottom: 10, maxWidth: 220 }} placeholder="e.g. 100" />
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.limitPerCustomer} onChange={() => set('limitPerCustomer', !form.limitPerCustomer)} style={{ accentColor: 'var(--accent)' }} />
              Limit to one use per customer
            </label>
          </Section>

          {/* Combinations */}
          <Section title="Combinations">
            <p style={hint}>This discount can be combined with:</p>
            {[
              { key: 'products', label: 'Product discounts', Icon: Package, desc: 'The highest discount will apply when combined with other product discounts.' },
              { key: 'orders', label: 'Order discounts', Icon: ShoppingBag, desc: 'The highest discount will apply when combined with order discounts.' },
              { key: 'shipping', label: 'Shipping discounts', Icon: Truck, desc: 'The largest eligible shipping discount will apply in addition to eligible product discounts.' },
            ].map(({ key, label, Icon, desc }) => (
              <div key={key} style={{ marginBottom: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={!!form.combinations[key]} onChange={() => setCombo(key)} style={{ accentColor: 'var(--accent)' }} />
                  <Icon size={14} />
                  {label}
                </label>
                {form.combinations[key] && (
                  <p style={{ ...hint, marginLeft: 26, marginTop: 4 }}>{desc}</p>
                )}
              </div>
            ))}
            {!Object.values(form.combinations).some(Boolean) && form.code && (
              <div style={{ marginTop: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{form.code}</strong> won't combine with any other discount at checkout.
              </div>
            )}
          </Section>

          {/* Active dates */}
          <Section title="Active dates">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <Label>Start date</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>📅</span>
                  <input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 30 }} />
                </div>
              </div>
              <div>
                <Label>Start time (IST)</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>🕐</span>
                  <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 30 }} />
                </div>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', marginBottom: form.hasEndDate ? 12 : 0 }}>
              <input type="checkbox" checked={form.hasEndDate} onChange={() => set('hasEndDate', !form.hasEndDate)} style={{ accentColor: 'var(--accent)' }} />
              Set end date
            </label>
            {form.hasEndDate && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <Label>End date</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>📅</span>
                    <input type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 30 }} />
                  </div>
                </div>
                <div>
                  <Label>End time (IST)</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>🕐</span>
                    <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 30 }} />
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onSave} style={accentBtn}>{editId ? 'Save changes' : 'Save discount'}</button>
            <button onClick={onBack} className="btn btn-ghost">Discard</button>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Summary ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>
          <SummaryCard form={form} />
          {/* Sales channel */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Sales channel access</div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
              Allow discount to be featured on selected channels
            </label>
          </div>
          {/* Status */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Status</div>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} style={{ ...inputStyle }}>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <style>{`.discount-form-grid { } @media (max-width: 860px) { .discount-form-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ─── Summary sidebar card ──────────────────────────────── */
function SummaryCard({ form }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!form.code) return;
    navigator.clipboard.writeText(form.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const typeDef = DISCOUNT_TYPES.find((t) => t.value === form.type);

  /* ── build bullet list exactly like Shopify ── */
  const bullets = [];

  // 1. Discount value line (first bullet)
  if (form.type === 'free_shipping') {
    bullets.push('Free shipping');
    if (form.countries === 'all') bullets.push('For all countries');
    else bullets.push('For selected countries');
  } else if (form.type === 'buy_x_get_y') {
    const buyQty = form.buyQty || '?';
    const getQty = form.getQty || '?';
    if (form.getValueType === 'free') bullets.push(`Buy ${buyQty} get ${getQty} free`);
    else if (form.getValueType === 'percentage' && form.getValue)
      bullets.push(`Buy ${buyQty} get ${getQty} at ${form.getValue}% off`);
    else bullets.push(`Buy ${buyQty} get ${getQty} at a discounted price`);
  } else if (form.type === 'amount_off_products' || form.type === 'amount_off_order') {
    if (form.value) {
      const valueStr = form.valueType === 'percentage' ? `${form.value}%` : `₹${Number(form.value).toFixed(2)}`;
      const appliesToStr =
        form.type === 'amount_off_order' ? 'entire order' :
        form.appliesTo === 'all_products' ? 'all products' :
        form.appliesTo === 'specific_collections' ? 'specific collections' :
        'specific products';
      bullets.push(`${valueStr} off ${appliesToStr}`);
    }
  }

  // 2. Eligibility
  if (form.eligibility === 'all') bullets.push('All customers');
  else if (form.eligibility === 'segments') bullets.push('Specific customer segments');
  else bullets.push('Specific customers');

  // 3. Channel
  bullets.push('For Online Store');

  // 4. Min purchase
  if (form.minReq === 'none' || !form.minReq) {
    bullets.push('No minimum purchase requirement');
  } else if (form.minReq === 'amount') {
    if (form.minReqAmount) bullets.push(`Minimum purchase of ₹${Number(form.minReqAmount).toFixed(2)}`);
    else bullets.push('Minimum purchase amount required');
  } else if (form.minReq === 'quantity') {
    if (form.minReqQty) bullets.push(`Minimum quantity of ${form.minReqQty} items`);
    else bullets.push('Minimum quantity required');
  }

  // 5. Usage limit
  if (form.limitTotal && form.limitTotalCount) {
    bullets.push(`Limit of ${form.limitTotalCount} uses`);
  } else if (form.limitPerCustomer) {
    bullets.push('One use per customer');
  } else {
    bullets.push('No usage limits');
  }

  // 6. Combinations — one bullet per active combo type
  const combosActive = Object.entries(form.combinations || {}).filter(([, v]) => v).map(([k]) => k);
  if (combosActive.length === 0) {
    bullets.push("Can't combine with other discounts");
  } else {
    const comboLabels = { products: 'product discounts', orders: 'order discounts', shipping: 'shipping discounts' };
    combosActive.forEach((k) => bullets.push(`Combines with ${comboLabels[k] || k}`));
  }

  // 7. Active date
  const today = new Date().toISOString().slice(0, 10);
  if (!form.startsAt || form.startsAt === today) {
    bullets.push('Active from today');
  } else {
    bullets.push(`Active from ${form.startsAt}`);
  }
  if (form.hasEndDate && form.endsAt) {
    bullets.push(`Expires ${form.endsAt}`);
  }

  const subTypeLabel =
    form.type === 'amount_off_products' || form.type === 'buy_x_get_y' ? 'Product discount' :
    form.type === 'amount_off_order' ? 'Order discount' : 'Shipping discount';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '18px 18px' }}>

      {/* Code header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: form.code ? 'var(--text-primary)' : 'var(--text-muted)', letterSpacing: form.code ? 0.5 : 0 }}>
          {form.code || 'No discount code yet'}
        </span>
        {form.code && (
          <button onClick={copyCode} title="Copy code"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: copied ? '#22c55e' : 'var(--text-muted)', display: 'flex' }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        {form.method === 'automatic' ? 'Automatic' : 'Code'}
      </div>

      {/* Type */}
      {typeDef && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Type</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{typeDef.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <typeDef.Icon size={12} />
            {subTypeLabel}
          </div>
        </div>
      )}

      {/* Details */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Details</div>
        <ul style={{ listStyle: 'disc', paddingLeft: 18, margin: 0 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, lineHeight: 1.55 }}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '20px 20px' }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{children}</div>;
}

function Radio({ name, checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 8, fontWeight: checked ? 600 : 400 }}>
      <input type="radio" name={name} checked={checked} onChange={onChange} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
      {label}
    </label>
  );
}

function typeIcon(type) {
  if (type === 'free_shipping') return <Truck size={13} />;
  if (type === 'buy_x_get_y') return <ShoppingBag size={13} />;
  if (type === 'amount_off_products') return <Tag size={13} />;
  return <Package size={13} />;
}

function typeLabel(d) {
  if (d.type === 'free_shipping') return 'Free shipping';
  if (d.type === 'buy_x_get_y') return 'Buy X get Y';
  if (d.type === 'amount_off_products') {
    return d.valueType === 'percentage' ? `${d.value}% off products` : `₹${d.value} off products`;
  }
  if (d.type === 'amount_off_order') {
    return d.valueType === 'percentage' ? `${d.value}% off order` : `₹${d.value} off order`;
  }
  return d.type || 'Discount';
}

/* ─── styles ─────────────────────────────────────────────── */

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' };
const iconBtn = { background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const ghostIconBtn = { background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' };
const accentBtn = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 50, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent)', color: 'white' };
const outlineBtn = { padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' };
const inputStyle = { width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' };
const hint = { fontSize: 12, color: 'var(--text-muted)', margin: 0 };
