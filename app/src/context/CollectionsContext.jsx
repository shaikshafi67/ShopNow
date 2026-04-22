import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { get, set } from '../utils/idb';
import { uid } from '../utils/storage';

const CollectionsContext = createContext(null);

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used within CollectionsProvider');
  return ctx;
}

function persist(data) {
  set('collections_data', data).catch((err) => console.error('Failed to save collections', err));
}

export function CollectionsProvider({ children }) {
  const [autoImages, setAutoImages] = useState({});
  const [autoExclusions, setAutoExclusions] = useState({}); // { [category]: [productId, ...] }
  const [hiddenAutoIds, setHiddenAutoIds] = useState([]); // categories hidden from list
  const [customCollections, setCustomCollections] = useState([]);
  const ready = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stored = await get('collections_data');
        if (!cancelled && stored) {
          if (stored.autoImages) setAutoImages(stored.autoImages);
          if (stored.autoExclusions) setAutoExclusions(stored.autoExclusions);
          if (stored.hiddenAutoIds) setHiddenAutoIds(stored.hiddenAutoIds);
          if (stored.customCollections) setCustomCollections(stored.customCollections);
        }
      } finally {
        if (!cancelled) ready.current = true;
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  function save(ai, ae, ha, cc) {
    persist({ autoImages: ai, autoExclusions: ae, hiddenAutoIds: ha, customCollections: cc });
  }

  const s = (ai, ae, ha, cc) => save(ai, ae, ha, cc);

  const setAutoImage = useCallback((category, imageUrl) => {
    setAutoImages((ai) => {
      const next = { ...ai };
      if (imageUrl === null) delete next[category]; else next[category] = imageUrl;
      setAutoExclusions((ae) => { setHiddenAutoIds((ha) => { setCustomCollections((cc) => { s(next, ae, ha, cc); return cc; }); return ha; }); return ae; });
      return next;
    });
  }, []);

  const setAutoExclusion = useCallback((category, excludedIds) => {
    setAutoExclusions((ae) => {
      const next = { ...ae, [category]: excludedIds };
      setAutoImages((ai) => { setHiddenAutoIds((ha) => { setCustomCollections((cc) => { s(ai, next, ha, cc); return cc; }); return ha; }); return ai; });
      return next;
    });
  }, []);

  const hideAutoCollections = useCallback((categories) => {
    setHiddenAutoIds((ha) => {
      const next = [...new Set([...ha, ...categories])];
      setAutoImages((ai) => { setAutoExclusions((ae) => { setCustomCollections((cc) => { s(ai, ae, next, cc); return cc; }); return ae; }); return ai; });
      return next;
    });
  }, []);

  const addCustom = useCallback((col) => {
    const newCol = { ...col, id: uid('col') };
    setCustomCollections((cc) => {
      const next = [...cc, newCol];
      setAutoImages((ai) => { setAutoExclusions((ae) => { setHiddenAutoIds((ha) => { s(ai, ae, ha, next); return ha; }); return ae; }); return ai; });
      return next;
    });
    return newCol;
  }, []);

  const updateCustom = useCallback((id, patch) => {
    setCustomCollections((cc) => {
      const next = cc.map((c) => c.id === id ? { ...c, ...patch } : c);
      setAutoImages((ai) => { setAutoExclusions((ae) => { setHiddenAutoIds((ha) => { s(ai, ae, ha, next); return ha; }); return ae; }); return ai; });
      return next;
    });
  }, []);

  const removeCustom = useCallback((ids) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setCustomCollections((cc) => {
      const next = cc.filter((c) => !idSet.has(c.id));
      setAutoImages((ai) => { setAutoExclusions((ae) => { setHiddenAutoIds((ha) => { s(ai, ae, ha, next); return ha; }); return ae; }); return ai; });
      return next;
    });
  }, []);

  return (
    <CollectionsContext.Provider value={{
      autoImages, setAutoImage,
      autoExclusions, setAutoExclusion,
      hiddenAutoIds, hideAutoCollections,
      customCollections, addCustom, updateCustom, removeCustom,
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}
