'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ListTodo, Sun, Moon, LogOut, Briefcase } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;

    setTheme(activeTheme as 'light' | 'dark');
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', { method: 'POST' });
      if (res.ok) {
        router.refresh();
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-400'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
    }`;
  };

  const mobileLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center gap-0.5 w-1/2 h-full text-xs font-bold transition-all ${
      isActive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
    }`;
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-850 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 text-slate-800 dark:text-slate-100 select-none">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-1.5 rounded-lg shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          {/* <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-slate-250 bg-clip-text text-transparent">
            Recruit
          </span> */}
        </Link>

        {/* Center: Desktop navigation links */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass('/')}>
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Link>
          <Link href="/lists" className={linkClass('/lists')}>
            <ListTodo className="w-4 h-4" />
            <span>Lists</span>
          </Link>
        </nav>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-950/30 rounded-lg text-xs font-semibold transition-colors"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Bottom Nav Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-200 dark:border-slate-850 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] flex items-center z-40 pb-safe">
        <Link href="/" className={mobileLinkClass('/')}>
          <Search className="w-5.5 h-5.5" />
          <span>Search</span>
        </Link>
        <Link href="/lists" className={mobileLinkClass('/lists')}>
          <ListTodo className="w-5.5 h-5.5" />
          <span>Lists</span>
        </Link>
      </nav>
    </>
  );
}
