import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ImportCurlModal from '../ImportCurlModal';

describe('ImportCurlModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ImportCurlModal isOpen={false} onClose={vi.fn()} onImport={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders input area when open', () => {
    render(<ImportCurlModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Import from cURL' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/curl -X POST/i)).toBeInTheDocument();
  });

  it('calls onImport with parsed request on valid curl command', () => {
    const onImport = vi.fn();
    const onClose = vi.fn();
    render(<ImportCurlModal isOpen={true} onClose={onClose} onImport={onImport} />);

    const textarea = screen.getByPlaceholderText(/curl -X POST/i);
    fireEvent.change(textarea, {
      target: {
        value: `curl -X POST https://api.example.com/items -H "Content-Type: application/json" -d '{"name":"item1"}'`,
      },
    });

    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/items',
        method: 'POST',
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays error message on invalid curl input', () => {
    const onImport = vi.fn();
    render(<ImportCurlModal isOpen={true} onClose={vi.fn()} onImport={onImport} />);

    const textarea = screen.getByPlaceholderText(/curl -X POST/i);
    fireEvent.change(textarea, { target: { value: 'invalid-command' } });

    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);

    expect(screen.getByText('Command must begin with "curl"')).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });
});
