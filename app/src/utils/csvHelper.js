/**
 * csvHelper.js — CSV Import / Export for Product Catalog
 *
 * Format spec:
 *   product_name, description, category, subcategory, brand,
 *   mrp, selling_price, cost_price, stock, sku,
 *   weight, length, width, height, tags, image_urls,
 *   variant_size, variant_color, variant_price, variant_stock
 *
 * Multi-values use pipe  |  as separator.
 */

export const CSV_HEADERS = [
  'product_name','description','category','subcategory','brand',
  'mrp','selling_price','cost_price','stock','sku',
  'weight','length','width','height','tags','image_urls',
  'variant_size','variant_color','variant_price','variant_stock',
  'meta_title','meta_description','slug','status','featured','try_on_ready',
];

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { fields.push(cur); cur = ''; }
    else cur += c;
  }
  fields.push(cur);
  return fields;
}

export function parseCSV(text) {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    const vals = parseLine(line);
    const row = { _row: i + 2 };
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim(); });
    return row;
  });
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateRow(row) {
  const errors = [];
  if (!row.product_name) errors.push('product_name is required');
  if (!row.category)     errors.push('category is required');
  const mrp  = parseFloat(row.mrp);
  const sp   = parseFloat(row.selling_price);
  if (isNaN(mrp) || mrp <= 0)       errors.push('mrp must be a positive number');
  if (isNaN(sp)  || sp  <= 0)       errors.push('selling_price must be a positive number');
  if (!isNaN(mrp) && !isNaN(sp) && sp > mrp) errors.push('selling_price cannot exceed mrp');
  return errors;
}

// ─── CSV row → Product object ─────────────────────────────────────────────────

export function rowToProduct(row) {
  const pipe = v => (v || '').split('|').map(s => s.trim()).filter(Boolean);
  const mrp  = parseFloat(row.mrp)  || 0;
  const sp   = parseFloat(row.selling_price) || 0;

  // Build variants
  const vSizes  = pipe(row.variant_size);
  const vColors = pipe(row.variant_color);
  const vPrices = pipe(row.variant_price);
  const vStocks = pipe(row.variant_stock);
  const maxLen  = Math.max(vSizes.length, vColors.length);
  const variants = maxLen > 0
    ? Array.from({ length: maxLen }, (_, i) => ({
        size:  vSizes[i]  || '',
        color: vColors[i] || '',
        price: parseFloat(vPrices[i]) || sp,
        stock: parseInt(vStocks[i], 10) || 0,
      }))
    : [];

  return {
    name:           row.product_name,
    description:    row.description    || '',
    category:       row.category,
    subcategory:    row.subcategory    || '',
    brand:          row.brand          || 'ShopNow',
    price:          sp,
    originalPrice:  mrp,
    discount:       mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0,
    costPrice:      parseFloat(row.cost_price) || 0,
    stock:          parseInt(row.stock, 10) || 0,
    sku:            row.sku            || '',
    weight:         row.weight         || '',
    dimensions:     { length: row.length || '', width: row.width || '', height: row.height || '' },
    tags:           pipe(row.tags),
    images:         pipe(row.image_urls),
    variants,
    sizes:          [...new Set(vSizes)],
    colors:         [],
    metaTitle:      row.meta_title     || '',
    metaDescription:row.meta_description || '',
    slug:           row.slug           || slugify(row.product_name),
    tag:            row.status === 'draft' ? 'Draft' : 'Active',
    featured:       row.featured === 'true' || row.featured === '1',
    tryOnReady:     row.try_on_ready === 'true' || row.try_on_ready === '1',
    gender:         detectGender(row.category),
    rating:         4.0,
    reviews:        0,
  };
}

// ─── Product → CSV row ────────────────────────────────────────────────────────

function csvEscape(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

export function productToRow(p) {
  const v = p.variants || [];
  return CSV_HEADERS.map(h => {
    switch (h) {
      case 'product_name':     return csvEscape(p.name);
      case 'description':      return csvEscape(p.description);
      case 'category':         return csvEscape(p.category);
      case 'subcategory':      return csvEscape(p.subcategory || '');
      case 'brand':            return csvEscape(p.brand || '');
      case 'mrp':              return p.originalPrice || p.price || '';
      case 'selling_price':    return p.price || '';
      case 'cost_price':       return p.costPrice || '';
      case 'stock':            return p.stock ?? 0;
      case 'sku':              return csvEscape(p.sku || '');
      case 'weight':           return p.weight || '';
      case 'length':           return p.dimensions?.length || '';
      case 'width':            return p.dimensions?.width  || '';
      case 'height':           return p.dimensions?.height || '';
      case 'tags':             return csvEscape(Array.isArray(p.tags) ? p.tags.join('|') : (p.tags || ''));
      case 'image_urls':       return csvEscape((p.images || []).filter(u => !u.startsWith('data:')).join('|'));
      case 'variant_size':     return csvEscape(v.map(x => x.size  || '').join('|'));
      case 'variant_color':    return csvEscape(v.map(x => x.color || '').join('|'));
      case 'variant_price':    return csvEscape(v.map(x => x.price || '').join('|'));
      case 'variant_stock':    return csvEscape(v.map(x => x.stock ?? 0).join('|'));
      case 'meta_title':       return csvEscape(p.metaTitle || '');
      case 'meta_description': return csvEscape(p.metaDescription || '');
      case 'slug':             return csvEscape(p.slug || '');
      case 'status':           return p.tag === 'Draft' ? 'draft' : 'published';
      case 'featured':         return p.featured ? 'true' : 'false';
      case 'try_on_ready':     return p.tryOnReady ? 'true' : 'false';
      default:                 return '';
    }
  }).join(',');
}

export function exportToCSV(products) {
  const header = CSV_HEADERS.join(',');
  const rows   = products.map(productToRow);
  return [header, ...rows].join('\n');
}

export function downloadCSV(content, filename = 'products.csv') {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const SAMPLE_CSV = `${CSV_HEADERS.join(',')}
"Classic Cotton T-Shirt","Premium 100% cotton tee for everyday comfort","T-Shirts","Men","Nike",999,699,500,50,"SKU-001",0.3,10,8,2,"casual|summer","/images/men/tshirt/tshirt_1_1.jpg","S|M|L|XL","Black|White","699|699|749|749","10|20|15|5","Classic Cotton T-Shirt | ShopNow","Premium cotton t-shirt available in multiple sizes","classic-cotton-t-shirt","published","false","true"
"Floral Wrap Dress","Elegant floral print wrap dress perfect for occasions","Dresses","Women","H&M",2499,1499,900,30,"SKU-002",0.5,15,12,3,"floral|dress|occasion","/images/women/dress/dress_1_1.jpg","S|M|L","Red|Blue","1499|1499|1599","8|12|10","","","floral-wrap-dress","published","false","false"`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function slugify(text) {
  return (text || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function detectGender(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('women') || c.includes('woman')) return 'women';
  return 'men';
}

export function autoSKU(name, count) {
  const prefix = (name || 'PRD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'PRD';
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}
