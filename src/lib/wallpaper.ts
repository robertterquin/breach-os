export const wallpapers = ['dots', 'grid', 'stripes', 'plain'] as const;
export type Wallpaper = (typeof wallpapers)[number];

const STORAGE_KEY = 'breach-os:wallpaper';

export function isWallpaper(value: string): value is Wallpaper {
  return (wallpapers as readonly string[]).includes(value);
}

/** Sets the desktop wallpaper and remembers it in this browser. */
export function setWallpaper(name: Wallpaper) {
  if (name === 'dots') delete document.documentElement.dataset.wallpaper;
  else document.documentElement.dataset.wallpaper = name;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Storage can be blocked; the wallpaper still changes for this visit.
  }
}

export function applySavedWallpaper() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isWallpaper(saved) && saved !== 'dots') {
      document.documentElement.dataset.wallpaper = saved;
    }
  } catch {
    // Default wallpaper.
  }
}

/** Asks the app to replay the boot sequence. */
export const REBOOT_EVENT = 'breach-os:reboot';
