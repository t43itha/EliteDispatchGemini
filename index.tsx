import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("Starting app mount...");
try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully");
} catch (error) {
  console.error("Error mounting app:", error);
  document.body.innerHTML += `<div style="color: red; padding: 20px;">Error mounting app: ${error}</div>`;
}