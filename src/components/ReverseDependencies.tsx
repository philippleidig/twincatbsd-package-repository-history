import { useMemo } from 'react';
import { PackageSite } from '../types/package';
import { DependencyTree } from './DependencyTree';
import {
  resolveReverseDependencyTree,
  collectReverseDependencyClosure,
} from '../utils/dependencyResolver';

interface ReverseDependenciesProps {
  packageName: string;
  packages: PackageSite;
  reverseIndex: Map<string, string[]>;
  onOpenPackageTab?: (packageName: string) => void;
}

export function ReverseDependencies({ packageName, packages, reverseIndex, onOpenPackageTab }: ReverseDependenciesProps) {
  const directDependents = useMemo(
    () => reverseIndex.get(packageName) || [],
    [reverseIndex, packageName]
  );

  const reverseTree = useMemo(
    () => resolveReverseDependencyTree(packageName, reverseIndex, packages),
    [packageName, reverseIndex, packages]
  );

  const totalDependents = useMemo(
    () => collectReverseDependencyClosure(packageName, reverseIndex).size,
    [packageName, reverseIndex]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1 break-all">
          Reverse Dependencies
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Packages that depend on <span className="font-semibold text-twincat-red">{packageName}</span>
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Direct Dependents
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {directDependents.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">depend on it directly</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Total Affected
            </div>
            <div className="text-2xl font-bold text-twincat-red">
              {totalDependents}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">depend on it directly or transitively</div>
          </div>
        </div>

        {directDependents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-lg font-medium mb-1">No packages depend on {packageName}</p>
            <p className="text-sm">This package is not used as a dependency by any other package.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                Dependent Tree
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  (double-click to open a package)
                </span>
              </h2>
            </div>
            <div className="p-4">
              <DependencyTree nodes={reverseTree} onOpenPackage={onOpenPackageTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
