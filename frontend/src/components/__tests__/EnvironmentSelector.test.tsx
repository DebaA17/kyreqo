import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvironmentSelector from '../EnvironmentSelector';
import { Environment } from '../../store/environmentStore';

const mockEnvironments: Environment[] = [];

// Mock the store
vi.mock('../../store/environmentStore', () => ({
  default: () => ({
    environments: mockEnvironments,
    activeEnvironmentId: null,
    fetchEnvironments: vi.fn(),
    setActiveEnvironment: vi.fn(),
    createEnvironment: vi.fn(),
    updateEnvironment: vi.fn(),
    deleteEnvironment: vi.fn(),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

describe('EnvironmentSelector', () => {
  it('renders without crashing', () => {
    render(<EnvironmentSelector workspaceId="test-workspace" />);
    expect(screen.getByText('No Environment')).toBeDefined();
  });
});
