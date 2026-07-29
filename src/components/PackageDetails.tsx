import { useMemo } from 'react';
import { Package, PackageSite, PackageHistory } from '../types/package';
import { DependencyTree } from './DependencyTree';
import { resolveDependencyTree, countTotalDependencies } from '../utils/dependencyResolver';

interface PackageDetailsProps {
  pkg: Package | null;
  packages: PackageSite;
  history: PackageHistory;
  selectedBuild: string;
  onOpenPackageTab?: (packageName: string) => void;
  onOpenGraph?: (packageName: string) => void;
  onOpenReverse?: (packageName: string) => void;
  onOpenImpact?: (packageName: string) => void;
}

export function PackageDetails({ pkg, packages, history, selectedBuild, onOpenPackageTab, onOpenGraph, onOpenReverse, onOpenImpact }: PackageDetailsProps) {
  const dependencyTree = useMemo(() => {
    if (!pkg) return [];
    return resolveDependencyTree(pkg.name, packages);
  }, [pkg, packages]);

  const totalDeps = useMemo(() => countTotalDependencies(dependencyTree), [dependencyTree]);

  if (!pkg) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>Select a package to view details</p>
        </div>
      </div>
    );
  }

  const versionHistory = history.packages[pkg.name]?.versions || {};
  const sortedBuilds = Object.keys(history.builds).sort((a, b) => Number(b) - Number(a));

  const hasDependencies = dependencyTree.length > 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1 break-all">
          {pkg.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 md:line-clamp-none">
          {pkg.comment}
        </p>
        <div className="flex flex-wrap gap-2">
          {onOpenGraph && (
            <button
              onClick={() => onOpenGraph(pkg.name)}
              aria-label="Dependency Graph"
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-11 md:min-h-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a3 3 0 11-6 0 3 3 0 016 0zM18 11a2 2 0 100-4 2 2 0 000 4zM18 17a2 2 0 100-4 2 2 0 000 4zM6 19a2 2 0 100-4 2 2 0 000 4zM10 9.5L16 7m-6 5l6 2m-9 .5l2-2" />
              </svg>
              <span className="sm:hidden">Graph</span>
              <span className="hidden sm:inline">Dependency Graph</span>
            </button>
          )}
          {onOpenReverse && (
            <button
              onClick={() => onOpenReverse(pkg.name)}
              aria-label="Reverse Dependencies"
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-11 md:min-h-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="sm:hidden">Used by</span>
              <span className="hidden sm:inline">Reverse Dependencies</span>
            </button>
          )}
          {onOpenImpact && (
            <button
              onClick={() => onOpenImpact(pkg.name)}
              aria-label="Impact Analysis"
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-11 md:min-h-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="sm:hidden">Impact</span>
              <span className="hidden sm:inline">Impact Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">

      {/* Two-column layout when dependencies exist */}
      <div className={`flex gap-6 ${hasDependencies ? 'flex-col xl:flex-row' : ''}`}>
        {/* Left column - Package info */}
        <div className={hasDependencies ? 'xl:w-1/2 min-w-0' : 'max-w-3xl'}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Current Version
              </div>
              <div className="text-lg font-semibold text-twincat-red">
                {versionHistory[selectedBuild] || 'N/A'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Dependencies
              </div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {Object.keys(pkg.deps || {}).length} direct / {totalDeps} total
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Details</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row">
                <span className="w-28 shrink-0 font-medium text-slate-500 dark:text-slate-400">Maintainer</span>
                <a href={`mailto:${pkg.maintainer}`} className="text-twincat-red hover:underline">
                  {pkg.maintainer}
                </a>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-28 shrink-0 font-medium text-slate-500 dark:text-slate-400">Origin</span>
                <span className="text-slate-700 dark:text-slate-300 break-all">{pkg.origin}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-28 shrink-0 font-medium text-slate-500 dark:text-slate-400">Architecture</span>
                <span className="text-slate-700 dark:text-slate-300">{pkg.arch}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-28 shrink-0 font-medium text-slate-500 dark:text-slate-400">License</span>
                <span className="text-slate-700 dark:text-slate-300">{pkg.licenses?.join(', ') || 'N/A'}</span>
              </div>
              {pkg.www && (
                <div className="flex flex-col sm:flex-row">
                  <span className="w-28 shrink-0 font-medium text-slate-500 dark:text-slate-400">Website</span>
                  <a href={pkg.www} target="_blank" rel="noopener noreferrer" className="text-twincat-red hover:underline break-all">
                    {pkg.www}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Version History</h2>
            </div>
            <div className="p-4">
              <div className="max-h-64 overflow-auto">
                <table className="w-full min-w-[20rem] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-medium">Build</th>
                      <th className="pb-2 font-medium">Release Date</th>
                      <th className="pb-2 font-medium">Version</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-300">
                    {sortedBuilds.map((buildId) => {
                      const version = versionHistory[buildId];
                      const buildInfo = history.builds[buildId];
                      const isCurrentBuild = buildId === selectedBuild;

                      return (
                        <tr
                          key={buildId}
                          className={isCurrentBuild ? 'bg-twincat-red/5' : ''}
                        >
                          <td className={`py-1.5 ${isCurrentBuild ? 'font-semibold text-twincat-red' : ''}`}>
                            {buildId}
                          </td>
                          <td className="py-1.5">{buildInfo.release_date}</td>
                          <td className={`py-1.5 ${version ? '' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                            {version || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {pkg.desc && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Description</h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {pkg.desc}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Dependency Tree (only shown when dependencies exist) */}
        {hasDependencies && (
          <div className="xl:w-1/2 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-0">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                  Dependency Tree
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({totalDeps} total)
                  </span>
                </h2>
              </div>
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-auto">
                <DependencyTree nodes={dependencyTree} onOpenPackage={onOpenPackageTab} />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
