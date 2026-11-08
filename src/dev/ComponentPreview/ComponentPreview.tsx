import { useEffects } from '../../lib/effects';
import { DesktopIcon, Dock, MenuBar, StickyNote, Window, type DockItem } from '../../os';
import './ComponentPreview.css';

// Dev-only page (open /?preview): every component at every repair stage, side by side.

const stages = [
  { repair: 0, flags: '0 flags' },
  { repair: 1, flags: '2 flags' },
  { repair: 2, flags: '4 flags' },
  { repair: 3, flags: '6 flags' },
  { repair: 4, flags: '8 flags' },
  { repair: 5, flags: '10 flags' },
];

const dockItems: DockItem[] = [
  { id: 'crypto', label: 'crypto', kind: 'app', accent: 'yellow' },
  { id: 'notes', label: 'notes.txt', kind: 'file' },
  { id: 'terminal', label: 'terminal', kind: 'terminal', accent: 'mint' },
];

const noop = () => {};

export default function ComponentPreview() {
  const { effects, toggleEffects } = useEffects();

  return (
    <main className="pv">
      <h1 className="pv__title">breach.os components at each repair stage</h1>
      <p className="pv__note">
        Effects are {effects ? 'on' : 'off'}.{' '}
        <button type="button" onClick={toggleEffects}>
          Turn effects {effects ? 'off' : 'on'}
        </button>
      </p>

      <div className="pv__grid">
        {stages.map(({ repair, flags }) => (
          <section key={repair} className="pv__stage" aria-label={`Stage ${repair}, ${flags}`}>
            <h2 className="pv__label">
              Stage {repair} · {flags}
            </h2>
            <div className="surface pv__surface" data-repair={repair}>
              <MenuBar effects={effects} onToggleEffects={noop} />
              <div className="pv__desk">
                <div className="pv__icons">
                  <DesktopIcon label="crypto" kind="folder" />
                  <DesktopIcon label="notes.txt" kind="file" selected />
                </div>

                <div className="pv__windows">
                  <Window title="crypto / 03_vigenere.txt" active onClose={noop} onMinimize={noop}>
                    <div className="term pv__crt">
                      <p className="term__line">
                        QLBY{'{'}xci_olclmt_ref_l_tsst{'}'}
                      </p>
                      <p className="term__line term__line--out">key: the room name</p>
                      <p className="term__line pv__amber">23:52 10.0.7.66 dns RkxBR3s.x.net</p>
                      <p className="term__line term__line--err">✕ Not the flag.</p>
                    </div>
                  </Window>
                  <Window title="notes.txt" active={false} onClose={noop}>
                    [2] Found a script I didn&apos;t write in /tmp.
                  </Window>
                </div>

                <StickyNote className="pv__sticky" tilt={-3}>
                  password? check the photo
                </StickyNote>
              </div>
              <div className="pv__dock">
                <Dock items={dockItems} openIds={['terminal']} onOpen={noop} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
