import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useIsMobile, useMediaQuery } from './useMediaQuery';
import { setViewport } from '../test/viewport';

function Probe() {
  const isMobile = useIsMobile();
  const isWide = useMediaQuery('(min-width: 1024px)');
  return (
    <div>
      <span data-testid="mobile">{String(isMobile)}</span>
      <span data-testid="wide">{String(isWide)}</span>
    </div>
  );
}

describe('useMediaQuery', () => {
  it('reports the desktop viewport', () => {
    setViewport('desktop');
    render(<Probe />);

    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
    expect(screen.getByTestId('wide')).toHaveTextContent('true');
  });

  it('reports a phone viewport', () => {
    setViewport('mobile');
    render(<Probe />);

    expect(screen.getByTestId('mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('wide')).toHaveTextContent('false');
  });

  it('reacts when the viewport changes while mounted', () => {
    setViewport('desktop');
    render(<Probe />);
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');

    act(() => setViewport('mobile'));
    expect(screen.getByTestId('mobile')).toHaveTextContent('true');

    act(() => setViewport('desktop'));
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
  });

  it('treats the md breakpoint as the mobile boundary', () => {
    setViewport(767);
    const { unmount } = render(<Probe />);
    expect(screen.getByTestId('mobile')).toHaveTextContent('true');
    unmount();

    setViewport(768);
    render(<Probe />);
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
  });
});
