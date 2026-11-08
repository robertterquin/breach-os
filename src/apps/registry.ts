import type { Category } from '../game/challenges';
import type { Accent, GlyphKind } from '../os';

export type AppId =
  'crypto' | 'web' | 'forensics' | 'network' | 'notes' | 'score' | 'ending' | 'terminal';

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
  /** A challenge folder: shows Access denied until its category unlocks. */
  category?: Category;
  /** Hidden from icons and lists until all 10 flags are found. */
  endingOnly?: boolean;
};

const folder = (category: Category, windowTitle: string, width: number): AppMeta => ({
  id: category,
  windowTitle,
  label: category,
  accent: 'yellow',
  icon: 'folder',
  width,
  category,
});

export const terminalApp: AppMeta = {
  id: 'terminal',
  windowTitle: 'terminal',
  label: 'terminal',
  accent: 'mint',
  icon: 'terminal',
  width: 600,
};

/** Every app, in desktop-icon order. */
export const apps: AppMeta[] = [
  folder('crypto', 'crypto - Notepad', 640),
  folder('web', 'Lab Explorer', 680),
  folder('forensics', 'forensics - Viewer', 660),
  folder('network', 'network - Log Viewer', 720),
  {
    id: 'notes',
    windowTitle: 'notes.txt - Notepad',
    label: 'notes.txt',
    accent: 'yellow',
    icon: 'file',
    width: 560,
  },
  {
    id: 'score',
    windowTitle: 'Score',
    label: 'score',
    accent: 'yellow',
    icon: 'app',
    width: 520,
  },
  terminalApp,
  {
    id: 'ending',
    windowTitle: 'admin_message.txt - Notepad',
    label: 'admin_message.txt',
    accent: 'yellow',
    icon: 'file',
    width: 520,
    endingOnly: true,
  },
];

const byId = new Map(apps.map((app) => [app.id, app]));

export function getApp(id: AppId): AppMeta {
  const app = byId.get(id);
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

/** Apps that can be opened from a link such as #crypto. */
export function isLinkableAppId(value: string): value is AppId {
  return byId.has(value as AppId);
}

/** Apps pinned to the dock. */
export const dockAppIds: AppId[] = ['terminal', 'notes', 'score'];
