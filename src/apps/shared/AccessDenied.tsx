import { categories, type Category } from '../../game/challenges';
import { lockReason } from '../../game/engine';
import { useGame } from '../../game/useGame';
import type { AppId } from '../registry';

/** What a locked folder shows instead of its contents. */
export function AccessDenied({
  category,
  onOpenApp,
}: {
  category: Category;
  onOpenApp: (id: AppId) => void;
}) {
  const { game } = useGame();
  const index = categories.findIndex((c) => c.id === category);
  const before = categories.at(index - 1)!.id;
  return (
    <div role="alert">
      <p>
        <strong>{category}/ is locked:</strong> {lockReason(game, category)}.
      </p>
      <button type="button" className="btn" onClick={() => onOpenApp(before)}>
        Open {before}/
      </button>
    </div>
  );
}
