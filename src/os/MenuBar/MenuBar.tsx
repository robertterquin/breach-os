import { useEffect, useState } from 'react';
import './MenuBar.css';

type MenuBarProps = {
  listView?: boolean;
  /** Omit to hide the List view button. */
  onToggleListView?: () => void;
  effects: boolean;
  onToggleEffects: () => void;
  onOpenHome?: () => void;
  /** Progress shown beside the clock, e.g. "3/10 flags · 250 pts". */
  status?: string;
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
  effects,
  onToggleEffects,
  onOpenHome,
  status,
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
          aria-pressed={effects}
          onClick={onToggleEffects}
        >
          <span className="menubar__check" aria-hidden="true">
            {effects ? '■' : '□'}
          </span>
          Effects
        </button>
      </nav>
      {status && <span className="menubar__status">{status}</span>}
      <Clock />
    </header>
  );
}
