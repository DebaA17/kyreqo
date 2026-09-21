import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WebSocketPanel from '../WebSocketPanel';

// Mock environmentStore
vi.mock('../../store/environmentStore', () => ({
  default: () => ({
    environments: [],
    activeEnvironmentId: null,
  }),
}));

describe('WebSocketPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders WebSocket URL input, connect button, and initial disconnected status', () => {
    render(<WebSocketPanel />);

    expect(screen.getByPlaceholderText('wss://echo.websocket.org')).toBeDefined();
    expect(screen.getByRole('button', { name: /Connect/i })).toBeDefined();
    expect(screen.getByText('Disconnected')).toBeDefined();
  });

  it('allows updating the WebSocket URL input', () => {
    render(<WebSocketPanel />);

    const input = screen.getByPlaceholderText('wss://echo.websocket.org') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'wss://test.websocket.org' } });

    expect(input.value).toBe('wss://test.websocket.org');
  });

  it('allows typing a message in the input text area', () => {
    render(<WebSocketPanel />);

    const textarea = screen.getByPlaceholderText(
      /Write text or JSON message.../i
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"hello": "world"}' } });

    expect(textarea.value).toBe('{"hello": "world"}');
  });

  it('prettifies JSON input when Prettify JSON button is clicked', () => {
    render(<WebSocketPanel />);

    const textarea = screen.getByPlaceholderText(
      /Write text or JSON message.../i
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"key":"value"}' } });

    const prettifyBtn = screen.getByRole('button', { name: /Prettify JSON/i });
    fireEvent.click(prettifyBtn);

    expect(textarea.value).toBe('{\n  "key": "value"\n}');
  });

  it('shows error message if attempting to prettify invalid JSON', () => {
    render(<WebSocketPanel />);

    const textarea = screen.getByPlaceholderText(
      /Write text or JSON message.../i
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'invalid json text' } });

    const prettifyBtn = screen.getByRole('button', { name: /Prettify JSON/i });
    fireEvent.click(prettifyBtn);

    expect(screen.getByText('Invalid JSON format')).toBeDefined();
  });
});
