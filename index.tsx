import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { WidgetPage } from './components/WidgetPage';
import { BookingStatusPage } from './components/BookingStatusPage';

import { ConvexClientProvider } from './src/components/ConvexClientProvider';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider, ToastProvider } from './src/providers';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple URL routing
const pathname = window.location.pathname;
const isWidgetPage = pathname === '/widget';
const bookingStatusMatch = pathname.match(/^\/booking\/([^\/]+)\/status$/);
const isBookingStatusPage = !!bookingStatusMatch;
const bookingId = bookingStatusMatch?.[1] || '';

console.log("Starting app mount...", { isWidgetPage, isBookingStatusPage, pathname });

try {
  const root = ReactDOM.createRoot(rootElement);

  // Create Convex client for public pages
  const createPublicConvexClient = () => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("VITE_CONVEX_URL environment variable not set");
    }
    return new ConvexReactClient(convexUrl);
  };

  if (isWidgetPage) {
    // Public widget page - uses Convex without Clerk authentication
    const convex = createPublicConvexClient();

    root.render(
      <React.StrictMode>
        <ConvexProvider client={convex}>
          <WidgetPage />
        </ConvexProvider>
      </React.StrictMode>
    );
    console.log("Widget page mounted successfully");
  } else if (isBookingStatusPage) {
    // Public booking status page - uses Convex without Clerk authentication
    const convex = createPublicConvexClient();

    root.render(
      <React.StrictMode>
        <ConvexProvider client={convex}>
          <BookingStatusPage bookingId={bookingId} />
        </ConvexProvider>
      </React.StrictMode>
    );
    console.log("Booking status page mounted successfully");
  } else {
    // Main app with full authentication
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <ToastProvider>
            <ConvexClientProvider>
              <App />
            </ConvexClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </React.StrictMode>
    );
    console.log("App mounted successfully");
  }
} catch (error) {
  console.error("Error mounting app:", error);
  document.body.innerHTML += `<div style="color: red; padding: 20px;">Error mounting app: ${error}</div>`;
}