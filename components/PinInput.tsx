'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PinInputProps {
  onSubmit: (pin: string) => void;
  isLoading: boolean;
  shouldShake: boolean;
  onShakeComplete: () => void;
}

export default function PinInput({ onSubmit, isLoading, shouldShake, onShakeComplete }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [showPin, setShowPin] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on load
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Trigger shake callback cleanup after animation duration
  useEffect(() => {
    if (shouldShake) {
      const timer = setTimeout(() => {
        onShakeComplete();
        // Clear pin on wrong attempt and focus first box
        setPin(Array(6).fill(''));
        inputsRef.current[0]?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShake, onShakeComplete]);

  const handleChange = (val: string, index: number) => {
    // Keep only numbers
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) return;

    const newPin = [...pin];
    // Take only the last character entered
    newPin[index] = cleanVal.substring(cleanVal.length - 1);
    setPin(newPin);

    // Shift focus to next input if not last
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else {
      // Auto submit when 6th digit is filled
      const completedPin = newPin.join('');
      if (completedPin.length === 6) {
        onSubmit(completedPin);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Empty box backspace: erase previous box and focus it
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputsRef.current[index - 1]?.focus();
      } else {
        // Normal backspace
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasteData.length === 0) return;

    const newPin = [...pin];
    for (let i = 0; i < 6; i++) {
      if (i < pasteData.length) {
        newPin[i] = pasteData[i];
      }
    }
    setPin(newPin);

    // Focus last filled or 6th box
    const focusIndex = Math.min(pasteData.length, 5);
    inputsRef.current[focusIndex]?.focus();

    const completedPin = newPin.join('');
    if (completedPin.length === 6) {
      onSubmit(completedPin);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 6 Input Boxes Grid */}
      <div
        className={`flex gap-1.5 min-[375px]:gap-2 min-[420px]:gap-2.5 sm:gap-3 ${
          shouldShake ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}
      >
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type={showPin ? 'text' : 'password'}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            disabled={isLoading}
            maxLength={1}
            autoComplete="one-time-code"
            inputMode="numeric"
            className="w-9 h-12 min-[375px]:w-10 min-[375px]:h-14 min-[420px]:w-11 min-[420px]:h-14 sm:w-14 sm:h-16 text-center text-base min-[375px]:text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
          />
        ))}
      </div>

      {/* Show/Hide controls */}
      <button
        type="button"
        onClick={() => setShowPin(!showPin)}
        className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors mt-1"
      >
        {showPin ? (
          <>
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide PIN</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>Show PIN</span>
          </>
        )}
      </button>
    </div>
  );
}
