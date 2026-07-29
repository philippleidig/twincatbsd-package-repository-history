import { useState, useMemo } from 'react';
import { PackageHistory, BuildCompareResult, BuildCompareStatus } from '../types/package';
import { compareBuilds } from '../utils/packageLogParser';

type FilterMode = 'all' | 'added' | 'deleted' | 'modified';

interface BuildCompareProps {
  history: PackageHistory;
  initialBuildA?: string;
  initialBuildB?: string;
}

export function BuildCompare({ history, initialBuildA, initialBuildB }: BuildCompareProps) {
  const sortedBuilds = useMemo(
    () => Object.entries(history.builds).sort(([a], [b]) => Number(b) - Number(a)),
    [history.builds]
  );

  const [buildA, setBuildA] = useState(initialBuildA || sortedBuilds[1]?.[0] || '');
  const [buildB, setBuildB] = useState(initialBuildB || sortedBuilds[0]?.[0] || '');
  const [results, setResults] = useState<BuildCompareResult[] | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

  const handleCompare = () => {
    if (!buildA || !buildB) return;
    setResults(compareBuilds(buildA, buildB, history));
    setFilter('all');
  };

  const stats = useMemo(() => {
    if (!results) return { added: 0, deleted: 0, modified: 0, total: 0 };
    const added = results.filter(r => r.status === 'added').length;
    const deleted = results.filter(r => r.status === 'deleted').length;
    const modified = results.filter(r => r.status === 'modified').length;
    return { added, deleted, modified, total: results.length };
  }, [results]);

  const filtered = useMemo(() => {
    if (!results) return [];
    if (filter === 'all') return results;
    return results.filter(r => r.status === filter);
  }, [results, filter]);

  const buildInfoA = history.builds[buildA];
  const buildInfoB = history.builds[buildB];

  const statusIcon = (status: BuildCompareStatus) => {
    switch (status) {
      case 'added':
        return (
          <span className="inline-flex items-center text-green-600 dark:text-green-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center text-red-600 dark:text-red-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </span>
        );
    }
  };

  const statusLabel = (status: BuildCompareStatus) => {
    switch (status) {
      case 'added': return 'Added';
      case 'deleted': return 'Deleted';
      case 'modified': return 'Modified';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Build Compare
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Compare packages between two builds
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Build Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Build A (Base)
              </label>
              <select
                value={buildA}
                onChange={(e) => setBuildA(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 min-h-11 md:min-h-0 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red"
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
                Build B (Target)
              </label>
              <select
                value={buildB}
                onChange={(e) => setBuildB(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 min-h-11 md:min-h-0 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red"
              >
                {sortedBuilds.map(([buildId, info]) => (
                  <option key={buildId} value={buildId}>
                    {buildId} ({info.release_date})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={!buildA || !buildB || buildA === buildB}
              className="w-full sm:w-auto px-5 py-2 min-h-11 md:min-h-0 rounded-lg bg-twincat-red text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare
            </button>
          </div>

          {buildA && buildB && buildA === buildB && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Please select two different builds to compare.
            </p>
          )}
        </div>

        {/* Build Info Cards */}
        {results && buildInfoA && buildInfoB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Build A (Base)
              </div>
              <div className="text-lg font-semibold text-twincat-red mb-1">{buildA}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                <div>Release: {buildInfoA.release_date}</div>
                <div>FreeBSD: {buildInfoA.freebsd_version}</div>
                <div>Packages: {buildInfoA.packages_count}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Build B (Target)
              </div>
              <div className="text-lg font-semibold text-twincat-red mb-1">{buildB}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                <div>Release: {buildInfoB.release_date}</div>
                <div>FreeBSD: {buildInfoB.freebsd_version}</div>
                <div>Packages: {buildInfoB.packages_count}</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {results && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                Added
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.added}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">new packages in Build B</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                Deleted
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.deleted}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">removed from Build B</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-300 dark:border-slate-600">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Modified
              </div>
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.modified}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">version changed</div>
            </div>
          </div>
        )}

        {/* Filter */}
        {results && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 min-h-11 md:min-h-0 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-twincat-red text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('added')}
              className={`px-4 py-1.5 min-h-11 md:min-h-0 text-sm font-medium rounded-lg transition-colors ${
                filter === 'added'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Added ({stats.added})
            </button>
            <button
              onClick={() => setFilter('deleted')}
              className={`px-4 py-1.5 min-h-11 md:min-h-0 text-sm font-medium rounded-lg transition-colors ${
                filter === 'deleted'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Deleted ({stats.deleted})
            </button>
            <button
              onClick={() => setFilter('modified')}
              className={`px-4 py-1.5 min-h-11 md:min-h-0 text-sm font-medium rounded-lg transition-colors ${
                filter === 'modified'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Modified ({stats.modified})
            </button>
          </div>
        )}

        {/* Results Table */}
        {results && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Package</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Version (Build A)</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Version (Build B)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((result) => (
                    <tr
                      key={result.name}
                      className={`border-b border-slate-100 dark:border-slate-700/50 ${
                        result.status === 'added'
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : result.status === 'deleted'
                            ? 'bg-red-50 dark:bg-red-900/10'
                            : ''
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          {statusIcon(result.status)}
                          <span className={`text-xs font-medium ${
                            result.status === 'added'
                              ? 'text-green-600 dark:text-green-400'
                              : result.status === 'deleted'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {statusLabel(result.status)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {result.name}
                      </td>
                      <td className={`px-4 py-2.5 ${
                        result.status === 'deleted'
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {result.versionA || '-'}
                      </td>
                      <td className={`px-4 py-2.5 ${
                        result.status === 'added'
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : result.status === 'modified'
                            ? 'text-slate-600 dark:text-slate-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {result.versionB || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No differences found for the selected filter.
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium mb-1">Select two builds to compare</p>
            <p className="text-sm">Choose Build A and Build B above, then click Compare.</p>
          </div>
        )}
      </div>
    </div>
  );
}
