import { useState, useMemo, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { usePackageData } from './hooks/usePackageData';
import { Header } from './components/Header';
import { PackageList } from './components/PackageList';
import { PackageDetails } from './components/PackageDetails';

interface Tab {
  id: string;
  packageName: string;
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const { packageSite, packageHistory, loading, error } = usePackageData();
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const latestBuild = useMemo(() => {
    if (!packageHistory) return '';
    const builds = Object.keys(packageHistory.builds);
    return builds.sort((a, b) => Number(b) - Number(a))[0] || '';
  }, [packageHistory]);

  const currentBuild = selectedBuild || latestBuild;

  const openPackageInTab = useCallback((packageName: string) => {
    // Check if tab already exists
    const existingTab = openTabs.find(tab => tab.packageName === packageName);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    // Create new tab
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      packageName,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      // If closing the active tab, switch to another tab or back to main view
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
        } else {
          setActiveTabId(null);
        }
      }
      return newTabs;
    });
  }, [activeTabId]);

  const activeTab = useMemo(() => {
    return openTabs.find(tab => tab.id === activeTabId) || null;
  }, [openTabs, activeTabId]);

  const activeTabPkg = useMemo(() => {
    if (!packageSite || !activeTab) return null;
    return packageSite[activeTab.packageName] || null;
  }, [packageSite, activeTab]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-twincat-red border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading package data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-red-600 dark:text-red-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!packageSite || !packageHistory) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        builds={packageHistory.builds}
        selectedBuild={currentBuild}
        onSelectBuild={setSelectedBuild}
      />

      <div className="flex-1 flex min-h-0">
        <div className="w-80 lg:w-96 flex-shrink-0">
          <PackageList
            packages={packageSite}
            history={packageHistory}
            selectedBuild={currentBuild}
            selectedPackage={activeTab?.packageName || null}
            onSelectPackage={openPackageInTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="flex bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center border-r border-slate-200 dark:border-slate-700 ${
                    activeTabId === tab.id
                      ? 'bg-slate-50 dark:bg-slate-900'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setActiveTabId(tab.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTabId === tab.id
                        ? 'text-twincat-red'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.packageName}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Close tab"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            <PackageDetails
              pkg={activeTabPkg}
              packages={packageSite}
              history={packageHistory}
              selectedBuild={currentBuild}
              onOpenPackageTab={openPackageInTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
