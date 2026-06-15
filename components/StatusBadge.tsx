'use client';

import React from 'react';

const statusConfig: Record<string, { label: string; emoji: string; classes: string }> = {
  to_contact: {
    label: 'To Contact',
    emoji: '🔵',
    classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900',
  },
  contacted: {
    label: 'Contacted',
    emoji: '🟡',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
  },
  interviewing: {
    label: 'Interviewing',
    emoji: '🟠',
    classes: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900',
  },
  hired: {
    label: 'Hired',
    emoji: '🟢',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
  },
  rejected: {
    label: 'Rejected',
    emoji: '🔴',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900',
  },
};

interface StatusBadgeProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  editable?: boolean;
}

export default function StatusBadge({ status, onStatusChange, editable = false }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.to_contact;

  if (!editable) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${config.classes}`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <select
      value={status}
      onChange={(e) => onStatusChange?.(e.target.value)}
      className={`appearance-none px-2.5 py-1 rounded-full border text-[10px] font-bold cursor-pointer outline-none ${config.classes}`}
    >
      {Object.entries(statusConfig).map(([key, val]) => (
        <option key={key} value={key}>
          {val.emoji} {val.label}
        </option>
      ))}
    </select>
  );
}
