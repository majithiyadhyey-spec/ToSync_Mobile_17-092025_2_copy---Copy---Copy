import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FormworkDataProvider } from './context/FormworkDataContext';
import { I18nProvider } from './context/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErpProvider } from './context/erp/ErpContext';

// Register the service worker for Progressive Web App (PWA) capabilities.
// This enables offline functionality and allows the app to be "installed".
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: Corrected the service worker registration syntax. The previous code was invalid.
    navigator.serviceWorker.register('./service-worker.js').then(registration => {
      console.log('PWA Service Worker registered: ', registration);
    }).catch(registrationError => {
      console.log('PWA SW registration failed: ', registrationError);
    });
  });
}

// Find the root DOM element to mount the React application.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root and render the application.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/*
      The application is wrapped in several Context Providers to manage global state.
      The order is important to respect dependencies (e.g., ErpProvider needs AuthProvider).
      - ThemeProvider: Manages the light/dark theme state.
      - AuthProvider: Manages user authentication state.
      - FormworkDataProvider: Manages core application data (projects, tasks, users).
      - I18nProvider: Handles internationalization and language translations.
      - ErpProvider: Manages ERP-related data.
    */}
    <ThemeProvider>
      <AuthProvider>
        <FormworkDataProvider>
          <I18nProvider>
            <ErpProvider>
              <App />
            </ErpProvider>
          </I18nProvider>
        </FormworkDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);