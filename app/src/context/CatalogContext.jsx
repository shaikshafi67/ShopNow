import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

  // When true, the next useEffect run should broadcast to other tabs
  const shouldBroadcast = useRef(false);

  // Seed version — bump this when products.js changes to force a re-merge
  const SEED_VERSION = 3;

  // Initial load from IndexedDB
  useEffect(() => {
    async function init() {
      try {
        const stored = await get('catalog');
        const seedVersion = await get('catalog_seed_version');
        if (stored && Array.isArray(stored) && stored.length > 0) {
          const WOMEN_CAT = /saree|kurti|kurta|dupatta|lehenga|blouse|salwar|anarkali|co-ord|ethnic|dress|top|short kurti|bottom wear|night wear/i;
          const migrated = stored.map(p => {
            const catName = (p.category || '').toLowerCase();
            const isWomenCat = WOMEN_CAT.test(catName);
            let gender = p.gender;
            if (isWomenCat && gender !== 'women' && gender !== 'unisex') gender = 'women';
            else if (!gender) gender = 'men';
            const tag = p.tag === 'Active' ? 'New' : (p.tag || 'New');
            return { colorVariants: [], variants: [], ...p, gender, tag };
          });

          // Merge new seed products that aren't in the stored catalog yet
          const storedIds = new Set(migrated.map(p => p.id));
          const newProducts = seedProducts
            .filter(p => !storedIds.has(p.id))
            .map(p => ({ ...p, stock: 25, colorVariants: [], variants: [] }));

          // Also update images array for existing products if seed version changed
          let base = migrated;
          if (seedVersion !== SEED_VERSION) {
            base = migrated.map(p => {
              const seedVersion = seedProducts.find(s => s.id === p.id);
              if (seedVersion && seedVersion.images?.length > (p.images?.length || 0)) {
                return { ...p, images: seedVersion.images };
              }
              return p;
            });
          }

          const merged = [...base, ...newProducts];
          await set('catalog', merged);
          await set('catalog_seed_version', SEED_VERSION);
          setProducts(merged);
        } else {
          const seeded = seedProducts.map((p) => ({ ...p, stock: 25 }));
          await set('catalog', seeded);
          await set('catalog_seed_version', SEED_VERSION);
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

    // Listen for catalog changes from other tabs
    let bc;
    try {
      bc = new BroadcastChannel('shopnow-catalog');
      bc.onmessage = (e) => {
        if (e.data?.type === 'catalogUpdate' && Array.isArray(e.data.products)) {
          // Received from another tab — update state but do NOT re-broadcast
          shouldBroadcast.current = false;
          setProducts(e.data.products);
        }
      };
    } catch {}

    // Re-read from IDB when this tab regains focus (catches changes from other tabs if BC was missed)
    const onFocus = () => {
      get('catalog').then(stored => {
        if (stored && Array.isArray(stored) && stored.length > 0) {
          shouldBroadcast.current = false; // re-reading from IDB should not re-broadcast
          setProducts(stored);
        }
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => { bc?.close(); window.removeEventListener('focus', onFocus); };
  }, []);

  // Save to IndexedDB whenever products change, and optionally broadcast
  useEffect(() => {
    if (!loading) {
      set('catalog', products).catch(err => console.error('Failed to save to IndexedDB', err));
      if (shouldBroadcast.current) {
        try {
          const bc = new BroadcastChannel('shopnow-catalog');
          bc.postMessage({ type: 'catalogUpdate', products });
          bc.close();
        } catch {}
        shouldBroadcast.current = false;
      }
    }
  }, [products, loading]);

  const byId = useCallback((id) => products.find((p) => p.id === id), [products]);

  const byGender = useCallback(
    (gender) => products.filter((p) => p.gender === gender || p.gender === 'unisex'),
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
    const mrp = Number(data.originalPrice) || Number(data.price) || 0;
    const sp  = Number(data.price) || 0;
    const product = {
      ...data,
      id:            data.id || uid('p'),
      name:          data.name?.trim() || 'Untitled',
      price:         sp,
      originalPrice: mrp,
      discount:      data.discount ?? (mrp > 0 ? Math.max(0, Math.round(((mrp - sp) / mrp) * 100)) : 0),
      rating:        Number(data.rating) || 4.0,
      reviews:       Number(data.reviews) || 0,
      category:      data.category || 'T-Shirts',
      gender:        data.gender || 'men',
      brand:         data.brand  || 'ShopNow',
      tag:           data.tag    || 'New',
      images:        Array.isArray(data.images) && data.images.length ? data.images : ['/images/placeholder.jpg'],
      colors:        Array.isArray(data.colors) ? data.colors : ['#000000'],
      colorVariants: Array.isArray(data.colorVariants) ? data.colorVariants : [],
      sizes:         Array.isArray(data.sizes) ? data.sizes : ['S', 'M', 'L'],
      variants:      Array.isArray(data.variants) ? data.variants : [],
      description:   data.description || '',
      stock:         Number(data.stock) ?? 25,
      tryOnReady:    Boolean(data.tryOnReady),
      createdAt:     data.createdAt || new Date().toISOString(),
    };
    shouldBroadcast.current = true;
    setProducts((arr) => [product, ...arr]);
    return product;
  }, []);

  const update = useCallback((id, patch) => {
    shouldBroadcast.current = true;
    setProducts((arr) => arr.map((p) => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const remove = useCallback((id) => {
    shouldBroadcast.current = true;
    setProducts((arr) => arr.filter((p) => p.id !== id));
  }, []);

  const decrementStock = useCallback((id, qty = 1) => {
    shouldBroadcast.current = true;
    setProducts((arr) => arr.map((p) => p.id === id ? { ...p, stock: Math.max(0, (p.stock ?? 0) - qty) } : p));
  }, []);

  const resetCatalog = useCallback(() => {
    const fresh = seedProducts.map((p) => ({ ...p, stock: 25 }));
    shouldBroadcast.current = true;
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
