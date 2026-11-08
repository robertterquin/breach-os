import { useEffect, useRef, useState } from 'react';
import { nextHint, score, takeHint } from '../../game/engine';
import { useGame } from '../../game/useGame';
import { Window } from '../../os';
import './HintDialog.css';

/** Shows a hint's price first; the points are only paid on "Show hint". */
export function HintDialog({ challengeId, onClose }: { challengeId: string; onClose: () => void }) {
  const { game, setGame } = useGame();
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<{ text: string; cost: number } | null>(null);
  const [offer] = useState(() => nextHint(game, challengeId));

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Start on the main action, not the title bar's close button.
    dialog?.querySelector<HTMLButtonElement>('.hint-dialog__actions .btn')?.focus();
  }, []);

  const close = () => ref.current?.close();

  const show = () => {
    const taken = takeHint(game, challengeId);
    if (!taken) return;
    setGame(taken.state);
    setShown({ text: taken.text, cost: taken.cost });
  };

  return (
    <dialog
      ref={ref}
      className="hint-dialog"
      aria-label={`Hint for ${challengeId}`}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop closes the dialog.
        if (event.target === event.currentTarget) close();
      }}
    >
      <Window title={`Hint · ${challengeId}`} onClose={close}>
        {!offer ? (
          <p>No hints left for {challengeId}.</p>
        ) : shown ? (
          <p className="crt-box">
            Hint {offer.number}: {shown.text}
          </p>
        ) : (
          <>
            <p>
              Hint {offer.number} of 2 {offer.cost ? `costs ${offer.cost} points.` : 'is free.'}
            </p>
            {offer.cost > 0 && (
              <p className="hint-dialog__score">
                Score {score(game)} → {Math.max(0, score(game) - offer.cost)}
              </p>
            )}
          </>
        )}
        <div className="hint-dialog__actions">
          {offer && !shown && (
            <button type="button" className="btn" onClick={show}>
              Show hint
            </button>
          )}
          <button type="button" className="btn" onClick={close}>
            {shown || !offer ? 'Close' : 'Cancel'}
          </button>
        </div>
      </Window>
    </dialog>
  );
}
