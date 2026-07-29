import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackageDetails } from './PackageDetails';
import { packageHistory, packageSite } from '../test/fixtures';

function setup(overrides: Partial<React.ComponentProps<typeof PackageDetails>> = {}) {
  const props = {
    pkg: packageSite.gtk3,
    packages: packageSite,
    history: packageHistory,
    selectedBuild: '347903',
    onOpenPackageTab: vi.fn(),
    onOpenGraph: vi.fn(),
    onOpenReverse: vi.fn(),
    onOpenImpact: vi.fn(),
    ...overrides,
  };

  render(<PackageDetails {...props} />);
  return { props, user: userEvent.setup() };
}

describe('PackageDetails', () => {
  it('prompts for a selection when no package is active', () => {
    setup({ pkg: null });
    expect(screen.getByText('Select a package to view details')).toBeInTheDocument();
  });

  it('keeps stable accessible names while shortening the visible labels for phones', () => {
    setup();

    const graph = screen.getByRole('button', { name: 'Dependency Graph' });
    // Short label for narrow screens, long label from `sm` upwards.
    expect(graph).toHaveTextContent('Graph');
    expect(graph).toHaveTextContent('Dependency Graph');

    expect(screen.getByRole('button', { name: 'Reverse Dependencies' })).toHaveTextContent('Used by');
    expect(screen.getByRole('button', { name: 'Impact Analysis' })).toHaveTextContent('Impact');
  });

  it('routes the three actions to their callbacks', async () => {
    const { props, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Dependency Graph' }));
    await user.click(screen.getByRole('button', { name: 'Reverse Dependencies' }));
    await user.click(screen.getByRole('button', { name: 'Impact Analysis' }));

    expect(props.onOpenGraph).toHaveBeenCalledWith('gtk3');
    expect(props.onOpenReverse).toHaveBeenCalledWith('gtk3');
    expect(props.onOpenImpact).toHaveBeenCalledWith('gtk3');
  });

  it('shows the version for the selected build and the dependency counts', () => {
    setup();

    // Once in the summary card and once in the version history table.
    expect(screen.getAllByText('3.24.43')).toHaveLength(2);
    expect(screen.getByText('2 direct / 2 total')).toBeInTheDocument();
  });

  it('renders the version history with one row per build', () => {
    setup();

    const table = screen.getByRole('table');
    expect(within(table).getByText('334630')).toBeInTheDocument();
    expect(within(table).getByText('3.24.42')).toBeInTheDocument();
  });
});
