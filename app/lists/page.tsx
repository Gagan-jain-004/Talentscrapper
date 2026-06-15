'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Download, Trash2, Edit3, FolderOpen, Loader2, LayoutGrid, List, Menu,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Toast, { triggerToast } from '@/components/Toast';
import CandidateListCard from '@/components/CandidateListCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ListType } from '@/types/list';
import { CandidateType } from '@/types/candidate';

const EMOJIS = ['💼', '☕', '💻', '🚀', '💡', '🎓', '✨', '🔥', '🔑', '⭐', '🎯', '🧙'];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const statusOptions = ['to_contact', 'contacted', 'interviewing', 'hired', 'rejected'] as const;

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<(ListType & { candidateCount?: number })[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateType[]>([]);
  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Create list form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('💼');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit list form
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('💼');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editDesc, setEditDesc] = useState('');
  const [editingListDetails, setEditingListDetails] = useState(false);

  // Reset edit state when active list changes
  useEffect(() => {
    setIsEditing(false);
  }, [activeListId]);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Client-side filters
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'savedAt' | 'name' | 'status' | 'relevanceScore'>('savedAt');

  // Mobile sidebar
  const [showSidebar, setShowSidebar] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
        if (!activeListId && data.length > 0) {
          setActiveListId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    } finally {
      setLoading(false);
    }
  }, [activeListId]);

  const fetchListDetail = useCallback(async (listId: string) => {
    setLoadingCandidates(true);
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveList(data.list);
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error('Failed to fetch list detail:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (activeListId) {
      fetchListDetail(activeListId);
    }
  }, [activeListId, fetchListDetail]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor, description: newDesc }),
      });
      if (res.ok) {
        const created = await res.json();
        triggerToast(`List "${created.name}" created!`, 'success');
        setNewName(''); setNewDesc(''); setShowCreate(false);
        fetchLists();
        setActiveListId(created._id);
      }
    } catch (err) {
      triggerToast('Failed to create list', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEditList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editingListDetails || !activeListId) return;
    setEditingListDetails(true);
    try {
      const res = await fetch(`/api/lists/${activeListId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          emoji: editEmoji,
          color: editColor,
          description: editDesc.trim(),
        }),
      });
      if (res.ok) {
        triggerToast('List details updated successfully!', 'success');
        setIsEditing(false);
        fetchLists();
        fetchListDetail(activeListId);
      } else {
        triggerToast('Failed to update list details', 'error');
      }
    } catch (err) {
      triggerToast('Failed to update list details', 'error');
    } finally {
      setEditingListDetails(false);
    }
  };

  const handleDeleteList = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/lists/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('List deleted', 'success');
        if (activeListId === deleteTarget) {
          setActiveListId(null);
          setActiveList(null);
          setCandidates([]);
        }
        fetchLists();
      }
    } catch (err) {
      triggerToast('Failed to delete list', 'error');
    }
    setDeleteTarget(null);
  };

  const exportListCSV = () => {
    if (candidates.length === 0) return;
    const headers = ['Name', 'Headline', 'Location', 'Profile URL', 'Status', 'Relevance', 'Tags', 'Notes'];
    const rows = candidates.map((c) => [
      `"${c.name}"`, `"${c.headline}"`, `"${c.location}"`, c.profileUrl,
      c.status, c.relevanceScore.toString(), `"${c.tags.join(', ')}"`, `"${c.notes.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeList?.name || 'list'}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter + sort candidates
  const filteredCandidates = candidates
    .filter((c) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'status': return a.status.localeCompare(b.status);
        case 'relevanceScore': return b.relevanceScore - a.relevanceScore;
        default: return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
    });

  // Status stats
  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s] = candidates.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Toast />

      <div className="flex-1 flex pb-20 md:pb-0">
        {/* LEFT PANEL: Lists Sidebar */}
        <>
          {/* Mobile overlay */}
          {showSidebar && (
            <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setShowSidebar(false)} />
          )}

          <aside className={`fixed md:static top-16 left-0 h-[calc(100vh-4rem)] w-72 md:w-72 lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-40 md:z-auto flex flex-col transition-transform duration-200 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  My Lists <span className="text-slate-400 font-mono text-xs ml-1">({lists.length})</span>
                </h2>
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  title="Create new list"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Create Form */}
              {showCreate && (
                <form onSubmit={handleCreateList} className="space-y-2 animate-fade-in">
                  <input
                    type="text" placeholder="List name..." value={newName}
                    onChange={(e) => setNewName(e.target.value)} maxLength={30} required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Description (optional)..." value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex flex-wrap gap-1 justify-center">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" onClick={() => setNewEmoji(e)}
                        className={`p-0.5 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 ${newEmoji === e ? 'bg-slate-200 dark:bg-slate-800 scale-110' : ''}`}>{e}</button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="w-1/2 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                    <button type="submit" disabled={creating || !newName.trim()}
                      className="w-1/2 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1">
                      {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loading ? (
                <div className="flex flex-col items-center py-8 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mb-2" />
                  <span>Loading lists...</span>
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-xs font-bold text-slate-400">No lists yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Create your first list above</p>
                </div>
              ) : (
                lists.map((list) => (
                  <button
                    key={list._id}
                    onClick={() => { setActiveListId(list._id); setShowSidebar(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                      activeListId === list._id
                        ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base flex-shrink-0">{list.emoji}</span>

                      <span className={`text-sm font-bold truncate ${activeListId === list._id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {list.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                        {list.candidateCount || 0}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(list._id); }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition-all"
                        title="Delete list"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </>

        {/* RIGHT PANEL: List Detail */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile sidebar toggle */}
          <div className="md:hidden sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 z-20">
            <button
              onClick={() => setShowSidebar(true)}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
              <span>My Lists</span>
            </button>
          </div>

          {activeListId && activeList ? (
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
              {/* List Header */}
              <div className="mb-6">
                {isEditing ? (
                  <form onSubmit={handleEditList} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex flex-wrap gap-3 items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="List name..."
                        maxLength={30}
                        required
                        className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-slate-400 mr-1">Emoji:</span>
                        <select
                          value={editEmoji}
                          onChange={(e) => setEditEmoji(e.target.value)}
                          className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none"
                        >
                          {EMOJIS.map((emoji) => (
                            <option key={emoji} value={emoji}>
                              {emoji}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editingListDetails || !editName.trim()}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        {editingListDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{activeList.emoji}</span>
                      <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">{activeList.name}</h1>
                      <button
                        onClick={() => {
                          setEditName(activeList.name);
                          setEditEmoji(activeList.emoji);
                          setEditColor(activeList.color);
                          setEditDesc(activeList.description || '');
                          setIsEditing(true);
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit List details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    {activeList.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-10">{activeList.description}</p>
                    )}
                  </>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total: {candidates.length}
                </span>
                {statusOptions.map((s) => {
                  const count = statusCounts[s] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 capitalize">
                      {s.replace('_', ' ')}: {count}
                    </span>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {/* Search in list */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text" placeholder="Filter candidates..." value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Sort */}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500">
                  <option value="savedAt">Date Saved</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="relevanceScore">Relevance</option>
                </select>

                {/* Export CSV */}
                {candidates.length > 0 && (
                  <button onClick={exportListCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                )}
              </div>

              {/* Candidates Grid */}
              {loadingCandidates ? (
                <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Loading candidates...</span>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {candidates.length === 0 ? 'No candidates saved yet' : 'No candidates match your filter'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {candidates.length === 0
                      ? 'Start searching for candidates and save them to this list'
                      : 'Try adjusting your search filter'}
                  </p>
                  {candidates.length === 0 && (
                    <button
                      onClick={() => router.push('/')}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Start Searching
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredCandidates.map((candidate) => (
                    <CandidateListCard
                      key={candidate._id}
                      candidate={candidate}
                      listId={activeListId}
                      onRemoved={(id) => {
                        setCandidates((prev) => prev.filter((c) => c._id !== id));
                        fetchLists(); // refresh counts
                      }}
                      onUpdated={(updated) => {
                        setCandidates((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
                      }}
                      onFindSimilar={(query) => router.push(`/?q=${encodeURIComponent(query)}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="text-5xl mb-4">📂</div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Select a list or create one</p>
                <p className="text-xs text-slate-400 mt-1">Organize candidates into searchable lists</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete List"
        message="This will permanently delete the list and all its candidates. This action cannot be undone."
        onConfirm={handleDeleteList}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
