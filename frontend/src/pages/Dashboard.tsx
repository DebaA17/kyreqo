import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Play, Terminal, HelpCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import CollectionsExplorer from '../components/CollectionsExplorer';
import useWorkspaceStore from '../store/workspaceStore';

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export default function Dashboard() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { user, logout } = useAuthStore();
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
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

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setStatusInfo(null);
    const startTime = Date.now();

    try {
      const reqHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) reqHeaders[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
        options.body = body;
      }

      const proxyUrl = `/api/requests/proxy/`;
      const proxyResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method, headers: reqHeaders, body: body || null }),
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
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponse({
        error: 'Failed to fetch response.',
        message: errorMessage,
        tip: 'If you are targeting local/private services, remember SSRF limits apply. If backend proxy is not started yet, browser CORS restrictions might block direct requests.',
      });
      setStatusInfo({
        code: 0,
        time: Date.now() - startTime,
        size: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0d0d11] border-b border-[#1f1f29] shadow-sm select-none">
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

        <div className="flex items-center gap-4">
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

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Mini Sidebar */}
        <aside className="w-64 bg-[#0c0c10] border-r border-[#1f1f29] p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase mb-2">
              Workspace
            </h3>
            <WorkspaceSwitcher />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <CollectionsExplorer workspaceId={currentWorkspaceId || ''} />
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

        {/* Center Panel (Request Builder & Response Panel) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Request Header Builder */}
          <div className="p-4 bg-[#0a0a0e] border-b border-[#1f1f29] flex flex-col gap-3">
            {/* Action Bar */}
            <div className="flex gap-2">
              <select
                value={method}
                onChange={e =>
                  setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')
                }

                className={`px-3.5 py-2.5 rounded-lg border font-bold text-sm bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500
                  ${method === 'GET' ? 'text-emerald-400 border-emerald-500/20' : ''}
                  ${method === 'POST' ? 'text-amber-400 border-amber-500/20' : ''}
                  ${method === 'PUT' ? 'text-indigo-400 border-indigo-500/20' : ''}
                  ${method === 'PATCH' ? 'text-sky-400 border-sky-500/20' : ''}
                  ${method === 'DELETE' ? 'text-rose-400 border-rose-500/20' : ''}
                `}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-md shadow-indigo-600/10"
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
            </div>

            {/* Request tabs */}
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

          {/* tab content + response output split */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#08080b]">
            {/* Left side of split: Request Data input */}
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
                    <span className="text-[10px] text-zinc-500">raw (application/json)</span>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
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

            {/* Right side of split: Response output */}
            <div className="flex-1 p-4 flex flex-col min-h-0 min-w-0 bg-[#0a0a0f]">
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-xs font-semibold text-zinc-400 flex-shrink-0">
                  Response Console
                </span>
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
                    {JSON.stringify(response, null, 2)}
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
      </main>
    </div>
  );
}
