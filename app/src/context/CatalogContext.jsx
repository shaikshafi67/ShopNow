import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { uid } from '../utils/storage';
import { get, set } from '../utils/idb';
import { allProducts as seedProducts } from '../data/products';

const CatalogContext = createContext(null);
export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial load from IndexedDB
  useEffect(() => {
    async function init() {
      try {
        const stored = await get('catalog');
        if (stored && Array.isArray(stored) && stored.length > 0) {
          setProducts(stored);
        } else {
          const seeded = seedProducts.map((p) => ({ ...p, stock: 25 }));
          await set('catalog', seeded);
          setProducts(seeded);
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
        setProducts(seedProducts.map((p) => ({ ...p, stock: 25 })));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Save to IndexedDB whenever products change
  useEffect(() => {
    if (!loading) {
      set('catalog', products).catch(err => console.error('Failed to save to IndexedDB', err));
    }
  }, [products, loading]);

  const byId = useCallback((id) => products.find((p) => p.id === id), [products]);

  const byGender = useCallback(
    (gender) => products.filter((p) => p.gender === gender),
    [products],
  );

  const categories = useMemo(() => {
    const setCategory = new Set();
    products.forEach((p) => setCategory.add(p.category));
    return Array.from(setCategory);
  }, [products]);

  const brands = useMemo(() => {
    const setBrand = new Set();
    products.forEach((p) => p.brand && setBrand.add(p.brand));
    return Array.from(setBrand);
  }, [products]);

  const create = useCallback((data) => {
    const product = {
      id: data.id || uid('p'),
      name: data.name?.trim() || 'Untitled',
      price: Number(data.price) || 0,
      originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
      discount: (data.discount ?? Math.max(0, Math.round(((Number(data.originalPrice) - Number(data.price)) / Number(data.originalPrice || 1)) * 100))) || 0,
      rating: Number(data.rating) || 4.0,
      reviews: Number(data.reviews) || 0,
      category: data.category || 'T-Shirts',
      gender: data.gender || 'men',
      brand: data.brand || 'ShopNow',
      tag: data.tag || 'New',
      images: Array.isArray(data.images) && data.images.length ? data.images : ['/images/placeholder.jpg'],
      colors: Array.isArray(data.colors) ? data.colors : ['#000000'],
      sizes: Array.isArray(data.sizes) ? data.sizes : ['S', 'M', 'L'],
      description: data.description || '',
      stock: Number(data.stock) ?? 25,
      tryOnReady: Boolean(data.tryOnReady),
      createdAt: new Date().toISOString(),
    };
    setProducts((arr) => [product, ...arr]);
    return product;
  }, []);

  const update = useCallback((id, patch) => {
    setProducts((arr) => arr.map((p) => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const remove = useCallback((id) => {
    setProducts((arr) => arr.filter((p) => p.id !== id));
  }, []);

  const decrementStock = useCallback((id, qty = 1) => {
    setProducts((arr) => arr.map((p) => p.id === id ? { ...p, stock: Math.max(0, (p.stock ?? 0) - qty) } : p));
  }, []);

  const resetCatalog = useCallback(() => {
    const fresh = seedProducts.map((p) => ({ ...p, stock: 25 }));
    setProducts(fresh);
  }, []);

  return (
    <CatalogContext.Provider value={{
      products,
      loading,
      byId,
      byGender,
      categories,
      brands,
      create,
      update,
      remove,
      decrementStock,
      resetCatalog,
    }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </CatalogContext.Provider>
  );
}
