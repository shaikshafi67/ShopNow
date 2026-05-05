/**
 * Unit tests for the merged products catalog.
 * Covers new categories (Short Kurtis, Bottom Wear, Night Wear),
 * multi-image arrays, and helper functions.
 */
import { describe, it, expect } from 'vitest';
import {
  menProducts,
  womenProducts,
  allProducts,
  getFeaturedProducts,
  getProductById,
} from './products';

// ─── Product shape validator ───────────────────────────────────────────────────
function assertProductShape(p) {
  expect(p).toHaveProperty('id');
  expect(p).toHaveProperty('name');
  expect(p).toHaveProperty('price');
  expect(p).toHaveProperty('originalPrice');
  expect(p).toHaveProperty('discount');
  expect(p).toHaveProperty('category');
  expect(p).toHaveProperty('gender');
  expect(p).toHaveProperty('images');
  expect(Array.isArray(p.images)).toBe(true);
  expect(p.images.length).toBeGreaterThan(0);
  expect(p).toHaveProperty('colors');
  expect(Array.isArray(p.colors)).toBe(true);
  expect(p).toHaveProperty('sizes');
  expect(Array.isArray(p.sizes)).toBe(true);
}

// ─── Men's catalog ────────────────────────────────────────────────────────────
describe('menProducts.tshirts', () => {
  it('has 5 T-shirt products', () => {
    expect(menProducts.tshirts).toHaveLength(5);
  });

  it('all T-shirts have valid shape', () => {
    menProducts.tshirts.forEach(assertProductShape);
  });

  it('mt1 has 5 multi-angle images', () => {
    const mt1 = menProducts.tshirts.find(p => p.id === 'mt1');
    expect(mt1.images).toHaveLength(5);
    expect(mt1.images[0]).toBe('/images/men/tshirt/tshirt_3_1.jpg');
    expect(mt1.images[4]).toBe('/images/men/tshirt/tshirt_3_5.jpg');
  });

  it('mt3 (polo) has multi-angle images', () => {
    const mt3 = menProducts.tshirts.find(p => p.id === 'mt3');
    expect(mt3.images.length).toBeGreaterThanOrEqual(3);
    expect(mt3.images[0]).toContain('tshirt_polo');
  });

  it('all T-shirts have gender = men', () => {
    menProducts.tshirts.forEach(p => expect(p.gender).toBe('men'));
  });
});

describe('menProducts.shirts', () => {
  it('has 5 shirt products', () => {
    expect(menProducts.shirts).toHaveLength(5);
  });

  it('ms1 has 5 images', () => {
    const ms1 = menProducts.shirts.find(p => p.id === 'ms1');
    expect(ms1.images).toHaveLength(5);
  });

  it('ms2-ms5 each have multiple images', () => {
    ['ms2', 'ms3', 'ms4', 'ms5'].forEach(id => {
      const p = menProducts.shirts.find(s => s.id === id);
      expect(p.images.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('menProducts.jeans', () => {
  it('has 5 jeans products', () => {
    expect(menProducts.jeans).toHaveLength(5);
  });

  it('all jeans have multiple images', () => {
    menProducts.jeans.forEach(p => {
      expect(p.images.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─── Women's catalog ──────────────────────────────────────────────────────────
describe('womenProducts.tops', () => {
  it('has 5 tops products', () => {
    expect(womenProducts.tops).toHaveLength(5);
  });

  it('all tops have multi-angle images', () => {
    womenProducts.tops.forEach(p => {
      expect(p.images.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('all tops have gender = women', () => {
    womenProducts.tops.forEach(p => expect(p.gender).toBe('women'));
  });
});

describe('womenProducts.dresses', () => {
  it('has 4 dress products', () => {
    expect(womenProducts.dresses).toHaveLength(4);
  });

  it('wd1 (OCEANISTA) has 4 images', () => {
    const wd1 = womenProducts.dresses.find(p => p.id === 'wd1');
    expect(wd1.images).toHaveLength(4);
    expect(wd1.tryOnReady).toBe(true);
  });
});

describe('womenProducts.kurtis', () => {
  it('has 5 kurti products', () => {
    expect(womenProducts.kurtis).toHaveLength(5);
  });

  it('wk4 and wk5 have images (previously missing)', () => {
    const wk4 = womenProducts.kurtis.find(p => p.id === 'wk4');
    const wk5 = womenProducts.kurtis.find(p => p.id === 'wk5');
    expect(wk4.images[0]).toBe('/images/women/kurtis/kurti_4_1.jpg');
    expect(wk5.images[0]).toBe('/images/women/kurtis/kurti_5_1.jpg');
  });
});

// ─── NEW: Short Kurtis ────────────────────────────────────────────────────────
describe('womenProducts.shortkurtis (new category)', () => {
  it('exists and has 3 products', () => {
    expect(womenProducts.shortkurtis).toHaveLength(3);
  });

  it('all short kurtis have valid shape', () => {
    womenProducts.shortkurtis.forEach(assertProductShape);
  });

  it('short kurtis have category = Short Kurtis', () => {
    womenProducts.shortkurtis.forEach(p => {
      expect(p.category).toBe('Short Kurtis');
    });
  });

  it('short kurtis have gender = women', () => {
    womenProducts.shortkurtis.forEach(p => expect(p.gender).toBe('women'));
  });

  it('wsk1 has 5 images (color variants)', () => {
    const wsk1 = womenProducts.shortkurtis.find(p => p.id === 'wsk1');
    expect(wsk1.images).toHaveLength(5);
    expect(wsk1.images[0]).toContain('/images/women/shortkurtis/sk1_');
  });

  it('short kurtis IDs are wsk1, wsk2, wsk3', () => {
    const ids = womenProducts.shortkurtis.map(p => p.id);
    expect(ids).toEqual(['wsk1', 'wsk2', 'wsk3']);
  });
});

// ─── NEW: Bottom Wear ─────────────────────────────────────────────────────────
describe('womenProducts.bottomwear (new category)', () => {
  it('exists and has 5 products', () => {
    expect(womenProducts.bottomwear).toHaveLength(5);
  });

  it('all bottom wear have valid shape', () => {
    womenProducts.bottomwear.forEach(assertProductShape);
  });

  it('bottom wear category names are Bottom Wear', () => {
    womenProducts.bottomwear.forEach(p => {
      expect(p.category).toBe('Bottom Wear');
    });
  });

  it('bottom wear have gender = women', () => {
    womenProducts.bottomwear.forEach(p => expect(p.gender).toBe('women'));
  });

  it('wb1 has correct image path', () => {
    const wb1 = womenProducts.bottomwear.find(p => p.id === 'wb1');
    expect(wb1.images[0]).toBe('/images/women/bottomwear/bw1_1.jpg');
  });

  it('bottom wear IDs are wb1 through wb5', () => {
    const ids = womenProducts.bottomwear.map(p => p.id);
    expect(ids).toEqual(['wb1', 'wb2', 'wb3', 'wb4', 'wb5']);
  });
});

// ─── NEW: Night Wear ──────────────────────────────────────────────────────────
describe('womenProducts.nightwear (new category)', () => {
  it('exists and has 1 product', () => {
    expect(womenProducts.nightwear).toHaveLength(1);
  });

  it('has valid shape', () => {
    assertProductShape(womenProducts.nightwear[0]);
  });

  it('wnw1 has category Night Wear and gender women', () => {
    const wnw1 = womenProducts.nightwear[0];
    expect(wnw1.id).toBe('wnw1');
    expect(wnw1.category).toBe('Night Wear');
    expect(wnw1.gender).toBe('women');
  });

  it('wnw1 has 4 images', () => {
    const wnw1 = womenProducts.nightwear[0];
    expect(wnw1.images).toHaveLength(4);
    expect(wnw1.images[0]).toBe('/images/women/nightwear/nw1_1.jpg');
  });
});

// ─── Co-ord Sets ──────────────────────────────────────────────────────────────
describe('womenProducts.coords', () => {
  it('has 3 co-ord set products', () => {
    expect(womenProducts.coords).toHaveLength(3);
  });

  it('wc1, wc2 have multi-angle images (previously missing)', () => {
    const wc1 = womenProducts.coords.find(p => p.id === 'wc1');
    const wc2 = womenProducts.coords.find(p => p.id === 'wc2');
    expect(wc1.images.length).toBeGreaterThanOrEqual(2);
    expect(wc2.images.length).toBeGreaterThanOrEqual(2);
    expect(wc1.images[0]).toBe('/images/women/coords/coord_1_1.jpg');
    expect(wc2.images[0]).toBe('/images/women/coords/coord_2_1.jpg');
  });

  it('wc3 has an image (previously missing)', () => {
    const wc3 = womenProducts.coords.find(p => p.id === 'wc3');
    expect(wc3.images[0]).toBe('/images/women/coords/coord_3_1.jpg');
  });
});

// ─── Sarees ───────────────────────────────────────────────────────────────────
describe('womenProducts.sarees', () => {
  it('has 5 saree products', () => {
    expect(womenProducts.sarees).toHaveLength(5);
  });

  it('all sarees have multi-angle images', () => {
    womenProducts.sarees.forEach(p => {
      expect(p.images.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('all sarees have Free Size', () => {
    womenProducts.sarees.forEach(p => {
      expect(p.sizes).toContain('Free Size');
    });
  });
});

// ─── allProducts aggregate ─────────────────────────────────────────────────────
describe('allProducts', () => {
  it('contains 46 products total', () => {
    expect(allProducts).toHaveLength(46);
  });

  it('includes men and women products', () => {
    const men   = allProducts.filter(p => p.gender === 'men');
    const women = allProducts.filter(p => p.gender === 'women');
    expect(men.length).toBe(15);   // 5 tshirts + 5 shirts + 5 jeans
    expect(women.length).toBe(31); // 5+4+5+3+5+3+5+1+1 = 31... let me count: tops(5)+dresses(4)+kurtis(5)+shortkurtis(3)+sarees(5)+coords(3)+bottomwear(5)+nightwear(1) = 31
  });

  it('has no duplicate IDs', () => {
    const ids = allProducts.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every product has at least one image', () => {
    allProducts.forEach(p => {
      expect(p.images.length).toBeGreaterThan(0);
    });
  });

  it('every image path starts with /images/', () => {
    allProducts.forEach(p => {
      p.images.forEach(img => {
        expect(img).toMatch(/^\/images\//);
      });
    });
  });

  it('every product has a positive price', () => {
    allProducts.forEach(p => {
      expect(p.price).toBeGreaterThan(0);
    });
  });

  it('discount is between 0 and 100 for all products', () => {
    allProducts.forEach(p => {
      expect(p.discount).toBeGreaterThanOrEqual(0);
      expect(p.discount).toBeLessThanOrEqual(100);
    });
  });

  it('selling price is always less than or equal to originalPrice', () => {
    allProducts.forEach(p => {
      expect(p.price).toBeLessThanOrEqual(p.originalPrice);
    });
  });

  it('includes new categories: Short Kurtis, Bottom Wear, Night Wear', () => {
    const categories = new Set(allProducts.map(p => p.category));
    expect(categories.has('Short Kurtis')).toBe(true);
    expect(categories.has('Bottom Wear')).toBe(true);
    expect(categories.has('Night Wear')).toBe(true);
  });
});

// ─── getProductById ───────────────────────────────────────────────────────────
describe('getProductById', () => {
  it('finds existing products by ID', () => {
    expect(getProductById('mt1')).toBeDefined();
    expect(getProductById('mt1').name).toContain('NOBERO');
  });

  it('finds new Short Kurtis products', () => {
    expect(getProductById('wsk1')).toBeDefined();
    expect(getProductById('wsk2')).toBeDefined();
    expect(getProductById('wsk3')).toBeDefined();
  });

  it('finds new Bottom Wear products', () => {
    ['wb1','wb2','wb3','wb4','wb5'].forEach(id => {
      expect(getProductById(id)).toBeDefined();
    });
  });

  it('finds new Night Wear product', () => {
    expect(getProductById('wnw1')).toBeDefined();
  });

  it('returns undefined for a non-existent ID', () => {
    expect(getProductById('xxxx')).toBeUndefined();
  });
});

// ─── getFeaturedProducts ──────────────────────────────────────────────────────
describe('getFeaturedProducts', () => {
  it('returns 8 featured products', () => {
    expect(getFeaturedProducts()).toHaveLength(8);
  });

  it('includes products from new categories', () => {
    const featured = getFeaturedProducts();
    const categories = featured.map(p => p.category);
    expect(categories).toContain('Short Kurtis');
    expect(categories).toContain('Bottom Wear');
  });

  it('all featured products are in allProducts', () => {
    const featured = getFeaturedProducts();
    const allIds = new Set(allProducts.map(p => p.id));
    featured.forEach(p => expect(allIds.has(p.id)).toBe(true));
  });
});

// ─── discount consistency ─────────────────────────────────────────────────────
describe('discount calculation consistency', () => {
  it('stated discount matches computed discount within 3%', () => {
    allProducts.forEach(p => {
      const computed = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      expect(Math.abs(computed - p.discount)).toBeLessThanOrEqual(3);
    });
  });
});
