import { useCallback, useEffect, useRef, useState } from 'react';
import { AppContent } from '../../apps/AppContent';
import { apps, getApp, type AppId } from '../../apps/registry';
import { readHashApp, replaceHash } from '../../lib/hash';
import { accentClass, DesktopIcon } from '../../os';
import './PhoneView.css';

/** Phones: a home screen of app icons. Each app opens full screen with a Back button. */
export function PhoneView() {
  const [activeId, setActiveId] = useState<AppId | null>(readHashApp);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The address drives which app is open, so the phone's own back gesture closes it.
  useEffect(() => {
    const onHashChange = () => setActiveId(readHashApp());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openApp = useCallback((id: AppId) => {
    location.hash = id;
  }, []);

  const goHome = useCallback(() => {
    replaceHash(null);
    setActiveId(null);
  }, []);

  // Move focus to the app's title when it opens, and back to its icon when it closes.
  const lastOpened = useRef<AppId | null>(null);
  useEffect(() => {
    if (activeId) {
      lastOpened.current = activeId;
      headingRef.current?.focus();
    } else if (lastOpened.current) {
      document.querySelector<HTMLElement>(`[data-app-id="${lastOpened.current}"]`)?.focus();
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goHome();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeId, goHome]);

  const active = activeId ? getApp(activeId) : null;

  return (
    <main className="phone" aria-label="Home screen">
      <section className="phone__widget" aria-label="This machine">
        <p className="phone__hello">SDCA-LAB-07</p>
        <p className="phone__sub">The admin wiped this machine. Ten fragments survived.</p>
        <p className="phone__hint">Start with the terminal.</p>
      </section>

      <nav className="phone__grid" aria-label="Apps">
        {apps.map((app) => (
          <DesktopIcon
            key={app.id}
            data-app-id={app.id}
            className="phone__icon"
            label={app.label}
            kind={app.icon}
            accent={app.accent}
            onClick={() => openApp(app.id)}
          />
        ))}
      </nav>

      {active && (
        <section
          className={`phone__app ${accentClass(active.accent)}`}
          aria-labelledby="phone-app-title"
        >
          <header className="phone__appbar">
            <button type="button" className="phone__back" onClick={goHome}>
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M7.5 2L3.5 6l4 4" />
              </svg>
              Home
            </button>
            <h2 id="phone-app-title" ref={headingRef} tabIndex={-1}>
              {active.windowTitle}
            </h2>
          </header>
          <div className="phone__appbody">
            <AppContent id={active.id} onOpenApp={openApp} />
          </div>
        </section>
      )}
    </main>
  );
}
