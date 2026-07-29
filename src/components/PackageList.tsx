import { useMemo, useRef, useEffect, useState } from 'react';
import { PackageSite, PackageHistory } from '../types/package';
import { PackageSearch } from './PackageSearch';

interface PackageListProps {
  packages: PackageSite;
  history: PackageHistory;
  selectedBuild: string;
  selectedPackage: string | null;
  onSelectPackage: (packageName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Taller rows give thumb-sized touch targets on phones. */
  rowHeight?: number;
}

const OVERSCAN = 5;

export function PackageList({
  packages,
  history,
  selectedBuild,
  selectedPackage,
  onSelectPackage,
  searchQuery,
  onSearchChange,
  rowHeight = 48,
}: PackageListProps) {
  const ITEM_HEIGHT = rowHeight;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const filteredPackages = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.keys(packages)
      .filter((name) => {
        if (!query) return true;
        const pkg = packages[name];
        return (
          name.toLowerCase().includes(query) ||
          pkg.comment?.toLowerCase().includes(query) ||
          pkg.desc?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.localeCompare(b));
  }, [packages, searchQuery]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    filteredPackages.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visiblePackages = filteredPackages.slice(startIndex, endIndex);

  const getVersionForBuild = (packageName: string): string | null => {
    return history.packages[packageName]?.versions[selectedBuild] || null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <PackageSearch value={searchQuery} onChange={onSearchChange} />
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {filteredPackages.length} packages
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div
          style={{ height: filteredPackages.length * ITEM_HEIGHT, position: 'relative' }}
        >
          {visiblePackages.map((name, index) => {
            const version = getVersionForBuild(name);
            const isSelected = selectedPackage === name;
            const actualIndex = startIndex + index;

            return (
              <button
                key={name}
                type="button"
                style={{
                  position: 'absolute',
                  top: actualIndex * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                }}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full flex items-center text-left px-4 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 transition-colors ${
                  isSelected
                    ? 'bg-twincat-red/10 border-l-2 border-l-twincat-red'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
                onClick={() => onSelectPackage(name)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${isSelected ? 'text-twincat-red' : 'text-slate-800 dark:text-slate-200'}`}>
                    {name}
                  </div>
                  {version && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {version}
                    </div>
                  )}
                </div>
                {!version && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    N/A
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
