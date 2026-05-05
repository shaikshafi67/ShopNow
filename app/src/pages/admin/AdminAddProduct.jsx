/**
 * AdminAddProduct.jsx — Comprehensive Product Add / Edit Form
 *
 * Sections (tabs):
 *   1. Basic Info  — name, description, brand, category, tags
 *   2. Media       — image upload, gallery, compression preview
 *   3. Pricing     — MRP, selling price (auto discount%), cost price
 *   4. Inventory   — SKU, stock, low-stock alert, availability
 *   5. Variants    — dynamic size/color variants with price & stock
 *   6. Shipping    — weight, dimensions, free-shipping toggle
 *   7. SEO         — meta title, description, slug (auto-generate)
 *   8. Status      — draft/publish, featured, try-on ready
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, ArrowLeft, Plus, X, Upload, RefreshCw,
  Eye, Package, Image, Tag, Truck, Search,
  Star, Zap, AlertCircle, CheckCircle, Copy,
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useCatalog } from '../../context/CatalogContext';
import { useCollections } from '../../context/CollectionsContext';
import { compressImage, formatBytes, base64Size } from '../../utils/imageCompress';
import { slugify, autoSKU } from '../../utils/csvHelper';

// ─── Constants ────────────────────────────────────────────────────────────────
// Default categories used as fallback when no products/collections exist yet
const DEFAULT_CATEGORIES = [
  'T-Shirts','Shirts','Jeans','Trousers','Jackets','Shorts',
  'Tops','Dresses','Kurtis','Sarees','Co-ord Sets','Skirts',
  'Ethnic Wear','Sportswear','Innerwear','Accessories',
];
const SUBCATEGORIES = {
  'T-Shirts': ['Oversized','Graphic','Polo','Plain','Striped'],
  'Shirts':   ['Casual','Formal','Oxford','Linen','Flannel'],
  'Jeans':    ['Slim Fit','Straight','Skinny','Wide Leg','Jogger'],
  'Dresses':  ['Maxi','Midi','Mini','Wrap','Shirt Dress'],
  'Tops':     ['Crop Top','Tank Top','Blouse','Corset','Peplum'],
};
const BRANDS = ['Nike','Adidas','H&M','Zara','ShopNow','Puma','Levi\'s','Allen Solly','Custom'];
const TAGS_PRESET = ['Bestseller','New','Trending','Hot','Sale','Premium','Featured'];

// Auto-detect gender from category name
const WOMEN_CATEGORIES = /saree|kurti|kurta|dupatta|lehenga|blouse|salwar|anarkali|tops|dresses|co-ord|ethnic|women/i;
const MEN_CATEGORIES   = /shirts|t-shirt|trouser|chinos|blazer|jacket|men/i;
function detectGender(category) {
  if (WOMEN_CATEGORIES.test(category)) return 'women';
  if (MEN_CATEGORIES.test(category))   return 'men';
  return null; // ambiguous — don't override
}
const SIZE_PRESETS = ['XS','S','M','L','XL','XXL','One Size','28','30','32','34','36','38'];
const COLOR_NAMES  = ['Black','White','Red','Blue','Green','Yellow','Pink','Orange','Purple','Grey','Brown','Navy','Beige','Maroon','Navy Blue','Cream','Olive','Teal','Coral','Lavender'];
const COLOR_PRESETS = [
  { name: 'Black',  hex: '#1a1a1a' }, { name: 'White',  hex: '#f5f5f5' },
  { name: 'Red',    hex: '#ef4444' }, { name: 'Blue',   hex: '#3b82f6' },
  { name: 'Green',  hex: '#22c55e' }, { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Pink',   hex: '#ec4899' }, { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' }, { name: 'Grey',   hex: '#9ca3af' },
  { name: 'Brown',  hex: '#92400e' }, { name: 'Navy',   hex: '#1e3a5f' },
  { name: 'Beige',  hex: '#d4b896' }, { name: 'Maroon', hex: '#800020' },
  { name: 'Teal',   hex: '#0d9488' }, { name: 'Cream',  hex: '#fffdd0' },
];

// Each color variant now holds an array of images
const EMPTY_COLOR_VARIANT = { id: '', name: '', hex: '#1a1a1a', images: [], sizeVariants: [] };
const EMPTY_VARIANT = { size: '', color: '', price: '', stock: '', sku: '' };

const EMPTY_FORM = {
  name: '', title: '', description: '',
  brand: 'ShopNow', category: '', subcategory: '', gender: 'men',
  tags: [],
  mrp: '', sellingPrice: '', discount: '', costPrice: '',
  sku: '', stock: '0', lowStockAlert: '5', availability: 'in_stock',
  images: [],
  colorVariants: [],
  colorDisplayMode: 'swatch', // 'swatch' = color circles | 'image' = product photos (Myntra style)
  variants: [],
  weight: '', dimLength: '', dimWidth: '', dimHeight: '',
  freeShipping: true, shippingCost: '',
  metaTitle: '', metaDescription: '', slug: '',
  status: 'published', featured: false, tryOnReady: false,
};

const TABS = [
  { id: 'basic',     label: 'Basic Info',  icon: Package },
  { id: 'media',     label: 'Media',       icon: Image   },
  { id: 'pricing',   label: 'Pricing',     icon: Tag     },
  { id: 'inventory', label: 'Inventory',   icon: AlertCircle },
  { id: 'variants',  label: 'Variants',    icon: RefreshCw },
  { id: 'shipping',  label: 'Shipping',    icon: Truck   },
  { id: 'seo',       label: 'SEO',         icon: Search  },
  { id: 'status',    label: 'Status',      icon: Star    },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border-glass)', background: 'var(--bg-glass)',
  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
  outline: 'none', transition: 'border-color 0.2s',
};
const label = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' };
const card  = { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '20px 22px', marginBottom: 16 };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

function Field({ label: lbl, children, hint, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{lbl}</label>
      {children}
      {hint  && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: 11, color: '#ff4646', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminAddProduct() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const { create, update, byId, products, categories: catalogCategories } = useCatalog();
  const { customCollections } = useCollections();
  const isEdit     = !!id;

  // Category list = what's in Collections admin (auto collections from catalog + custom collections).
  // Falls back to hardcoded defaults only when nothing else exists yet.
  const allCategories = useMemo(() => {
    const fromCollections = [
      ...catalogCategories.filter(Boolean),           // auto-collections (from products)
      ...customCollections.map(c => c.title).filter(Boolean), // admin-created collections
    ];
    const base = fromCollections.length > 0 ? fromCollections : DEFAULT_CATEGORIES;
    return Array.from(new Set(base)).sort((a, b) => a.localeCompare(b));
  }, [catalogCategories, customCollections]);

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [tagInput,  setTagInput]  = useState('');
  const [imgLoading,setImgLoading]= useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [preview,   setPreview]   = useState(false);
  const fileRef   = useRef(null);

  // Load existing product for edit
  useEffect(() => {
    if (!isEdit) return;
    const p = byId(id);
    if (!p) return;
    const vs = (p.variants || []);
    setForm({
      name:         p.name        || '',
      title:        p.metaTitle   || p.name || '',
      description:  p.description || '',
      brand:        p.brand       || 'ShopNow',
      category:     p.category    || '',
      subcategory:  p.subcategory || '',
      gender:       p.gender      || 'men',
      tags:         Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim()) : []),
      mrp:          String(p.originalPrice || p.price || ''),
      sellingPrice: String(p.price   || ''),
      discount:     String(p.discount || ''),
      costPrice:    String(p.costPrice || ''),
      sku:          p.sku          || '',
      stock:        String(p.stock  || 0),
      lowStockAlert:String(p.lowStockAlert || 5),
      availability: p.availability || 'in_stock',
      images:        (p.images || []).map(src => ({ src, compressed: true })),
      colorVariants: Array.isArray(p.colorVariants)
        ? p.colorVariants.map(cv => ({
            ...cv,
            images: cv.images || (cv.image ? [cv.image] : []),
            sizeVariants: cv.sizeVariants || [],
          }))
        : [],
      colorDisplayMode: p.colorDisplayMode || 'swatch',
      variants:      vs.length ? vs.map(v => ({ ...EMPTY_VARIANT, ...v, price: String(v.price||''), stock: String(v.stock||'') })) : [],
      weight:       p.weight       || '',
      dimLength:    p.dimensions?.length || '',
      dimWidth:     p.dimensions?.width  || '',
      dimHeight:    p.dimensions?.height || '',
      freeShipping: p.freeShipping !== false,
      shippingCost: String(p.shippingCost || ''),
      metaTitle:    p.metaTitle    || '',
      metaDescription: p.metaDescription || '',
      slug:         p.slug         || '',
      status:       p.tag === 'Draft' ? 'draft' : 'published',
      featured:     !!p.featured,
      tryOnReady:   !!p.tryOnReady,
    });
  }, [id]);

  // ── Computed helpers ─────────────────────────────────────────────────────────
  const f = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-calculate discount
      if (key === 'mrp' || key === 'sellingPrice') {
        const m = parseFloat(key === 'mrp' ? val : next.mrp);
        const s = parseFloat(key === 'sellingPrice' ? val : next.sellingPrice);
        if (m > 0 && s >= 0 && s <= m) next.discount = String(Math.round(((m - s) / m) * 100));
        else next.discount = '';
      }
      // Auto-generate slug from name
      if (key === 'name' && !prev.slug) next.slug = slugify(val);
      // Auto-generate meta title
      if (key === 'name' && !prev.metaTitle) next.metaTitle = val;
      return next;
    });
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const addTag = (t) => {
    const tag = t.trim();
    if (tag && !form.tags.includes(tag)) f('tags', [...form.tags, tag]);
  };
  const removeTag = (t) => f('tags', form.tags.filter(x => x !== t));

  // ── Images ───────────────────────────────────────────────────────────────────
  const processFiles = useCallback(async (files) => {
    setImgLoading(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).slice(0, 8).map(async file => {
          const src = await compressImage(file, 1600, 0.88);
          return { src, originalName: file.name, size: base64Size(src), compressed: true };
        })
      );
      f('images', [...form.images, ...compressed]);
    } finally { setImgLoading(false); }
  }, [form.images]);

  const removeImg = (idx) => f('images', form.images.filter((_, i) => i !== idx));
  const moveImg   = (from, to) => {
    const imgs = [...form.images];
    [imgs[from], imgs[to]] = [imgs[to], imgs[from]];
    f('images', imgs);
  };

  // ── Color Variants ───────────────────────────────────────────────────────────
  const colorImgRef = useRef({});

  const addColorVariant = (preset = null) => {
    const cv = preset
      ? { ...EMPTY_COLOR_VARIANT, id: Date.now().toString(), name: preset.name, hex: preset.hex }
      : { ...EMPTY_COLOR_VARIANT, id: Date.now().toString() };
    f('colorVariants', [...form.colorVariants, cv]);
  };

  const removeColorVariant = (id) => f('colorVariants', form.colorVariants.filter(cv => cv.id !== id));

  const setColorVariant = (id, key, val) =>
    f('colorVariants', form.colorVariants.map(cv => cv.id === id ? { ...cv, [key]: val } : cv));

  // Use setForm functional update to avoid stale closure
  const uploadColorImage = useCallback(async (id, file) => {
    if (!file) return;
    const compressed = await compressImage(file, 800, 0.85);
    setForm(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map(cv =>
        cv.id === id ? { ...cv, images: [...(cv.images || []), compressed] } : cv
      ),
    }));
  }, []);

  const removeColorImage = useCallback((cvId, imgIdx) => {
    setForm(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map(cv =>
        cv.id === cvId ? { ...cv, images: cv.images.filter((_, i) => i !== imgIdx) } : cv
      ),
    }));
  }, []);

  // Add a product media image to a color variant (pick from already-uploaded images)
  const addMediaToColor = useCallback((cvId, src) => {
    setForm(prev => {
      const cv = prev.colorVariants.find(c => c.id === cvId);
      if (!cv || cv.images.includes(src)) return prev;
      return {
        ...prev,
        colorVariants: prev.colorVariants.map(c =>
          c.id === cvId ? { ...c, images: [...c.images, src] } : c
        ),
      };
    });
  }, []);

  // Per-color size stock helpers
  const setColorSizeStock = useCallback((cvId, size, stock) => {
    setForm(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map(cv => {
        if (cv.id !== cvId) return cv;
        const sv = [...(cv.sizeVariants || [])];
        const idx = sv.findIndex(s => s.size === size);
        if (idx >= 0) sv[idx] = { ...sv[idx], stock: Number(stock) };
        else sv.push({ size, stock: Number(stock) });
        return { ...cv, sizeVariants: sv };
      }),
    }));
  }, []);

  const addColorSizeVariant = useCallback((cvId, size) => {
    setForm(prev => {
      const cv = prev.colorVariants.find(c => c.id === cvId);
      if (!cv || (cv.sizeVariants || []).find(s => s.size === size)) return prev;
      const defaultPrice = parseFloat(prev.sellingPrice) || 0;
      const defaultStock = parseInt(prev.stock, 10) || 0;
      return {
        ...prev,
        colorVariants: prev.colorVariants.map(c =>
          c.id === cvId
            ? { ...c, sizeVariants: [...(c.sizeVariants || []), { size, price: defaultPrice, stock: defaultStock, sku: '' }] }
            : c
        ),
      };
    });
  }, []);

  const setColorSizeField = useCallback((cvId, size, field, value) => {
    setForm(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map(cv =>
        cv.id !== cvId ? cv : {
          ...cv,
          sizeVariants: (cv.sizeVariants || []).map(sv =>
            sv.size === size ? { ...sv, [field]: value } : sv
          ),
        }
      ),
    }));
  }, []);

  const removeColorSizeVariant = useCallback((cvId, size) => {
    setForm(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map(cv =>
        cv.id === cvId ? { ...cv, sizeVariants: (cv.sizeVariants || []).filter(s => s.size !== size) } : cv
      ),
    }));
  }, []);

  // ── Variants ─────────────────────────────────────────────────────────────────
  const addVariant   = () => f('variants', [...form.variants, { ...EMPTY_VARIANT, price: form.sellingPrice, stock: form.stock || '0' }]);
  const removeVariant= (i) => f('variants', form.variants.filter((_, idx) => idx !== i));
  const setVariant   = (i, key, val) => {
    const vs = [...form.variants];
    vs[i] = { ...vs[i], [key]: val };
    f('variants', vs);
  };

  // ── Auto-SKU ─────────────────────────────────────────────────────────────────
  const genSKU = () => f('sku', autoSKU(form.name, products.length));

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Product name is required';
    if (!form.category)           e.category    = 'Category is required';
    if (!form.gender)             e.gender      = 'Gender is required (Men / Women / Unisex)';
    if (!form.sellingPrice)       e.sellingPrice= 'Selling price is required';
    if (!form.mrp)                e.mrp         = 'MRP is required';
    if (parseFloat(form.sellingPrice) > parseFloat(form.mrp)) e.sellingPrice = 'Selling price cannot exceed MRP';
    if (form.images.length === 0) e.images = 'Add at least one product card image in the Media tab';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const tabMap = { name:'basic', category:'basic', gender:'basic', sellingPrice:'pricing', mrp:'pricing', images:'media' };
      const firstTab = tabMap[Object.keys(e)[0]] || 'basic';
      setActiveTab(firstTab);
    }
    return Object.keys(e).length === 0;
  };

  // ── Send stock-back emails to all users who set a Notify Me reminder ──────────
  function sendStockNotifications(productId, productName, brand) {
    try {
      const key = 'shopnow:notifications';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const forThis = list.filter(n => n.productId === productId);
      if (!forThis.length) return;

      const svcId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const tplId  = import.meta.env.VITE_EMAILJS_STOCK_TEMPLATE_ID
                  || import.meta.env.VITE_EMAILJS_TEMPLATE_ID; // fallback to existing template
      const pubKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (!svcId || !tplId || !pubKey) return;

      emailjs.init(pubKey);

      forThis.forEach(n => {
        const productUrl = `${window.location.origin}/product/${productId}`;
        emailjs.send(svcId, tplId, {
          to_name:      n.userName || n.userEmail?.split('@')[0] || 'Valued Customer',
          to_email:     n.userEmail,
          from_name:    'ShopNow Team',
          product_name: productName,
          brand:        brand || 'ShopNow',
          product_url:  productUrl,
          message:
            `Great news, ${n.userName || 'there'}! 🎉\n\n` +
            `The product you were waiting for — "${productName}" by ${brand || 'ShopNow'} — ` +
            `is back in stock right now!\n\n` +
            `Hurry up and grab yours before it sells out again. We can't guarantee how long it'll stay available.\n\n` +
            `Shop now: ${productUrl}\n\n` +
            `Happy Shopping! 🛍️\n` +
            `— The ShopNow Team`,
          subject:      `✅ "${productName}" is back in stock! Don't miss out`,
        }).catch(() => {}); // silent fail per-email
      });

      // Remove fulfilled notification requests
      const remaining = list.filter(n => n.productId !== productId);
      localStorage.setItem(key, JSON.stringify(remaining));
    } catch {}
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const mrp = parseFloat(form.mrp)          || 0;
      const sp  = parseFloat(form.sellingPrice)  || 0;
      const payload = {
        name:            form.name.trim(),
        description:     form.description,
        brand:           form.brand,
        category:        form.category,
        subcategory:     form.subcategory,
        gender:          form.gender,
        tags:            form.tags,
        price:           sp,
        originalPrice:   mrp,
        discount:        mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0,
        costPrice:       parseFloat(form.costPrice) || 0,
        sku:             form.sku,
        // Stock: auto-sum from all color+size variants if colors exist, else manual
        stock: form.colorVariants.length > 0
          ? form.colorVariants.reduce((total, cv) =>
              total + (cv.sizeVariants || []).reduce((sum, sv) => sum + (Number(sv.stock) || 0), 0), 0)
          : parseInt(form.stock, 10) || 0,
        lowStockAlert:   parseInt(form.lowStockAlert, 10) || 5,
        availability:    form.availability,
        // Media tab images = product card thumbnail shown in listing grids
        images:          form.images.map(i => i.src || i),
        // Sizes: from color sizeVariants when colors exist, else from global variants
        sizes: form.colorVariants.length > 0
          ? [...new Set(form.colorVariants.flatMap(cv => (cv.sizeVariants || []).map(sv => sv.size)).filter(Boolean))]
          : [...new Set(form.variants.map(v => v.size).filter(Boolean))],
        variants: form.colorVariants.length === 0
          ? form.variants.map(v => ({ ...v, price: parseFloat(v.price) || sp, stock: parseInt(v.stock, 10) || 0 }))
          : [], // replaced by colorVariants.sizeVariants
        colors:          form.colorVariants.map(cv => cv.hex).filter(Boolean),
        colorVariants:   form.colorVariants.map(cv => ({
          ...cv,
          images: cv.images || [],
          sizeVariants: (cv.sizeVariants || []).map(sv => ({ ...sv, stock: Number(sv.stock) || 0 })),
        })),
        colorDisplayMode: form.colorDisplayMode || 'swatch',
        weight:          form.weight,
        dimensions:      { length: form.dimLength, width: form.dimWidth, height: form.dimHeight },
        freeShipping:    form.freeShipping,
        shippingCost:    form.freeShipping ? 0 : (parseFloat(form.shippingCost) || 0),
        metaTitle:       form.metaTitle || form.name,
        metaDescription: form.metaDescription,
        slug:            form.slug || slugify(form.name),
        tag:             form.status === 'draft' ? 'Draft' : (form.tags[0] || 'New'),
        featured:        form.featured,
        tryOnReady:      form.tryOnReady,
        rating:          4.0,
        reviews:         0,
      };

      // ── Check if stock just came back (was 0, now > 0) — send Notify Me emails ──
      if (isEdit) {
        const oldProduct = byId(id);
        const wasOutOfStock = !oldProduct || oldProduct.stock === 0
          || oldProduct.availability === 'out_of_stock'
          || oldProduct.availability === 'Out of Stock';
        const nowInStock = payload.stock > 0 && payload.availability !== 'out_of_stock'
          && payload.availability !== 'Out of Stock';

        if (wasOutOfStock && nowInStock) {
          sendStockNotifications(id, payload.name, payload.brand);
        }
        update(id, payload);
      } else {
        create(payload);
      }

      setSaved(true);
      setTimeout(() => navigate('/admin/products'), 1200);
    } finally { setSaving(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  const subCats = SUBCATEGORIES[form.category] || [];
  const discountNum = parseFloat(form.discount) || 0;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/admin/products')}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: 0 }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            {isEdit ? `Editing: ${form.name}` : 'Fill in the details below to list a new product'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setPreview(p => !p)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Eye size={14} /> Preview
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saved ? '#00c864' : 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> {isEdit ? 'Update' : 'Save Product'}</>}
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 320px' : '1fr', gap: 20 }}>

        {/* ── Main Form ── */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: 5, flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              const hasErr = (tab.id === 'basic' && (errors.name || errors.category)) ||
                             (tab.id === 'media' && errors.images) ||
                             (tab.id === 'pricing' && (errors.mrp || errors.sellingPrice));
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding: '7px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', background: activeTab === tab.id ? 'var(--gradient-1)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, position: 'relative', transition: 'all 0.2s' }}>
                  <tab.icon size={13} />
                  {tab.label}
                  {hasErr && <span style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: '50%', background: '#ff4646' }} />}
                </button>
              );
            })}
          </div>

          {/* ══ BASIC INFO ══════════════════════════════════════════════════ */}
          {activeTab === 'basic' && (
            <motion.div key="basic" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Basic Information</p>
                <Field label="Product Name *" error={errors.name}>
                  <input style={inp} placeholder="e.g. Classic Cotton T-Shirt" value={form.name} onChange={e => f('name', e.target.value)} />
                </Field>
                <Field label="SEO Title">
                  <input style={inp} placeholder="Browser tab / search result title" value={form.title} onChange={e => f('title', e.target.value)} />
                </Field>
                <Field label="Description" hint="Supports basic HTML or plain text">
                  <div style={{ border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden' }}>
                    {/* Mini toolbar */}
                    <div style={{ display: 'flex', gap: 4, padding: '6px 10px', background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)' }}>
                      {[['<b>B</b>','<b>|</b>'],['<i>I</i>','<i>|</i>'],['• List','<ul><li>|</li></ul>']].map(([lbl, wrap]) => (
                        <button key={lbl} title={lbl}
                          onClick={() => { const s = window.getSelection()?.toString(); if (s) f('description', form.description + wrap.replace('|', s)); }}
                          style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11 }}
                          dangerouslySetInnerHTML={{ __html: lbl }} />
                      ))}
                    </div>
                    <textarea rows={5} style={{ ...inp, border: 'none', borderRadius: 0, resize: 'vertical' }}
                      placeholder="Describe the product — material, fit, features…"
                      value={form.description} onChange={e => f('description', e.target.value)} />
                  </div>
                </Field>
                <div style={grid2}>
                  <Field label="Brand">
                    <select style={inp} value={form.brand} onChange={e => f('brand', e.target.value)}>
                      {BRANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Gender *" error={errors.gender} hint="Determines which page products appear on">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[{v:'men',l:'👔 Men'},{v:'women',l:'👗 Women'},{v:'unisex',l:'✦ Unisex'},{v:'kids',l:'🧒 Kids'}].map(({v,l}) => (
                        <button key={v} type="button" onClick={() => f('gender', v)}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${form.gender===v ? 'var(--accent)' : 'var(--border-glass)'}`, background: form.gender===v ? 'rgba(124,106,255,0.12)' : 'var(--bg-glass)', color: form.gender===v ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 11, fontWeight: form.gender===v ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Visibility hint */}
                {form.gender && form.status && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: form.status === 'published' ? 'rgba(0,200,100,0.08)' : 'rgba(245,166,35,0.08)', border: `1px solid ${form.status === 'published' ? 'rgba(0,200,100,0.25)' : 'rgba(245,166,35,0.25)'}`, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{form.status === 'published' ? '✅' : '⚠️'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {form.status === 'published'
                        ? <>This product will appear on <strong style={{ color: 'var(--accent)' }}>/{form.gender}</strong> page immediately after saving.</>
                        : <>This product is in <strong style={{ color: '#f5a623' }}>Draft</strong> — not visible to customers. Change status to Published to go live.</>
                      }
                    </span>
                  </div>
                )}

                <div style={grid2}>
                  <Field label="Category *" error={errors.category}>
                    <input
                      list="category-list"
                      style={inp}
                      value={form.category}
                      placeholder="Select or type a category…"
                      onChange={e => {
                        const cat = e.target.value;
                        f('category', cat);
                        f('subcategory', '');
                        const detectedGender = detectGender(cat);
                        if (detectedGender) f('gender', detectedGender);
                      }}
                    />
                    <datalist id="category-list">
                      {allCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </Field>
                  <Field label="Subcategory">
                    <select style={inp} value={form.subcategory} onChange={e => f('subcategory', e.target.value)}>
                      <option value="">Select subcategory…</option>
                      {subCats.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
              {/* Tags */}
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Tags</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: 'var(--accent)' }}>
                      {t}<button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, display: 'flex' }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Type tag and press Enter…" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {TAGS_PRESET.filter(t => !form.tags.includes(t)).map(t => (
                    <button key={t} onClick={() => addTag(t)}
                      style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ MEDIA ═══════════════════════════════════════════════════════ */}
          {activeTab === 'media' && (
            <motion.div key="media" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Product Card Image</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    This image shows on the <strong>product card</strong> in Men / Women / Home pages. Upload 1 clear photo.
                    For multiple color photos, go to <strong>Variants tab</strong>.
                  </p>
                </div>
                {errors.images && <p style={{ color: '#ff4646', fontSize: 12, marginBottom: 10 }}>{errors.images}</p>}
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-glass)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(124,106,255,0.06)' : 'var(--bg-glass)', transition: 'all 0.2s', marginBottom: 14 }}>
                  <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{imgLoading ? 'Compressing images…' : 'Drag & drop images here, or click to browse'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, WEBP — up to 8 images — auto-compressed to ≤1.6 MP</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
                </div>
                {/* Gallery grid */}
                {form.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {form.images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: idx === 0 ? '2px solid var(--accent)' : '1px solid var(--border-glass)' }}>
                        <img src={img.src || img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>MAIN</span>}
                        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3 }}>
                          {idx > 0 && <button onClick={() => moveImg(idx, idx - 1)} style={{ width: 20, height: 20, borderRadius: 5, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10 }}>←</button>}
                          <button onClick={() => removeImg(idx)} style={{ width: 20, height: 20, borderRadius: 5, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                        </div>
                        {img.size && <div style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 8, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)', padding: '1px 5px', borderRadius: 4 }}>{formatBytes(img.size)}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>First image is the main product photo. Drag ← → to reorder.</p>
              </div>
            </motion.div>
          )}

          {/* ══ PRICING ══════════════════════════════════════════════════════ */}
          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Pricing</p>
                <div style={grid2}>
                  <Field label="MRP (₹) *" error={errors.mrp} hint="Maximum retail price">
                    <input style={inp} type="number" placeholder="999" value={form.mrp} onChange={e => f('mrp', e.target.value)} />
                  </Field>
                  <Field label="Selling Price (₹) *" error={errors.sellingPrice} hint="Price shown to customers">
                    <input style={inp} type="number" placeholder="699" value={form.sellingPrice} onChange={e => f('sellingPrice', e.target.value)} />
                  </Field>
                </div>
                {discountNum > 0 && (
                  <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} color="#00c864" />
                    <span style={{ fontSize: 13, color: '#00c864', fontWeight: 600 }}>{discountNum}% discount auto-calculated</span>
                  </div>
                )}
                <Field label="Cost Price (₹)" hint="Your purchase cost — used for profit margin tracking">
                  <input style={inp} type="number" placeholder="500" value={form.costPrice} onChange={e => f('costPrice', e.target.value)} />
                </Field>
                {form.costPrice && form.sellingPrice && (
                  <div style={{ background: 'rgba(124,106,255,0.07)', border: '1px solid rgba(124,106,255,0.15)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Profit per unit</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>₹{(parseFloat(form.sellingPrice) - parseFloat(form.costPrice)).toFixed(0)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Margin</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>
                        {(((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellingPrice)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ INVENTORY ════════════════════════════════════════════════════ */}
          {activeTab === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Inventory</p>
                <div style={grid2}>
                  <Field label="SKU" hint="Stock Keeping Unit">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input style={{ ...inp, flex: 1 }} placeholder="e.g. TSHIRT-BLK-M" value={form.sku} onChange={e => f('sku', e.target.value)} />
                      <button onClick={genSKU} title="Auto-generate SKU"
                        style={{ padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </Field>
                  <Field label="Stock Quantity">
                    <input style={inp} type="number" placeholder="0" value={form.stock} onChange={e => f('stock', e.target.value)} />
                  </Field>
                </div>
                <div style={grid2}>
                  <Field label="Low Stock Alert" hint="Get alerted when stock falls below this">
                    <input style={inp} type="number" placeholder="5" value={form.lowStockAlert} onChange={e => f('lowStockAlert', e.target.value)} />
                  </Field>
                  <Field label="Availability">
                    <select style={inp} value={form.availability} onChange={e => f('availability', e.target.value)}>
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre-Order</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </Field>
                </div>
                {parseInt(form.stock) <= parseInt(form.lowStockAlert) && form.stock !== '' && (
                  <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8 }}>
                    <AlertCircle size={14} color="#f5a623" />
                    <span style={{ fontSize: 12, color: '#f5a623' }}>Low stock warning — stock is at or below your alert threshold</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ VARIANTS ═════════════════════════════════════════════════════ */}
          {activeTab === 'variants' && (
            <motion.div key="variants" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── COLOR VARIANTS ── */}
              <div style={card}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Color Variants</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Upload gallery photos per color. These show on the <strong>product detail page</strong> when a customer clicks that color. Card thumbnail → Media tab.</p>
                  </div>
                  <button onClick={() => addColorVariant()}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'rgba(124,106,255,0.08)', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <Plus size={12} /> Add Color
                  </button>
                </div>

                {/* Color Display Mode toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Color Display on Product Page</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                      {form.colorDisplayMode === 'image'
                        ? '🖼️ Image mode — shows product photos per color (like Myntra MORE COLORS)'
                        : '⬤ Swatch mode — shows small color circles only'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-glass)', overflow: 'hidden', flexShrink: 0 }}>
                    {[{ v: 'image', label: '🖼️ Image' }, { v: 'swatch', label: '⬤ Swatch' }].map(opt => (
                      <button key={opt.v} onClick={() => f('colorDisplayMode', opt.v)}
                        style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                          background: form.colorDisplayMode === opt.v ? 'var(--accent)' : 'transparent',
                          color: form.colorDisplayMode === opt.v ? 'white' : 'var(--text-secondary)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick color presets */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>Quick add:</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map(p => {
                      const already = form.colorVariants.some(cv => cv.hex === p.hex);
                      return (
                        <button key={p.hex} onClick={() => { if (!already) addColorVariant(p); }}
                          title={p.name}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${already ? 'var(--accent)' : 'var(--border-glass)'}`, background: already ? 'rgba(124,106,255,0.1)' : 'transparent', cursor: already ? 'default' : 'pointer', fontSize: 11, color: already ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.colorVariants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border-glass)', borderRadius: 10 }}>
                    No colors yet — click a preset above or "+ Add Color"
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {form.colorVariants.map(cv => (
                      <div key={cv.id} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '14px 16px' }}>

                        {/* Top row: color picker + name + delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          {/* Hex color picker */}
                          <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: cv.hex, border: '2px solid var(--border-glass)', overflow: 'hidden', cursor: 'pointer' }}>
                            <input type="color" value={cv.hex}
                              onChange={e => setColorVariant(cv.id, 'hex', e.target.value)}
                              style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
                          </div>
                          {/* Name */}
                          <input value={cv.name} onChange={e => setColorVariant(cv.id, 'name', e.target.value)}
                            placeholder="Color name (e.g. Navy Blue)"
                            style={{ ...inp, flex: 1, padding: '7px 10px' }} />
                          {/* Delete color */}
                          <button onClick={() => removeColorVariant(cv.id)}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,70,70,0.3)', background: 'transparent', cursor: 'pointer', color: '#ff4646', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <X size={13} />
                          </button>
                        </div>

                        {/* ── Images for this color ── */}
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Photos for <strong style={{ color: 'var(--text-secondary)' }}>{cv.name || 'this color'}</strong>
                            <span style={{ marginLeft: 6 }}>({(cv.images || []).length} photo{(cv.images || []).length !== 1 ? 's' : ''})</span>
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            {(cv.images || []).map((img, imgIdx) => (
                              <div key={imgIdx} style={{ position: 'relative', flexShrink: 0 }}>
                                <img src={img} alt={`${cv.name} ${imgIdx + 1}`}
                                  style={{ width: 72, height: 90, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--border-glass)', display: 'block' }} />
                                {imgIdx === 0 && (
                                  <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'white', background: 'rgba(0,0,0,0.55)', borderRadius: '0 0 6px 6px', padding: '2px 0' }}>MAIN</div>
                                )}
                                <button onClick={() => removeColorImage(cv.id, imgIdx)}
                                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <X size={9} />
                                </button>
                              </div>
                            ))}
                            {/* Upload new photos */}
                            <div>
                              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                ref={el => colorImgRef.current[cv.id] = el}
                                onChange={e => Array.from(e.target.files).forEach(file => uploadColorImage(cv.id, file))} />
                              <button onClick={() => colorImgRef.current[cv.id]?.click()}
                                style={{ width: 72, height: 90, borderRadius: 8, border: '2px dashed var(--border-glass)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--text-muted)' }}>
                                <Upload size={15} />
                                <span style={{ fontSize: 10, fontWeight: 600 }}>Upload</span>
                              </button>
                            </div>
                          </div>

                          {/* Pick from product images — only images NOT used by other colors */}
                          {(() => {
                            // Collect images used by ALL colors (not current color)
                            const usedByOthers = new Set(
                              form.colorVariants
                                .filter(c => c.id !== cv.id)
                                .flatMap(c => c.images || [])
                            );
                            // Available = product images not already in THIS color and not in other colors
                            const available = form.images.filter(img => {
                              const src = img.src || img;
                              return !usedByOthers.has(src) && !(cv.images || []).includes(src);
                            });
                            if (!available.length) return null;
                            return (
                              <div style={{ marginTop: 10 }}>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                                  ↓ PICK FROM PRODUCT IMAGES
                                </p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {available.map((img, i) => {
                                    const src = img.src || img;
                                    return (
                                      <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                        <img src={src} alt="" style={{ width: 52, height: 64, objectFit: 'cover', borderRadius: 6, border: '1.5px solid var(--border-glass)', display: 'block' }} />
                                        {/* + Add to this color */}
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 6, cursor: 'pointer' }}
                                          onClick={() => addMediaToColor(cv.id, src)}>
                                          <Plus size={14} color="white" />
                                        </div>
                                        {/* × Delete from main product images */}
                                        <button
                                          onClick={e => { e.stopPropagation(); f('images', form.images.filter(im => (im.src || im) !== src)); }}
                                          style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                          <X size={8} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* ── Per-color Size Variants (Size + Price + Stock + SKU) ── */}
                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              Size Variants for <span style={{ color: 'var(--accent)' }}>{cv.name || 'this color'}</span>
                            </p>
                          </div>
                          {/* Quick add sizes */}
                          <div style={{ marginBottom: 10 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Quick add sizes:</p>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {SIZE_PRESETS.map(s => {
                                const already = (cv.sizeVariants || []).some(sv => sv.size === s);
                                return (
                                  <button key={s} onClick={() => !already && addColorSizeVariant(cv.id, s)}
                                    style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, border: `1px solid ${already ? 'var(--accent)' : 'var(--border-glass)'}`, background: already ? 'rgba(124,106,255,0.1)' : 'transparent', color: already ? 'var(--accent)' : 'var(--text-muted)', cursor: already ? 'default' : 'pointer' }}>
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {(cv.sizeVariants || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border-glass)', borderRadius: 8 }}>
                              No sizes yet — click a quick-add above
                            </div>
                          ) : (
                            <div>
                              {/* Header row */}
                              <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 80px 1fr 32px', gap: 8, marginBottom: 6 }}>
                                {['Size', 'Price (₹)', 'Stock', 'SKU', ''].map(h => (
                                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</span>
                                ))}
                              </div>
                              <AnimatePresence>
                                {(cv.sizeVariants || []).map(sv => (
                                  <motion.div key={sv.size}
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                    style={{ display: 'grid', gridTemplateColumns: '120px 100px 80px 1fr 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                    {/* Size dropdown */}
                                    <select style={{ ...inp, padding: '7px 10px' }} value={sv.size}
                                      onChange={e => {
                                        const newSize = e.target.value;
                                        if ((cv.sizeVariants || []).some(s => s.size === newSize && s.size !== sv.size)) return;
                                        setColorSizeField(cv.id, sv.size, 'size', newSize);
                                      }}>
                                      {SIZE_PRESETS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    {/* Price */}
                                    <input style={{ ...inp, padding: '7px 8px' }} type="number" min="0"
                                      placeholder={form.sellingPrice || '0'}
                                      value={sv.price ?? ''}
                                      onChange={e => setColorSizeField(cv.id, sv.size, 'price', parseFloat(e.target.value) || 0)} />
                                    {/* Stock */}
                                    <input style={{ ...inp, padding: '7px 8px', textAlign: 'center', fontWeight: 700,
                                      color: (!sv.stock || sv.stock === 0) ? '#ef4444' : '#22c55e' }}
                                      type="number" min="0" placeholder="0"
                                      value={sv.stock ?? 0}
                                      onChange={e => setColorSizeField(cv.id, sv.size, 'stock', parseInt(e.target.value) || 0)} />
                                    {/* SKU */}
                                    <input style={{ ...inp, padding: '7px 8px' }} placeholder="SKU…"
                                      value={sv.sku || ''}
                                      onChange={e => setColorSizeField(cv.id, sv.size, 'sku', e.target.value)} />
                                    {/* Remove */}
                                    <button onClick={() => removeColorSizeVariant(cv.id, sv.size)}
                                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,70,70,0.3)', background: 'transparent', cursor: 'pointer', color: '#ff4646', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <X size={12} />
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                                Stock = 0 shown in red → that size appears disabled on the product page
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── GLOBAL SIZE VARIANTS — only when no colors added ── */}
              {form.colorVariants.length === 0 && (
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Size Variants</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                        For single-color products. Add a color above to get per-color size tables.
                      </p>
                    </div>
                    <button onClick={addVariant}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--accent)', background: 'rgba(124,106,255,0.08)', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Plus size={12} /> Add Size
                    </button>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Quick add sizes:</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {SIZE_PRESETS.map(s => (
                        <button key={s} onClick={() => { if (!form.variants.some(v => v.size === s)) f('variants', [...form.variants, { ...EMPTY_VARIANT, size: s, price: form.sellingPrice, stock: form.stock || '0' }]); }}
                          style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${form.variants.some(v => v.size === s) ? 'var(--accent)' : 'var(--border-glass)'}`, background: form.variants.some(v => v.size === s) ? 'rgba(124,106,255,0.1)' : 'transparent', cursor: 'pointer', color: form.variants.some(v => v.size === s) ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11 }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.variants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border-glass)', borderRadius: 10 }}>
                      No sizes yet — click quick-add above or "+ Add Size"
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 80px 1fr 32px', gap: 8, marginBottom: 6 }}>
                        {['Size', 'Price (₹)', 'Stock', 'SKU', ''].map(h => (
                          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</span>
                        ))}
                      </div>
                      <AnimatePresence>
                        {form.variants.map((v, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                            style={{ display: 'grid', gridTemplateColumns: '120px 100px 80px 1fr 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <select style={{ ...inp, padding: '7px 10px' }} value={v.size} onChange={e => setVariant(i, 'size', e.target.value)}>
                              <option value="">Size…</option>
                              {SIZE_PRESETS.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <input style={{ ...inp, padding: '7px 8px' }} type="number" placeholder={form.sellingPrice || '0'} value={v.price} onChange={e => setVariant(i, 'price', e.target.value)} />
                            <input style={{ ...inp, padding: '7px 8px', textAlign: 'center', fontWeight: 700,
                              color: (!v.stock || v.stock === '0' || v.stock === 0) ? '#ef4444' : '#22c55e' }}
                              type="number" placeholder="0" value={v.stock} onChange={e => setVariant(i, 'stock', e.target.value)} />
                            <input style={{ ...inp, padding: '7px 8px' }} placeholder="SKU…" value={v.sku} onChange={e => setVariant(i, 'sku', e.target.value)} />
                            <button onClick={() => removeVariant(i)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,70,70,0.3)', background: 'transparent', cursor: 'pointer', color: '#ff4646', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        Stock = 0 shown in red → that size appears disabled on the product page
                      </p>
                    </>
                  )}
                </div>
              )}

            </motion.div>
          )}

          {/* ══ SHIPPING ═════════════════════════════════════════════════════ */}
          {activeTab === 'shipping' && (
            <motion.div key="shipping" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Shipping & Dimensions</p>
                <div style={grid2}>
                  <Field label="Weight (kg)" hint="Used to calculate shipping rates">
                    <input style={inp} type="number" step="0.01" placeholder="0.30" value={form.weight} onChange={e => f('weight', e.target.value)} />
                  </Field>
                  <Field label="Free Shipping">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                      <div onClick={() => f('freeShipping', !form.freeShipping)}
                        style={{ width: 42, height: 24, borderRadius: 12, background: form.freeShipping ? 'var(--accent)' : 'var(--border-glass)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: form.freeShipping ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{form.freeShipping ? 'Free shipping' : 'Paid shipping'}</span>
                    </div>
                  </Field>
                </div>
                {!form.freeShipping && (
                  <Field label="Shipping Cost (₹)">
                    <input style={inp} type="number" placeholder="49" value={form.shippingCost} onChange={e => f('shippingCost', e.target.value)} />
                  </Field>
                )}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, marginTop: 4 }}>Dimensions (cm)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[['dimLength','Length'],['dimWidth','Width'],['dimHeight','Height']].map(([key, lbl]) => (
                    <Field key={key} label={lbl}>
                      <input style={inp} type="number" placeholder="0" value={form[key]} onChange={e => f(key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ SEO ══════════════════════════════════════════════════════════ */}
          {activeTab === 'seo' && (
            <motion.div key="seo" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Search Engine Optimization</p>
                <Field label="Meta Title" hint={`${form.metaTitle.length}/60 chars`}>
                  <input style={{ ...inp, borderColor: form.metaTitle.length > 60 ? '#ff4646' : undefined }} placeholder={form.name || 'Product page title for search results'} value={form.metaTitle} onChange={e => f('metaTitle', e.target.value)} />
                </Field>
                <Field label="Meta Description" hint={`${form.metaDescription.length}/160 chars`}>
                  <textarea rows={3} style={{ ...inp, resize: 'vertical', borderColor: form.metaDescription.length > 160 ? '#ff4646' : undefined }} placeholder="Brief description for search engine results…" value={form.metaDescription} onChange={e => f('metaDescription', e.target.value)} />
                </Field>
                <Field label="URL Slug" hint="yourstore.com/product/[slug]">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input style={{ ...inp, flex: 1 }} placeholder="classic-cotton-t-shirt" value={form.slug} onChange={e => f('slug', slugify(e.target.value))} />
                    <button onClick={() => f('slug', slugify(form.name))}
                      style={{ padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <RefreshCw size={12} /> Auto
                    </button>
                    <button onClick={() => navigator.clipboard?.writeText(`/product/${form.slug}`)}
                      style={{ padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <Copy size={13} />
                    </button>
                  </div>
                </Field>
                {/* SEO preview */}
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Search Preview</p>
                  <p style={{ fontSize: 15, color: '#1a73e8', fontWeight: 500, marginBottom: 2 }}>{form.metaTitle || form.name || 'Product Title'}</p>
                  <p style={{ fontSize: 11, color: '#006621', marginBottom: 4 }}>yourstore.com › product › {form.slug || 'product-slug'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{form.metaDescription || form.description?.substring(0, 160) || 'Product description will appear here…'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ STATUS ═══════════════════════════════════════════════════════ */}
          {activeTab === 'status' && (
            <motion.div key="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Product Status</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[{ val: 'published', label: 'Published', sub: 'Visible to customers', color: '#00c864' },
                    { val: 'draft',     label: 'Draft',     sub: 'Hidden from store', color: '#f5a623' }].map(opt => (
                    <div key={opt.val} onClick={() => f('status', opt.val)}
                      style={{ padding: '14px 16px', borderRadius: 10, border: `2px solid ${form.status === opt.val ? opt.color : 'var(--border-glass)'}`, background: form.status === opt.val ? `${opt.color}10` : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: form.status === opt.val ? opt.color : 'var(--text-primary)' }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{opt.sub}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'featured', label: 'Featured Product', sub: 'Show on homepage featured section', icon: Star },
                    { key: 'tryOnReady', label: '3D Try-On Ready', sub: 'Enable virtual try-on for this product', icon: Zap },
                  ].map(({ key, label: lbl, sub, icon: Icon }) => (
                    <div key={key} onClick={() => f(key, !form[key])}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-glass)', cursor: 'pointer', background: form[key] ? 'rgba(124,106,255,0.06)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color={form[key] ? 'var(--accent)' : 'var(--text-muted)'} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: form[key] ? 'var(--accent)' : 'var(--text-primary)' }}>{lbl}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>
                        </div>
                      </div>
                      <div style={{ width: 38, height: 22, borderRadius: 11, background: form[key] ? 'var(--accent)' : 'var(--border-glass)', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: form[key] ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Bottom save bar ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <button onClick={() => navigate('/admin/products')}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </div>

        {/* ── Product Preview Panel ── */}
        {preview && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'sticky', top: 80 }}>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '3/4', background: 'var(--bg-glass)' }}>
                {form.images[0] ? (
                  <img src={form.images[0].src || form.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Image size={40} />
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                {form.tags.length > 0 && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{form.tags[0]}</span>}
                <p style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 3px' }}>{form.name || 'Product Name'}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{form.brand} · {form.category}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>₹{form.sellingPrice || '—'}</p>
                  {form.mrp && form.mrp !== form.sellingPrice && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{form.mrp}</p>
                  )}
                  {discountNum > 0 && <span style={{ fontSize: 11, background: '#00c864', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>{discountNum}% OFF</span>}
                </div>
                {form.variants.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>SIZES</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {[...new Set(form.variants.map(v => v.size).filter(Boolean))].map(s => (
                        <span key={s} style={{ fontSize: 11, border: '1px solid var(--border-glass)', borderRadius: 4, padding: '2px 8px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 10, padding: '8px 10px', background: form.status === 'published' ? 'rgba(0,200,100,0.1)' : 'rgba(245,166,35,0.1)', borderRadius: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: form.status === 'published' ? '#00c864' : '#f5a623', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {form.status === 'published' ? '● Published' : '○ Draft'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
