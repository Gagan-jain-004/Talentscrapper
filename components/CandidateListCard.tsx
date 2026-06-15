'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Trash2, Search as SearchIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TagInput from './TagInput';
import ConfirmDialog from './ConfirmDialog';
import { triggerToast } from './Toast';
import { CandidateType } from '@/types/candidate';
import { formatDate } from '@/lib/utils';

interface CandidateListCardProps {
  candidate: CandidateType;
  listId: string;
  onRemoved: (candidateId: string) => void;
  onUpdated: (candidate: CandidateType) => void;
  onFindSimilar: (query: string) => void;
}

export default function CandidateListCard({
  candidate,
  listId,
  onRemoved,
  onUpdated,
  onFindSimilar,
}: CandidateListCardProps) {
  const [notes, setNotes] = useState(candidate.notes);
  const [showConfirm, setShowConfirm] = useState(false);

  // Debounce notes saving
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== candidate.notes) {
        updateCandidate({ notes });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [notes]);

  const updateCandidate = useCallback(
    async (updates: Partial<CandidateType>) => {
      try {
        const res = await fetch(`/api/lists/${listId}/candidates/${candidate._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          onUpdated(updated);
        }
      } catch (err) {
        console.error('Failed to update candidate:', err);
        triggerToast('Failed to update candidate', 'error');
      }
    },
    [candidate._id, listId, onUpdated]
  );

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}/candidates/${candidate._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRemoved(candidate._id);
        triggerToast('Candidate removed from list', 'success');
      }
    } catch (err) {
      triggerToast('Failed to remove candidate', 'error');
    }
    setShowConfirm(false);
  };

  const handleStatusChange = (newStatus: string) => {
    updateCandidate({ status: newStatus as CandidateType['status'] });
    triggerToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'info');
  };

  const handleTagsChange = (newTags: string[]) => {
    updateCandidate({ tags: newTags });
  };

  // Generate initials
  const initials = candidate.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
      'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-fuchsia-500',
    ];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-fade-in">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm ${getAvatarColor(candidate.name)}`}>
              {initials}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 line-clamp-1">
                {candidate.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold line-clamp-1">
                {candidate.headline}
              </p>
            </div>
          </div>

          <StatusBadge
            status={candidate.status}
            onStatusChange={handleStatusChange}
            editable
          />
        </div>

        {/* Location + Date */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className="inline-flex items-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-full font-bold">
            📍 {candidate.location}
          </span>
          <span className="text-slate-400 dark:text-slate-505 font-semibold">
            Saved {formatDate(candidate.savedAt)}
          </span>
        </div>

        {/* Snippet */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-3 line-clamp-2">
          {candidate.snippet || 'No description snippet.'}
        </p>

        {/* Notes textarea */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add recruiter notes..."
            rows={2}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 resize-none font-medium text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            Tags
          </label>
          <TagInput tags={candidate.tags} onTagsChange={handleTagsChange} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex gap-2">
            <a
              href={candidate.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Profile</span>
            </a>

            <button
              onClick={() => onFindSimilar(candidate.headline)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <SearchIcon className="w-3 h-3" />
              <span>Similar</span>
            </button>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            title="Remove from list"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Remove Candidate"
        message={`Are you sure you want to remove "${candidate.name}" from this list? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
