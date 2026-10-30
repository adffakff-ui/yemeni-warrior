import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider.tsx';
import { registerSW } from 'virtual:pwa-register';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Register PWA service worker
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <FirebaseProvider>
    <App />
    <SpeedInsights />
  </FirebaseProvider>
);
