'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, Check, Plus, Folder, Loader2 } from 'lucide-react';
import { triggerToast } from './Toast';

interface ListData {
  _id: string;
  name: string;
  color: string;
  emoji: string;
  savedUrls: string[];
}

interface SaveToListDropdownProps {
  candidate: {
    name: string;
    profileUrl: string;
    headline: string;
    location: string;
    snippet: string;
    relevanceScore: number;
    searchQuery: string;
  };
  lists: ListData[];
  onListsUpdated: (updatedLists: ListData[]) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const EMOJIS = ['💼', '☕', '💻', '🚀', '💡', '🎓', '✨', '🔥', '🔑', '⭐️', '🎯', '🧙'];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function SaveToListDropdown({
  candidate,
  lists,
  onListsUpdated,
  onOpenChange,
}: SaveToListDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('💼');
  const [newListColor, setNewListColor] = useState('#3B82F6');
  const [creatingList, setCreatingList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Sync open state with parent
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleToggleSave = async (listId: string, isSaved: boolean) => {
    // 1. Optimistic Update
    const updatedLists = lists.map((list) => {
      if (list._id === listId) {
        return {
          ...list,
          savedUrls: isSaved
            ? list.savedUrls.filter((url) => url !== candidate.profileUrl)
            : [...list.savedUrls, candidate.profileUrl],
        };
      }
      return list;
    });

    onListsUpdated(updatedLists);
    triggerToast(
      isSaved ? `Removed candidate from list` : `Saved candidate to list`,
      'success'
    );

    // 2. Perform API request in background
    try {
      const res = await fetch(`/api/lists/${listId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });

      if (!res.ok) {
        throw new Error('Save operation failed');
      }

      const data = await res.json();
      // Sync list state if returned action differs from our optimistic guess
      // (Usually they align, but fetch lists again to be safe)
      const freshListsRes = await fetch('/api/lists');
      if (freshListsRes.ok) {
        const freshData = await freshListsRes.json();
        onListsUpdated(freshData);
      }
    } catch (err) {
      console.error('Failed to save to list:', err);
      triggerToast('Failed to save candidate. Reverting...', 'error');
      // Revert optimistic update by fetching list
      const freshListsRes = await fetch('/api/lists');
      if (freshListsRes.ok) {
        const freshData = await freshListsRes.json();
        onListsUpdated(freshData);
      }
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || creatingList) return;

    try {
      setCreatingList(true);
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          emoji: newListEmoji,
          color: newListColor,
          description: '',
        }),
      });

      if (res.ok) {
        const newList = await res.json();
        newList.savedUrls = [];
        
        onListsUpdated([newList, ...lists]);
        setNewListName('');
        setShowCreateForm(false);
        triggerToast(`Created list "${newList.name}"`, 'success');
      }
    } catch (err) {
      console.error('Failed to create list:', err);
      triggerToast('Failed to create list', 'error');
    } finally {
      setCreatingList(false);
    }
  };

  // Determine if saved in at least one list
  const savedListsCount = lists.filter((list) => list.savedUrls.includes(candidate.profileUrl)).length;
  const isSavedAny = savedListsCount > 0;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-all ${
          isSavedAny
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900 shadow-sm'
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm'
        }`}
      >
        <FolderPlus className="w-3.5 h-3.5" />
        <span>{isSavedAny ? `Saved (${savedListsCount})` : 'Save to List'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-500 dark:text-slate-400 select-none">
            Select Lists
          </div>

          {/* List items */}
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {lists.length > 0 ? (
              lists.map((list) => {
                const isSaved = list.savedUrls.includes(candidate.profileUrl);
                return (
                  <button
                    key={list._id}
                    onClick={() => handleToggleSave(list._id, isSaved)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm flex-shrink-0">{list.emoji}</span>

                      <span className="truncate">{list.name}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSaved
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isSaved && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                No lists created yet.
              </div>
            )}
          </div>

          {/* Form Toggle button / Form container */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New List</span>
              </button>
            ) : (
              <form onSubmit={handleCreateList} className="space-y-2">
                <input
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  maxLength={25}
                  required
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />

                {/* Emoji Select Grid */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewListEmoji(emoji)}
                      className={`p-1 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors ${
                        newListEmoji === emoji ? 'bg-slate-200 dark:bg-slate-800 scale-110' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>



                {/* Form Buttons */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-1/2 py-1 rounded-md text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 dark:border-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingList || !newListName.trim()}
                    className="w-1/2 py-1 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {creatingList ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <span>Create</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
