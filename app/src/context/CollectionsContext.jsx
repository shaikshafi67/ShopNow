import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CollectionsContext = createContext(null);
export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used within CollectionsProvider');
  return ctx;
}

const toApp = (c) => ({
  id:           c.id,
  name:         c.name  ?? '',
  title:        c.name  ?? '',  // alias for old code
  slug:         c.slug  ?? '',
  description:  c.description,
  image:        c.image,
  isAuto:       c.is_auto,
  autoCategory: c.auto_category,
  isActive:     c.is_active,
  sortOrder:    c.sort_order,
  createdAt:    c.created_at,
});

export function CollectionsProvider({ children }) {
  const [collections, setCollections] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('collections').select('*').order('sort_order');
    setCollections((data ?? []).map(toApp));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCollection = useCallback(async (col) => {
    const { data, error } = await supabase.from('collections').insert({
      name: col.name, slug: col.slug, description: col.description ?? '',
      image: col.image ?? null, is_auto: col.isAuto ?? false,
      auto_category: col.autoCategory ?? null,
      is_active: col.isActive !== false, sort_order: collections.length,
    }).select().single();
    if (error) throw new Error(error.message);
    const c = toApp(data);
    setCollections(prev => [...prev, c]);
    return c;
  }, [collections]);

  const updateCollection = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('collections').update({
      name: updates.name, slug: updates.slug, description: updates.description,
      image: updates.image, is_active: updates.isActive,
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    setCollections(prev => prev.map(c => c.id === id ? toApp(data) : c));
  }, []);

  const deleteCollection = useCallback(async (id) => {
    await supabase.from('collections').delete().eq('id', id);
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const uploadCollectionImage = useCallback(async (file) => {
    const path = `collections/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path);
    return publicUrl;
  }, []);

  // Derived values expected by HomePage / old code
  const customCollections = collections.filter(c => !c.isAuto && c.isActive).map(c => ({
    ...c,
    title:     c.name,      // pages use c.title
    active:    c.isActive,  // pages use c.active
    productIds: [],         // pages use c.productIds
  }));
  const autoImages        = Object.fromEntries(collections.filter(c => c.isAuto && c.autoCategory).map(c => [c.autoCategory, c.image]));
  const hiddenAutoIds     = collections.filter(c => c.isAuto && !c.isActive).map(c => c.autoCategory).filter(Boolean);
  const autoExclusions    = {};

  const setAutoImage = useCallback(async (category, imageUrl) => {
    const col = collections.find(c => c.isAuto && c.autoCategory === category);
    if (col) await updateCollection(col.id, { image: imageUrl });
  }, [collections, updateCollection]);

  const setAutoExclusion = useCallback(() => {}, []); // no-op, handled by Supabase
  const hideAutoCollections = useCallback(async (categories) => {
    for (const cat of categories) {
      const col = collections.find(c => c.isAuto && c.autoCategory === cat);
      if (col) await updateCollection(col.id, { isActive: false });
    }
  }, [collections, updateCollection]);

  return (
    <CollectionsContext.Provider value={{
      collections, customCollections, autoImages, hiddenAutoIds, autoExclusions,
      addCollection, updateCollection, deleteCollection, uploadCollectionImage, reload: load,
      // aliases
      addCustom: addCollection, updateCustom: updateCollection, removeCustom: deleteCollection,
      setAutoImage, setAutoExclusion, hideAutoCollections,
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}
