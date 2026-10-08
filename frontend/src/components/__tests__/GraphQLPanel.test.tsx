import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GraphQLPanel from '../GraphQLPanel';

vi.mock('../../store/environmentStore', () => ({
  default: () => ({
    environments: [],
    activeEnvironmentId: null,
  }),
}));

vi.mock('../../store/workspaceStore', () => ({
  default: () => ({
    currentWorkspaceId: null,
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    accessToken: null,
  }),
}));

describe('GraphQLPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GraphQL URL input, Run Query button, and initial state', () => {
    render(<GraphQLPanel />);

    expect(screen.getByPlaceholderText('https://api.example.com/graphql')).toBeDefined();
    expect(screen.getByRole('button', { name: /Run Query/i })).toBeDefined();
    expect(
      screen.getByText('Compose a query and click "Run Query" to inspect the GraphQL response.')
    ).toBeDefined();
  });

  it('allows updating the GraphQL URL input', () => {
    render(<GraphQLPanel />);

    const input = screen.getByPlaceholderText(
      'https://api.example.com/graphql'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://api.spacex.land/graphql' } });

    expect(input.value).toBe('https://api.spacex.land/graphql');
  });

  it('allows switching between Variables and Headers tabs', () => {
    render(<GraphQLPanel />);

    const headersTab = screen.getByRole('button', { name: /Headers \(JSON\)/i });
    fireEvent.click(headersTab);

    expect(screen.getByPlaceholderText('{ "Authorization": "Bearer ..." }')).toBeDefined();

    const variablesTab = screen.getByRole('button', { name: /Variables \(JSON\)/i });
    fireEvent.click(variablesTab);

    expect(screen.getByPlaceholderText('{ "id": "1" }')).toBeDefined();
  });

  it('prettifies JSON input when Prettify button is clicked', () => {
    render(<GraphQLPanel />);

    const textarea = screen.getByPlaceholderText('{ "id": "1" }') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"limit":10}' } });

    const prettifyBtn = screen.getByRole('button', { name: /Prettify/i });
    fireEvent.click(prettifyBtn);

    expect(textarea.value).toBe('{\n  "limit": 10\n}');
  });
});
