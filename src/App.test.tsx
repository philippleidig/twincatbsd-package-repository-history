import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { mockPackageDataFetch } from './test/fixtures';
import { setViewport } from './test/viewport';

async function renderApp(kind: 'mobile' | 'desktop') {
  setViewport(kind);
  mockPackageDataFetch();
  const user = userEvent.setup();
  render(<App />);
  await screen.findByAltText('TwinCAT/BSD');
  return { user };
}

/** Open the package list (bottom sheet on phones) and pick a package. */
async function openPackage(user: ReturnType<typeof userEvent.setup>, name: string) {
  const packagesButton = screen.queryByRole('button', { name: /Packages/ });
  if (packagesButton) await user.click(packagesButton);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App on phones', () => {
  it('renders the phone shell with a bottom navigation', async () => {
    await renderApp('mobile');

    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('keeps the header free of action buttons', async () => {
    await renderApp('mobile');

    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('button', { name: 'Compare Builds' })).not.toBeInTheDocument();
    expect(within(header).queryByRole('button', { name: 'Upload packages.log' })).not.toBeInTheDocument();
    expect(within(header).queryByRole('link', { name: 'View on GitHub' })).not.toBeInTheDocument();
    // Branding and the build selector do stay.
    expect(within(header).getByAltText('TwinCAT/BSD')).toBeInTheDocument();
    expect(within(header).getByLabelText('Build')).toHaveValue('347903');
  });

  it('never renders the desktop sidebar or the horizontal tab strip', async () => {
    const { user } = await renderApp('mobile');

    expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
    // The package list is only present once the sheet is opened.
    expect(screen.queryByPlaceholderText('Search packages...')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Packages/ }));
    expect(await screen.findByRole('dialog', { name: 'Packages' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();
  });

  it('opens a package from the sheet, closes the sheet and shows the details', async () => {
    const { user } = await renderApp('mobile');

    await openPackage(user, 'gtk3');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Packages' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'gtk3', level: 1 })).toBeInTheDocument();
  });

  it('searches the package list inside the sheet', async () => {
    const { user } = await renderApp('mobile');

    await user.click(screen.getByRole('button', { name: /Packages/ }));
    await user.type(screen.getByPlaceholderText('Search packages...'), 'vim');

    expect(screen.getByRole('button', { name: /^vim/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^gtk3/ })).not.toBeInTheDocument();
  });

  it('shows one tab at a time and switches through the tab sheet', async () => {
    const { user } = await renderApp('mobile');

    await openPackage(user, 'gtk3');
    await openPackage(user, 'vim');

    expect(screen.getByText('2 open tabs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'vim', level: 1 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tabs/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Open tabs' });
    await user.click(within(sheet).getByRole('button', { name: 'gtk3' }));

    expect(screen.getByRole('heading', { name: 'gtk3', level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Open tabs' })).not.toBeInTheDocument();
    });
  });

  it('closes tabs from the bar and closes all of them from the sheet', async () => {
    const { user } = await renderApp('mobile');

    await openPackage(user, 'gtk3');
    await openPackage(user, 'vim');

    await user.click(screen.getByRole('button', { name: 'Close vim' }));
    expect(screen.getByText('1 open tab')).toBeInTheDocument();

    await openPackage(user, 'glib');
    await user.click(screen.getByRole('button', { name: /Tabs/ }));
    await user.click(screen.getByRole('button', { name: 'Close all tabs' }));

    expect(screen.queryByText(/open tabs?/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse packages' })).toBeInTheDocument();
  });

  it('opens Build Compare from the bottom navigation tools', async () => {
    const { user } = await renderApp('mobile');

    await user.click(screen.getByRole('button', { name: /Tools/ }));
    await user.click(screen.getByRole('button', { name: /Compare Builds/ }));

    expect(screen.getByRole('heading', { name: 'Build Compare', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1 open tab')).toBeInTheDocument();
  });

  it('opens the impact analysis from the bottom navigation tools', async () => {
    const { user } = await renderApp('mobile');

    await user.click(screen.getByRole('button', { name: /Tools/ }));
    await user.click(screen.getByRole('button', { name: /Impact Analysis/ }));

    expect(screen.getByRole('heading', { name: /Update Impact Analysis/, level: 1 })).toBeInTheDocument();
  });

  it('toggles the theme from the More sheet', async () => {
    const { user } = await renderApp('mobile');

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', { name: /More/ }));
    await user.click(screen.getByRole('button', { name: /Dark mode/ }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('shows the dependency graph as a list', async () => {
    const { user } = await renderApp('mobile');

    await openPackage(user, 'gtk3');
    await user.click(screen.getByRole('button', { name: 'Dependency Graph' }));

    expect(screen.getByTestId('dependency-graph-list')).toBeInTheDocument();
    expect(screen.queryByTestId('dependency-graph-canvas')).not.toBeInTheDocument();
  });

  it('offers a starting point while no tab is open', async () => {
    const { user } = await renderApp('mobile');

    await user.click(screen.getByRole('button', { name: 'Browse packages' }));
    expect(await screen.findByRole('dialog', { name: 'Packages' })).toBeInTheDocument();
  });
});

describe('App on desktop', () => {
  it('renders the sidebar, the header actions and the tab strip', async () => {
    const { user } = await renderApp('desktop');

    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare Builds' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();

    await openPackage(user, 'gtk3');
    expect(screen.getByRole('button', { name: 'Close gtk3' })).toBeInTheDocument();
  });

  it('keeps the disclaimer in the footer', async () => {
    await renderApp('desktop');

    expect(screen.getByRole('contentinfo')).toHaveTextContent(/independent, community-driven project/);
  });
});

describe('App switching between layouts', () => {
  it('swaps the shell when the viewport changes and closes phone sheets', async () => {
    const { user } = await renderApp('mobile');

    await user.click(screen.getByRole('button', { name: /Packages/ }));
    expect(await screen.findByRole('dialog', { name: 'Packages' })).toBeInTheDocument();

    act(() => setViewport('desktop'));

    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Packages' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare Builds' })).toBeInTheDocument();

    act(() => setViewport('mobile'));
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });

  it('keeps the open tabs when the layout changes', async () => {
    const { user } = await renderApp('mobile');

    await openPackage(user, 'gtk3');
    act(() => setViewport('desktop'));

    expect(screen.getByRole('button', { name: 'Close gtk3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'gtk3', level: 1 })).toBeInTheDocument();
  });
});
