import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { read, write, uid } from '../utils/storage';
import { allProducts as seedProducts } from '../data/products';

const CatalogContext = createContext(null);
export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

function loadProducts() {
  const stored = read('catalog', null);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  // First boot — seed from static catalog with stock counts
  const seeded = seedProducts.map((p) => ({ ...p, stock: 25 }));
  write('catalog', seeded);
  return seeded;
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(loadProducts);
  useEffect(() => { write('catalog', products); }, [products]);

  const byId = useCallback((id) => products.find((p) => p.id === id), [products]);

  const byGender = useCallback(
    (gender) => products.filter((p) => p.gender === gender),
    [products],
  );

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.brand && set.add(p.brand));
    return Array.from(set);
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
      {children}
    </CatalogContext.Provider>
  );
}
