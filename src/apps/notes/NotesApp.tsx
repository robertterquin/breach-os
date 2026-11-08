import { useGame } from '../../game/useGame';
import { readText, root, type FileNode } from '../terminal/files';

const notes = root.children.find((c) => c.name === 'notes.txt') as FileNode;

/** The admin's notes, a line restored for every flag found. */
export function NotesApp() {
  const { game } = useGame();
  return <pre className="field notes-paper">{readText(notes, game)}</pre>;
}
