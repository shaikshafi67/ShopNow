import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BannersContext = createContext(null);
export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error('useBanners must be used within BannersProvider');
  return ctx;
}

const toApp = (b) => ({
  id: b.id, image: b.image, title: b.title, subtitle: b.subtitle,
  link: b.link, active: b.is_active, sortOrder: b.sort_order, createdAt: b.created_at,
});

export function BannersProvider({ children }) {
  const [banners, setBanners]           = useState([]);
  const [heroImages, setHeroImages]     = useState({ men: null, women: null });
  const [bannerSettings, setBSettings]  = useState({ preset: 'fullscreen' });

  useEffect(() => {
    Promise.all([
      supabase.from('banners').select('*').order('sort_order'),
      supabase.from('hero_images').select('*'),
      supabase.from('banner_settings').select('*').eq('id', 1).single(),
    ]).then(([{ data: bans }, { data: heroes }, { data: settings }]) => {
      setBanners((bans ?? []).map(toApp));
      const hi = {};
      (heroes ?? []).forEach(h => { hi[h.id] = h.image_url; });
      setHeroImages({ men: hi.men ?? null, women: hi.women ?? null });
      if (settings) setBSettings({ preset: settings.preset, customVh: settings.custom_vh });
    });
  }, []);

  const addBanner = useCallback(async (banner) => {
    const { data, error } = await supabase.from('banners').insert({
      image: banner.image, title: banner.title ?? '', subtitle: banner.subtitle ?? '',
      link: banner.link ?? '/', is_active: banner.active !== false,
      sort_order: banners.length,
    }).select().single();
    if (error) throw new Error(error.message);
    setBanners(prev => [...prev, toApp(data)]);
  }, [banners]);

  const updateBanner = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('banners').update({
      image: updates.image, title: updates.title, subtitle: updates.subtitle,
      link: updates.link, is_active: updates.active,
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    setBanners(prev => prev.map(b => b.id === id ? toApp(data) : b));
  }, []);

  const deleteBanner = useCallback(async (id) => {
    await supabase.from('banners').delete().eq('id', id);
    setBanners(prev => prev.filter(b => b.id !== id));
  }, []);

  const setHeroImage = useCallback(async (gender, imageUrl) => {
    await supabase.from('hero_images').upsert({ id: gender, image_url: imageUrl, updated_at: new Date().toISOString() });
    setHeroImages(prev => ({ ...prev, [gender]: imageUrl }));
  }, []);

  const uploadBannerImage = useCallback(async (file, folder = 'banners') => {
    const path = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path);
    return publicUrl;
  }, []);

  const saveBannerSettings = useCallback(async (settings) => {
    await supabase.from('banner_settings').upsert({ id: 1, preset: settings.preset, custom_vh: settings.customVh ?? null });
    setBSettings(settings);
  }, []);

  return (
    <BannersContext.Provider value={{ banners, heroImages, bannerSettings, addBanner, updateBanner, deleteBanner, setHeroImage, uploadBannerImage, saveBannerSettings }}>
      {children}
    </BannersContext.Provider>
  );
}
