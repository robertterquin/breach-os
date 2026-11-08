import { useState } from 'react';
import { isFinished, newGame, resultLine } from '../../game/engine';
import { saveGame } from '../../game/storage';
import { useGame } from '../../game/useGame';
import './EndingApp.css';

// The admin's last message, from the game design doc's Ending.
const message = [
  "I didn't wipe this machine to hide something. I wiped it to lock someone out.",
  "GHOSTWIRE had been copying the lab's files for a week, a few bytes at a time, inside DNS lookups.",
  'Their last upload bounced at 23:57. One minute later, everything they could reach was gone.',
  'Thanks for finishing what I started.',
  '— sysad_07, 2024-03-14 23:58',
].join('\n');

/** admin_message.txt: the ending, with a shareable result and a way to play again. */
export function EndingApp() {
  const { game } = useGame();
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [credits, setCredits] = useState(false);

  if (!isFinished(game)) {
    return <p>This file is still corrupted. Recover all 10 flags to read it.</p>;
  }

  const result = resultLine(game);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setNote('Result copied.');
    } catch {
      setNote('Copy blocked by the browser. Select the line above and copy it by hand.');
    }
  };

  return (
    <>
      <pre className="field notes-paper">{message}</pre>
      <p className="ending__result">{result}</p>
      <div className="ending__actions">
        <button type="button" className="btn" onClick={() => void copy()}>
          Copy result
        </button>
        {confirming ? (
          <span role="alert" className="ending__confirm">
            Start over from a broken machine?
            <button
              type="button"
              className="btn"
              onClick={() => {
                // Save first, then reload clean so every window closes on the broken machine.
                saveGame(newGame());
                location.assign(location.pathname);
              }}
            >
              Yes, play again
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>
            Play again
          </button>
        )}
        <button
          type="button"
          className="btn"
          aria-pressed={credits}
          onClick={() => setCredits((c) => !c)}
        >
          Credits
        </button>
      </div>
      {note && <p role="status">{note}</p>}
      {credits && (
        <p className="ending__credits">
          breach.os by Robert Terquin Laqui. Set on a fictional SDCA lab machine; every person,
          handle and event in it is made up.
        </p>
      )}
    </>
  );
}
