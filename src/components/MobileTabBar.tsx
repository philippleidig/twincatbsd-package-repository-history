import { BottomSheet } from './BottomSheet';

export interface MobileTabItem {
  id: string;
  label: string;
}

interface MobileTabBarProps {
  tabs: MobileTabItem[];
  activeTabId: string | null;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  onCloseSheet: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllTabs: () => void;
}

/**
 * Phones cannot use the horizontal tab strip of the desktop layout — it scrolls
 * sideways and the targets are tiny. Instead a single bar shows the active tab
 * and opens a full list of open tabs.
 */
export function MobileTabBar({
  tabs,
  activeTabId,
  sheetOpen,
  onOpenSheet,
  onCloseSheet,
  onSelectTab,
  onCloseTab,
  onCloseAllTabs,
}: MobileTabBarProps) {
  if (tabs.length === 0) return null;

  const activeTab = tabs.find(tab => tab.id === activeTabId) || null;

  return (
    <>
      <div className="shrink-0 flex items-stretch border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <button
          onClick={onOpenSheet}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className="flex-1 min-w-0 flex items-center gap-2 px-4 min-h-12 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {tabs.length === 1 ? '1 open tab' : `${tabs.length} open tabs`}
            </span>
            <span className="block truncate font-medium text-twincat-red">
              {activeTab ? activeTab.label : 'Select a tab'}
            </span>
          </span>
          <svg className="w-5 h-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {activeTab && (
          <button
            onClick={() => onCloseTab(activeTab.id)}
            aria-label={`Close ${activeTab.label}`}
            className="flex items-center justify-center w-12 border-l border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <BottomSheet open={sheetOpen} title="Open tabs" onClose={onCloseSheet} size="auto">
        <ul className="p-2">
          {tabs.map(tab => (
            <li key={tab.id} className="flex items-stretch gap-1">
              <button
                onClick={() => onSelectTab(tab.id)}
                aria-current={tab.id === activeTabId ? 'true' : undefined}
                className={`flex-1 min-w-0 min-h-14 px-3 py-3 rounded-xl text-left truncate ${
                  tab.id === activeTabId
                    ? 'bg-twincat-red/10 font-semibold text-twincat-red'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
              <button
                onClick={() => onCloseTab(tab.id)}
                aria-label={`Close ${tab.label}`}
                className="flex items-center justify-center w-14 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCloseAllTabs}
            className="w-full min-h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Close all tabs
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
