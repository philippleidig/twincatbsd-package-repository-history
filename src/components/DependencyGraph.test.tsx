import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DependencyGraph } from './DependencyGraph';
import { packageSite } from '../test/fixtures';
import { buildReverseDependencyIndex } from '../utils/dependencyResolver';

const reverseIndex = buildReverseDependencyIndex(packageSite);

function setup(overrides: Partial<React.ComponentProps<typeof DependencyGraph>> = {}) {
  const props = {
    rootPackage: 'gtk3',
    packages: packageSite,
    reverseIndex,
    onOpenPackageTab: vi.fn(),
    ...overrides,
  };

  render(<DependencyGraph {...props} />);
  return { props, user: userEvent.setup() };
}

describe('DependencyGraph on phones', () => {
  it('renders the list view instead of the drag-and-drop canvas', () => {
    setup({ isMobile: true });

    expect(screen.getByTestId('dependency-graph-list')).toBeInTheDocument();
    expect(screen.queryByTestId('dependency-graph-canvas')).not.toBeInTheDocument();
  });

  it('lists dependencies and dependents with their versions', () => {
    setup({ isMobile: true });

    const dependencies = screen.getByRole('heading', { name: /Dependencies/ }).closest('section')!;
    expect(dependencies).toHaveTextContent('glib');
    expect(dependencies).toHaveTextContent('2.80.0');
    expect(dependencies).toHaveTextContent('cairo');

    const dependents = screen.getByRole('heading', { name: /Dependents/ }).closest('section')!;
    expect(dependents).toHaveTextContent('vim');
  });

  it('re-centers on a tapped entry', async () => {
    const { user } = setup({ isMobile: true });

    await user.click(screen.getByRole('button', { name: /^glib/ }));

    // glib is now the focus, so gtk3 shows up as its dependent.
    const dependents = screen.getByRole('heading', { name: /Dependents/ }).closest('section')!;
    expect(dependents).toHaveTextContent('gtk3');
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
  });

  it('opens an entry in its own tab', async () => {
    const { props, user } = setup({ isMobile: true });

    await user.click(screen.getByRole('button', { name: 'Open cairo' }));
    expect(props.onOpenPackageTab).toHaveBeenCalledWith('cairo');
  });

  it('can switch to the graph and back to the list', async () => {
    const { user } = setup({ isMobile: true });

    await user.click(screen.getByRole('button', { name: 'Graph' }));
    expect(screen.getByTestId('dependency-graph-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('dependency-graph-list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByTestId('dependency-graph-list')).toBeInTheDocument();
  });

  it('explains the touch interaction rather than dragging and zooming', () => {
    setup({ isMobile: true });

    expect(screen.getByText(/Tap an entry to re-center/)).toBeInTheDocument();
    expect(screen.queryByText(/Drag to rearrange/)).not.toBeInTheDocument();
  });

  it('says so when a package has no relations at all', () => {
    setup({ isMobile: true, rootPackage: 'cairo', reverseIndex: new Map() });

    expect(screen.getByText('cairo has no dependencies and no dependents.')).toBeInTheDocument();
  });
});

describe('DependencyGraph on desktop', () => {
  it('defaults to the graph canvas', () => {
    setup();

    expect(screen.getByTestId('dependency-graph-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('dependency-graph-list')).not.toBeInTheDocument();
  });

  it('offers the list view as an alternative', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByTestId('dependency-graph-list')).toBeInTheDocument();
  });
});
