import { useEffect, useState } from 'react';
import type { Theme } from '../../lib/theme';
import './MenuBar.css';

type MenuBarProps = {
  listView?: boolean;
  /** Omit to hide the List view button. */
  onToggleListView?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenHome?: () => void;
};

const clockFormat = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="menubar__clock" dateTime={now.toISOString()}>
      {clockFormat.format(now)}
    </time>
  );
}

export function MenuBar({
  listView = false,
  onToggleListView,
  theme,
  onToggleTheme,
  onOpenHome,
}: MenuBarProps) {
  return (
    <header className="menubar">
      <button type="button" className="menubar__brand" onClick={onOpenHome}>
        breach.os
      </button>
      <nav className="menubar__menus" aria-label="View options">
        {onToggleListView && (
          <button
            type="button"
            className="menubar__item"
            aria-pressed={listView}
            onClick={onToggleListView}
          >
            <span className="menubar__check" aria-hidden="true">
              {listView ? '■' : '□'}
            </span>
            List view
          </button>
        )}
        <button
          type="button"
          className="menubar__item"
          onClick={onToggleTheme}
          aria-label={theme === 'day' ? 'Switch to Night theme' : 'Switch to Day theme'}
        >
          <svg className="menubar__icon" viewBox="0 0 16 16" aria-hidden="true">
            {theme === 'day' ? (
              <path d="M10.5 2.5a5.5 5.5 0 1 0 3 9.8A6 6 0 0 1 10.5 2.5z" />
            ) : (
              <>
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" />
              </>
            )}
          </svg>
          {theme === 'day' ? 'Night' : 'Day'}
        </button>
      </nav>
      <Clock />
    </header>
  );
}
