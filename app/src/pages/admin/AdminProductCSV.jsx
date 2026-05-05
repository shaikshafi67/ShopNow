/**
 * AdminProductCSV.jsx — Bulk CSV Import & Export
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, CheckCircle, AlertCircle,
  X, ArrowLeft, FileText, RefreshCw, Eye, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import {
  parseCSV, validateRow, rowToProduct,
  exportToCSV, downloadCSV, SAMPLE_CSV,
} from '../../utils/csvHelper';

const card = { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: '20px 22px', marginBottom: 16 };

export default function AdminProductCSV() {
  const navigate = useNavigate();
  const { products, create, update } = useCatalog();
  const fileRef = useRef(null);

  const [rows,        setRows]        = useState([]);
  const [validated,   setValidated]   = useState([]);
  const [duplicates,  setDuplicates]  = useState([]); // rows that match existing products
  const [step,        setStep]        = useState('idle'); // idle|duplicates|preview|importing|done
  const [importCount, setImportCount] = useState(0);
  const [skipCount,   setSkipCount]   = useState(0);
  const [dragOver,    setDragOver]    = useState(false);
  const [rawText,     setRawText]     = useState('');
  const [showPaste,   setShowPaste]   = useState(false);

  // ── Parse ─────────────────────────────────────────────────────────────────
  const handleParse = (text) => {
    const parsed = parseCSV(text);
    if (!parsed.length) { alert('No rows found. Check the CSV format.'); return; }
    const val = parsed.map(r => ({ row: r, errors: validateRow(r) }));

    // Duplicate detection — case-insensitive match on product_name
    const existingNames = new Set(products.map(p => p.name.trim().toLowerCase()));
    const dups = parsed.filter(r => {
      const name = (r.product_name || '').trim().toLowerCase();
      return name && existingNames.has(name);
    });

    setRows(parsed);
    setValidated(val);
    setDuplicates(dups);

    if (dups.length > 0) {
      setStep('duplicates'); // show warning first
    } else {
      setStep('preview');    // no duplicates, go straight to preview
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => handleParse(e.target.result);
    reader.readAsText(file, 'UTF-8');
  };

  // ── Import with duplicate action ──────────────────────────────────────────
  const handleImport = async (dupAction) => {
    setStep('importing');
    const existingNames = new Map(products.map(p => [p.name.trim().toLowerCase(), p]));
    const valid = validated.filter(v => v.errors.length === 0);
    let imported = 0, skipped = 0;

    for (const { row } of valid) {
      const name = (row.product_name || '').trim().toLowerCase();
      const existing = existingNames.get(name);

      if (existing) {
        if (dupAction === 'skip') {
          skipped++;
          continue; // skip this duplicate
        } else if (dupAction === 'overwrite') {
          try { update(existing.id, rowToProduct(row)); imported++; }
          catch { skipped++; }
          continue;
        }
        // 'import_all' falls through to create
      }

      try { create(rowToProduct(row)); imported++; }
      catch { skipped++; }
    }

    setImportCount(imported);
    setSkipCount(skipped);
    setStep('done');
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const csv = exportToCSV(products);
    downloadCSV(csv, `shopnow-products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const validCount  = validated.filter(v => v.errors.length === 0).length;
  const errorCount  = validated.filter(v => v.errors.length > 0).length;
  const PREVIEW_COLS = ['product_name','category','brand','mrp','selling_price','stock','sku','variant_size','variant_color'];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate('/admin/products')}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: 0 }}>Bulk CSV Import / Export</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Import products via CSV or export your full catalog</p>
        </div>
      </div>

      {/* Action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Download size={18} color="var(--accent)" />
            <p style={{ fontSize: 14, fontWeight: 700 }}>Export Products</p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
            Download all <strong style={{ color: 'var(--text-primary)' }}>{products.length} products</strong> as a CSV file.
          </p>
          <button onClick={handleExport}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={14} /> Export {products.length} Products
          </button>
          <button onClick={() => downloadCSV(SAMPLE_CSV, 'sample-products.csv')}
            style={{ width: '100%', marginTop: 7, padding: '8px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <FileText size={12} /> Download Sample CSV Template
          </button>
        </div>

        <div style={{ ...card, marginBottom: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>CSV Format Guide</p>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>• <strong>Required:</strong> product_name, category, mrp, selling_price</p>
            <p>• <strong>Multi-values:</strong> use pipe <code style={{ background: 'var(--bg-glass)', padding: '0 4px', borderRadius: 3 }}>|</code> separator</p>
            <p>• <strong>Variants:</strong> variant_size, variant_color, variant_price, variant_stock</p>
            <p>• <strong>Images:</strong> pipe-separated URLs in image_urls column</p>
            <p>• <strong>Status:</strong> "published" or "draft"</p>
            <p>• <strong>Encoding:</strong> UTF-8 with BOM (Excel compatible)</p>
          </div>
        </div>
      </div>

      {/* ── IDLE: Upload zone ── */}
      {step === 'idle' && (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Import Products</p>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-glass)'}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(124,106,255,0.06)' : 'var(--bg-glass)', transition: 'all 0.2s', marginBottom: 12 }}>
            <Upload size={36} color="var(--text-muted)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Drop CSV file here or click to browse</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports .csv, .txt — max 5MB</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>

          <button onClick={() => setShowPaste(p => !p)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} /> Paste CSV text instead
          </button>
          {showPaste && (
            <div style={{ marginTop: 10 }}>
              <textarea rows={8}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                placeholder={`product_name,category,...\n"T-Shirt","T-Shirts",...`}
                value={rawText}
                onChange={e => setRawText(e.target.value)} />
              <button onClick={() => handleParse(rawText)} disabled={!rawText.trim()}
                style={{ marginTop: 8, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Parse CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DUPLICATE WARNING ── */}
      {step === 'duplicates' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={card}>
          {/* Warning header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20, padding: '18px 20px', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 12 }}>
            <AlertTriangle size={28} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', margin: '0 0 6px' }}>
                ⚠️ {duplicates.length} Duplicate Product{duplicates.length !== 1 ? 's' : ''} Found!
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                The following product names in your CSV already exist in the catalog.
                Choose how you want to handle them before importing.
              </p>
            </div>
          </div>

          {/* Duplicate list */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
            Duplicate Products ({duplicates.length})
          </p>
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
            {duplicates.map((row, i) => {
              const existing = products.find(p => p.name.trim().toLowerCase() === (row.product_name || '').trim().toLowerCase());
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < duplicates.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                  {/* Existing product thumbnail */}
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
                    {existing?.images?.[0] && <img src={existing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.product_name}
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Existing: <span style={{ color: 'var(--text-secondary)' }}>₹{existing?.price?.toLocaleString() || '—'} · {existing?.category || '—'}</span>
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        CSV: <span style={{ color: 'var(--text-secondary)' }}>₹{row.selling_price || '—'} · {row.category || '—'}</span>
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', flexShrink: 0 }}>
                    DUPLICATE
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action choice */}
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>How do you want to handle these {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>

            {/* Skip duplicates */}
            <button onClick={() => { setStep('preview'); }}
              style={{ padding: '16px 14px', borderRadius: 12, border: '2px solid #22c55e', background: 'rgba(34,197,94,0.06)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.06)'}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>⏭️</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', margin: '0 0 4px' }}>Skip Duplicates</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Import only NEW products. Skip {duplicates.length} already existing.
              </p>
            </button>

            {/* Overwrite */}
            <button onClick={() => { setStep('preview'); }}
              style={{ padding: '16px 14px', borderRadius: 12, border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.06)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.06)'}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🔄</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 4px' }}>Overwrite Existing</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Update existing products with CSV data. Cannot be undone.
              </p>
            </button>

            {/* Import all */}
            <button onClick={() => { setStep('preview'); }}
              style={{ padding: '16px 14px', borderRadius: 12, border: '2px solid #7c6aff', background: 'rgba(124,106,255,0.06)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,106,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,106,255,0.06)'}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>➕</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#7c6aff', margin: '0 0 4px' }}>Import All Anyway</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Create all as new products even if names match.
              </p>
            </button>
          </div>

          {/* Proceed buttons with action stored */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setStep('idle')}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
              ← Upload Different File
            </button>
            <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => handleImport('skip')} disabled={validCount === 0}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Upload size={13} /> Skip & Import {validCount - duplicates.length < 0 ? 0 : validCount - duplicates.length} New
              </button>
              <button onClick={() => handleImport('overwrite')} disabled={validCount === 0}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <RefreshCw size={13} /> Overwrite + Import {validCount}
              </button>
              <button onClick={() => handleImport('import_all')} disabled={validCount === 0}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Upload size={13} /> Import All {validCount}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PREVIEW (no duplicates path) ── */}
      {step === 'preview' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Preview — {rows.length} rows</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, background: 'rgba(0,200,100,0.1)', color: '#00c864', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>
                ✓ {validCount} valid
              </span>
              {errorCount > 0 && (
                <span style={{ fontSize: 12, background: 'rgba(255,70,70,0.1)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.25)', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>
                  ✗ {errorCount} errors
                </span>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-glass)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>Status</th>
                  {PREVIEW_COLS.map(c => (
                    <th key={c} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>
                      {c.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validated.map(({ row, errors }, idx) => {
                  const isDup = duplicates.some(d => d.product_name?.trim().toLowerCase() === (row.product_name || '').trim().toLowerCase());
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)', background: errors.length > 0 ? 'rgba(255,70,70,0.04)' : isDup ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '7px 10px' }}>
                        {errors.length > 0
                          ? <div title={errors.join('\n')}><AlertCircle size={14} color="#ff4646" /></div>
                          : isDup
                            ? <div title="Duplicate product name"><AlertTriangle size={14} color="#f59e0b" /></div>
                            : <CheckCircle size={14} color="#00c864" />
                        }
                      </td>
                      {PREVIEW_COLS.map(c => (
                        <td key={c} style={{ padding: '7px 10px', color: 'var(--text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[c] || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {errorCount > 0 && (
            <div style={{ marginTop: 14, background: 'rgba(255,70,70,0.06)', border: '1px solid rgba(255,70,70,0.18)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#ff4646', marginBottom: 8 }}>Row Errors</p>
              {validated.filter(v => v.errors.length > 0).map(({ row, errors }, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Row {row._row} "{row.product_name || 'unnamed'}":</span>
                  <span style={{ fontSize: 11, color: '#ff4646', marginLeft: 6 }}>{errors.join(' · ')}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Rows with errors will be skipped. Only {validCount} valid rows will be imported.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(duplicates.length > 0 ? 'duplicates' : 'idle')}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
              ← Back
            </button>
            <button onClick={() => handleImport('import_all')} disabled={validCount === 0}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: validCount > 0 ? 'var(--gradient-1)' : 'var(--bg-glass)', color: validCount > 0 ? '#fff' : 'var(--text-muted)', cursor: validCount > 0 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={14} /> Import {validCount} Valid Products
            </button>
          </div>
        </div>
      )}

      {/* ── IMPORTING ── */}
      {step === 'importing' && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
            <RefreshCw size={36} color="var(--accent)" />
          </motion.div>
          <p style={{ fontSize: 16, fontWeight: 700 }}>Importing products…</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Please wait</p>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <CheckCircle size={48} color="#00c864" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Import Complete!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
            Successfully imported / updated <strong>{importCount}</strong> products.
          </p>
          {skipCount > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 24 }}>
              {skipCount} row{skipCount !== 1 ? 's' : ''} skipped (errors or duplicates).
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => { setStep('idle'); setRows([]); setValidated([]); setDuplicates([]); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
              Import More
            </button>
            <button onClick={() => navigate('/admin/products')}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--gradient-1)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={14} /> View Products
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
