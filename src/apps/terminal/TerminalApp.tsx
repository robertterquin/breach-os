import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useGame } from '../../game/useGame';
import type { AppId } from '../registry';
import { promptFor, REBOOT_EVENT, run, welcomeLines, type Line } from './commands';
import './TerminalApp.css';

const reboot = () => window.dispatchEvent(new Event(REBOOT_EVENT));

export function TerminalApp({ onOpenApp }: { onOpenApp: (id: AppId) => void }) {
  const { game, setGame } = useGame();
  const [cwd, setCwd] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Line[]>(welcomeLines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Keep the newest output in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);

  const submit = async () => {
    const command = input.trim();
    const echo: Line = { kind: 'in', text: command, prompt: promptFor(cwd) };
    setInput('');
    setHistoryIndex(null);
    if (command) setHistory((h) => [...h, command]);
    setBusy(true);
    // Flag checks hash in the background, so commands can be async.
    const result = await run(input, { game, setGame, cwd, setCwd, openApp: onOpenApp, reboot });
    setBusy(false);
    if (result === 'clear') {
      setLines([]);
      return;
    }
    const output: Line[] = Array.isArray(result)
      ? result.map((text) => ({ kind: 'out', text }))
      : [{ kind: 'err', text: result.error }];
    setLines((current) => [...current, echo, ...output]);
  };

  // Up and Down walk through earlier commands.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (history.length === 0) return;
    event.preventDefault();
    const last = history.length - 1;
    const next =
      event.key === 'ArrowUp'
        ? Math.max(0, (historyIndex ?? history.length) - 1)
        : historyIndex === null || historyIndex >= last
          ? null
          : historyIndex + 1;
    setHistoryIndex(next);
    setInput(next === null ? '' : (history.at(next) ?? ''));
  };

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term__log" role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((line, index) => (
          <p key={index} className={`term__line term__line--${line.kind}`}>
            {line.kind === 'in' && (
              <span className="term__prompt" aria-hidden="true">
                {line.prompt}{' '}
              </span>
            )}
            {line.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="term__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) void submit();
        }}
      >
        <label htmlFor={inputId} className="term__prompt">
          {promptFor(cwd)}
          <span className="visually-hidden">Terminal command</span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="term__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
        />
      </form>
    </div>
  );
}
