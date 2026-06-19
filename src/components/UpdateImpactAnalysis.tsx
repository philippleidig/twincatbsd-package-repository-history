import { useState, useMemo, ReactNode } from 'react';
import { PackageHistory, ImpactResult } from '../types/package';
import { analyzeUpdateImpact } from '../utils/dependencyResolver';

interface UpdateImpactAnalysisProps {
  history: PackageHistory;
  reverseIndex: Map<string, string[]>;
  initialPackage?: string;
  onOpenPackageTab?: (packageName: string) => void;
}

type FilterMode = 'all' | 'direct' | 'changed';

export function UpdateImpactAnalysis({
  history,
  reverseIndex,
  initialPackage,
  onOpenPackageTab,
}: UpdateImpactAnalysisProps) {
  const sortedBuilds = useMemo(
    () => Object.entries(history.builds).sort(([a], [b]) => Number(b) - Number(a)),
    [history.builds]
  );

  const packageNames = useMemo(
    () => Object.keys(history.packages).sort((a, b) => a.localeCompare(b)),
    [history.packages]
  );

  const [packageName, setPackageName] = useState(initialPackage || '');
  const [buildA, setBuildA] = useState(sortedBuilds[1]?.[0] || '');
  const [buildB, setBuildB] = useState(sortedBuilds[0]?.[0] || '');
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

  const isValidPackage = !!history.packages[packageName];
  const canAnalyze = isValidPackage && buildA && buildB && buildA !== buildB;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setResult(analyzeUpdateImpact(packageName, buildA, buildB, reverseIndex, history));
    setFilter('all');
  };

  const changedCount = useMemo(
    () => (result ? result.transitiveDependents.filter(d => d.changed).length : 0),
    [result]
  );

  const filtered = useMemo(() => {
    if (!result) return [];
    switch (filter) {
      case 'direct':
        return result.transitiveDependents.filter(d => d.direct);
      case 'changed':
        return result.transitiveDependents.filter(d => d.changed);
      default:
        return result.transitiveDependents;
    }
  }, [result, filter]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Update Impact Analysis
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          See how a package version changes between two builds, and which packages are affected.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Package
              </label>
              <input
                list="impact-package-list"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="Type a package name…"
                className={`w-full bg-slate-100 dark:bg-slate-700 border rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red ${
                  packageName && !isValidPackage
                    ? 'border-amber-400 dark:border-amber-600'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              <datalist id="impact-package-list">
                {packageNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {packageName && !isValidPackage && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No package named "{packageName}" found in history.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  From Build
                </label>
                <select
                  value={buildA}
                  onChange={(e) => setBuildA(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red"
                >
                  {sortedBuilds.map(([buildId, info]) => (
                    <option key={buildId} value={buildId}>
                      {buildId} ({info.release_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex items-center pb-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              <div className="flex-1 w-full sm:w-auto">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  To Build
                </label>
                <select
                  value={buildB}
                  onChange={(e) => setBuildB(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red"
                >
                  {sortedBuilds.map(([buildId, info]) => (
                    <option key={buildId} value={buildId}>
                      {buildId} ({info.release_date})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="px-5 py-2 rounded-lg bg-twincat-red text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze
              </button>
            </div>

            {buildA && buildB && buildA === buildB && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Please select two different builds.
              </p>
            )}
          </div>
        </div>

        {result && (
          <>
            {/* Version change card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Package
                  </div>
                  <button
                    onClick={() => onOpenPackageTab?.(result.packageName)}
                    className="text-lg font-bold text-twincat-red hover:underline"
                  >
                    {result.packageName}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    {result.versionA || 'absent'}
                  </span>
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className={`px-2.5 py-1 rounded font-mono font-medium ${
                    result.changed
                      ? 'bg-twincat-red/10 text-twincat-red'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {result.versionB || 'absent'}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    result.changed
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {result.changed ? 'Version changed' : 'No version change'}
                  </span>
                </div>
              </div>
            </div>

            {/* Impact summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Direct Dependents
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {result.directDependents.length}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-twincat-red/30">
                <div className="text-xs font-medium text-twincat-red uppercase tracking-wide mb-1">
                  Total Affected
                </div>
                <div className="text-2xl font-bold text-twincat-red">
                  {result.transitiveCount}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                  Also Changed
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {changedCount}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">dependents changed too</div>
              </div>
            </div>

            {result.transitiveCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <p className="text-lg font-medium mb-1">No other packages depend on {result.packageName}</p>
                <p className="text-sm">Updating it has no impact on other packages.</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} color="red">
                    All ({result.transitiveCount})
                  </FilterButton>
                  <FilterButton active={filter === 'direct'} onClick={() => setFilter('direct')} color="slate">
                    Direct ({result.directDependents.length})
                  </FilterButton>
                  <FilterButton active={filter === 'changed'} onClick={() => setFilter('changed')} color="amber">
                    Also Changed ({changedCount})
                  </FilterButton>
                </div>

                {/* Affected table */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Package</th>
                          <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Relation</th>
                          <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">{buildA}</th>
                          <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">{buildB}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((dep) => (
                          <tr
                            key={dep.name}
                            className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                          >
                            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                              <button
                                onClick={() => onOpenPackageTab?.(dep.name)}
                                className="hover:text-twincat-red hover:underline text-left"
                              >
                                {dep.name}
                              </button>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                dep.direct
                                  ? 'bg-twincat-red/10 text-twincat-red'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                              }`}>
                                {dep.direct ? 'direct' : 'transitive'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {dep.versionA || '-'}
                            </td>
                            <td className={`px-4 py-2.5 font-mono ${
                              dep.changed
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {dep.versionB || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No packages match the selected filter.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!result && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-lg font-medium mb-1">Choose a package and two builds</p>
            <p className="text-sm">Then click Analyze to see the update impact.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: 'red' | 'slate' | 'amber';
  children: ReactNode;
}) {
  const activeColors = {
    red: 'bg-twincat-red text-white',
    slate: 'bg-slate-600 text-white',
    amber: 'bg-amber-500 text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? activeColors[color]
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
