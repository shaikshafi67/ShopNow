// Same color-family algorithm as FilterSidebar — inlined here to avoid importing a component
function hexToColorFamily(raw) {
  if (!raw) return null;
  const hex = raw.replace('#', '').toLowerCase().trim();
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const avg = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  if (avg < 45 && diff < 25) return 'Black';
  if (avg > 210 && diff < 30) return 'White';
  if (diff < 35) return 'Grey';
  if (r < 60 && g < 90 && b > 80 && avg < 90) return 'Navy';
  if (r > 100 && g < 60 && b < 60 && avg < 90) return 'Maroon';
  if (r > g && g > b && avg > 100 && avg < 185 && diff < 100) {
    return avg > 165 ? 'Beige' : 'Brown';
  }
  let h = 0;
  if (diff > 0) {
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / diff + 2) * 60;
    else h = ((r - g) / diff + 4) * 60;
  }
  const l = avg / 255;
  const s = diff / (255 - Math.abs(2 * avg - 255));
  if (h < 15 || h >= 345) return 'Red';
  if (h < 45) return s > 0.5 ? 'Orange' : 'Brown';
  if (h < 70) return 'Yellow';
  if (h < 155) return 'Green';
  if (h < 195) return 'Cyan';
  if (h < 255) return l < 0.35 ? 'Navy' : 'Blue';
  if (h < 285) return 'Purple';
  if (h < 345) return 'Pink';
  return 'Red';
}

// Color word → color family name (conservative list — only unambiguous single color words)
export const COLOR_NAMES = {
  white: 'White', ivory: 'White', cream: 'White', offwhite: 'White',
  black: 'Black', charcoal: 'Black',
  grey: 'Grey', gray: 'Grey', silver: 'Grey', ash: 'Grey',
  red: 'Red', crimson: 'Red', scarlet: 'Red', cherry: 'Red',
  orange: 'Orange', rust: 'Orange', amber: 'Orange',
  yellow: 'Yellow', gold: 'Yellow', mustard: 'Yellow', lemon: 'Yellow',
  green: 'Green', olive: 'Green', lime: 'Green', mint: 'Green', sage: 'Green',
  blue: 'Blue', sky: 'Blue', cobalt: 'Blue', azure: 'Blue',
  navy: 'Navy', indigo: 'Navy', denim: 'Navy', midnight: 'Navy',
  purple: 'Purple', violet: 'Purple', lavender: 'Purple', lilac: 'Purple', plum: 'Purple',
  pink: 'Pink', rose: 'Pink', peach: 'Pink', blush: 'Pink', magenta: 'Pink', coral: 'Pink',
  brown: 'Brown', chocolate: 'Brown', tan: 'Brown', coffee: 'Brown',
  beige: 'Beige', khaki: 'Beige', camel: 'Beige', wheat: 'Beige',
  maroon: 'Maroon', burgundy: 'Maroon', wine: 'Maroon', oxblood: 'Maroon',
  cyan: 'Cyan', teal: 'Cyan', aqua: 'Cyan', turquoise: 'Cyan',
};

// Category keyword → list of category strings to match against product.category
export const CATEGORY_KEYWORDS = {
  shirt: ['Shirts', 'T-Shirts', 'Polo Shirts'],
  shirts: ['Shirts', 'T-Shirts', 'Polo Shirts'],
  tshirt: ['T-Shirts'],
  tshirts: ['T-Shirts'],
  't-shirt': ['T-Shirts'],
  tee: ['T-Shirts'],
  tees: ['T-Shirts'],
  polo: ['Polo Shirts'],
  jeans: ['Jeans'],
  jean: ['Jeans'],
  trouser: ['Trousers'],
  trousers: ['Trousers'],
  pants: ['Trousers', 'Pants'],
  dress: ['Dresses'],
  dresses: ['Dresses'],
  kurta: ['Kurtas', 'Kurta Sets'],
  kurtas: ['Kurtas', 'Kurta Sets'],
  saree: ['Sarees'],
  sarees: ['Sarees'],
  sari: ['Sarees'],
  top: ['Tops'],
  tops: ['Tops'],
  jacket: ['Jackets'],
  jackets: ['Jackets'],
  shorts: ['Shorts'],
  short: ['Shorts'],
  hoodie: ['Hoodies', 'Sweatshirts'],
  hoodies: ['Hoodies', 'Sweatshirts'],
  sweatshirt: ['Sweatshirts'],
  sweatshirts: ['Sweatshirts'],
  legging: ['Leggings'],
  leggings: ['Leggings'],
  skirt: ['Skirts'],
  skirts: ['Skirts'],
  blazer: ['Blazers', 'Jackets'],
  sweater: ['Sweaters', 'Sweatshirts'],
  ethnic: ['Kurtas', 'Sarees', 'Kurta Sets'],
  formal: ['Shirts', 'Trousers', 'Blazers'],
  casual: ['T-Shirts', 'Jeans', 'Shirts'],
};

export const GENDER_KEYWORDS = {
  men: 'men', male: 'men', boys: 'men', gents: 'men', mans: 'men',
  women: 'women', female: 'women', girls: 'women', ladies: 'women', womens: 'women',
};

function productColorFamilies(product) {
  return new Set((product.colors || []).map(hexToColorFamily).filter(Boolean));
}

/**
 * How this works:
 *
 * Each query token is classified as one of:
 *   - colorToken   ("white", "blue", "maroon" …)
 *   - catToken     ("shirt", "jeans", "dress" …)
 *   - genderToken  ("men", "women" …)
 *   - textToken    (everything else)
 *
 * For MULTI-WORD queries that contain at least one semantic token:
 *   → Hard filters are applied first (return 0 immediately on any miss):
 *       • ALL color tokens must match  (product hex OR color word in name/desc)
 *       • ANY cat token must match     (product.category matches the mapped categories)
 *       • ALL gender tokens must match (product.gender)
 *   → Products that survive get a positive base score + bonuses.
 *
 * For SINGLE-WORD queries OR all-text multi-word queries:
 *   → Pure soft scoring (any match gives positive score).
 *
 * Result: "white shirt" shows ONLY white shirts, "blue jeans" shows ONLY blue jeans, etc.
 */
export function scoreProduct(product, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tag = (product.tag || '').toLowerCase();
  const gender = (product.gender || '').toLowerCase();
  const colorFamilies = productColorFamilies(product);

  const tokens = q.split(/\s+/).filter(Boolean);

  // Classify tokens
  const colorTokens = tokens.filter(t => COLOR_NAMES[t]);
  const catTokens = tokens.filter(t => CATEGORY_KEYWORDS[t]);
  const genderTokens = tokens.filter(t => GENDER_KEYWORDS[t]);
  const textTokens = tokens.filter(t => !COLOR_NAMES[t] && !CATEGORY_KEYWORDS[t] && !GENDER_KEYWORDS[t]);

  const hasSemanticFilter = colorTokens.length > 0 || catTokens.length > 0 || genderTokens.length > 0;

  // ── MULTI-WORD + semantic: hard-filter then score ─────────────────────
  if (tokens.length > 1 && hasSemanticFilter) {
    // Color hard filter — ALL color tokens must match
    for (const ct of colorTokens) {
      const fam = COLOR_NAMES[ct];
      const hexMatch = colorFamilies.has(fam);
      // Fallback: the color word literally appears in name or description
      // (handles "White Striped Shirt" products where color is also in the name)
      const textMatch = name.includes(ct) || description.includes(ct);
      if (!hexMatch && !textMatch) return 0;
    }

    // Category hard filter — ANY one category token must match
    if (catTokens.length > 0) {
      const passed = catTokens.some(ct =>
        CATEGORY_KEYWORDS[ct].some(c => category.includes(c.toLowerCase()))
      );
      if (!passed) return 0;
    }

    // Gender hard filter — ALL gender tokens must match
    for (const gt of genderTokens) {
      if (gender !== GENDER_KEYWORDS[gt]) return 0;
    }

    // Passed all hard filters → score for ranking
    let score = 40; // base relevance score

    // Full-phrase bonus
    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 40;
    else if (name.includes(q)) score += 20;
    if (brand.includes(q)) score += 10;

    // Prefer hex color match over text fallback
    for (const ct of colorTokens) {
      score += colorFamilies.has(COLOR_NAMES[ct]) ? 20 : 6;
    }

    // Extra credit for text tokens
    for (const tt of textTokens) {
      if (name.includes(tt)) score += 15;
      else if (brand.includes(tt)) score += 10;
      else if (description.includes(tt)) score += 4;
    }

    return score;
  }

  // ── SINGLE TOKEN or all-text multi-word: pure soft scoring ────────────
  let score = 0;

  // Full-phrase text matching
  if (name === q) score += 100;
  if (name.startsWith(q)) score += 40;
  if (name.includes(q)) score += 20;
  if (brand.includes(q)) score += 15;
  if (category.includes(q)) score += 12;
  if (tag.includes(q)) score += 8;
  if (description.includes(q)) score += 4;

  if (tokens.length === 1) {
    // Single-token semantic bonuses
    const colorFamily = COLOR_NAMES[q];
    if (colorFamily) {
      if (colorFamilies.has(colorFamily)) score += 30; // strong hex match
      else if (name.includes(q)) score += 5;           // weak: only in name text
    }
    const catList = CATEGORY_KEYWORDS[q];
    if (catList && catList.some(c => category.includes(c.toLowerCase()))) score += 20;
    const gm = GENDER_KEYWORDS[q];
    if (gm && gender === gm) score += 15;
  } else {
    // Multi-word all-text (e.g. "slim fit"): score each token
    let tokenMatches = 0;
    for (const tt of tokens) {
      if (name.includes(tt)) { score += 12; tokenMatches++; }
      else if (brand.includes(tt)) { score += 8; tokenMatches++; }
      else if (category.includes(tt)) { score += 8; tokenMatches++; }
      else if (description.includes(tt)) { score += 3; tokenMatches++; }
    }
    if (tokenMatches === tokens.length) score += 20;
  }

  return score;
}
