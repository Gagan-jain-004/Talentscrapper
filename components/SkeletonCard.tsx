'use client';

import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />
        </div>
        <div className="w-10 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-24 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6" />
      </div>
      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-7 w-7 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
