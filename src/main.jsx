import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startSync } from './lib/sync.js';
import './styles.css';

startSync();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
