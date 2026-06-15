'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, History, Loader2, X } from 'lucide-react';
import { SearchHistoryType } from '@/types/search';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const PLACEHOLDERS = [
  '5 year Java developer open to work...',
  'Senior React developer in Bangalore...',
  'Python ML engineer remote...',
  'Fullstack DevOps engineer 3+ years...',
  'TypeScript developer open to work in Pune...',
];

export default function SearchBar({ onSearch, isLoading, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryType[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialValue changes
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Cycle placeholders with fade effect
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setFade(true);
      }, 200); // duration of fade out
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Fetch search history
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/search/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isLoading]); // Refetch search history whenever a search completes

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryItemClick = (histQuery: string) => {
    setQuery(histQuery);
    onSearch(histQuery);
    setShowHistory(false);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-grow">
          {/* Search Icon */}
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              fetchHistory();
              setShowHistory(true);
            }}
            placeholder={fade ? PLACEHOLDERS[placeholderIndex] : ''}
            disabled={isLoading}
            className="w-full pl-12 pr-28 sm:pr-32 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all text-sm sm:text-base disabled:opacity-75"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-20 sm:right-24 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:shadow-none flex items-center gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Searching</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Suggestion / History Dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto py-2.5 animate-fade-in">
          <div className="flex items-center gap-1.5 px-4 pb-2 border-b border-slate-50 dark:border-slate-800 mb-1 text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase select-none">
            <History className="w-3.5 h-3.5" />
            <span>Recent Searches</span>
          </div>

          {history.map((hist) => (
            <button
              key={hist._id}
              onClick={() => handleHistoryItemClick(hist.query)}
              className="w-full text-left px-4 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-between gap-4 font-medium"
            >
              <span className="truncate">{hist.query}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded capitalize">
                  {hist.providerUsed}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {hist.resultsCount} hits
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
