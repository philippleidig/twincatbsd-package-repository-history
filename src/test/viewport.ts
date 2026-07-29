import { vi } from 'vitest';

export const MOBILE_WIDTH = 390;
export const DESKTOP_WIDTH = 1280;

type Listener = (event: MediaQueryListEvent) => void;

interface MockMediaQueryList extends MediaQueryList {
  __listeners: Set<Listener>;
}

const lists = new Set<MockMediaQueryList>();
let currentWidth = DESKTOP_WIDTH;
let prefersDark = false;

function evaluate(query: string): boolean {
  if (query.includes('prefers-color-scheme: dark')) return prefersDark;
  if (query.includes('prefers-color-scheme: light')) return !prefersDark;

  const maxWidth = /max-width:\s*(\d+)px/.exec(query);
  if (maxWidth) return currentWidth <= Number(maxWidth[1]);

  const minWidth = /min-width:\s*(\d+)px/.exec(query);
  if (minWidth) return currentWidth >= Number(minWidth[1]);

  return false;
}

function createList(query: string): MockMediaQueryList {
  const listeners = new Set<Listener>();

  const list = {
    media: query,
    matches: evaluate(query),
    onchange: null,
    __listeners: listeners,
    addEventListener: (type: string, listener: Listener) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: Listener) => {
      if (type === 'change') listeners.delete(listener);
    },
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => true,
  } as unknown as MockMediaQueryList;

  return list;
}

function notify() {
  for (const list of lists) {
    const matches = evaluate(list.media);
    if (matches === list.matches) continue;
    (list as { matches: boolean }).matches = matches;
    const event = { matches, media: list.media } as MediaQueryListEvent;
    for (const listener of list.__listeners) listener(event);
  }
}

/** Point the mocked `matchMedia` at a phone- or desktop-sized viewport. */
export function setViewport(kind: 'mobile' | 'desktop' | number) {
  currentWidth = kind === 'mobile' ? MOBILE_WIDTH : kind === 'desktop' ? DESKTOP_WIDTH : kind;

  if (!vi.isMockFunction(window.matchMedia)) {
    window.matchMedia = vi.fn((query: string) => {
      const list = createList(query);
      lists.add(list);
      return list;
    }) as unknown as typeof window.matchMedia;
  }

  window.innerWidth = currentWidth;
  notify();
}

export function setPrefersDark(value: boolean) {
  prefersDark = value;
  notify();
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  // jsdom has no layout engine; the virtualised package list only needs the hook to exist.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
