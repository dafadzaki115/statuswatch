'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('statuswatch-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('statuswatch-theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('statuswatch-theme', 'dark');
      setIsDark(true);
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9 border border-transparent rounded-lg" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="h-9 w-9 rounded-lg flex items-center justify-center text-foreground hover:bg-muted border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
    >
      {isDark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  );
}
