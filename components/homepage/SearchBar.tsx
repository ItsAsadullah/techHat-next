'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  image: string;
  categoryName: string;
}

interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

const TRENDING_SEARCHES = ['Laptop', 'Smartphone', 'Headphones', 'Smart Watch', 'Router'];

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (q.length < 2) {
      setProducts([]);
      setCategories([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
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
    debounceRef.current = setTimeout(() => doSearch(value), 300);
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

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, brands, categories..."
          className="w-full h-11 pl-12 pr-24 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 transition-all"
          autoComplete="off"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
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
          {query.length < 2 && (
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
          {isLoading && query.length >= 2 && (
            <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
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
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {c.image ? (
                        <Image src={c.image} alt={c.name} width={32} height={32} className="object-cover" />
                      ) : (
                        <Search className="w-4 h-4 text-gray-400" />
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
                      saveSearch(query);
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
                      <p className="text-xs text-gray-500">{p.categoryName}</p>
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
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && products.length === 0 && categories.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
