import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { WidgetPage } from './components/WidgetPage';

import { ConvexClientProvider } from './src/components/ConvexClientProvider';
import { ConvexProvider, ConvexReactClient } from "convex/react";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple URL routing - check if we're on the public widget page
const isWidgetPage = window.location.pathname === '/widget';

console.log("Starting app mount...", { isWidgetPage, pathname: window.location.pathname });

try {
  const root = ReactDOM.createRoot(rootElement);

  if (isWidgetPage) {
    // Public widget page - uses Convex without Clerk authentication
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("VITE_CONVEX_URL environment variable not set");
    }
    const convex = new ConvexReactClient(convexUrl);

    root.render(
      <React.StrictMode>
        <ConvexProvider client={convex}>
          <WidgetPage />
        </ConvexProvider>
      </React.StrictMode>
    );
    console.log("Widget page mounted successfully");
  } else {
    // Main app with full authentication
    root.render(
      <React.StrictMode>
        <ConvexClientProvider>
          <App />
        </ConvexClientProvider>
      </React.StrictMode>
    );
    console.log("App mounted successfully");
  }
} catch (error) {
  console.error("Error mounting app:", error);
  document.body.innerHTML += `<div style="color: red; padding: 20px;">Error mounting app: ${error}</div>`;
}