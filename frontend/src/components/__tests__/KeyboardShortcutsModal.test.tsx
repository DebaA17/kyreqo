import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import KeyboardShortcutsModal from '../KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('lists the supported keyboard shortcuts when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.getByText('Send the current HTTP request')).toBeInTheDocument();
    expect(screen.getByText('Toggle between History and Collections')).toBeInTheDocument();
    expect(screen.getByText('Open this keyboard shortcuts guide')).toBeInTheDocument();
    expect(screen.getByText('Ctrl/Cmd + Enter')).toBeInTheDocument();
  });

  it('closes from the close button or backdrop, but not the dialog content', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close keyboard shortcuts' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
