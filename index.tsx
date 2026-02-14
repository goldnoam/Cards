import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Wait for DOM to be fully ready
const init = () => {
  const rootElement = document.getElementById('root');

  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } catch (error) {
      console.error("Critical rendering error:", error);
      rootElement.innerHTML = `
        <div style="padding: 40px; color: white; text-align: center; font-family: sans-serif; background: #020617; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">משהו השתבש בטעינת המשחק</h2>
          <p style="opacity: 0.7; margin-bottom: 2rem;">ייתכן שיש בעיית חיבור או שהדפדפן אינו תומך בגרסה זו.</p>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            רענן דף
          </button>
          <pre style="margin-top: 2rem; font-size: 0.7rem; opacity: 0.3; text-align: left; max-width: 80%; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        </div>`;
    }
  }
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
