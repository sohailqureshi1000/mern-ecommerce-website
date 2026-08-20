import { useState, useRef, type KeyboardEvent } from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
}

export function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let newIndex: number | null = null;

    if (event.key === "ArrowRight") {
      newIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      newIndex = 0;
    } else if (event.key === "End") {
      newIndex = tabs.length - 1;
    }

    if (newIndex !== null) {
      event.preventDefault();
      const newTab = tabs[newIndex];
      setActiveTabId(newTab.id);
      tabRefs.current[newIndex]?.focus();
    }
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="tabs">
      <div role="tablist" aria-label="Example Tabs" className="tablist">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              // Roving tabindex: only the active tab is in the Tab order
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="tab-button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          tabIndex={0}
          className="tab-panel"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}