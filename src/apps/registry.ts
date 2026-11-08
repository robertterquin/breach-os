import type { Accent, GlyphKind } from '../os';

// Challenge folders join this list in Phase 4 and 5.
export type AppId = 'terminal';

export type AppMeta = {
  id: AppId;
  /** Shown in the window title bar. */
  windowTitle: string;
  /** Shown under the desktop icon and in the dock tooltip. */
  label: string;
  accent: Accent;
  icon: GlyphKind;
  /** Preferred window width in px; shrinks to fit small screens. */
  width: number;
};

export const terminalApp: AppMeta = {
  id: 'terminal',
  windowTitle: 'terminal',
  label: 'terminal',
  accent: 'mint',
  icon: 'terminal',
  width: 600,
};

/** Every app, in desktop-icon order. */
export const apps: AppMeta[] = [terminalApp];

const byId = new Map(apps.map((app) => [app.id, app]));

export function getApp(id: AppId): AppMeta {
  const app = byId.get(id);
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

/** Apps that can be opened from a link such as #terminal. */
export function isLinkableAppId(value: string): value is AppId {
  return byId.has(value as AppId);
}

/** Apps pinned to the dock. */
export const dockAppIds: AppId[] = ['terminal'];
