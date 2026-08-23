import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('crisiskit_theme');
    // Default to dark mode if no preference stored
    return stored !== null ? stored === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('crisiskit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('crisiskit_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 border border-ocean-800/60 text-slate-300 hover:text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-700/90 transition-all"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};
