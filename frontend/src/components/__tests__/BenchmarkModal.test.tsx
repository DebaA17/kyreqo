import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BenchmarkModal from '../BenchmarkModal';

vi.mock('../../store/environmentStore', () => ({
  default: () => ({
    environments: [],
    activeEnvironmentId: null,
  }),
}));

describe('BenchmarkModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BenchmarkModal
        isOpen={false}
        onClose={vi.fn()}
        url="https://api.example.com"
        method="GET"
        headers={[]}
        body=""
        currentWorkspaceId="ws-1"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal controls and target URL when isOpen is true', () => {
    render(
      <BenchmarkModal
        isOpen={true}
        onClose={vi.fn()}
        url="https://api.example.com/test"
        method="GET"
        headers={[]}
        body=""
        currentWorkspaceId="ws-1"
      />
    );

    expect(screen.getByText('API Latency & Performance Benchmarker')).toBeDefined();
    expect(screen.getByText(/Run Benchmark/i)).toBeDefined();
    expect(screen.getByText(/api\.example\.com\/test/i)).toBeDefined();
  });

  it('allows changing iteration selection', () => {
    render(
      <BenchmarkModal
        isOpen={true}
        onClose={vi.fn()}
        url="https://api.example.com/test"
        method="GET"
        headers={[]}
        body=""
        currentWorkspaceId="ws-1"
      />
    );

    const btn20 = screen.getByRole('button', { name: '20' });
    fireEvent.click(btn20);

    expect(screen.getByText(/Run Benchmark \(20 Requests\)/i)).toBeDefined();
  });
});
