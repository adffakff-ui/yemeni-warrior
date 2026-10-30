import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker safely with try-catch so it never breaks app mount
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, r) {
        if (r) {
          setInterval(() => {
            r.update().catch(() => {});
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.warn('PWA service worker registration error:', error);
      },
    });
  } catch (err) {
    console.warn('ServiceWorker registration skipped:', err);
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  );
}
