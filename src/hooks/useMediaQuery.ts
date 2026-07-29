import { useState, useEffect } from 'react';

/** Everything below the Tailwind `md` breakpoint counts as a phone-sized screen. */
export const MOBILE_QUERY = '(max-width: 767px)';

function getMatch(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatch(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Re-sync in case the viewport changed between render and effect.
    setMatches(list.matches);

    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    }

    // Safari < 14 only knows the deprecated API.
    list.addListener(onChange);
    return () => list.removeListener(onChange);
  }, [query]);

  return matches;
}

/** True while the viewport is phone sized, so the app can render its touch layout. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
