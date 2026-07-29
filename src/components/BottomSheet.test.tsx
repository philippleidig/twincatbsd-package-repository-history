import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('renders nothing while closed', () => {
    render(
      <BottomSheet open={false} title="Packages" onClose={() => {}}>
        <p>content</p>
      </BottomSheet>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders an accessible modal dialog with its content', () => {
    render(
      <BottomSheet open title="Packages" onClose={() => {}}>
        <p>content</p>
      </BottomSheet>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Packages');
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('closes via the close button, the backdrop and Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BottomSheet open title="Tools" onClose={onClose}>
        <p>content</p>
      </BottomSheet>
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('moves focus into the sheet so screen readers and keyboards follow along', () => {
    render(
      <BottomSheet open title="Tools" onClose={() => {}}>
        <p>content</p>
      </BottomSheet>
    );

    expect(screen.getByRole('dialog')).toHaveFocus();
  });
});
