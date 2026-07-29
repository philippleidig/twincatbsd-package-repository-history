import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileTabBar } from './MobileTabBar';

const tabs = [
  { id: 'tab-1', label: 'gtk3' },
  { id: 'tab-2', label: 'Build Compare' },
  { id: 'tab-3', label: 'Graph: gtk3' },
];

function setup(overrides: Partial<React.ComponentProps<typeof MobileTabBar>> = {}) {
  const props = {
    tabs,
    activeTabId: 'tab-2',
    sheetOpen: false,
    onOpenSheet: vi.fn(),
    onCloseSheet: vi.fn(),
    onSelectTab: vi.fn(),
    onCloseTab: vi.fn(),
    onCloseAllTabs: vi.fn(),
    ...overrides,
  };

  const view = render(<MobileTabBar {...props} />);
  return { props, user: userEvent.setup(), view };
}

describe('MobileTabBar', () => {
  it('renders nothing without open tabs', () => {
    const { view } = setup({ tabs: [], activeTabId: null });
    expect(view.container).toBeEmptyDOMElement();
  });

  it('shows the active tab and the number of open tabs instead of a scrolling strip', () => {
    setup();

    expect(screen.getByText('3 open tabs')).toBeInTheDocument();
    expect(screen.getByText('Build Compare')).toBeInTheDocument();
    // The inactive tabs are not rendered as competing targets.
    expect(screen.queryByText('Graph: gtk3')).not.toBeInTheDocument();
  });

  it('uses the singular label for a single tab', () => {
    setup({ tabs: [tabs[0]], activeTabId: 'tab-1' });
    expect(screen.getByText('1 open tab')).toBeInTheDocument();
  });

  it('opens the tab sheet when the bar is tapped', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { expanded: false }));
    expect(props.onOpenSheet).toHaveBeenCalledTimes(1);
  });

  it('closes the active tab straight from the bar', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Close Build Compare' }));
    expect(props.onCloseTab).toHaveBeenCalledWith('tab-2');
  });

  it('lists every open tab in the sheet and marks the active one', async () => {
    setup({ sheetOpen: true });

    const sheet = await screen.findByRole('dialog', { name: 'Open tabs' });
    expect(sheet).toBeInTheDocument();

    for (const tab of tabs) {
      expect(screen.getByRole('button', { name: tab.label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Build Compare' })).toHaveAttribute('aria-current', 'true');
  });

  it('switches to a tab picked from the sheet', async () => {
    const { props, user } = setup({ sheetOpen: true });

    await user.click(screen.getByRole('button', { name: 'Graph: gtk3' }));
    expect(props.onSelectTab).toHaveBeenCalledWith('tab-3');
  });

  it('closes a single tab and all tabs from the sheet', async () => {
    const { props, user } = setup({ sheetOpen: true });

    await user.click(screen.getByRole('button', { name: 'Close gtk3' }));
    expect(props.onCloseTab).toHaveBeenCalledWith('tab-1');

    await user.click(screen.getByRole('button', { name: 'Close all tabs' }));
    expect(props.onCloseAllTabs).toHaveBeenCalledTimes(1);
  });
});
