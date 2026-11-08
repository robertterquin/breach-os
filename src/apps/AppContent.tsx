import { useGame } from '../game/useGame';
import { CryptoApp } from './crypto/CryptoApp';
import { EndingApp } from './ending/EndingApp';
import { ForensicsApp } from './forensics/ForensicsApp';
import { NetworkApp } from './network/NetworkApp';
import { NotesApp } from './notes/NotesApp';
import { isLocked } from './appStatus';
import { getApp, type AppId } from './registry';
import { ScoreApp } from './score/ScoreApp';
import { AccessDenied } from './shared/AccessDenied';
import { TerminalApp } from './terminal/TerminalApp';
import { LabExplorer } from './web/LabExplorer';

type AppContentProps = {
  id: AppId;
  onOpenApp: (id: AppId) => void;
};

/** Picks the window body for an app; locked folders show Access denied instead. */
export function AppContent({ id, onOpenApp }: AppContentProps) {
  const { game } = useGame();
  const app = getApp(id);
  if (app.category && isLocked(app, game)) {
    return <AccessDenied category={app.category} onOpenApp={onOpenApp} />;
  }
  switch (id) {
    case 'crypto':
      return <CryptoApp />;
    case 'web':
      return <LabExplorer />;
    case 'forensics':
      return <ForensicsApp />;
    case 'network':
      return <NetworkApp />;
    case 'notes':
      return <NotesApp />;
    case 'score':
      return <ScoreApp onOpenApp={onOpenApp} />;
    case 'ending':
      return <EndingApp />;
    case 'terminal':
      return <TerminalApp onOpenApp={onOpenApp} />;
  }
}
