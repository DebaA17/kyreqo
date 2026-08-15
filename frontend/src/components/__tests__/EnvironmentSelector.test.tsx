import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvironmentSelector from '../EnvironmentSelector';

// Mock the store
vi.mock('../../store/environmentStore', () => ({
  default: () => ({
    environments: [],
    activeEnvironmentId: null,
    fetchEnvironments: vi.fn(),
    setActiveEnvironment: vi.fn(),
    isLoading: false,
  }),
}));

describe('EnvironmentSelector', () => {
  it('renders without crashing', () => {
    render(<EnvironmentSelector workspaceId="test-workspace" />);
    expect(screen.getByText('No Environment')).toBeDefined();
  });
});
