import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Wifi,
  WifiOff,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react';
import useEnvironmentStore from '../store/environmentStore';
import { substituteVariables, getActiveVariables } from '../utils/variables';

export interface LogMessage {
  id: string;
  type: 'incoming' | 'outgoing' | 'system';
  data: string;
  timestamp: string;
}

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export default function WebSocketPanel() {
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing' | 'system'>('all');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { environments, activeEnvironmentId } = useEnvironmentStore();

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up WebSocket connection on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, []);

  const addLog = (type: 'incoming' | 'outgoing' | 'system', data: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const newMsg: LogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      data,
      timestamp: timeStr,
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleConnect = () => {
    if (status === 'CONNECTED' || status === 'CONNECTING') return;

    const activeVariables = getActiveVariables(environments, activeEnvironmentId);
    const resolvedUrl = substituteVariables(url.trim(), activeVariables);

    if (!resolvedUrl) {
      addLog('system', 'Error: WebSocket URL cannot be empty.');
      setStatus('ERROR');
      return;
    }

    if (!resolvedUrl.startsWith('ws://') && !resolvedUrl.startsWith('wss://')) {
      addLog('system', 'Error: URL must start with ws:// or wss://');
      setStatus('ERROR');
      return;
    }

    setStatus('CONNECTING');
    addLog('system', `Connecting to ${resolvedUrl}...`);

    try {
      const socket = new WebSocket(resolvedUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('CONNECTED');
        addLog('system', `Connected to ${resolvedUrl}`);
      };

      socket.onmessage = event => {
        let displayData = event.data;
        if (typeof event.data === 'string') {
          try {
            const parsed = JSON.parse(event.data);
            displayData = JSON.stringify(parsed, null, 2);
          } catch {
            displayData = event.data;
          }
        }
        addLog('incoming', displayData);
      };

      socket.onerror = () => {
        setStatus('ERROR');
        addLog('system', 'WebSocket error encountered.');
      };

      socket.onclose = event => {
        setStatus('DISCONNECTED');
        const reasonStr = event.reason ? ` (Reason: ${event.reason})` : '';
        addLog(
          'system',
          `Disconnected from server. Code: ${event.code}${reasonStr}`
        );
        wsRef.current = null;
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatus('ERROR');
      addLog('system', `Failed to create WebSocket: ${errMsg}`);
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setStatus('DISCONNECTED');
  };

  const handleSendMessage = () => {
    if (!wsRef.current || status !== 'CONNECTED') {
      addLog('system', 'Cannot send message: Not connected.');
      return;
    }

    if (!inputMessage.trim()) return;

    try {
      wsRef.current.send(inputMessage);
      addLog('outgoing', inputMessage);
      setInputMessage('');
      setFormatError(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog('system', `Failed to send message: ${errMsg}`);
    }
  };

  const handlePrettifyJson = () => {
    if (!inputMessage.trim()) {
      setFormatError('No text to prettify');
      setTimeout(() => setFormatError(null), 2000);
      return;
    }
    try {
      const parsed = JSON.parse(inputMessage);
      setInputMessage(JSON.stringify(parsed, null, 2));
      setFormatError(null);
    } catch {
      setFormatError('Invalid JSON format');
      setTimeout(() => setFormatError(null), 3000);
    }
  };

  const handleCopyMessage = async (id: string, data: string) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filterType === 'all') return true;
    return m.type === filterType;
  });

  const getStatusBadge = () => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Connecting...
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Connection Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Disconnected
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 gap-4 overflow-hidden">
      {/* Top Connection Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-md border border-slate-700/80 focus-within:border-cyan-500 transition-colors">
          <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
            WS
          </span>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="wss://echo.websocket.org"
            className="w-full bg-transparent border-none outline-none text-slate-100 font-mono text-sm placeholder-slate-500"
            disabled={status === 'CONNECTED' || status === 'CONNECTING'}
          />
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}

          {status === 'CONNECTED' || status === 'CONNECTING' ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-rose-600/80 hover:bg-rose-600 rounded-md transition-colors shadow-sm"
            >
              <WifiOff className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm font-semibold"
            >
              <Wifi className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Content: Split into Log Console & Message Sender */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Message Log Console (2 cols on large screen) */}
        <div className="lg:col-span-2 flex flex-col bg-slate-800/50 rounded-lg border border-slate-700/60 overflow-hidden">
          {/* Console Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Messages Log
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                {filteredMessages.length}
              </span>
            </div>

            {/* Filter & Clear Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-700/60 text-xs">
                {(['all', 'incoming', 'outgoing', 'system'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-1 rounded-sm capitalize transition-colors ${
                      filterType === type
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMessages([])}
                title="Clear Log"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Console Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Info className="w-6 h-6 opacity-60" />
                <p>No messages yet. Connect to a WebSocket endpoint to start.</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-md border text-slate-200 transition-all ${
                    msg.type === 'incoming'
                      ? 'bg-slate-900/90 border-emerald-500/30'
                      : msg.type === 'outgoing'
                      ? 'bg-slate-900/90 border-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                    <div className="flex items-center gap-2">
                      {msg.type === 'incoming' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          <ArrowDownLeft className="w-3 h-3" /> RECEIVED
                        </span>
                      )}
                      {msg.type === 'outgoing' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                          <ArrowUpRight className="w-3 h-3" /> SENT
                        </span>
                      )}
                      {msg.type === 'system' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          SYSTEM
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {msg.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.data)}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                      title="Copy payload"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <pre className="whitespace-pre-wrap break-all text-slate-100 leading-relaxed max-h-60 overflow-y-auto">
                    {msg.data}
                  </pre>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Composer (1 col on large screen) */}
        <div className="flex flex-col bg-slate-800/50 rounded-lg border border-slate-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Send Message
            </h3>
            <button
              onClick={handlePrettifyJson}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded transition-colors"
              title="Prettify JSON"
            >
              <Sparkles className="w-3 h-3" />
              Prettify JSON
            </button>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-3">
            {formatError && (
              <div className="p-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
                {formatError}
              </div>
            )}

            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Write text or JSON message...\nPress Ctrl+Enter to send.`}
              className="flex-1 w-full bg-slate-950 p-3 rounded-md border border-slate-700/80 font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Tip: Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-300">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-300">Enter</kbd> to send
              </span>
              <button
                onClick={handleSendMessage}
                disabled={status !== 'CONNECTED' || !inputMessage.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
