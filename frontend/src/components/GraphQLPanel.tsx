import { useState, useCallback } from 'react';
import { Play, Sparkles, AlertCircle, Copy, Check, Info } from 'lucide-react';
import useEnvironmentStore from '../store/environmentStore';
import useWorkspaceStore from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import {
  substituteVariables,
  substituteVariablesInObject,
  getActiveVariables,
} from '../utils/variables';

const DEFAULT_QUERY = `query GetCountries {
  countries {
    code
    name
    emoji
  }
}`;

const DEFAULT_VARIABLES = `{\n  \n}`;
const DEFAULT_HEADERS = `{\n  "Content-Type": "application/json"\n}`;

export default function GraphQLPanel() {
  const [url, setUrl] = useState('https://countries.trevorblades.com/');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [variables, setVariables] = useState(DEFAULT_VARIABLES);
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [activeBottomTab, setActiveBottomTab] = useState<'variables' | 'headers'>('variables');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { accessToken } = useAuthStore();

  const handleRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const activeVariables = getActiveVariables(environments, activeEnvironmentId);
      const finalUrl = substituteVariables(url, activeVariables);
      const finalQuery = substituteVariables(query, activeVariables);

      let parsedVariables: Record<string, unknown> = {};
      if (variables.trim()) {
        try {
          parsedVariables = JSON.parse(variables);
          parsedVariables = substituteVariablesInObject(parsedVariables, activeVariables);
        } catch {
          throw new Error('Variables must be valid JSON');
        }
      }

      let parsedHeaders: Record<string, string> = {};
      if (headers.trim()) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          throw new Error('Headers must be valid JSON');
        }
      }

      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        proxyHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/requests/proxy/', {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({
          url: finalUrl,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...parsedHeaders },
          body: JSON.stringify({
            query: finalQuery,
            variables: parsedVariables,
          }),
          workspace_id: currentWorkspaceId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const graphQLResponse = data.data !== undefined ? data.data : data;

      if (
        graphQLResponse &&
        typeof graphQLResponse === 'object' &&
        'errors' in graphQLResponse &&
        Array.isArray((graphQLResponse as { errors: unknown[] }).errors)
      ) {
        const errorList = (graphQLResponse as { errors: { message?: string }[] }).errors;
        setError(`GraphQL Errors: ${errorList.map(e => e.message || 'Unknown error').join(', ')}`);
      }

      setResponse(JSON.stringify(graphQLResponse, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [
    url,
    query,
    variables,
    headers,
    environments,
    activeEnvironmentId,
    currentWorkspaceId,
    accessToken,
  ]);

  const handleCopyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setError('Failed to copy response to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePrettify = () => {
    try {
      if (activeBottomTab === 'variables') {
        const parsed = JSON.parse(variables || '{}');
        setVariables(JSON.stringify(parsed, null, 2));
      } else {
        const parsed = JSON.parse(headers || '{}');
        setHeaders(JSON.stringify(parsed, null, 2));
      }
      setError(null);
    } catch {
      setError(`Invalid JSON in ${activeBottomTab}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c10] text-zinc-100 p-4 gap-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#13131a] p-3 rounded-lg border border-[#1f1f29]">
        <div className="flex-1 flex items-center gap-2 bg-[#09090d] px-3 py-2 rounded-md border border-[#1f1f29] focus-within:border-pink-500 transition-colors">
          <span className="text-xs font-mono text-pink-400 font-semibold uppercase tracking-wider">
            GQL
          </span>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com/graphql"
            className="w-full bg-transparent border-none outline-none text-zinc-100 font-mono text-sm placeholder-zinc-500"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-zinc-950 bg-pink-400 hover:bg-pink-300 disabled:opacity-50 rounded-md transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Running...' : 'Run Query'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 flex flex-col bg-[#13131a] rounded-lg border border-[#1f1f29] overflow-hidden min-h-0">
            <div className="px-4 py-2.5 bg-[#171720] border-b border-[#1f1f29]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Query / Mutation
              </h3>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="query { ... }"
              className="flex-1 w-full bg-[#09090d] p-3 font-mono text-xs text-zinc-100 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="h-2/5 flex flex-col bg-[#13131a] rounded-lg border border-[#1f1f29] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#171720] border-b border-[#1f1f29]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBottomTab('variables')}
                  className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded transition ${
                    activeBottomTab === 'variables'
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Variables (JSON)
                </button>
                <button
                  onClick={() => setActiveBottomTab('headers')}
                  className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded transition ${
                    activeBottomTab === 'headers'
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Headers (JSON)
                </button>
              </div>
              <button
                onClick={handlePrettify}
                className="flex items-center gap-1 px-2 py-1 text-xs text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 rounded transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Prettify
              </button>
            </div>
            {activeBottomTab === 'variables' ? (
              <textarea
                value={variables}
                onChange={e => setVariables(e.target.value)}
                placeholder='{ "id": "1" }'
                className="flex-1 w-full bg-[#09090d] p-3 font-mono text-xs text-zinc-100 focus:outline-none resize-none"
              />
            ) : (
              <textarea
                value={headers}
                onChange={e => setHeaders(e.target.value)}
                placeholder='{ "Authorization": "Bearer ..." }'
                className="flex-1 w-full bg-[#09090d] p-3 font-mono text-xs text-zinc-100 focus:outline-none resize-none"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col bg-[#13131a] rounded-lg border border-[#1f1f29] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#171720] border-b border-[#1f1f29]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Response
            </h3>
            {response && (
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-[#1f1f29] hover:bg-[#2a2a38] rounded transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 p-3 overflow-auto bg-[#09090d]">
            {error && (
              <div className="mb-3 p-2.5 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {loading ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                <span className="h-5 w-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mr-2.5"></span>
                Running GraphQL query...
              </div>
            ) : response ? (
              <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all">
                {response}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 text-xs">
                <Info className="w-6 h-6 opacity-60 text-zinc-400" />
                <p>Compose a query and click "Run Query" to inspect the GraphQL response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
