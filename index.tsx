import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { WidgetPage } from './components/WidgetPage';
import { BookingStatusPage } from './components/BookingStatusPage';

import { ConvexClientProvider } from './src/components/ConvexClientProvider';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider, ToastProvider } from './src/providers';

const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  // Visible marker to confirm JS executed (useful for debugging blank deploys)
  rootElement.innerHTML = `<div style="padding:16px;font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">Loading…</div>`;

  // Simple URL routing
  const pathname = window.location.pathname;
  const isWidgetPage = pathname === '/widget';
  const bookingStatusMatch = pathname.match(/^\/booking\/([^\/]+)\/status$/);
  const isBookingStatusPage = !!bookingStatusMatch;
  const bookingId = bookingStatusMatch?.[1] || '';

  console.log("Starting app mount...", { isWidgetPage, isBookingStatusPage, pathname });

  // Minimal error boundary so widget failures don't render as a blank page
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: unknown) {
      return { error };
    }
    componentDidCatch(error: unknown) {
      console.error('ErrorBoundary caught:', error);
    }
    render() {
      if (this.state.error) {
        return (
          <div style={{ padding: 16, color: '#b91c1c', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Widget error</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          </div>
        );
      }
      return this.props.children;
    }
  }

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
        <ErrorBoundary>
          <ConvexProvider client={convex}>
            <WidgetPage />
          </ConvexProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("Widget page mounted successfully");
  } else if (isBookingStatusPage) {
    // Public booking status page - uses Convex without Clerk authentication
    const convex = createPublicConvexClient();

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ConvexProvider client={convex}>
            <BookingStatusPage bookingId={bookingId} />
          </ConvexProvider>
        </ErrorBoundary>
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
};

// Ensure #root exists even if the script is injected in <head>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}