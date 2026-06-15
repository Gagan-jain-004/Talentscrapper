'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { UsageType } from '@/types/search';

export default function ApiStatusPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-emerald-500';
    if (percentage < 90) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getBadgeColor = (percentage: number) => {
    if (percentage < 70) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (percentage < 90) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
  };

  // Compute maximum percentage among all providers to show on trigger badge
  const maxPercentage = usage?.providers
    ? Math.max(...usage.providers.map(p => p.percentage))
    : 0;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchUsage();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-semibold bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${getProgressBarColor(maxPercentage)} animate-pulse`} />
        <span>API Quotas</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Search API Usages</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Month: {usage?.month || '---'}
            </span>
          </div>

          {usage ? (
            <div className="space-y-3.5">
              {usage.providers.map((p) => (
                <div key={p.provider} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {p.provider === 'serpapi' ? 'SerpAPI' : p.provider === 'scaleserp' ? 'ScaleSerp' : p.provider === 'valueserp' ? 'ValueSerp' : p.provider === 'zenserp' ? 'Zenserp' : 'Brave Search'}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {p.used} / {p.limit} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressBarColor(p.percentage)} transition-all duration-500`}
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500">
                <span>Total Requests: {usage.totalSearches}</span>
                <span className="flex items-center gap-1 font-mono text-[9px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Fallbacks Active
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mb-2 text-slate-300 dark:text-slate-700" />
              <span>Loading usages...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
