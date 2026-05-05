import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { get, set } from '../utils/idb';
import { uid } from '../utils/storage';

const CollectionsContext = createContext(null);

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used within CollectionsProvider');
  return ctx;
}

export function CollectionsProvider({ children }) {
  const [autoImages, setAutoImages] = useState({});
  const [autoExclusions, setAutoExclusions] = useState({});
  const [hiddenAutoIds, setHiddenAutoIds] = useState([]);
  const [customCollections, setCustomCollections] = useState([]);
  const ready = useRef(false);
  const shouldBroadcast = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stored = await get('collections_data');
        if (!cancelled && stored) {
          if (stored.autoImages !== undefined) setAutoImages(stored.autoImages);
          if (stored.autoExclusions !== undefined) setAutoExclusions(stored.autoExclusions);
          if (stored.hiddenAutoIds !== undefined) setHiddenAutoIds(stored.hiddenAutoIds);
          if (stored.customCollections !== undefined) setCustomCollections(stored.customCollections);
        }
      } finally {
        if (!cancelled) ready.current = true;
      }
    }
    init();

    let bc;
    try {
      bc = new BroadcastChannel('shopnow-collections');
      bc.onmessage = (e) => {
        if (e.data?.type === 'collectionsUpdate' && e.data.data) {
          const d = e.data.data;
          // Update state from another tab — do NOT re-broadcast
          shouldBroadcast.current = false;
          if (d.autoImages !== undefined) setAutoImages(d.autoImages);
          if (d.autoExclusions !== undefined) setAutoExclusions(d.autoExclusions);
          if (d.hiddenAutoIds !== undefined) setHiddenAutoIds(d.hiddenAutoIds);
          if (d.customCollections !== undefined) setCustomCollections(d.customCollections);
        }
      };
    } catch {}

    const onFocus = () => {
      get('collections_data').then(stored => {
        if (!stored) return;
        shouldBroadcast.current = false;
        if (stored.autoImages !== undefined) setAutoImages(stored.autoImages);
        if (stored.autoExclusions !== undefined) setAutoExclusions(stored.autoExclusions);
        if (stored.hiddenAutoIds !== undefined) setHiddenAutoIds(stored.hiddenAutoIds);
        if (stored.customCollections !== undefined) setCustomCollections(stored.customCollections);
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => { cancelled = true; bc?.close(); window.removeEventListener('focus', onFocus); };
  }, []);

  // Save to IDB and optionally broadcast whenever any collection state changes
  useEffect(() => {
    if (!ready.current) return;
    const data = { autoImages, autoExclusions, hiddenAutoIds, customCollections };
    set('collections_data', data).catch(err => console.error('Failed to save collections', err));
    if (shouldBroadcast.current) {
      try {
        const bc = new BroadcastChannel('shopnow-collections');
        bc.postMessage({ type: 'collectionsUpdate', data });
        bc.close();
      } catch {}
      shouldBroadcast.current = false;
    }
  }, [autoImages, autoExclusions, hiddenAutoIds, customCollections]);

  const setAutoImage = useCallback((category, imageUrl) => {
    shouldBroadcast.current = true;
    setAutoImages((ai) => {
      const next = { ...ai };
      if (imageUrl === null) delete next[category]; else next[category] = imageUrl;
      return next;
    });
  }, []);

  const setAutoExclusion = useCallback((category, excludedIds) => {
    shouldBroadcast.current = true;
    setAutoExclusions((ae) => ({ ...ae, [category]: excludedIds }));
  }, []);

  const hideAutoCollections = useCallback((categories) => {
    shouldBroadcast.current = true;
    setHiddenAutoIds((ha) => [...new Set([...ha, ...categories])]);
  }, []);

  const showAutoCollections = useCallback((categories) => {
    shouldBroadcast.current = true;
    setHiddenAutoIds((ha) => ha.filter(c => !categories.includes(c)));
  }, []);

  const addCustom = useCallback((col) => {
    const newCol = { ...col, id: uid('col') };
    shouldBroadcast.current = true;
    setCustomCollections((cc) => [...cc, newCol]);
    return newCol;
  }, []);

  const updateCustom = useCallback((id, patch) => {
    shouldBroadcast.current = true;
    setCustomCollections((cc) => cc.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const removeCustom = useCallback((ids) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    shouldBroadcast.current = true;
    setCustomCollections((cc) => cc.filter((c) => !idSet.has(c.id)));
  }, []);

  return (
    <CollectionsContext.Provider value={{
      autoImages, setAutoImage,
      autoExclusions, setAutoExclusion,
      hiddenAutoIds, hideAutoCollections, showAutoCollections,
      customCollections, addCustom, updateCustom, removeCustom,
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}
