import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { AppId } from '../registry';
import { run, welcomeLines, type Line } from './commands';
import './TerminalApp.css';

export function TerminalApp({ onOpenApp }: { onOpenApp: (id: AppId) => void }) {
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

  const submit = () => {
    const command = input.trim();
    const result = run(command, { openApp: onOpenApp });
    setInput('');
    setHistoryIndex(null);
    if (command) setHistory((h) => [...h, command]);
    if (result === 'clear') {
      setLines([]);
      return;
    }
    const echo: Line = { kind: 'in', text: command };
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
                ~ ${' '}
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
          submit();
        }}
      >
        <label htmlFor={inputId} className="term__prompt">
          ~ $<span className="visually-hidden">Terminal command</span>
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
