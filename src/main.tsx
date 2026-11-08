import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-600.css';
import '@fontsource/vt323/latin-400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/repair.css';
import App from './App.tsx';

// /?preview shows every component at every repair stage. It only exists in development builds.
const ComponentPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/ComponentPreview/ComponentPreview.tsx'))
  : null;
const showPreview = ComponentPreview && new URLSearchParams(location.search).has('preview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showPreview && ComponentPreview ? (
      <Suspense fallback={null}>
        <ComponentPreview />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
