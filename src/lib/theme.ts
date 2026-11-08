import { useCallback, useEffect, useState } from 'react';

export type Theme = 'day' | 'night';

const STORAGE_KEY = 'breach-os:theme';

function readSaved(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'day' || saved === 'night' ? saved : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

/**
 * Day/Night theme. Follows the OS setting until the visitor picks one,
 * then remembers the choice in this browser.
 */
export function useTheme() {
  const [saved, setSaved] = useState<Theme | null>(readSaved);
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(query.matches ? 'night' : 'day');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (saved) root.dataset.theme = saved;
    else delete root.dataset.theme;
  }, [saved]);

  const theme = saved ?? system;

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'day' ? 'night' : 'day';
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still changes for this visit.
    }
  }, [theme]);

  return { theme, toggleTheme };
}
