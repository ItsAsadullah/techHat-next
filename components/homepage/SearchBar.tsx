'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, TrendingUp, Camera, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isLucideIcon, ICON_MAP } from '@/lib/category-icon';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  sku: string | null;
  barcode: string | null;
  image: string;
  categoryName: string;
  brandName: string;
  matchedText: string;
}

interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

const TRENDING_SEARCHES = ['Laptop', 'Smartphone', 'Headphones', 'Smart Watch', 'Router'];

// Client-side result cache — avoids re-fetching identical queries
const _resultCache = new Map<string, { products: SearchResult[]; categories: CategoryResult[]; t: number }>();
const RESULT_CACHE_TTL = 60_000;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSearchName, setImageSearchName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 1) {
      setProducts([]);
      setCategories([]);
      return;
    }
    const cached = _resultCache.get(term);
    if (cached && Date.now() - cached.t < RESULT_CACHE_TTL) {
      setProducts(cached.products);
      setCategories(cached.categories);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      const products = data.products || [];
      const categories = data.categories || [];
      _resultCache.set(term, { products, categories, t: Date.now() });
      if (_resultCache.size > 100) _resultCache.delete(_resultCache.keys().next().value!);
      setProducts(products);
      setCategories(categories);
    } catch {
      setProducts([]);
      setCategories([]);
    }
    setIsLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 150);
  };

  const handleImageSearch = async (file: File | null) => {
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
    setImageSearchName(file.name);
    setQuery('');
    setIsOpen(true);
    setProducts([]);
    setCategories([]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/search/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setProducts(data.products || []);
      setCategories([]);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearch(query.trim());
      setIsOpen(false);
      window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleSelect = (term: string) => {
    setQuery(term);
    saveSearch(term);
    setIsOpen(false);
    window.location.href = `/products?search=${encodeURIComponent(term)}`;
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const clearImageSearch = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageSearchName('');
    setProducts([]);
    setCategories([]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const showDropdown = isOpen && (query.trim().length >= 1 || recentSearches.length > 0 || imagePreview);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex h-12 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 pl-4 pr-1.5 shadow-sm transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500"
      >
        <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, brands, model..."
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageSearch(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
          aria-label="Search by image"
          title="Search by image"
        >
          <Camera className="h-4 w-4" />
        </button>
        <button
          type="submit"
          className="h-9 flex-shrink-0 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-5"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {/* Recent Searches */}
          {imagePreview && (
            <div className="p-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  <Image src={imagePreview} alt="Selected search image" width={48} height={48} className="object-cover w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">Visual image search</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isLoading ? 'Matching similar product photos...' : imageSearchName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearImageSearch}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Clear image search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {query.trim().length < 1 && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Searches</span>
                <button onClick={clearRecent} className="text-xs text-blue-600 hover:text-blue-800">
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSelect(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {query.trim().length < 1 && (
            <div className="p-3 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSelect(s)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-full text-sm text-blue-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (query.trim().length >= 1 || imagePreview) && (
            <div className="p-4 text-center text-sm text-gray-400">
              {imagePreview ? 'Finding visually similar products...' : 'Searching...'}
            </div>
          )}

          {/* Category Results */}
          {categories.length > 0 && (
            <div className="p-3 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Categories
              </span>
              <div className="space-y-1">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.image && !isLucideIcon(c.image) ? (
                        <Image src={c.image} alt={c.name} width={32} height={32} className="object-cover w-full h-full" />
                      ) : c.image && isLucideIcon(c.image) ? (() => {
                        const Icon = ICON_MAP[c.image];
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            {Icon ? <Icon className="w-4 h-4 text-white" /> : <Search className="w-4 h-4 text-white" />}
                          </div>
                        );
                      })() : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Product Results */}
          {products.length > 0 && (
            <div className="p-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Products
              </span>
              <div className="space-y-1">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => {
                      if (query.trim()) saveSearch(query.trim());
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[p.brandName, p.categoryName, p.sku ? `SKU: ${p.sku}` : '', p.matchedText].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                    <div className="text-right">
                      {p.offerPrice ? (
                        <>
                          <span className="text-sm font-bold text-blue-600">৳{p.offerPrice.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 line-through ml-1">৳{p.price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-gray-800">৳{p.price.toLocaleString()}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {query.trim() && (
                <Link
                  href={`/products?search=${encodeURIComponent(query)}`}
                  onClick={() => {
                    saveSearch(query);
                    setIsOpen(false);
                  }}
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 mt-2 border-t border-gray-50"
                >
                  View all results for &ldquo;{query}&rdquo;
                </Link>
              )}
            </div>
          )}

          {/* No Results */}
          {!isLoading && (query.trim().length >= 1 || imagePreview) && products.length === 0 && categories.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                {imagePreview ? 'No visually similar products found' : `No results found for "${query}"`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {imagePreview ? 'Try a clearer product photo' : 'Try searching with different keywords'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
