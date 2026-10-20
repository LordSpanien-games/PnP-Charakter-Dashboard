import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import "./core/print.css";
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Anwendungsfehler beim Laden des P&P Dashboards">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
