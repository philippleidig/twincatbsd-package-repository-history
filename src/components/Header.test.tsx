import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { packageHistory } from '../test/fixtures';

const ACTION_LABELS = [
  'Compare Builds',
  'Update Impact Analysis',
  'Upload packages.log',
  'Switch to dark mode',
];

function setup(overrides: Partial<React.ComponentProps<typeof Header>> = {}) {
  const props = {
    theme: 'light' as const,
    onToggleTheme: vi.fn(),
    builds: packageHistory.builds,
    selectedBuild: '347903',
    onSelectBuild: vi.fn(),
    onUploadPackageLog: vi.fn(),
    onCompareBuilds: vi.fn(),
    onImpactAnalysis: vi.fn(),
    ...overrides,
  };

  render(<Header {...props} />);
  return { props, user: userEvent.setup() };
}

describe('Header (desktop)', () => {
  it('keeps every action in the header', () => {
    setup();

    for (const label of ACTION_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Send Feedback' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View on GitHub' })).toBeInTheDocument();
  });

  it('shows the build metadata next to the selector', () => {
    setup();

    expect(screen.getByText('14.4-RELEASE-p5')).toBeInTheDocument();
    expect(screen.getByLabelText('Build:')).toHaveValue('347903');
  });

  it('reports build changes', async () => {
    const { props, user } = setup();

    await user.selectOptions(screen.getByLabelText('Build:'), '334630');
    expect(props.onSelectBuild).toHaveBeenCalledWith('334630');
  });
});

describe('Header (compact / phone)', () => {
  it('drops the action buttons — they live in the bottom navigation instead', () => {
    setup({ compact: true });

    for (const label of ACTION_LABELS) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'Send Feedback' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View on GitHub' })).not.toBeInTheDocument();
  });

  it('keeps branding and a labelled build selector', () => {
    setup({ compact: true });

    expect(screen.getByAltText('TwinCAT/BSD')).toBeInTheDocument();

    const select = screen.getByLabelText('Build');
    expect(select).toHaveValue('347903');
    // Shorter option labels so the select fits a phone header.
    expect(screen.getByRole('option', { name: 'Build 347903' })).toBeInTheDocument();
  });

  it('still switches builds', async () => {
    const { props, user } = setup({ compact: true });

    await user.selectOptions(screen.getByLabelText('Build'), '334630');
    expect(props.onSelectBuild).toHaveBeenCalledWith('334630');
  });
});
