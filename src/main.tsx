import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <FirebaseProvider>
    <App />
  </FirebaseProvider>
);
