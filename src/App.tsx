import { useState, useMemo, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { usePackageData } from './hooks/usePackageData';
import { Header } from './components/Header';
import { PackageList } from './components/PackageList';
import { PackageDetails } from './components/PackageDetails';
import { PackageLogAnalysis } from './components/PackageLogAnalysis';
import { PackageCheckResult } from './types/package';
import { parsePackageLog, detectBuild, analyzePackages } from './utils/packageLogParser';

type Tab =
  | { id: string; type: 'package'; packageName: string }
  | { id: string; type: 'analysis'; label: string; results: PackageCheckResult[]; buildId: string };

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
    const existingTab = openTabs.find(tab => tab.type === 'package' && tab.packageName === packageName);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      type: 'package',
      packageName,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs]);

  const handleUploadPackageLog = useCallback((content: string) => {
    if (!packageHistory) return;

    const parsed = parsePackageLog(content);
    if (parsed.length === 0) return;

    const detectedBuild = detectBuild(parsed, packageHistory) || currentBuild;
    const results = analyzePackages(parsed, detectedBuild, packageHistory);

    const newTab: Tab = {
      id: `analysis-${Date.now()}`,
      type: 'analysis',
      label: `Analysis (${detectedBuild})`,
      results,
      buildId: detectedBuild,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [packageHistory, currentBuild]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
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
    if (!packageSite || !activeTab || activeTab.type !== 'package') return null;
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

  const getTabLabel = (tab: Tab) => {
    if (tab.type === 'package') return tab.packageName;
    return tab.label;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        builds={packageHistory.builds}
        selectedBuild={currentBuild}
        onSelectBuild={setSelectedBuild}
        onUploadPackageLog={handleUploadPackageLog}
      />

      <div className="flex-1 flex min-h-0">
        <div className="w-80 lg:w-96 flex-shrink-0">
          <PackageList
            packages={packageSite}
            history={packageHistory}
            selectedBuild={currentBuild}
            selectedPackage={activeTab?.type === 'package' ? activeTab.packageName : null}
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
                    {getTabLabel(tab)}
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
            {activeTab?.type === 'analysis' ? (
              <PackageLogAnalysis
                results={activeTab.results}
                buildId={activeTab.buildId}
                history={packageHistory}
              />
            ) : (
              <PackageDetails
                pkg={activeTabPkg}
                packages={packageSite}
                history={packageHistory}
                selectedBuild={currentBuild}
                onOpenPackageTab={openPackageInTab}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400">
        This is an independent, community-driven project — not affiliated with, endorsed by, or sponsored by Beckhoff Automation GmbH &amp; Co. KG.
        "TwinCAT" and "TwinCAT/BSD" are registered trademarks of Beckhoff Automation GmbH &amp; Co. KG.
      </footer>
    </div>
  );
}

export default App;
