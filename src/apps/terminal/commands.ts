import { isWallpaper, REBOOT_EVENT, setWallpaper, wallpapers } from '../../lib/wallpaper';
import { apps, type AppId } from '../registry';

export type Line = { kind: 'in' | 'out' | 'err'; text: string };

type Context = {
  openApp: (id: AppId) => void;
};

/** What `run` returns: lines to print, or 'clear' to wipe the screen. */
type Result = string[] | { error: string } | 'clear';

// The file system, submit, hint and status commands arrive in Phase 4.
const help = [
  'Commands:',
  '  open <app>        open an app, e.g. open terminal',
  '  wallpaper <name>  change the desktop: ' + wallpapers.join(', '),
  '  date              today’s date',
  '  clear             clear the screen',
];

const commands: Record<string, (args: string[], ctx: Context) => Result> = {
  help: () => help,
  open: (args, ctx) => {
    const query = args.join(' ').trim().toLowerCase();
    const app = apps.find((a) => a.id === query || a.label.toLowerCase() === query);
    if (!app) return { error: `open: no app called "${query}".` };
    ctx.openApp(app.id);
    return [`Opening ${app.label}.`];
  },
  wallpaper: (args) => {
    const name = (args[0] ?? '').toLowerCase();
    if (!isWallpaper(name)) return { error: `wallpaper: pick one of ${wallpapers.join(', ')}.` };
    setWallpaper(name);
    return [`Wallpaper set to ${name}.`];
  },
  date: () => [new Date().toLocaleDateString('en-PH', { dateStyle: 'full' })],
  clear: () => 'clear',
  echo: (args) => [args.join(' ')],
  // Not listed in help.
  reboot: () => {
    window.dispatchEvent(new Event(REBOOT_EVENT));
    return ['Rebooting breach.os.'];
  },
};

/** Runs one line of input and returns what to print. */
export function run(input: string, ctx: Context): Result {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const command = commands[name.toLowerCase()];
  if (!command) return { error: `command not found: ${name}. Type help for the list.` };
  return command(args, ctx);
}

export const welcomeLines: Line[] = [
  { kind: 'out', text: 'breach.os terminal · SDCA-LAB-07' },
  { kind: 'out', text: 'Type help to see the commands.' },
];
