export interface TabConfig<TKey extends string = string> {
  key: TKey;
  label: string;
  description?: string;
}

interface TabNavigationProps<TKey extends string = string> {
  tabs: Array<TabConfig<TKey>>;
  activeTab: TKey;
  onChange: (tab: TKey) => void;
}

export function TabNavigation<TKey extends string>({
  tabs,
  activeTab,
  onChange
}: TabNavigationProps<TKey>): JSX.Element {
  return (
    <nav className="tab-navigation" aria-label="Primary">
      <ul className="tab-navigation__list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <li key={tab.key} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.key}`}
                id={`tab-${tab.key}`}
                className={isActive ? 'tab-navigation__item tab-navigation__item--active' : 'tab-navigation__item'}
                onClick={() => onChange(tab.key)}
              >
                <span className="tab-navigation__label">{tab.label}</span>
                {tab.description ? (
                  <span className="tab-navigation__description">{tab.description}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
