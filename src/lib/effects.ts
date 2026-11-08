import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'breach-os:effects';

/** Saved choice, else on, unless the device asks for reduced motion. */
function initialEffects(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'on' || saved === 'off') return saved === 'on';
  } catch {
    // Storage can be blocked; fall back to the device setting.
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scanlines, static and flicker. Sets data-effects on <html> and remembers the choice. */
export function useEffects() {
  const [effects, setEffects] = useState(initialEffects);

  useEffect(() => {
    document.documentElement.dataset.effects = effects ? 'on' : 'off';
  }, [effects]);

  const toggleEffects = useCallback(() => {
    setEffects((on) => {
      try {
        localStorage.setItem(STORAGE_KEY, on ? 'off' : 'on');
      } catch {
        // Storage can be blocked; the change still applies for this visit.
      }
      return !on;
    });
  }, []);

  return { effects, toggleEffects };
}
