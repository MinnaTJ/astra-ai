import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

import { SettingsProvider, JobsProvider, ToastProvider, ConfirmProvider } from './contexts';
import { ToastContainer } from './components/ui/Toast';

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <JobsProvider>
        <ToastProvider>
          <ConfirmProvider>
            <App />
            <ToastContainer />
          </ConfirmProvider>
        </ToastProvider>
      </JobsProvider>
    </SettingsProvider>
  </React.StrictMode>
);
