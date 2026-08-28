import React, { useState, useCallback, useRef } from 'react';

const SERP_API_KEY = 'aff6d764cc39231962c73042a3bebed557c95a15b9aa63f1142fa95a18bd5a0d';

const CATEGORIES = [
  { label: 'All Furniture', query: 'furniture for home amazon india' },
  { label: 'Sofas', query: 'sofa couch living room amazon india' },
  { label: 'Beds', query: 'bed frame bedroom amazon india' },
  { label: 'Tables', query: 'dining table center table amazon india' },
  { label: 'Chairs', query: 'chair home office amazon india' },
  { label: 'Wardrobes', query: 'wardrobe cupboard amazon india' },
  { label: 'Lighting', query: 'ceiling light lamp home amazon india' },
  { label: 'Decor', query: 'home decor interior amazon india' },
];

function StarRating({ rating }) {
  const num = parseFloat(rating) || 0;
  const full = Math.floor(num);
  const half = num - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: 11, letterSpacing: 1 }}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, empty))}
    </span>
  );
}

function ProductCard({ product, index }) {
  const [imgError, setImgError] = useState(false);
  const price = product.price || (product.extracted_price ? `₹${product.extracted_price}` : null);

  return (
    <a
      href={product.link || product.product_link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="furnish-card"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="furnish-card-img-wrap">
        {!imgError && product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="furnish-card-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="furnish-card-img-placeholder">🛋️</div>
        )}
      </div>

      <div className="furnish-card-body">
        <p className="furnish-card-title">{product.title}</p>

        {product.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <StarRating rating={product.rating} />
            {product.reviews && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                ({Number(String(product.reviews).replace(/,/g, '')).toLocaleString('en-IN')})
              </span>
            )}
          </div>
        )}

        <div className="furnish-card-footer">
          <span className="furnish-card-price">{price ?? 'View Price'}</span>
          <span className="furnish-card-amazon-tag">amazon.in</span>
        </div>
      </div>
    </a>
  );
}

export default function FurnishPanel({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');
  const inputRef = useRef(null);

  // Extract a numeric price from a product for sorting
  const getNumericPrice = (product) => {
    const raw = product.extracted_price
      || (product.price ? parseFloat(String(product.price).replace(/[^0-9.]/g, '')) : null);
    return raw != null ? parseFloat(raw) : null;
  };

  // Sorted copy of results
  const sortedResults = React.useMemo(() => {
    if (sortOrder === 'default') return results;
    return [...results].sort((a, b) => {
      const pa = getNumericPrice(a);
      const pb = getNumericPrice(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });
  }, [results, sortOrder]);

  const fetchProducts = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        engine: 'google_shopping',
        q: searchQuery,
        gl: 'in',
        hl: 'en',
        location: 'India',
        api_key: SERP_API_KEY,
        num: '20',
      });

      const res = await fetch(`/serpapi/search.json?${params.toString()}`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text.slice(0, 120)}`);
      }

      const data = await res.json();
      const items = data.shopping_results || data.organic_results || [];

      if (items.length === 0) {
        setError('No products found. Try a different search.');
      } else {
        const amazonItems = items.filter(p =>
          (p.source || '').toLowerCase().includes('amazon')
        );
        setResults(amazonItems.length > 0 ? amazonItems : items);
      }
    } catch (err) {
      console.error('FurnishPanel error:', err);
      setError('Could not load results. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryClick = (idx) => {
    setActiveCategory(idx);
    setQuery('');
    setSortOrder('default');
    fetchProducts(CATEGORIES[idx].query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveCategory(null);
      setSortOrder('default');
      fetchProducts(query + ' amazon india');
    }
  };

  return (
    <>
      {open && <div className="furnish-backdrop" onClick={onClose} />}

      <div className={`furnish-panel ${open ? 'furnish-panel--open' : ''}`}>
        {/* Panel Header */}
        <div className="furnish-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="furnish-panel-icon">🛋️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Furnish
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Shop from Amazon India
              </div>
            </div>
          </div>
          <button className="furnish-close-btn" onClick={onClose} title="Close panel">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <form className="furnish-search-form" onSubmit={handleSearch}>
          <div className="furnish-search-wrap">
            <svg className="furnish-search-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="6.5" cy="6.5" r="4" />
              <path d="M11 11l3 3" />
            </svg>
            <input
              ref={inputRef}
              className="furnish-search-input"
              type="text"
              placeholder="Search sofas, beds, lighting…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="furnish-search-clear" onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </div>
          <button type="submit" className="furnish-search-btn">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6.5" cy="6.5" r="4" />
              <path d="M11 11l3 3" />
            </svg>
          </button>
        </form>

        {/* Category pills */}
        <div className="furnish-categories">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              className={`furnish-category-pill ${activeCategory === i ? 'active' : ''}`}
              onClick={() => handleCategoryClick(i)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="furnish-divider" />

        {/* Results */}
        <div className="furnish-results">
          {/* Loading skeletons */}
          {loading && (
            <div className="furnish-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="furnish-skeleton-card">
                  <div className="furnish-skeleton-img" />
                  <div style={{ padding: '10px 10px 12px' }}>
                    <div className="furnish-skeleton-line" style={{ width: '90%', marginBottom: 6 }} />
                    <div className="furnish-skeleton-line" style={{ width: '65%', marginBottom: 10 }} />
                    <div className="furnish-skeleton-line" style={{ width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="furnish-empty">
              <span style={{ fontSize: 36 }}>😕</span>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>{error}</p>
              <button
                className="furnish-category-pill"
                style={{ marginTop: 8 }}
                onClick={() => handleCategoryClick(0)}
              >
                Browse All Furniture
              </button>
            </div>
          )}

          {/* Empty / initial state */}
          {!loading && !error && !searched && (
            <div className="furnish-empty">
              <div style={{ fontSize: 48 }}>🛒</div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: 14 }}>
                Find furniture for your space
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
                Search above or pick a category<br />to shop from Amazon India
              </p>
            </div>
          )}

          {/* Product grid */}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="furnish-results-meta">
                <span>{results.length} products found</span>
                <div className="furnish-sort-wrap">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    <path d="M2 4h12M4 8h8M6 12h4" />
                  </svg>
                  <select
                    className="furnish-sort-select"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="asc">Price: Low to High</option>
                    <option value="desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="furnish-product-grid">
                {sortedResults.map((product, i) => (
                  <ProductCard key={i} product={product} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
