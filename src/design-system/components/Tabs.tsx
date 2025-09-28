import { ReactNode, useMemo, useState } from 'react';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ items, defaultActiveId, onChange }: TabsProps) {
  const firstEnabled = useMemo(() => items.find((item) => !item.disabled)?.id, [items]);
  const [activeId, setActiveId] = useState(defaultActiveId ?? firstEnabled);

  const handleSelect = (id: string) => {
    if (activeId === id) return;
    setActiveId(id);
    onChange?.(id);
  };

  return (
    <div className="ds-tabs">
      <div role="tablist" className="ds-tabs__list">
        {items.map(({ id, label, disabled }) => (
          <button
            key={id}
            role="tab"
            type="button"
            className={
              activeId === id ? 'ds-tabs__trigger ds-tabs__trigger--active' : 'ds-tabs__trigger'
            }
            aria-selected={activeId === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            disabled={disabled}
            tabIndex={activeId === id ? 0 : -1}
            onClick={() => !disabled && handleSelect(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {items.map(({ id, content, disabled }) => (
        <div
          key={id}
          role="tabpanel"
          id={`panel-${id}`}
          aria-labelledby={`tab-${id}`}
          hidden={activeId !== id}
          className="ds-tabs__panel"
          aria-disabled={disabled || undefined}
        >
          {activeId === id ? content : null}
        </div>
      ))}
    </div>
  );
}
