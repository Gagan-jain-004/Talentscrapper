'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, Download, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import CandidateCard from '@/components/CandidateCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterSidebar from '@/components/FilterSidebar';
import Toast from '@/components/Toast';
import { SearchResultType } from '@/types/search';

export default function SearchPage() {
  const [results, setResults] = useState<SearchResultType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [providerUsed, setProviderUsed] = useState('');
  const [builtQuery, setBuiltQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Lists state for SaveToListDropdown
  const [lists, setLists] = useState<any[]>([]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    openToWork: false,
    location: '',
    minRelevance: 1,
    sortBy: 'relevance' as 'relevance' | 'name' | 'location',
  });

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch lists for dropdown
  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setSearchQuery(query);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (res.ok) {
        setResults(data.results);
        setProviderUsed(data.provider);
        setBuiltQuery(data.builtQuery);
        // Persist search in local storage
        try {
          localStorage.setItem('recruitboard_last_query', query);
          localStorage.setItem('recruitboard_last_results', JSON.stringify(data.results));
          localStorage.setItem('recruitboard_last_provider', data.provider || '');
          localStorage.setItem('recruitboard_last_built_query', data.builtQuery || '');
          localStorage.setItem('recruitboard_last_searched', 'true');
        } catch (e) {}
        // Update tab title
        document.title = `(${data.total}) Results — RecruitBoard`;
      } else {
        setError(data.error || 'Search failed.');
        setResults([]);
        try {
          localStorage.setItem('recruitboard_last_searched', 'false');
          localStorage.removeItem('recruitboard_last_results');
        } catch (e) {}
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setResults([]);
      try {
        localStorage.setItem('recruitboard_last_searched', 'false');
        localStorage.removeItem('recruitboard_last_results');
      } catch (e) {}
    } finally {
      setIsLoading(false);
      // Refresh lists to pick up any new savedUrls
      fetchLists();
    }
  };

  // Restore search state from sessionStorage or trigger URL query search on mount
  useEffect(() => {
    // Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');

    if (q) {
      handleSearch(q);
      // Clean up URL parameter to avoid double search on manual reload
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url.pathname + url.search);
      return;
    }

    // Otherwise, restore from localStorage
    try {
      const savedQuery = localStorage.getItem('recruitboard_last_query');
      const savedResults = localStorage.getItem('recruitboard_last_results');
      const savedProvider = localStorage.getItem('recruitboard_last_provider');
      const savedBuiltQuery = localStorage.getItem('recruitboard_last_built_query');
      const savedHasSearched = localStorage.getItem('recruitboard_last_searched');

      if (savedHasSearched === 'true' && savedResults) {
        setSearchQuery(savedQuery || '');
        setResults(JSON.parse(savedResults));
        setProviderUsed(savedProvider || '');
        setBuiltQuery(savedBuiltQuery || '');
        setHasSearched(true);
      }
    } catch (e) {
      console.error('Failed to restore search results from local storage:', e);
    }
  }, []);

  // Apply client-side filters
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (filters.openToWork) {
      filtered = filtered.filter(
        (r) =>
          r.snippet.toLowerCase().includes('open to work') ||
          r.headline.toLowerCase().includes('open to work')
      );
    }

    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase().trim();
      filtered = filtered.filter((r) => r.location.toLowerCase().includes(loc));
    }

    if (filters.minRelevance > 1) {
      filtered = filtered.filter((r) => r.relevanceScore >= filters.minRelevance);
    }

    // Sort
    switch (filters.sortBy) {
      case 'relevance':
        filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'location':
        filtered.sort((a, b) => a.location.localeCompare(b.location));
        break;
    }

    return filtered;
  }, [results, filters]);

  // CSV export
  const exportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['Name', 'Headline', 'Location', 'Profile URL', 'Relevance Score', 'Snippet'];
    const rows = filteredResults.map((r) => [
      `"${r.name}"`,
      `"${r.headline}"`,
      `"${r.location}"`,
      r.profileUrl,
      r.relevanceScore.toString(),
      `"${r.snippet.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recruitboard_results_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Toast />

      <main className="flex-1 pb-20 md:pb-8">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
              <Sparkles className="w-3 h-3" />
              <span>AI-Powered LinkedIn Search</span>
            </div> */}

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              Find the <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">perfect candidates</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
              Search across LinkedIn profiles.
              <span className="hidden sm:inline"> Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold border border-slate-200 dark:border-slate-800 ml-1">Ctrl + K</kbd> to focus.</span>
            </p>

            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </section>

        {/* Results Section */}
        {(hasSearched || isLoading) && (
          <section className="px-4 max-w-7xl mx-auto">
            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-semibold">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    Searching across providers...
                  </span>
                ) : error ? (
                  <span className="text-rose-500">{error}</span>
                ) : (
                  <span>
                    Found <strong className="text-slate-800 dark:text-slate-200">{filteredResults.length}</strong> candidates
                    {providerUsed && (
                      <span className="ml-1.5">
                        via <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{providerUsed}</span>
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Filter toggle (mobile) */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>

                {/* CSV Export */}
                {filteredResults.length > 0 && (
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content Grid with Filter Sidebar */}
            <div className="flex gap-6">
              {/* Filter sidebar */}
              <FilterSidebar
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFilterChange={setFilters}
              />

              {/* Results Grid */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">😔</div>
                    <p className="text-base font-bold text-slate-500 dark:text-slate-400">{error}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search query or check API keys</p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-base font-bold text-slate-500 dark:text-slate-400">No candidates match your filters</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try broadening your search or resetting filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredResults.map((result, index) => (
                      <CandidateCard
                        key={`${result.profileUrl}-${index}`}
                        candidate={{ ...result, searchQuery }}
                        lists={lists}
                        onListsUpdated={setLists}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Empty State (before first search) */}
        {!hasSearched && !isLoading && (
          <section className="text-center py-12 px-4">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-base font-bold text-slate-500 dark:text-slate-400">
              Start by typing a natural language search above
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              Examples: &quot;Senior React developer in Bangalore&quot;, &quot;Python ML engineer 3+ years remote&quot;
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
