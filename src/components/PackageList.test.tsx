import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackageList } from './PackageList';
import { packageHistory, packageSite } from '../test/fixtures';

function setup(overrides: Partial<React.ComponentProps<typeof PackageList>> = {}) {
  const props = {
    packages: packageSite,
    history: packageHistory,
    selectedBuild: '347903',
    selectedPackage: null,
    onSelectPackage: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    ...overrides,
  };

  render(<PackageList {...props} />);
  return { props, user: userEvent.setup() };
}

describe('PackageList', () => {
  it('renders each package as a real button so it works with touch and keyboard', () => {
    setup();

    const row = screen.getByRole('button', { name: /^gtk3/ });
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent('3.24.43');
  });

  it('reports the selected package', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: /^vim/ }));
    expect(props.onSelectPackage).toHaveBeenCalledWith('vim');
  });

  it('marks the active package for assistive technology', () => {
    setup({ selectedPackage: 'gtk3' });

    expect(screen.getByRole('button', { name: /^gtk3/ })).toHaveAttribute('aria-current', 'true');
  });

  it('uses taller rows when a touch row height is requested', () => {
    const { props } = setup({ rowHeight: 60 });
    expect(props.rowHeight).toBe(60);

    expect(screen.getByRole('button', { name: /^gtk3/ })).toHaveStyle({ height: '60px' });
  });

  it('falls back to the compact desktop row height', () => {
    setup();
    expect(screen.getByRole('button', { name: /^gtk3/ })).toHaveStyle({ height: '48px' });
  });

  it('marks packages that are missing from the selected build', () => {
    setup({ selectedBuild: '334630' });

    // cairo only exists in build 347903.
    expect(screen.getByRole('button', { name: /^cairo/ })).toHaveTextContent('N/A');
  });
});
