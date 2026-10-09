import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {},
});

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const currentTab = value !== undefined ? value : internalTab;
  const setTab = onValueChange || setInternalTab;

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: setTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 bg-zinc-900/60 rounded-lg border border-white/[0.08] ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '', count }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
        isActive
          ? 'bg-zinc-100 text-zinc-950 font-medium shadow-xs'
          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
      } ${className}`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            isActive ? 'bg-zinc-900/10 text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return <div className={`animate-fadeIn ${className}`}>{children}</div>;
}
