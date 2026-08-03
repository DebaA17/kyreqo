import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Play,
  Terminal,
  HelpCircle,
  Shield,
  Folder,
  X,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import CollectionsExplorer from '../components/CollectionsExplorer';
import useWorkspaceStore from '../store/workspaceStore';
import useCollectionStore from '../store/collectionStore';
import { apiClient } from '../api/client';
import EnvironmentSelector from '../components/EnvironmentSelector';
import useEnvironmentStore from '../store/environmentStore';
import {
  substituteVariables,
  substituteVariablesInObject,
  getActiveVariables,
} from '../utils/variables';
import HistorySidebar from '../components/HistorySidebar';
import { RequestHistory } from '../types/history';
import useHistoryStore from '../store/historyStore';
import { useEffect, useCallback } from 'react';

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export default function Dashboard() {
  const [isCopied, setIsCopied] = useState(false);
  const [urlSuggestions, setUrlSuggestions] = useState<string[]>([]);
  const [showUrlSuggestions, setShowUrlSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'collections' | 'history'>(
    'collections'
  );
  const [prettifyError, setPrettifyError] = useState<string | null>(null);
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { collections, fetchCollections } = useCollectionStore();
  const { user, logout } = useAuthStore();
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY'>(
    'GET'
  );
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('{\n  "name": "Kyreqo Dev",\n  "status": "active"\n}');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('headers');
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{ code: number; time: number; size: number } | null>(
    null
  );

  const [showSaveRequestModal, setShowSaveRequestModal] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [saveCollectionId, setSaveCollectionId] = useState<number | ''>('');

  // Last Request Restore State
  const [lastRequest, setLastRequest] = useState<{
    method: string;
    url: string;
    headers: RequestHeader[];
    body: string;
  }>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '{\n  "name": "Kyreqo Dev",\n  "status": "active"\n}',
  });

  const handleSaveRequest = async () => {
    if (!saveRequestName.trim() || !saveCollectionId) return;

    try {
      const reqHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) reqHeaders[h.key] = h.value;
      });

      await apiClient('/api/requests/', {
        method: 'POST',
        body: JSON.stringify({
          collection: saveCollectionId,
          name: saveRequestName.trim(),
          url,
          method,
          headers: reqHeaders,
          query_params: {},
          body: body || '',
        }),
      });
      setShowSaveRequestModal(false);
      setSaveRequestName('');
      setSaveCollectionId('');
      if (currentWorkspaceId) {
        fetchCollections(currentWorkspaceId);
      }
    } catch (err) {
      alert('Failed to save request.');
    }
  };

  const handleHistorySelect = (history: RequestHistory) => {
    setMethod(history.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY');
    setUrl(history.url);

    if (history.headers) {
      const headerEntries = Object.entries(history.headers);
      if (headerEntries.length > 0) {
        setHeaders(
          headerEntries.map(([key, value]) => ({
            key,
            value: String(value),
            enabled: true,
          }))
        );
      }
    }

    if (history.body) {
      setBody(history.body);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    val: string | boolean
  ) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: val } as RequestHeader;
    setHeaders(updated);
  };
  const handlePrettifyJson = () => {
    if (!body || body.trim() === '') {
      setPrettifyError('No JSON to prettify');
      setTimeout(() => setPrettifyError(null), 2000);
      return;
    }

    try {
      const parsed = JSON.parse(body);
      const prettified = JSON.stringify(parsed, null, 2);
      setBody(prettified);
      setPrettifyError(null);
    } catch (error) {
      setPrettifyError('Invalid JSON format');
      setTimeout(() => setPrettifyError(null), 3000);
    }
  };
  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setStatusInfo(null);
    const startTime = Date.now();

    try {
      // Save last request for restore (deep copy headers, save template URL)
      setLastRequest({
        method: method,
        url: url,
        headers: headers.map(h => ({ ...h })),
        body: body || '',
      });

      const activeVariables = getActiveVariables(environments, activeEnvironmentId);

      const reqHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) {
          reqHeaders[h.key] = substituteVariables(h.value, activeVariables);
        }
      });

      const finalUrl = substituteVariables(url, activeVariables);

      let finalBody = body;
      if (body) {
        try {
          const parsedBody = JSON.parse(body);
          const substitutedBody = substituteVariablesInObject(parsedBody, activeVariables);
          finalBody = JSON.stringify(substitutedBody, null, 2);
        } catch {
          finalBody = substituteVariables(body, activeVariables);
        }
      }

      const options: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE', 'QUERY'].includes(method) && finalBody) {
        options.body = finalBody;
      }

      const proxyUrl = `/api/requests/proxy/`;
      const accessToken = localStorage.getItem('accessToken');
      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        proxyHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const proxyResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({
          url: finalUrl,
          method,
          headers: reqHeaders,
          body: finalBody || null,
          workspace: currentWorkspaceId,
        }),
      });

      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Proxy server returned status ${proxyResponse.status}`);
      }

      const res = await proxyResponse.json();

      const duration = Date.now() - startTime;
      const sizeBytes = new Blob([JSON.stringify(res.data)]).size;

      setResponse(res.data);
      setStatusInfo({
        code: res.status || 200,
        time: duration,
        size: sizeBytes,
      });
      saveUrlToHistory(finalUrl);

      if (currentWorkspaceId) {
        useHistoryStore.getState().fetchHistory(currentWorkspaceId);
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponse(
        JSON.stringify(
          {
            error: 'Failed to fetch response.',
            message: errorMessage,
            tip: 'If you are targeting local/private services, remember SSRF limits apply. If backend proxy is not started yet, browser CORS restrictions might block direct requests.',
          },
          null,
          2
        )
      );
      setStatusInfo({
        code: 0,
        time: Date.now() - startTime,
        size: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [environments, activeEnvironmentId, headers, url, body, method, currentWorkspaceId]);

  const handleRestoreLastRequest = () => {
    if (!lastRequest) return;

    setMethod(lastRequest.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY');
    setUrl(lastRequest.url);
    setHeaders(lastRequest.headers);
    setBody(lastRequest.body);
    setShowUrlSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  // Load URL history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('urlHistory');
    if (saved) {
      try {
        const urls = JSON.parse(saved);
        if (Array.isArray(urls)) {
          // Keep only valid URLs (not empty)
          const validUrls = urls.filter((u: string) => u && u.trim().length > 0);
          localStorage.setItem('urlHistory', JSON.stringify(validUrls));
        }
      } catch {
        // If corrupted, reset
        localStorage.setItem('urlHistory', JSON.stringify([]));
      }
    } else {
      localStorage.setItem('urlHistory', JSON.stringify([]));
    }
  }, []);

  // Save URL to history after successful request
  const saveUrlToHistory = (urlToSave: string) => {
    if (!urlToSave || urlToSave.trim().length === 0) return;

    const saved = localStorage.getItem('urlHistory');
    let urls: string[] = [];
    try {
      urls = saved ? JSON.parse(saved) : [];
    } catch {
      urls = [];
    }

    // Remove duplicate if exists
    urls = urls.filter(u => u !== urlToSave);

    // Add to beginning
    urls.unshift(urlToSave);

    // Keep only last 10
    if (urls.length > 10) {
      urls = urls.slice(0, 10);
    }

    localStorage.setItem('urlHistory', JSON.stringify(urls));
  };

  // Handle URL input change with suggestions
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    // Get suggestions
    const saved = localStorage.getItem('urlHistory');
    let urls: string[] = [];
    try {
      urls = saved ? JSON.parse(saved) : [];
    } catch {
      urls = [];
    }

    // Filter suggestions based on input
    const filtered = value.trim()
      ? urls.filter(u => u.toLowerCase().includes(value.toLowerCase()))
      : urls;

    setUrlSuggestions(filtered);
    setShowUrlSuggestions(filtered.length > 0);
    setActiveSuggestionIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setUrl(suggestion);
    setShowUrlSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loading) {
          handleSend();
        }
      }

      if (event.key === 'h' || event.key === 'H') {
        const activeEl = document.activeElement;
        const isInputFocused =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true');

        if (!isInputFocused) {
          event.preventDefault();
          setActiveSidebarTab(prev => (prev === 'history' ? 'collections' : 'history'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, handleSend]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-hidden">
      {}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-6 py-4 bg-[#0d0d11] border-b border-[#1f1f29] shadow-sm select-none">
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Send className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Kyreqo
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium">MODERN API WORKGROUND</p>
            </div>
          </div>
          {currentWorkspaceId && (
            <div className="md:ml-4">
              <EnvironmentSelector workspaceId={currentWorkspaceId} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 md:gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            {user ? `${user.first_name || 'User'}'s Sandbox` : 'Guest Sandbox'}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white cursor-pointer transition">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>SSRF Protection Engaged</span>
          </div>
        </div>
      </header>

      {}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {}
        <aside className="w-full lg:w-64 bg-[#0c0c10] border-b lg:border-b-0 lg:border-r border-[#1f1f29] p-4 flex flex-col gap-4 flex-shrink-0">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase mb-2">
              Workspace
            </h3>
            <WorkspaceSwitcher />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex border-b border-zinc-800 mb-2">
              <button
                className={`flex-1 py-1.5 text-xs font-semibold transition ${
                  activeSidebarTab === 'collections'
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveSidebarTab('collections')}
              >
                Collections
              </button>
              <button
                className={`flex-1 py-1.5 text-xs font-semibold transition ${
                  activeSidebarTab === 'history'
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveSidebarTab('history')}
              >
                History
              </button>
            </div>

            {activeSidebarTab === 'collections' ? (
              <CollectionsExplorer
                workspaceId={currentWorkspaceId || ''}
                onSelectRequest={req => {
                  setUrl(req.url);
                  setMethod(req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY');
                  const reqHeaders: RequestHeader[] = Object.entries(req.headers || {}).map(
                    ([key, value]) => ({
                      key,
                      value: String(value),
                      enabled: true,
                    })
                  );
                  if (reqHeaders.length === 0) {
                    reqHeaders.push({ key: '', value: '', enabled: true });
                  }
                  setHeaders(reqHeaders);
                  setBody(
                    typeof req.body === 'string'
                      ? req.body
                      : JSON.stringify(req.body, null, 2) || ''
                  );
                }}
              />
            ) : (
              <HistorySidebar
                workspaceId={currentWorkspaceId || ''}
                onSelectHistory={handleHistorySelect}
              />
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-2 bg-zinc-900/40 border border-zinc-800/80 rounded-xl mb-1">
                  <div className="h-9 w-9 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-[9px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                {(user.is_staff || user.is_superuser) && (
                  <Link
                    to="/admin"
                    className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-lg transition-all text-center"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="w-full py-2 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10"
              >
                Sign In to Save
              </Link>
            )}
            <Link
              to="/privacy"
              className="text-[10px] text-zinc-500 hover:text-zinc-300 text-center transition py-1 select-none"
            >
              Privacy Policy
            </Link>
          </div>
        </aside>

        {}
        <div className="flex-1 flex flex-col min-w-0">
          {}
          <div className="p-4 bg-[#0a0a0e] border-b border-[#1f1f29] flex flex-col gap-3">
            {}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-1 gap-2">
                <select
                  value={method}
                  onChange={e =>
                    setMethod(
                      e.target.value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY'
                    )
                  }

                  className={`px-3.5 py-2.5 rounded-lg border font-bold text-sm bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500
                    ${method === 'GET' ? 'text-emerald-400 border-emerald-500/20' : ''}
                    ${method === 'POST' ? 'text-amber-400 border-amber-500/20' : ''}
                    ${method === 'PUT' ? 'text-indigo-400 border-indigo-500/20' : ''}
                    ${method === 'PATCH' ? 'text-sky-400 border-sky-500/20' : ''}
                    ${method === 'DELETE' ? 'text-rose-400 border-rose-500/20' : ''}
                    ${method === 'QUERY' ? 'text-purple-400 border-purple-500/20' : ''}
                  `}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="QUERY">QUERY</option>
                </select>

                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    onFocus={() => {
                      const saved = localStorage.getItem('urlHistory');
                      let urls: string[] = [];
                      try {
                        urls = saved ? JSON.parse(saved) : [];
                      } catch {
                        urls = [];
                      }
                      const filtered = url.trim()
                        ? urls.filter(u => u.toLowerCase().includes(url.toLowerCase()))
                        : urls;
                      setUrlSuggestions(filtered);
                      setShowUrlSuggestions(filtered.length > 0);
                    }}
                    onKeyDown={e => {
                      if (showUrlSuggestions && urlSuggestions.length > 0) {
                        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                          e.preventDefault();
                          setActiveSuggestionIndex(prev =>
                            prev < urlSuggestions.length - 1 ? prev + 1 : 0
                          );
                          return;
                        }
                        if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                          e.preventDefault();
                          setActiveSuggestionIndex(prev =>
                            prev > 0 ? prev - 1 : urlSuggestions.length - 1
                          );
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (
                            activeSuggestionIndex >= 0 &&
                            activeSuggestionIndex < urlSuggestions.length
                          ) {
                            handleSuggestionClick(urlSuggestions[activeSuggestionIndex]);
                          } else {
                            if (!loading) {
                              handleSend();
                            }
                          }
                          return;
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowUrlSuggestions(false);
                          setActiveSuggestionIndex(-1);
                          return;
                        }
                      } else {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!loading) {
                            handleSend();
                          }
                        }
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click on suggestion
                      setTimeout(() => setShowUrlSuggestions(false), 200);
                    }}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full pl-4 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                  />

                  {url && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrl('');
                        const saved = localStorage.getItem('urlHistory');
                        let urls: string[] = [];
                        try {
                          urls = saved ? JSON.parse(saved) : [];
                        } catch {
                          urls = [];
                        }
                        setUrlSuggestions(urls);
                        setShowUrlSuggestions(urls.length > 0);
                        setActiveSuggestionIndex(-1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition p-1"
                      title="Clear URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Suggestions Dropdown */}
                  {showUrlSuggestions && urlSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                      {urlSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 cursor-pointer text-sm transition ${
                            index === activeSuggestionIndex
                              ? 'bg-indigo-600/40 text-zinc-100 font-medium'
                              : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                          onMouseDown={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {lastRequest && (
                  <button
                    onClick={handleRestoreLastRequest}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition flex items-center gap-1 text-sm font-medium flex-shrink-0"
                    title="Restore last request"
                  >
                    ↺ Restore
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex-1 sm:flex-none justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        Send
                      </>
                    )}
                  </button>

                  {user && (
                    <button
                      onClick={() => {
                        if (collections.length > 0) {
                          setSaveCollectionId(collections[0].id);
                        }
                        setShowSaveRequestModal(true);
                      }}
                      className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition cursor-pointer"
                    >
                      <Folder className="h-4 w-4" />
                      Save
                    </button>
                  )}
                </div>
              </div>

              {}
              <div className="flex border-b border-zinc-800 text-xs">
                <button
                  onClick={() => setActiveTab('headers')}
                  className={`py-2 px-4 font-semibold border-b-2 transition ${activeTab === 'headers' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                  Headers ({headers.filter(h => h.key).length})
                </button>
                <button
                  onClick={() => setActiveTab('body')}
                  className={`py-2 px-4 font-semibold border-b-2 transition ${activeTab === 'body' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                  Body
                </button>
                <button
                  onClick={() => setActiveTab('params')}
                  className={`py-2 px-4 font-semibold border-b-2 transition ${activeTab === 'params' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                  Params
                </button>
              </div>
            </div>

            {}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#08080b]">
              {}
              <div className="flex-1 border-r border-[#1f1f29] p-4 flex flex-col min-h-0 min-w-0">
                {activeTab === 'headers' && (
                  <div className="flex-1 flex flex-col min-h-0 gap-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-zinc-400">Request Headers</span>
                      <button
                        onClick={addHeader}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        + Add Header
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                      {headers.map((h, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={h.enabled}
                            onChange={e => updateHeader(idx, 'enabled', e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                          />
                          <input
                            type="text"
                            value={h.key}
                            onChange={e => updateHeader(idx, 'key', e.target.value)}
                            placeholder="Header Key"
                            className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                          <input
                            type="text"
                            value={h.value}
                            onChange={e => updateHeader(idx, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'body' && (
                  <div className="flex-1 flex flex-col min-h-0 gap-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-zinc-400">JSON Payload</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrettifyJson}
                          className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition flex items-center gap-1"
                          title="Prettify JSON"
                        >
                          <Sparkles className="h-3 w-3" />
                          Prettify
                        </button>
                        <span className="text-[10px] text-zinc-500">raw (application/json)</span>
                      </div>
                    </div>
                    {prettifyError && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded px-2 py-1">
                        <AlertCircle className="h-3 w-3" />
                        {prettifyError}
                      </div>
                    )}
                    <textarea
                      value={body}
                      onChange={e => {
                        setBody(e.target.value);
                        setPrettifyError(null);
                      }}
                      className="flex-1 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
                    />
                  </div>
                )}

                {activeTab === 'params' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <HelpCircle className="h-6 w-6 mb-1 text-zinc-600" />
                    URL parameters will be parsed dynamically from your request URL.
                  </div>
                )}
              </div>

              {}
              <div className="flex-1 p-4 flex flex-col min-h-0 min-w-0 bg-[#0a0a0f]">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400 flex-shrink-0">
                      Response Console
                    </span>
                    {response !== null && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              typeof response === 'string'
                                ? response
                                : JSON.stringify(response, null, 2)
                            );
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition flex items-center gap-1"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {statusInfo && (
                    <div className="flex gap-2 flex-wrap justify-end">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-bold flex items-center gap-1
        ${statusInfo.code >= 200 && statusInfo.code < 300 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}
      `}
                      >
                        {statusInfo.code === 0 ? 'FAIL' : statusInfo.code}
                      </span>
                      <span className="text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex-shrink-0">
                        {statusInfo.time} ms
                      </span>
                      <span className="text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex-shrink-0">
                        {(statusInfo.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-[#07070b] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col min-h-0">
                  {response ? (
                    <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-indigo-300 leading-relaxed select-text whitespace-pre-wrap break-all">
                      {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
                    </pre>
                  ) : loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <span className="h-7 w-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-2"></span>
                      Retrieving target response...
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-6">
                      <Terminal className="h-8 w-8 text-zinc-700 mb-2" />
                      <p className="font-semibold text-zinc-400">Response is empty</p>
                      <p className="text-[10px] text-zinc-600 mt-1 max-w-[240px]">
                        Enter a URL and click Send above to run an API request through the Kyreqo
                        engine.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {}
      {showSaveRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Save Active Request</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Request Name *</label>
                <input
                  type="text"
                  value={saveRequestName}
                  onChange={e => setSaveRequestName(e.target.value)}
                  placeholder="e.g. Fetch Users List"
                  className="w-full px-3 py-2 bg-zinc-950 text-white rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 transition"
                  onKeyPress={e => e.key === 'Enter' && handleSaveRequest()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Collection Folder *</label>
                <select
                  value={saveCollectionId}
                  onChange={e => setSaveCollectionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-zinc-950 text-white rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 transition"
                >
                  <option value="" disabled>
                    Select a folder
                  </option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                onClick={() => {
                  setShowSaveRequestModal(false);
                  setSaveRequestName('');
                  setSaveCollectionId('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
                onClick={handleSaveRequest}
                disabled={!saveRequestName.trim() || !saveCollectionId}
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
