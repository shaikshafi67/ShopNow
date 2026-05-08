import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PagesContext = createContext(null);
export function usePages() {
  const ctx = useContext(PagesContext);
  if (!ctx) throw new Error('usePages must be used within PagesProvider');
  return ctx;
}

const toApp = (p) => ({
  id:              p.id,
  title:           p.title,
  slug:            p.slug,
  content:         p.content,
  status:          p.status,
  metaTitle:       p.meta_title,
  metaDescription: p.meta_description,
  createdAt:       p.created_at,
  updatedAt:       p.updated_at,
});

export function PagesProvider({ children }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    supabase.from('pages').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPages((data ?? []).map(toApp)));
  }, []);

  const addPage = useCallback(async (page) => {
    const { data, error } = await supabase.from('pages').insert({
      title: page.title, slug: page.slug, content: page.content ?? '',
      status: page.status ?? 'draft',
      meta_title: page.metaTitle ?? '', meta_description: page.metaDescription ?? '',
    }).select().single();
    if (error) throw new Error(error.message);
    const p = toApp(data);
    setPages(prev => [p, ...prev]);
    return p;
  }, []);

  const updatePage = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('pages').update({
      title: updates.title, slug: updates.slug, content: updates.content,
      status: updates.status,
      meta_title: updates.metaTitle, meta_description: updates.metaDescription,
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    setPages(prev => prev.map(p => p.id === id ? toApp(data) : p));
  }, []);

  const deletePage = useCallback(async (id) => {
    await supabase.from('pages').delete().eq('id', id);
    setPages(prev => prev.filter(p => p.id !== id));
  }, []);

  const getBySlug = useCallback((slug) => pages.find(p => p.slug === slug), [pages]);

  const bulkDelete = useCallback(async (ids) => {
    await supabase.from('pages').delete().in('id', ids);
    setPages(prev => prev.filter(p => !ids.includes(p.id)));
  }, []);

  const bulkSetStatus = useCallback(async (ids, status) => {
    await supabase.from('pages').update({ status }).in('id', ids);
    setPages(prev => prev.map(p => ids.includes(p.id) ? { ...p, status } : p));
  }, []);

  return (
    <PagesContext.Provider value={{
      pages, addPage, updatePage, deletePage, getBySlug,
      createPage: addPage,   // alias used by AdminPages
      bulkDelete,
      bulkSetStatus,
    }}>
      {children}
    </PagesContext.Provider>
  );
}
