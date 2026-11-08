import { useCallback, useEffect } from 'react';
import { AppContent } from '../../apps/AppContent';
import { isLocked } from '../../apps/locked';
import { apps, type AppId } from '../../apps/registry';
import { useGame } from '../../game/useGame';
import { readHashApp, replaceHash } from '../../lib/hash';
import { revealElement } from '../../lib/reveal';
import { Window } from '../../os';
import './ListView.css';

/** Every app on one plain scrolling page. Becomes the case file in Phase 7. */
export function ListView() {
  const { game } = useGame();
  const goTo = useCallback((id: AppId) => {
    replaceHash(id);
    revealElement(`list-${id}`);
  }, []);

  // Open on the app named in the link, and follow links like #terminal.
  useEffect(() => {
    const fromLink = readHashApp();
    // Landing on a link jumps straight there; later jumps animate.
    if (fromLink) revealElement(`list-${fromLink}`, { animate: false });
    const onHashChange = () => {
      const id = readHashApp();
      if (id) goTo(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [goTo]);

  return (
    <main className="listview" aria-label="List view">
      <div className="listview__inner">
        <nav className="listview__toc" aria-label="Jump to an app">
          <p className="listview__toc-title">Apps</p>
          <ol>
            {apps.map((app) => (
              <li key={app.id}>
                <a
                  href={`#${app.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(app.id);
                  }}
                >
                  {isLocked(app, game) ? `${app.label} (locked)` : app.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="listview__sections">
          {apps.map((app) => (
            <Window
              key={app.id}
              title={isLocked(app, game) ? `${app.label}/ - Access denied` : app.windowTitle}
              accent={app.accent}
              danger={isLocked(app, game)}
              className="listview__window"
              rootProps={{ id: `list-${app.id}`, tabIndex: -1 }}
            >
              <AppContent id={app.id} onOpenApp={goTo} />
            </Window>
          ))}
        </div>
      </div>
    </main>
  );
}
