import { useRef, useState, ReactNode } from 'react';
import { BottomSheet } from './BottomSheet';

interface MobileNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  openTabCount: number;
  onOpenPackages: () => void;
  onOpenTabs: () => void;
  onCompareBuilds: () => void;
  onImpactAnalysis: () => void;
  onUploadPackageLog: (content: string) => void;
}

/**
 * Bottom navigation for phones. The header has no room for the tool buttons,
 * so they live down here within thumb reach: package list, open tabs, the
 * analysis tools and everything else behind a "More" sheet.
 */
export function MobileNav({
  theme,
  onToggleTheme,
  openTabCount,
  onOpenPackages,
  onOpenTabs,
  onCompareBuilds,
  onImpactAnalysis,
  onUploadPackageLog,
}: MobileNavProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadPackageLog(reader.result);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    setToolsOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Main"
        className="shrink-0 grid grid-cols-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pb-[env(safe-area-inset-bottom)]"
      >
        <NavButton label="Packages" onClick={onOpenPackages}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </NavButton>

        <NavButton label="Tabs" onClick={onOpenTabs} badge={openTabCount}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h6v12H4zM14 6h6v12h-6z" />
          </svg>
        </NavButton>

        <NavButton label="Tools" onClick={() => setToolsOpen(true)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </NavButton>

        <NavButton label="More" onClick={() => setMoreOpen(true)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h.01M12 12h.01M19 12h.01" />
          </svg>
        </NavButton>
      </nav>

      <BottomSheet open={toolsOpen} title="Tools" onClose={() => setToolsOpen(false)}>
        <div className="p-2">
          <SheetItem
            label="Compare Builds"
            description="Diff the package sets of two builds"
            onClick={() => {
              setToolsOpen(false);
              onCompareBuilds();
            }}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            }
          />
          <SheetItem
            label="Impact Analysis"
            description="See which packages an update affects"
            onClick={() => {
              setToolsOpen(false);
              onImpactAnalysis();
            }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />}
          />
          <SheetItem
            label="Upload packages.log"
            description="Check an installation against a build"
            onClick={() => fileInputRef.current?.click()}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            }
          />
        </div>
      </BottomSheet>

      <BottomSheet open={moreOpen} title="More" onClose={() => setMoreOpen(false)}>
        <div className="p-2">
          <SheetItem
            label={theme === 'light' ? 'Dark mode' : 'Light mode'}
            description="Switch the colour theme"
            onClick={() => {
              onToggleTheme();
              setMoreOpen(false);
            }}
            icon={
              theme === 'light' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              )
            }
          />
          <SheetLink
            label="Send Feedback"
            description="Open an issue on GitHub"
            href="https://github.com/philippleidig/twincatbsd-package-repository-history/issues/new/choose"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            }
          />
          <SheetLink
            label="View on GitHub"
            description="philippleidig/twincatbsd-package-repository-history"
            href="https://github.com/philippleidig/twincatbsd-package-repository-history"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3a9 9 0 00-2.84 17.54c.45.08.62-.2.62-.44v-1.7c-2.5.54-3.03-1.2-3.03-1.2-.41-1.05-1-1.33-1-1.33-.82-.56.06-.55.06-.55.9.07 1.38.94 1.38.94.8 1.38 2.1.98 2.62.75.08-.58.31-.98.57-1.2-2-.23-4.1-1-4.1-4.45 0-.98.35-1.79.93-2.42-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.48.92a8.6 8.6 0 014.5 0c1.72-1.16 2.47-.92 2.47-.92.49 1.25.18 2.17.09 2.4.58.63.93 1.44.93 2.42 0 3.46-2.11 4.22-4.12 4.44.32.28.61.83.61 1.68v2.5c0 .24.16.52.62.43A9 9 0 0012 3z" />
            }
          />

          <p className="px-3 py-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 mt-2">
            This is an independent, community-driven project — not affiliated with, endorsed by, or sponsored by
            Beckhoff Automation GmbH &amp; Co. KG. "TwinCAT" and "TwinCAT/BSD" are registered trademarks of Beckhoff
            Automation GmbH &amp; Co. KG.
          </p>
        </div>
      </BottomSheet>

      <input
        ref={fileInputRef}
        type="file"
        accept=".log,.txt"
        onChange={handleFileChange}
        className="hidden"
        data-testid="mobile-package-log-input"
      />
    </>
  );
}

function NavButton({
  label,
  onClick,
  badge,
  children,
}: {
  label: string;
  onClick: () => void;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-0.5 min-h-14 py-2 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
    >
      <span className="relative">
        {children}
        {badge !== undefined && badge > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-twincat-red text-[10px] font-bold leading-4 text-white text-center"
          >
            {badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function SheetItem({
  label,
  description,
  onClick,
  icon,
}: {
  label: string;
  description: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 min-h-14 px-3 py-3 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <svg className="w-6 h-6 shrink-0 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
      <span className="min-w-0">
        <span className="block font-medium text-slate-800 dark:text-slate-100">{label}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </span>
    </button>
  );
}

function SheetLink({
  label,
  description,
  href,
  icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 min-h-14 px-3 py-3 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <svg className="w-6 h-6 shrink-0 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
      <span className="min-w-0">
        <span className="block font-medium text-slate-800 dark:text-slate-100">{label}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{description}</span>
      </span>
    </a>
  );
}
