import { useState, useMemo, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { usePackageData } from './hooks/usePackageData';
import { Header } from './components/Header';
import { PackageList } from './components/PackageList';
import { PackageDetails } from './components/PackageDetails';
import { PackageLogAnalysis } from './components/PackageLogAnalysis';
import { BuildCompare } from './components/BuildCompare';
import { DependencyGraph } from './components/DependencyGraph';
import { ReverseDependencies } from './components/ReverseDependencies';
import { UpdateImpactAnalysis } from './components/UpdateImpactAnalysis';
import { PackageCheckResult } from './types/package';
import { parsePackageLog, detectBuild, analyzePackages } from './utils/packageLogParser';
import { buildReverseDependencyIndex } from './utils/dependencyResolver';

type Tab =
  | { id: string; type: 'package'; packageName: string }
  | { id: string; type: 'analysis'; label: string; results: PackageCheckResult[]; buildId: string }
  | { id: string; type: 'compare'; label: string }
  | { id: string; type: 'graph'; packageName: string; label: string }
  | { id: string; type: 'reverse'; packageName: string; label: string }
  | { id: string; type: 'impact'; label: string; packageName?: string };

function App() {
  const { theme, toggleTheme } = useTheme();
  const { packageSite, packageHistory, loading, error } = usePackageData();
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const latestBuild = useMemo(() => {
    if (!packageHistory) return '';
    const builds = Object.keys(packageHistory.builds);
    return builds.sort((a, b) => Number(b) - Number(a))[0] || '';
  }, [packageHistory]);

  const currentBuild = selectedBuild || latestBuild;

  const reverseIndex = useMemo(
    () => (packageSite ? buildReverseDependencyIndex(packageSite) : new Map<string, string[]>()),
    [packageSite]
  );

  const openPackageInTab = useCallback((packageName: string) => {
    const existingTab = openTabs.find(tab => tab.type === 'package' && tab.packageName === packageName);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setSidebarOpen(false);
      return;
    }
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      type: 'package',
      packageName,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSidebarOpen(false);
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

  const handleCompareBuilds = useCallback(() => {
    const newTab: Tab = {
      id: `compare-${Date.now()}`,
      type: 'compare',
      label: 'Build Compare',
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const openGraphInTab = useCallback((packageName: string) => {
    const existing = openTabs.find(tab => tab.type === 'graph' && tab.packageName === packageName);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const newTab: Tab = {
      id: `graph-${Date.now()}`,
      type: 'graph',
      packageName,
      label: `Graph: ${packageName}`,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs]);

  const openReverseInTab = useCallback((packageName: string) => {
    const existing = openTabs.find(tab => tab.type === 'reverse' && tab.packageName === packageName);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const newTab: Tab = {
      id: `reverse-${Date.now()}`,
      type: 'reverse',
      packageName,
      label: `Used by: ${packageName}`,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs]);

  const handleImpactAnalysis = useCallback((packageName?: string) => {
    const newTab: Tab = {
      id: `impact-${Date.now()}`,
      type: 'impact',
      label: 'Impact Analysis',
      packageName,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

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
        onCompareBuilds={handleCompareBuilds}
        onImpactAnalysis={() => handleImpactAnalysis()}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex min-h-0">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - overlay on mobile, static on desktop */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-200 ease-in-out md:relative md:z-auto md:transform-none md:transition-none md:w-80 lg:w-96 md:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-10 p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 md:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
            ) : activeTab?.type === 'compare' ? (
              <BuildCompare
                history={packageHistory}
              />
            ) : activeTab?.type === 'graph' ? (
              <DependencyGraph
                rootPackage={activeTab.packageName}
                packages={packageSite}
                reverseIndex={reverseIndex}
                onOpenPackageTab={openPackageInTab}
              />
            ) : activeTab?.type === 'reverse' ? (
              <ReverseDependencies
                packageName={activeTab.packageName}
                packages={packageSite}
                reverseIndex={reverseIndex}
                onOpenPackageTab={openPackageInTab}
              />
            ) : activeTab?.type === 'impact' ? (
              <UpdateImpactAnalysis
                history={packageHistory}
                reverseIndex={reverseIndex}
                initialPackage={activeTab.packageName}
                onOpenPackageTab={openPackageInTab}
              />
            ) : (
              <PackageDetails
                pkg={activeTabPkg}
                packages={packageSite}
                history={packageHistory}
                selectedBuild={currentBuild}
                onOpenPackageTab={openPackageInTab}
                onOpenGraph={openGraphInTab}
                onOpenReverse={openReverseInTab}
                onOpenImpact={handleImpactAnalysis}
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
