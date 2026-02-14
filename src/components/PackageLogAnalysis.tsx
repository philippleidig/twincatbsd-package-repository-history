import { useState, useMemo } from 'react';
import { PackageCheckResult, PackageHistory } from '../types/package';

type FilterMode = 'all' | 'mismatch' | 'not_found';

interface PackageLogAnalysisProps {
  results: PackageCheckResult[];
  buildId: string;
  history: PackageHistory;
}

export function PackageLogAnalysis({ results, buildId, history }: PackageLogAnalysisProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const buildInfo = history.builds[buildId];

  const stats = useMemo(() => {
    const match = results.filter(r => r.status === 'match').length;
    const mismatch = results.filter(r => r.status === 'mismatch').length;
    const notFound = results.filter(r => r.status === 'not_found').length;
    return { match, mismatch, notFound, total: results.length };
  }, [results]);

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter(r => r.status === filter);
  }, [results, filter]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Package Log Analysis
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Consistency check against build {buildId}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Build Info */}
        {buildInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Build
              </div>
              <div className="text-lg font-semibold text-twincat-red">{buildId}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Release Date
              </div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{buildInfo.release_date}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                FreeBSD Version
              </div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{buildInfo.freebsd_version}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Packages in Build
              </div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{buildInfo.packages_count}</div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
              Consistent
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.match}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">of {stats.total} packages</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
              Mismatch
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.mismatch}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">version differs</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              Not Found
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.notFound}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">not in build history</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-twincat-red text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('mismatch')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'mismatch'
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Mismatch ({stats.mismatch})
          </button>
          <button
            onClick={() => setFilter('not_found')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'not_found'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Not Found ({stats.notFound})
          </button>
        </div>

        {/* Package Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Package</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Installed Version</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Expected Version</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((result) => (
                  <tr
                    key={result.name}
                    className={`border-b border-slate-100 dark:border-slate-700/50 ${
                      result.status === 'mismatch'
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : result.status === 'not_found'
                          ? 'bg-amber-50 dark:bg-amber-900/10'
                          : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {result.status === 'match' && (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      {result.status === 'mismatch' && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                      {result.status === 'not_found' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {result.name}
                    </td>
                    <td className={`px-4 py-2.5 ${
                      result.status === 'mismatch' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {result.installedVersion}
                    </td>
                    <td className={`px-4 py-2.5 ${
                      result.status === 'mismatch' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {result.expectedVersion || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {result.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
