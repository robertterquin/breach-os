import { useEffect, useRef, useState } from 'react';
import './BootScreen.css';

type BootScreenProps = {
  lines: string[];
  onDone: () => void;
};

const STEP_MS = 190;
const HOLD_MS = 450;
const FADE_MS = 250;

/** The one orchestrated moment: a short startup log on first visit. Any key or click skips it. */
export function BootScreen({ lines, onDone }: BootScreenProps) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    skipRef.current?.focus();
    const timers = lines.map((_, i) => window.setTimeout(() => setShown(i + 1), STEP_MS * (i + 1)));
    const total = STEP_MS * lines.length + HOLD_MS;
    timers.push(window.setTimeout(() => setLeaving(true), total));
    timers.push(window.setTimeout(() => doneRef.current(), total + FADE_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [lines]);

  useEffect(() => {
    const skip = () => doneRef.current();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, []);

  const progress = Math.round((shown / lines.length) * 100);

  return (
    <div
      className="boot"
      data-leaving={leaving}
      role="status"
      aria-label="breach.os is starting"
      onClick={() => doneRef.current()}
    >
      <div className="boot__panel">
        <p className="boot__logo">breach.os</p>
        <ol className="boot__log">
          {lines.slice(0, shown).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="boot__bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <button
          ref={skipRef}
          type="button"
          className="boot__skip"
          onClick={() => doneRef.current()}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
