'use client';

import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    openToWork: boolean;
    location: string;
    minRelevance: number;
    sortBy: 'relevance' | 'name' | 'location';
  };
  onFilterChange: (filters: FilterSidebarProps['filters']) => void;
}

export default function FilterSidebar({ isOpen, onClose, filters, onFilterChange }: FilterSidebarProps) {
  const update = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-20 right-0 md:right-auto h-full md:h-auto w-72 md:w-60 bg-white dark:bg-slate-900 border-l md:border border-slate-200 dark:border-slate-800 md:rounded-2xl shadow-xl md:shadow-sm p-5 z-40 md:z-auto transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-base font-extrabold text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Open to Work Toggle */}
          <div>
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Availability
            </label>
            <button
              onClick={() => update('openToWork', !filters.openToWork)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                filters.openToWork
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>🟢 Open to Work</span>
              <div
                className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                  filters.openToWork ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    filters.openToWork ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Location
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Remote..."
              value={filters.location}
              onChange={(e) => update('location', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Min Relevance Score */}
          <div>
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Min Relevance: <span className="text-blue-600 dark:text-blue-400">{filters.minRelevance}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={filters.minRelevance}
              onChange={(e) => update('minRelevance', parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-0.5">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => update('sortBy', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <option value="relevance">Relevance Score</option>
              <option value="name">Name (A-Z)</option>
              <option value="location">Location</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() =>
              onFilterChange({
                openToWork: false,
                location: '',
                minRelevance: 1,
                sortBy: 'relevance',
              })
            }
            className="w-full py-2 text-sm font-bold text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      </aside>
    </>
  );
}
