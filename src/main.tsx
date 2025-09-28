import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@app/App';
import { seedDatabase } from '@db/seeds';
import '@styles/theme.css';

async function bootstrap(): Promise<void> {
  await seedDatabase();

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap().catch((error) => {
  console.error('Failed to bootstrap application', error);
});
