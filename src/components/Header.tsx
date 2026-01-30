import { BuildInfo } from '../types/package';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  builds: Record<string, BuildInfo>;
  selectedBuild: string;
  onSelectBuild: (buildId: string) => void;
}

export function Header({ theme, onToggleTheme, builds, selectedBuild, onSelectBuild }: HeaderProps) {
  const sortedBuilds = Object.entries(builds).sort(([a], [b]) => Number(b) - Number(a));
  const currentBuild = builds[selectedBuild];

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <img
          src="./images/twincatbsd.svg"
          alt="TwinCAT/BSD"
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <label htmlFor="build-select" className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Build:
          </label>
          <select
            id="build-select"
            value={selectedBuild}
            onChange={(e) => onSelectBuild(e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-twincat-red"
          >
            {sortedBuilds.map(([buildId, info]) => (
              <option key={buildId} value={buildId}>
                {buildId} ({info.release_date})
              </option>
            ))}
          </select>
        </div>

        {currentBuild && (
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>
              <span className="font-medium">FreeBSD:</span> {currentBuild.freebsd_version}
            </span>
            <span>
              <span className="font-medium">Packages:</span> {currentBuild.packages_count}
            </span>
          </div>
        )}

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        <a
          href="https://github.com/philippleidig/twincatbsd-package-repository-history/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-600 dark:text-slate-300"
          aria-label="Send Feedback"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline">Feedback</span>
        </a>

        <a
          href="https://github.com/philippleidig/twincatbsd-package-repository-history"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label="View on GitHub"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
