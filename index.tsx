import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Ensure the root element exists before attempting to render
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
    rootElement.innerHTML = `<div style="padding: 20px; color: white; text-align: center;">
      <h2>משהו השתבש...</h2>
      <p>אנא רעננו את הדף</p>
    </div>`;
  }
} else {
  console.error("Root element not found");
}