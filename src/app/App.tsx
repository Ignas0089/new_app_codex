import { useState } from 'react';
import { Layout } from '@components/Layout';
import { TabNavigation } from '@components/TabNavigation';
import { BudgetsPage } from '@pages/Budgets';
import { LogPage } from '@pages/Log';
import { ReportsPage } from '@pages/Reports';
import { SettingsPage } from '@pages/Settings';

type TabKey = 'log' | 'budgets' | 'reports' | 'settings';

const tabs: Array<{ key: TabKey; label: string; description: string }> = [
  { key: 'log', label: 'Log', description: 'Quickly capture expenses and review the latest entries.' },
  { key: 'budgets', label: 'Budgets', description: 'Adjust monthly targets and monitor status badges.' },
  { key: 'reports', label: 'Reports', description: 'Visualize trends that guide next steps.' },
  { key: 'settings', label: 'Settings', description: 'Manage categories, backups, and preferences.' }
];

const heroContent: Record<
  TabKey,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    helperLabel: string;
    helperCopy: string;
  }
> = {
  log: {
    eyebrow: 'Stage 1 • Capture',
    title: 'Log expenses',
    subtitle: 'Capture spending without friction and stay focused on what’s left.',
    helperLabel: 'Keyboard shortcut',
    helperCopy: 'Paspausk N, kad greitai pradėtum naują išlaidos įrašą bet kurioje vietoje puslapyje.'
  },
  budgets: {
    eyebrow: 'Stage 2 • Plan',
    title: 'Monthly budgets',
    subtitle: 'Adjust targets so you always know how your categories are pacing.',
    helperLabel: 'Guided action',
    helperCopy: 'Peržiūrėk likučius ir koreguok sumas, kad palaikytum ramų finansų tempą.'
  },
  reports: {
    eyebrow: 'Stage 3 • Review',
    title: 'Spending reports',
    subtitle: 'Visualize spending patterns and celebrate the progress you’re making.',
    helperLabel: 'Insight tip',
    helperCopy: 'Ieškok tendencijų, kurios parodo kur sutaupai daugiau ir kur verta sugrįžti prie plano.'
  },
  settings: {
    eyebrow: 'Stage 4 • Control',
    title: 'Settings',
    subtitle: 'Fine-tune preferences, backups, and data control without the stress.',
    helperLabel: 'Best practice',
    helperCopy: 'Prieš atlikdamas rizikingus veiksmus, eksportuok duomenis – taip užtikrinsi ramybę.'
  }
};

const tabContent: Record<TabKey, JSX.Element> = {
  log: <LogPage />,
  budgets: <BudgetsPage />,
  reports: <ReportsPage />,
  settings: <SettingsPage />
};

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('log');
  const { eyebrow, title, subtitle, helperLabel, helperCopy } = heroContent[activeTab];
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  return (
    <Layout>
      <div className="app-shell">
        <header className="hero" role="banner">
          <div className="hero__content">
            <p className="hero__eyebrow">{eyebrow}</p>
            <h1 className="hero__title">{title}</h1>
            <p className="hero__subtitle">{subtitle}</p>
          </div>
          <div className="hero__aside" aria-live="polite">
            <span className="hero__aside-label">{helperLabel}</span>
            <p className="hero__aside-copy">{helperCopy}</p>
          </div>
        </header>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

        <section aria-live="polite" className="app-section" id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {tabContent[activeTab]}
        </section>
      </div>
    </Layout>
  );
}
