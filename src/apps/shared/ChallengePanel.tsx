import { useId, useState } from 'react';
import { categories } from '../../game/challenges';
import { findChallenge, isCategoryOpen, submitFlag } from '../../game/engine';
import { useGame } from '../../game/useGame';
import { HintDialog } from './HintDialog';
import './ChallengePanel.css';

type Message = { kind: 'ok' | 'error'; lines: string[] } | null;

/** The flag box under a clue: submit for this challenge, take a hint, reread hints taken. */
export function ChallengePanel({ challengeId }: { challengeId: string }) {
  const { game, setGame } = useGame();
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState<Message>(null);
  const [hinting, setHinting] = useState(false);
  const inputId = useId();
  const challenge = findChallenge(challengeId)!;
  const solved = game.solved.includes(challengeId);
  const hintsTaken = challenge.hints.slice(0, game.hintsTaken[challengeId] ?? 0);

  const submit = async () => {
    if (!flag.trim()) {
      setMessage({ kind: 'error', lines: ['Enter a flag first, e.g. FLAG{...}'] });
      return;
    }
    const before = game;
    const result = await submitFlag(before, flag, { id: challengeId });
    setGame(result.state);
    if (result.outcome !== 'correct') {
      setMessage({
        kind: 'error',
        lines: ['✕ Not the flag. Check every character, then try again.'],
      });
      return;
    }
    const unlocked = categories
      .filter(({ id }) => !isCategoryOpen(before, id) && isCategoryOpen(result.state, id))
      .map(({ id }) => `Unlocked: ${id}/`);
    setFlag('');
    setMessage({
      kind: 'ok',
      lines: [`✓ Correct. +${challenge.points} pts. Fragment recovered in notes.txt.`, ...unlocked],
    });
  };

  return (
    <section className="challenge" aria-label={`Answer for ${challengeId}`}>
      <p className="challenge__head">
        <strong>{challengeId}</strong> {challenge.title} · {challenge.points} pts ·{' '}
        {challenge.difficulty}
        {solved && <span className="challenge__solved"> ✓ solved</span>}
      </p>

      {hintsTaken.length > 0 && (
        <ol className="challenge__hints" aria-label="Hints taken">
          {hintsTaken.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      )}

      {!solved && (
        <form
          className="challenge__form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label htmlFor={inputId} className="visually-hidden">
            Flag for {challengeId}
          </label>
          <input
            id={inputId}
            className="field challenge__flag"
            value={flag}
            placeholder="FLAG{...}"
            onChange={(event) => {
              setFlag(event.target.value);
              if (message?.kind === 'error') setMessage(null);
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button type="submit" className="btn">
            Submit flag
          </button>
          <button type="button" className="btn" onClick={() => setHinting(true)}>
            Hint
          </button>
        </form>
      )}

      {message && (
        <div
          className={`challenge__message challenge__message--${message.kind}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}

      {hinting && <HintDialog challengeId={challengeId} onClose={() => setHinting(false)} />}
    </section>
  );
}
