import { useState } from 'react';
import { Layout } from '@components/Layout';
import { TabNavigation } from '@components/TabNavigation';
import type { TabConfig } from '@components/TabNavigation';
import { BudgetsPage } from '@pages/Budgets';
import { LogPage } from '@pages/Log';
import { ReportsPage } from '@pages/Reports';
import { SettingsPage } from '@pages/Settings';

type TabKey = 'log' | 'budgets' | 'reports' | 'settings';

const tabs: TabConfig<TabKey>[] = [
  { key: 'log', label: 'Log', description: 'Quickly capture expenses and review the latest entries.' },
  { key: 'budgets', label: 'Budgets', description: 'Adjust monthly targets and monitor status badges.' },
  { key: 'reports', label: 'Reports', description: 'Visualize trends that guide next steps.' },
  { key: 'settings', label: 'Settings', description: 'Manage categories, backups, and preferences.' }
];

const tabContent: Record<TabKey, JSX.Element> = {
  log: <LogPage />,
  budgets: <BudgetsPage />,
  reports: <ReportsPage />,
  settings: <SettingsPage />
};

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('log');

  return (
    <Layout>
      <header className="app-header">
        <h1 className="app-title">Simple Ledger</h1>
        <p className="app-subtitle">Expense tracking so simple you’ll actually use it.</p>
      </header>
      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} />
      <section aria-live="polite" className="app-section">
        {tabContent[activeTab]}
      </section>
    </Layout>
  );
}
