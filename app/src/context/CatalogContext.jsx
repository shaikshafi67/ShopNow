import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const CatalogContext = createContext(null);
export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

const toApp = (p) => ({
  id:            p.id,
  name:          p.name,
  description:   p.description,
  price:         Number(p.price),
  originalPrice: Number(p.original_price),
  discount:      Math.round((1 - p.price / p.original_price) * 100),
  rating:        Number(p.rating),
  reviews:       p.reviews,
  category:      p.category,
  gender:        p.gender,
  brand:         p.brand,
  tag:           p.tag,
  images:        p.images ?? [],
  colors:        p.colors ?? [],
  sizes:         p.sizes  ?? [],
  stock:         p.stock,
  tryOnReady:    p.try_on_ready,
  freeShipping:  p.free_shipping,
  weight:        p.weight,
  sku:           p.sku,
  isActive:      p.is_active,
  createdAt:     p.created_at,
});

const toDB = (p) => ({
  name:          p.name,
  description:   p.description ?? '',
  price:         p.price,
  original_price: p.originalPrice,
  rating:        p.rating ?? 4.0,
  reviews:       p.reviews ?? 0,
  category:      p.category ?? '',
  gender:        p.gender ?? 'unisex',
  brand:         p.brand ?? 'ShopNow',
  tag:           p.tag ?? 'New',
  images:        p.images ?? [],
  colors:        p.colors ?? [],
  sizes:         p.sizes  ?? [],
  stock:         p.stock  ?? 25,
  try_on_ready:  p.tryOnReady ?? false,
  free_shipping: p.freeShipping ?? false,
  weight:        p.weight ?? null,
  sku:           p.sku ?? null,
  is_active:     p.isActive !== false,
});

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data ?? []).map(toApp));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Real-time updates for product changes
    const channel = supabase.channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const addProduct = useCallback(async (product) => {
    const { data, error } = await supabase.from('products').insert(toDB(product)).select().single();
    if (error) throw new Error(error.message);
    const p = toApp(data);
    setProducts(prev => [p, ...prev]);
    return p;
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('products').update(toDB(updates)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    const p = toApp(data);
    setProducts(prev => prev.map(x => x.id === id ? p : x));
    return p;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const decrementStock = useCallback(async (id, qty = 1) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock - qty);
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
  }, [products]);

  const uploadProductImage = useCallback(async (file, productId) => {
    const ext  = file.name.split('.').pop();
    const path = `${productId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
    return publicUrl;
  }, []);

  const byGender = useCallback((gender) =>
    products.filter(p => p.gender === gender || p.gender === 'unisex'),
  [products]);

  const byCategory = useCallback((category) =>
    products.filter(p => p.category?.toLowerCase() === category?.toLowerCase()),
  [products]);

  const search = useCallback((query) => {
    const q = query?.toLowerCase() ?? '';
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }, [products]);

  return (
    <CatalogContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, decrementStock, uploadProductImage, reload: load, byGender, byCategory, search }}>
      {children}
    </CatalogContext.Provider>
  );
}
