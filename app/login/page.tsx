'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, AlertTriangle, Timer } from 'lucide-react';
import PinInput from '@/components/PinInput';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLockoutCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lockoutCountdown === 0 && lockedOut) {
      setLockedOut(false);
      setError('');
    }
  }, [lockoutCountdown, lockedOut]);

  const handleSubmit = async (pin: string) => {
    if (isLoading || lockedOut) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else if (res.status === 429) {
        setLockedOut(true);
        setLockoutCountdown(30);
        setError('Too many attempts. Please wait.');
        setShouldShake(true);
      } else {
        setError(data.error || 'Incorrect PIN');
        setAttemptsRemaining(data.attemptsRemaining ?? null);
        setShouldShake(true);

        if (data.lockedOut) {
          setLockedOut(true);
          setLockoutCountdown(30);
        }
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      setShouldShake(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 dark:bg-blue-500/3 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/3 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            RecruitBoard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
            Enter your 6-digit PIN to access the dashboard
          </p>
        </div>

        {/* PIN Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          <div className="flex items-center justify-center gap-2 mb-6 text-slate-400 dark:text-slate-500">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Secure Access</span>
          </div>

          <PinInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            shouldShake={shouldShake}
            onShakeComplete={() => setShouldShake(false)}
          />

          {/* Error message */}
          {error && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 animate-fade-in">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Attempts remaining */}
          {attemptsRemaining !== null && !lockedOut && (
            <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </p>
          )}

          {/* Lockout countdown */}
          {lockedOut && lockoutCountdown > 0 && (
            <div className="mt-4 flex flex-col items-center gap-1.5 animate-fade-in">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Timer className="w-4 h-4" />
                <span className="text-sm font-extrabold tabular-nums">{lockoutCountdown}s</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                Account locked. Please wait.
              </span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center font-medium leading-relaxed">
          Private recruiter tool. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
