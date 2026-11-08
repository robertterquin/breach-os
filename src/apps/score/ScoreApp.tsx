import { useState } from 'react';
import { challenges } from '../../game/challenges';
import {
  hintsUsed,
  isCategoryOpen,
  isFinished,
  newGame,
  resultLine,
  score,
} from '../../game/engine';
import { useGame } from '../../game/useGame';
import type { AppId } from '../registry';
import './ScoreApp.css';

/** Every challenge's status, the totals, and a reset that asks first. */
export function ScoreApp({ onOpenApp }: { onOpenApp: (id: AppId) => void }) {
  const { game, setGame } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <p className="score__total">
        <strong>{score(game)} pts</strong> · {game.solved.length}/10 flags · {hintsUsed(game)}{' '}
        {hintsUsed(game) === 1 ? 'hint' : 'hints'}
      </p>
      <table className="score__table">
        <thead>
          <tr>
            <th scope="col">Challenge</th>
            <th scope="col">Points</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((c) => {
            const solved = game.solved.includes(c.id);
            const open = isCategoryOpen(game, c.category);
            const hints = game.hintsTaken[c.id] ?? 0;
            return (
              <tr key={c.id} data-status={solved ? 'solved' : open ? 'open' : 'locked'}>
                <td>
                  {c.id} {c.title}
                </td>
                <td>{c.points}</td>
                <td>
                  {solved ? '✓ solved' : open ? 'open' : 'locked'}
                  {hints > 0 && ` · ${hints} ${hints === 1 ? 'hint' : 'hints'}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="score__actions">
        {isFinished(game) && (
          <button type="button" className="btn" onClick={() => onOpenApp('ending')}>
            Read admin_message.txt
          </button>
        )}
        {confirming ? (
          <span role="alert" className="score__confirm">
            Wipe every flag, hint and point?
            <button
              type="button"
              className="btn"
              onClick={() => {
                setGame(newGame());
                setConfirming(false);
              }}
            >
              Yes, reset
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>
            Reset progress
          </button>
        )}
      </div>
      {isFinished(game) && <p className="score__result">{resultLine(game)}</p>}
    </>
  );
}
