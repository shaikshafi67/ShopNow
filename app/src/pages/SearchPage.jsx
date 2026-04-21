import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { allProducts } from '../data/products';

function scoreProduct(product, query) {
  const q = query.toLowerCase();
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tag = (product.tag || '').toLowerCase();

  let score = 0;
  if (name === q) score += 100;
  if (name.startsWith(q)) score += 40;
  if (name.includes(q)) score += 20;
  if (category.includes(q)) score += 12;
  if (tag.includes(q)) score += 8;
  if (description.includes(q)) score += 4;
  return score;
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();

  const results = useMemo(() => {
    if (!query) return [];
    return allProducts
      .map((p) => ({ p, score: scoreProduct(p, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p);
  }, [query]);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,106,255,0.12) 0%, rgba(255,106,154,0.06) 100%)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '50px 0 36px',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SearchIcon size={20} color="var(--accent)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 2 }}>Search results</p>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 3.5vw, 34px)',
                fontWeight: 800,
                lineHeight: 1.1,
              }}>
                {query ? `"${query}"` : 'Type something in the search bar'}
              </h1>
            </div>
          </motion.div>
          {query && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        {!query && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 24 }}>
              Try searching for "tshirt", "saree", "polo", or "dress".
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/men" className="btn btn-primary" style={{ textDecoration: 'none', gap: 8 }}>
                Browse Men <ArrowRight size={16} />
              </Link>
              <Link to="/women" className="btn btn-ghost" style={{ textDecoration: 'none', gap: 8 }}>
                Browse Women <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              marginBottom: 10,
            }}>
              No matches found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
              We could not find anything for "{query}". Try a different keyword, or browse the full collection.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/men" className="btn btn-primary" style={{ textDecoration: 'none', gap: 8 }}>
                Shop Men <ArrowRight size={16} />
              </Link>
              <Link to="/women" className="btn btn-ghost" style={{ textDecoration: 'none', gap: 8 }}>
                Shop Women <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {query && results.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
