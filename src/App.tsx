import { useEffect, useState } from 'react';
import { useMediaQuery } from './lib/useMediaQuery';
import { repairStage } from './game/engine';
import { GameProvider } from './game/GameProvider';
import { useGame } from './game/useGame';
import { useEffects } from './lib/effects';
import { REBOOT_EVENT } from './apps/terminal/commands';
import { BootScreen, MenuBar } from './os';
import { DesktopView } from './views/desktop/DesktopView';
import { ListView } from './views/list/ListView';
import { PhoneView } from './views/phone/PhoneView';
import './App.css';

const LIST_VIEW_KEY = 'breach-os:list-view';

/** A link with ?view=list opens List view. Otherwise the last choice wins. */
function readListViewPref() {
  if (new URLSearchParams(location.search).get('view') === 'list') return true;
  try {
    return localStorage.getItem(LIST_VIEW_KEY) === 'on';
  } catch {
    return false;
  }
}

const BOOT_KEY = 'breach-os:booted';

/** The boot sequence plays once per browser, and never for visitors who prefer less motion. */
function shouldBoot() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return localStorage.getItem(BOOT_KEY) !== 'yes';
  } catch {
    return false;
  }
}

// Story text from the design doc; the boot screen will reflect progress in Phase 6.
const bootLines = [
  'BIOS SDCA-LAB-07 rev 2.1',
  'Memory test ........ 65536K OK',
  'Mounting /home/guest .. OK',
  'Mounting /home/admin .. FAILED (wiped 2024-03-14 23:58)',
  'Recovering fragments .. 10 found, 10 corrupted',
  'Starting breach.os',
];

/**
 * Picks one of three views of the same content:
 * List view (one scrolling page), the phone home screen, or the desktop.
 */
export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const { game } = useGame();
  const { effects, toggleEffects } = useEffects();
  const isPhone = useMediaQuery('(max-width: 767px)');
  const [listView, setListView] = useState(readListViewPref);
  const [booting, setBooting] = useState(shouldBoot);

  // The terminal's hidden reboot command replays the boot sequence.
  useEffect(() => {
    const onReboot = () => setBooting(true);
    window.addEventListener(REBOOT_EVENT, onReboot);
    return () => window.removeEventListener(REBOOT_EVENT, onReboot);
  }, []);

  const finishBoot = () => {
    setBooting(false);
    try {
      localStorage.setItem(BOOT_KEY, 'yes');
    } catch {
      // Storage can be blocked; the boot sequence may play again next visit.
    }
  };

  const toggleListView = () => {
    const next = !listView;
    setListView(next);
    // Keep the address in step so it can be shared as-is.
    const url = new URL(location.href);
    if (next) url.searchParams.set('view', 'list');
    else url.searchParams.delete('view');
    history.replaceState(null, '', url);
    try {
      localStorage.setItem(LIST_VIEW_KEY, next ? 'on' : 'off');
    } catch {
      // Storage can be blocked; the view still changes for this visit.
    }
  };

  return (
    <>
      {/* data-repair: how healed the desktop looks, one stage per two flags (styles/repair.css). */}
      <div className="shell surface" data-repair={repairStage(game)} inert={booting}>
        <h1 className="visually-hidden">breach.os, a capture-the-flag puzzle game</h1>
        <MenuBar
          listView={listView}
          onToggleListView={toggleListView}
          effects={effects}
          onToggleEffects={toggleEffects}
          // Every view opens the terminal from the #terminal link.
          onOpenHome={() => (location.hash = 'terminal')}
        />
        {listView ? <ListView /> : isPhone ? <PhoneView /> : <DesktopView />}
      </div>
      {booting && <BootScreen lines={bootLines} onDone={finishBoot} />}
    </>
  );
}
