import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ArrowLeft, ChevronUp, ChevronDown, Eye,
  Copy, MoreHorizontal, Edit3, Globe, Search, Pencil, Plus, Check,
  Bold, Italic, Underline, Link, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Minus, Code, Type,
  ChevronDown as ChevronD, Image as ImageIcon, X, Trash2,
} from 'lucide-react';
import { usePages } from '../../context/PagesContext';
import { useToast } from '../../context/ToastContext';

/* ── helpers ── */
function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}
function fmtDate(iso) {
  const d = new Date(iso);
  const opts = { day: 'numeric', month: 'short' };
  return d.toLocaleDateString('en-IN', opts) + ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateFull(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ══════════════════════════════════════════════════════════ */
export default function AdminPages() {
  const { pages, updatePage, createPage, bulkDelete, bulkSetStatus } = usePages();
  const toast = useToast();

  const [view, setView] = useState('list');   // 'list' | 'edit'
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // List toolbar state
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [visibilityTab, setVisibilityTab] = useState('all'); // 'all' | 'published' | 'hidden'
  const [sortField, setSortField] = useState('updatedAt');   // 'title' | 'updatedAt'
  const [sortDir, setSortDir] = useState('desc');            // 'asc' | 'desc'
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  /* edit page index for prev/next nav */
  const editIdx = pages.findIndex((p) => p.id === editId);

  const openEdit = (page) => {
    setEditId(page.id);
    setDraft({ ...page });
    setView('edit');
  };

  const handleAddPage = () => {
    const page = createPage({ title: 'Untitled page', slug: 'untitled-' + Date.now() });
    openEdit(page);
  };
  const navPage = (dir) => {
    const next = pages[editIdx + dir];
    if (next) openEdit(next);
  };

  const setDraftField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = () => {
    updatePage(editId, draft);
    toast.success(`"${draft.title}" saved.`);
    setView('list');
  };

  const toggleSelect = (id) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () =>
    setSelected(selected.length === pages.length ? [] : pages.map((p) => p.id));

  const handleBulkVisible = () => {
    bulkSetStatus(selected, 'published');
    toast.success(`${selected.length} page${selected.length > 1 ? 's' : ''} set as visible.`);
    setSelected([]);
  };
  const handleBulkHidden = () => {
    bulkSetStatus(selected, 'hidden');
    toast.info(`${selected.length} page${selected.length > 1 ? 's' : ''} set as hidden.`);
    setSelected([]);
  };
  const handleBulkDelete = () => {
    bulkDelete(selected);
    toast.info(`${selected.length} page${selected.length > 1 ? 's' : ''} deleted.`);
    setSelected([]);
    setConfirmDelete(false);
    setShowMoreMenu(false);
  };

  /* ── EDIT VIEW ── */
  if (view === 'edit' && draft) {
    return (
      <div style={{ maxWidth: 1100 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setView('list')} style={iconBtnSt}><ArrowLeft size={15} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}>
              <FileText size={14} />
              <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setView('list')}>Pages</span>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{draft.title}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { setDraft({ ...draft, title: draft.title + ' (copy)' }); toast.info('Duplicated — save to create.'); }} style={topBtn}>
              <Copy size={13} /> Duplicate
            </button>
            <a href={'/' + draft.slug} target="_blank" rel="noopener noreferrer" style={{ ...topBtn, textDecoration: 'none' }}>
              <Eye size={13} /> View
            </a>
            <button style={topBtn}><MoreHorizontal size={13} /> More actions</button>
            <div style={{ width: 1, height: 24, background: 'var(--border-glass)', margin: '0 2px' }} />
            <button onClick={() => navPage(-1)} disabled={editIdx <= 0} style={{ ...iconBtnSt, opacity: editIdx <= 0 ? 0.3 : 1 }}><ChevronUp size={15} /></button>
            <button onClick={() => navPage(1)} disabled={editIdx >= pages.length - 1} style={{ ...iconBtnSt, opacity: editIdx >= pages.length - 1 ? 0.3 : 1 }}><ChevronDown size={15} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: 18, alignItems: 'start' }} className="pages-edit-grid">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Title */}
            <div style={cardSt}>
              <label style={fieldLabel}>Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraftField('title', e.target.value)}
                style={{ ...inputSt, fontSize: 16, fontWeight: 600 }}
                placeholder="Page title"
              />
            </div>

            {/* Content — Rich Text */}
            <div style={cardSt}>
              <label style={fieldLabel}>Content</label>
              <RichTextEditor
                value={draft.content || ''}
                onChange={(v) => setDraftField('content', v)}
              />
            </div>

            {/* SEO */}
            <div style={cardSt}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Search engine listing</span>
                <button onClick={() => {}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0 }}><Pencil size={14} /></button>
              </div>
              {/* Preview */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#1a0dab', fontWeight: 500, marginBottom: 2 }}>{draft.metaTitle || draft.title}</div>
                <div style={{ fontSize: 12, color: '#006621' }}>shopnow.com › pages › {draft.slug}</div>
                <div style={{ fontSize: 12, color: '#545454', marginTop: 2 }}>{draft.metaDescription || stripHtml(draft.content).slice(0, 120) + '…'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={fieldLabel}>Page title</label>
                  <input value={draft.metaTitle || ''} onChange={(e) => setDraftField('metaTitle', e.target.value)} style={inputSt} placeholder={draft.title} />
                </div>
                <div>
                  <label style={fieldLabel}>Description</label>
                  <textarea value={draft.metaDescription || ''} onChange={(e) => setDraftField('metaDescription', e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical' }} placeholder="Brief description for search engines" />
                </div>
                <div>
                  <label style={fieldLabel}>URL handle</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, overflow: 'hidden' }}>
                    <span style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)', borderRight: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>shopnow.com/</span>
                    <input value={draft.slug || ''} onChange={(e) => setDraftField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} style={{ ...inputSt, border: 'none', borderRadius: 0, flex: 1 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>

            {/* Visibility */}
            <div style={cardSt}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Visibility</div>
              {[{ v: 'published', l: 'Visible' }, { v: 'hidden', l: 'Hidden' }].map((o) => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                  <input type="radio" name="visibility" checked={draft.status === o.v} onChange={() => setDraftField('status', o.v)}
                    style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{o.l}</div>
                    {draft.status === o.v && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        As of {fmtDateFull(draft.updatedAt)}
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}><Pencil size={11} /></button>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Template */}
            <div style={cardSt}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Template</span>
                <Eye size={14} color="var(--text-muted)" />
              </div>
              <select value={draft.template || 'page'} onChange={(e) => setDraftField('template', e.target.value)} style={{ ...inputSt }}>
                <option value="page">page</option>
                <option value="contact">contact</option>
                <option value="about">about</option>
                <option value="policy">policy</option>
              </select>
            </div>

            {/* Save */}
            <button onClick={handleSave} style={{ ...accentBtnSt, width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
              Save
            </button>
            <button onClick={() => setView('list')} style={{ ...outlineBtnSt, width: '100%', justifyContent: 'center' }}>
              Discard
            </button>
          </div>
        </div>

        <style>{`@media(max-width:860px){.pages-edit-grid{grid-template-columns:1fr!important;}}`}</style>
      </div>
    );
  }

  /* ── LIST VIEW ── */

  // Filtered + sorted list
  const displayPages = pages
    .filter((p) => visibilityTab === 'all' || p.status === visibilityTab)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || stripHtml(p.content).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = sortField === 'title' ? a.title.toLowerCase() : a.updatedAt;
      const vb = sortField === 'title' ? b.title.toLowerCase() : b.updatedAt;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const allChecked = selected.length > 0 && selected.length === displayPages.length;
  const someChecked = selected.length > 0 && !allChecked;

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronD size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} color="var(--accent)" />
      : <ChevronDown size={12} color="var(--accent)" />;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Pages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{pages.length} pages</p>
        </div>
        <button onClick={handleAddPage} style={accentBtnSt}><Plus size={15} /> Add page</button>
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div style={{ borderBottom: '1px solid var(--border-glass)' }}>

          {/* Search bar (shown when search active) */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-glass)' }}>
                  <Search size={15} color="var(--text-muted)" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search pages by title or content…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      <X size={14} />
                    </button>
                  )}
                  <button onClick={() => { setShowSearch(false); setSearch(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs / Bulk actions row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', minHeight: 46 }}>
            {selected.length > 0 ? (
              /* ── Bulk action bar ── */
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <input type="checkbox" checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={() => setSelected(allChecked ? [] : displayPages.map((p) => p.id))}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.length} selected</span>
                <div style={{ flex: 1 }} />
                <button onClick={handleBulkVisible} style={bulkBtnSt}>Set as visible</button>
                <button onClick={handleBulkHidden} style={bulkBtnSt}>Set as hidden</button>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setShowMoreMenu(!showMoreMenu); setConfirmDelete(false); }} style={{ ...iconBtnSt, padding: '5px 9px' }}>
                    <MoreHorizontal size={16} />
                  </button>
                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        style={{ position: 'absolute', top: '110%', right: 0, zIndex: 300, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 190, overflow: 'hidden' }}>
                        {!confirmDelete ? (
                          <button onClick={() => setConfirmDelete(true)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Trash2 size={14} /> Delete pages
                          </button>
                        ) : (
                          <div style={{ padding: '14px 16px' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                              Delete <strong>{selected.length}</strong> page{selected.length > 1 ? 's' : ''}? Cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={handleBulkDelete} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                              <button onClick={() => { setConfirmDelete(false); setShowMoreMenu(false); }} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showMoreMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => { setShowMoreMenu(false); setConfirmDelete(false); }} />}
                </div>
              </div>
            ) : (
              /* ── Normal tab bar ── */
              <>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ v: 'all', l: 'All' }, { v: 'published', l: 'Visible' }, { v: 'hidden', l: 'Hidden' }].map((tab) => (
                    <button key={tab.v} onClick={() => setVisibilityTab(tab.v)} style={{
                      padding: '5px 14px', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer',
                      border: visibilityTab === tab.v ? '1px solid var(--border-glass)' : '1px solid transparent',
                      background: visibilityTab === tab.v ? 'var(--bg-glass)' : 'transparent',
                      color: visibilityTab === tab.v ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: visibilityTab === tab.v ? 600 : 400,
                    }}>{tab.l}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Search toggle */}
                  <button onClick={() => { setShowSearch(true); }} title="Search" style={{ ...iconBtnSt, background: showSearch ? 'rgba(124,106,255,0.1)' : 'var(--bg-glass)', color: showSearch ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Search size={14} />
                  </button>
                  {/* Filter by visibility */}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowFilterMenu(!showFilterMenu)} title="Filter"
                      style={{ ...iconBtnSt, background: visibilityTab !== 'all' ? 'rgba(124,106,255,0.1)' : 'var(--bg-glass)', color: visibilityTab !== 'all' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
                    </button>
                    <AnimatePresence>
                      {showFilterMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          style={{ position: 'absolute', top: '110%', right: 0, zIndex: 300, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 180, overflow: 'hidden', padding: '8px 0' }}>
                          <div style={{ padding: '6px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Filter by visibility</div>
                          {[{ v: 'all', l: 'All pages' }, { v: 'published', l: 'Visible only' }, { v: 'hidden', l: 'Hidden only' }].map((o) => (
                            <button key={o.v} onClick={() => { setVisibilityTab(o.v); setShowFilterMenu(false); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', color: visibilityTab === o.v ? 'var(--accent)' : 'var(--text-primary)', fontWeight: visibilityTab === o.v ? 600 : 400 }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              {o.l}
                              {visibilityTab === o.v && <Check size={13} color="var(--accent)" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {showFilterMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowFilterMenu(false)} />}
                  </div>
                  {/* Sort toggle */}
                  <button onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
                    style={{ ...iconBtnSt }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l4-4 4 4M7 5v14M21 15l-4 4-4-4M17 19V5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                <th style={{ width: 44, padding: '10px 14px' }}>
                  <input type="checkbox" checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={() => setSelected(allChecked ? [] : displayPages.map((p) => p.id))}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                </th>
                <th style={{ ...thSt, cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Title <SortIcon field="title" /></span>
                </th>
                <th style={thSt}>Visibility</th>
                <th style={thSt}>Content</th>
                <th style={{ ...thSt, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('updatedAt')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Updated <SortIcon field="updatedAt" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayPages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileText size={32} style={{ opacity: 0.2, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14 }}>No pages found{search ? ` for "${search}"` : ''}.</p>
                    {search && <button onClick={() => setSearch('')} style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Clear search</button>}
                  </td>
                </tr>
              ) : displayPages.map((page) => (
                <tr key={page.id}
                  style={{ borderBottom: '1px solid var(--border-glass)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(page.id)} onChange={() => toggleSelect(page.id)}
                      style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent)' }} onClick={() => openEdit(page)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {page.title}
                      {page.id === 'contact' && <Eye size={13} color="var(--text-muted)" />}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={() => openEdit(page)}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 20,
                      background: page.status === 'published' ? '#22c55e18' : '#f59e0b18',
                      color: page.status === 'published' ? '#16a34a' : '#b45309',
                    }}>
                      {page.status === 'published' ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: 380 }} onClick={() => openEdit(page)}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stripHtml(page.content).slice(0, 110) || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={() => openEdit(page)}>
                    {fmtDate(page.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {displayPages.length} of {pages.length} pages
            {visibilityTab !== 'all' || search ? ' · ' : ''}
            {(visibilityTab !== 'all' || search) && (
              <button onClick={() => { setVisibilityTab('all'); setSearch(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                Clear filters
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RICH TEXT EDITOR
══════════════════════════════════════════════════════════ */
const BLOCK_FORMATS = [
  { label: 'Paragraph', tag: 'p' },
  { label: 'Heading 1', tag: 'h1' },
  { label: 'Heading 2', tag: 'h2' },
  { label: 'Heading 3', tag: 'h3' },
  { label: 'Heading 4', tag: 'h4' },
];

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [showHtml, setShowHtml] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);
  const [blockFormat, setBlockFormat] = useState('Paragraph');
  const [showFormatDrop, setShowFormatDrop] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const savedRange = useRef(null);

  /* seed content on mount only */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []); // eslint-disable-line

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const formatBlock = (tag) => {
    exec('formatBlock', tag);
    setBlockFormat(BLOCK_FORMATS.find((f) => f.tag === tag)?.label || 'Paragraph');
    setShowFormatDrop(false);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const insertLink = () => {
    restoreSelection();
    if (linkUrl) exec('createLink', linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl);
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const toggleHtml = () => {
    if (!showHtml) {
      setRawHtml(editorRef.current?.innerHTML || '');
    } else {
      if (editorRef.current) editorRef.current.innerHTML = rawHtml;
      onChange(rawHtml);
    }
    setShowHtml(!showHtml);
  };

  const TBtn = ({ onClick, title, active, children }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick && onClick(); }}
      title={title}
      style={{
        background: active ? 'rgba(124,106,255,0.12)' : 'transparent',
        border: 'none', borderRadius: 5, padding: '5px 7px', cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-glass)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );

  const Sep = () => <div style={{ width: 1, height: 20, background: 'var(--border-glass)', margin: '0 4px' }} />;

  return (
    <div style={{ border: '1px solid var(--border-glass)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-glass)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
        padding: '8px 10px', borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-card)',
      }}>
        {/* Block format dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowFormatDrop(!showFormatDrop); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
              background: 'transparent', border: '1px solid var(--border-glass)',
              borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: 13, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            }}
          >
            {blockFormat} <ChevronD size={12} />
          </button>
          {showFormatDrop && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              minWidth: 150, overflow: 'hidden',
            }}>
              {BLOCK_FORMATS.map((f) => (
                <button key={f.tag} onMouseDown={(e) => { e.preventDefault(); formatBlock(f.tag); }}
                  style={{
                    width: '100%', padding: '9px 14px', background: 'transparent', border: 'none',
                    textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)',
                    fontSize: f.tag === 'h1' ? 18 : f.tag === 'h2' ? 16 : f.tag === 'h3' ? 14 : 13,
                    fontWeight: f.tag !== 'p' ? 700 : 400,
                    fontFamily: f.tag !== 'p' ? 'var(--font-display)' : 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >{f.label}</button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* Text formatting */}
        <TBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={14} /></TBtn>
        <TBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={14} /></TBtn>
        <TBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={14} /></TBtn>

        {/* Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            title="Text color"
            style={{ background: 'transparent', border: 'none', borderRadius: 5, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-secondary)' }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>A</span>
            <span style={{ display: 'block', width: 14, height: 3, background: '#ef4444', borderRadius: 1 }} />
            <ChevronD size={10} />
          </button>
        </div>

        <Sep />

        {/* Alignment */}
        <TBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={14} /></TBtn>
        <TBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={14} /></TBtn>
        <TBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={14} /></TBtn>

        <Sep />

        {/* Lists */}
        <TBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={14} /></TBtn>
        <TBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></TBtn>

        <Sep />

        {/* Link */}
        <TBtn
          title="Insert link"
          onClick={() => { saveSelection(); setShowLinkDialog(true); }}
        ><Link size={14} /></TBtn>

        {/* Horizontal rule */}
        <TBtn onClick={() => exec('insertHorizontalRule')} title="Divider"><Minus size={14} /></TBtn>

        <Sep />

        {/* HTML source */}
        <TBtn onClick={toggleHtml} title="HTML source" active={showHtml}><Code size={14} /></TBtn>
      </div>

      {/* Link dialog */}
      <AnimatePresence>
        {showLinkDialog && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card)', display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <Link size={14} color="var(--text-muted)" />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') insertLink(); if (e.key === 'Escape') setShowLinkDialog(false); }}
              placeholder="https://example.com"
              autoFocus
              style={{ ...inputSt, flex: 1, padding: '6px 10px' }}
            />
            <button onClick={insertLink} style={{ ...accentBtnSt, padding: '6px 14px', fontSize: 13 }}>Apply</button>
            <button onClick={() => setShowLinkDialog(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor area */}
      {showHtml ? (
        <textarea
          value={rawHtml}
          onChange={(e) => setRawHtml(e.target.value)}
          onBlur={() => { onChange(rawHtml); }}
          style={{
            width: '100%', minHeight: 380, padding: '16px', border: 'none',
            background: '#1a1a2e', color: '#a3e635',
            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          style={{
            minHeight: 380, padding: '18px 20px',
            outline: 'none', lineHeight: 1.8,
            fontFamily: 'var(--font-body)', fontSize: 14,
            color: 'var(--text-primary)',
          }}
        />
      )}

      <style>{`
        [contenteditable] h1 { font-size: 28px; font-weight: 800; margin: 20px 0 10px; font-family: var(--font-display); }
        [contenteditable] h2 { font-size: 20px; font-weight: 700; margin: 18px 0 8px; font-family: var(--font-display); }
        [contenteditable] h3 { font-size: 16px; font-weight: 700; margin: 14px 0 6px; }
        [contenteditable] h4 { font-size: 14px; font-weight: 700; margin: 12px 0 4px; }
        [contenteditable] p { margin: 0 0 10px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 0 0 12px; }
        [contenteditable] li { margin-bottom: 4px; }
        [contenteditable] a { color: var(--accent); }
        [contenteditable] hr { border: none; border-top: 1px solid var(--border-glass); margin: 16px 0; }
        [contenteditable]:empty:before { content: 'Start writing your page content here…'; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

/* ─── styles ─── */
const cardSt = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 14, padding: '20px',
};
const thSt = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  color: 'var(--text-secondary)', fontSize: 12,
};
const inputSt = {
  width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 10, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
};
const fieldLabel = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
};
const accentBtnSt = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
  borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', border: 'none', background: 'var(--accent)', color: 'white',
};
const outlineBtnSt = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
  borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
  cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)',
  color: 'var(--text-primary)',
};
const topBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--bg-card)',
  color: 'var(--text-primary)',
};
const bulkBtnSt = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-glass)',
  background: 'var(--bg-glass)', fontSize: 13, fontFamily: 'var(--font-body)',
  cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500,
};
const iconBtnSt = {
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
  borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center',
};
