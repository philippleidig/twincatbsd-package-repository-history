import { useEffect, useRef, ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** `auto` hugs the content (max 80% of the viewport), `full` uses most of the screen. */
  size?: 'auto' | 'full';
}

/**
 * Slide-up panel used for every secondary surface on phones: the package list,
 * the open tabs and the action menus that no longer fit into the header.
 */
export function BottomSheet({ open, title, onClose, children, size = 'auto' }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        data-testid="bottom-sheet-backdrop"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex flex-col w-full rounded-t-2xl bg-white dark:bg-slate-800 shadow-xl outline-none ${
          size === 'full' ? 'h-[85vh]' : 'max-h-[80vh]'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="block w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
