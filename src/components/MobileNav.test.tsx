import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNav } from './MobileNav';

function setup(overrides: Partial<React.ComponentProps<typeof MobileNav>> = {}) {
  const props = {
    theme: 'light' as const,
    onToggleTheme: vi.fn(),
    openTabCount: 0,
    onOpenPackages: vi.fn(),
    onOpenTabs: vi.fn(),
    onCompareBuilds: vi.fn(),
    onImpactAnalysis: vi.fn(),
    onUploadPackageLog: vi.fn(),
    ...overrides,
  };

  render(<MobileNav {...props} />);
  return { props, user: userEvent.setup() };
}

describe('MobileNav', () => {
  it('exposes the four primary destinations', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();
    for (const label of ['Packages', 'Tabs', 'Tools', 'More']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('opens the package list and the tab list through callbacks', async () => {
    const { props, user } = setup({ openTabCount: 2 });

    await user.click(screen.getByRole('button', { name: /Packages/ }));
    expect(props.onOpenPackages).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Tabs/ }));
    expect(props.onOpenTabs).toHaveBeenCalledTimes(1);
  });

  it('shows the number of open tabs on the tabs button', () => {
    setup({ openTabCount: 3 });
    expect(screen.getByRole('button', { name: /Tabs/ })).toHaveTextContent('3');
  });

  it('keeps the analysis tools in the Tools sheet, not in the header', async () => {
    const { props, user } = setup();

    expect(screen.queryByRole('button', { name: 'Compare Builds' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tools/ }));
    const sheet = screen.getByRole('dialog', { name: 'Tools' });
    expect(sheet).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Compare Builds/ }));
    expect(props.onCompareBuilds).toHaveBeenCalledTimes(1);
    // Acting on a tool closes the sheet again.
    expect(screen.queryByRole('dialog', { name: 'Tools' })).not.toBeInTheDocument();
  });

  it('triggers the impact analysis from the Tools sheet', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: /Tools/ }));
    await user.click(screen.getByRole('button', { name: /Impact Analysis/ }));

    expect(props.onImpactAnalysis).toHaveBeenCalledTimes(1);
  });

  it('reads an uploaded packages.log and hands the content over', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: /Tools/ }));
    const input = screen.getByTestId('mobile-package-log-input');
    const file = new File(['gtk3-3.24.43 Gimp Toolkit'], 'packages.log', { type: 'text/plain' });

    await user.upload(input as HTMLInputElement, file);

    await vi.waitFor(() => {
      expect(props.onUploadPackageLog).toHaveBeenCalledWith('gtk3-3.24.43 Gimp Toolkit');
    });
  });

  it('offers theme switching, feedback and the repository in the More sheet', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: /More/ }));
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Send Feedback/ })).toHaveAttribute(
      'href',
      'https://github.com/philippleidig/twincatbsd-package-repository-history/issues/new/choose'
    );
    expect(screen.getByRole('link', { name: /View on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/philippleidig/twincatbsd-package-repository-history'
    );

    await user.click(screen.getByRole('button', { name: /Dark mode/ }));
    expect(props.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('keeps the trademark disclaimer reachable from the More sheet', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /More/ }));

    expect(screen.getByText(/independent, community-driven project/)).toBeInTheDocument();
  });
});
