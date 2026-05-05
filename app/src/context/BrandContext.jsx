import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BrandContext = createContext(null);
export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}

const DEFAULT = { logoUrl: '/Logo.png', brandName: 'ShopNow', socials: { facebook: '', instagram: '', youtube: '' } };

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT);

  useEffect(() => {
    supabase.from('brand_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setBrand({
          logoUrl:   data.logo_url ?? '/Logo.png',
          brandName: data.brand_name,
          socials:   { facebook: data.facebook, instagram: data.instagram, youtube: data.youtube },
        });
      });
  }, []);

  const saveBrand = useCallback(async (updates) => {
    await supabase.from('brand_settings').upsert({
      id:         1,
      logo_url:   updates.logoUrl,
      brand_name: updates.brandName,
      facebook:   updates.socials?.facebook  ?? '',
      instagram:  updates.socials?.instagram ?? '',
      youtube:    updates.socials?.youtube   ?? '',
      updated_at: new Date().toISOString(),
    });
    setBrand(updates);
  }, []);

  const uploadLogo = useCallback(async (file) => {
    const path = `logo/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('brand').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('brand').getPublicUrl(path);
    return publicUrl;
  }, []);

  return (
    <BrandContext.Provider value={{ brand, saveBrand, uploadLogo }}>
      {children}
    </BrandContext.Provider>
  );
}
