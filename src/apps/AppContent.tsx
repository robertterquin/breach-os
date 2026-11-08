import type { AppId } from './registry';
import { TerminalApp } from './terminal/TerminalApp';

type AppContentProps = {
  id: AppId;
  onOpenApp: (id: AppId) => void;
};

/** Picks the window body for an app. */
export function AppContent({ id, onOpenApp }: AppContentProps) {
  switch (id) {
    case 'terminal':
      return <TerminalApp onOpenApp={onOpenApp} />;
  }
}
