'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Star } from 'lucide-react';
import { triggerToast } from './Toast';
import SaveToListDropdown from './SaveToListDropdown';

interface CandidateCardProps {
  candidate: {
    name: string;
    profileUrl: string;
    headline: string;
    location: string;
    snippet: string;
    relevanceScore: number;
    searchQuery: string;
  };
  lists: any[];
  onListsUpdated: (updatedLists: any[]) => void;
}

export default function CandidateCard({ candidate, lists, onListsUpdated }: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate initials
  const initials = candidate.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Consistent background colors based on candidate name string
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-amber-500 text-white',
      'bg-rose-500 text-white',
      'bg-indigo-500 text-white',
      'bg-cyan-500 text-white',
      'bg-fuchsia-500 text-white',
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  // Relevance Score Colors
  const getRelevanceBadgeClass = (score: number) => {
    if (score >= 8) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
    }
    if (score >= 5) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  };

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(candidate.profileUrl);
      setCopied(true);
      triggerToast('LinkedIn URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 animate-fade-in ${
      isDropdownOpen ? 'relative z-30 shadow-md ring-1 ring-blue-500/10' : 'relative z-0 hover:z-10'
    }`}>
      <div className="space-y-3.5">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Initials Avatar */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-base shadow-inner ${getAvatarColor(candidate.name)}`}>
              {initials || '??'}
            </div>

            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug">
                {candidate.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold line-clamp-1">
                {candidate.headline}
              </p>
            </div>
          </div>

          {/* Relevance Score Badge */}
          <div className={`flex flex-col items-center px-2 py-1 rounded-xl border font-extrabold text-sm select-none ${getRelevanceBadgeClass(candidate.relevanceScore)}`}>
            <span className="text-[10px] uppercase tracking-wide opacity-75 font-bold">Match</span>
            <span className="text-base font-black leading-none">{candidate.relevanceScore}</span>
          </div>
        </div>

        {/* Location chip */}
        <div className="inline-flex items-center text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-full font-bold select-none">
          📍 {candidate.location}
        </div>

        {/* Snippet text */}
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          <p className={expanded ? '' : 'line-clamp-2'}>{candidate.snippet || 'No description snippet found.'}</p>
          {candidate.snippet && candidate.snippet.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-1">
        <div className="flex gap-2">
          {/* View Profile */}
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Profile</span>
          </a>

          {/* Copy URL */}
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Save to list dropdown */}
        <SaveToListDropdown
          candidate={candidate}
          lists={lists}
          onListsUpdated={onListsUpdated}
          onOpenChange={setIsDropdownOpen}
        />
      </div>
    </div>
  );
}
