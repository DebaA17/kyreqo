import { useState, useCallback } from 'react';
import { Play, Sparkles, AlertCircle, Copy, Check, Info } from 'lucide-react';
import useEnvironmentStore from '../store/environmentStore';
import {
  substituteVariables,
  substituteVariablesInObject,
  getActiveVariables,
} from '../utils/variables';

const DEFAULT_QUERY = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`;

const DEFAULT_VARIABLES = `{
  "id": "1"
}`;

export default function GraphQLPanel() {
  const [url, setUrl] = useState('https://countries.trevorblades.com/');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [variables, setVariables] = useState(DEFAULT_VARIABLES);
  const headers = '{\n  "Content-Type": "application/json"\n}';
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { environments, activeEnvironmentId } = useEnvironmentStore();

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

      const res = await fetch('/api/requests/proxy/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...parsedHeaders },
          body: JSON.stringify({
            query: finalQuery,
            variables: parsedVariables,
          }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const graphQLResponse = data.data || data;

      // Detect GraphQL errors
      if (graphQLResponse?.errors && Array.isArray(graphQLResponse.errors)) {
        setError(
          `GraphQL Errors: ${graphQLResponse.errors.map((e: { message: string }) => e.message).join(', ')}`
        );
      }

      setResponse(JSON.stringify(graphQLResponse, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [url, query, variables, headers, environments, activeEnvironmentId]);

  const handleCopyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handlePrettifyVariables = () => {
    try {
      const parsed = JSON.parse(variables);
      setVariables(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError('Invalid JSON in variables');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 gap-4 overflow-hidden">
      {/* Top Bar: URL + Run Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-md border border-slate-700/80 focus-within:border-pink-500 transition-colors">
          <span className="text-xs font-mono text-pink-400 font-semibold uppercase tracking-wider">
            GQL
          </span>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com/graphql"
            className="w-full bg-transparent border-none outline-none text-slate-100 font-mono text-sm placeholder-slate-500"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-slate-900 bg-pink-400 hover:bg-pink-300 disabled:opacity-50 rounded-md transition"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Running...' : 'Run Query'}
        </button>
      </div>

      {/* Main Content: Query + Variables + Response */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left: Query + Variables */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Query Editor */}
          <div className="flex-1 flex flex-col bg-slate-800/50 rounded-lg border border-slate-700/60 overflow-hidden min-h-0">
            <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Query / Mutation
              </h3>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="query { ... }"
              className="flex-1 w-full bg-slate-950 p-3 font-mono text-xs text-slate-100 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Variables Editor */}
          <div className="h-1/3 flex flex-col bg-slate-800/50 rounded-lg border border-slate-700/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Variables (JSON)
              </h3>
              <button
                onClick={handlePrettifyVariables}
                className="flex items-center gap-1 px-2 py-1 text-xs text-pink-400 hover:text-pink-300 bg-pink-500/10 rounded transition"
              >
                <Sparkles className="w-3 h-3" />
                Prettify
              </button>
            </div>
            <textarea
              value={variables}
              onChange={e => setVariables(e.target.value)}
              placeholder='{ "id": "1" }'
              className="flex-1 w-full bg-slate-950 p-3 font-mono text-xs text-slate-100 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Right: Response */}
        <div className="flex flex-col bg-slate-800/50 rounded-lg border border-slate-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Response
            </h3>
            {response && (
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-700/50 rounded transition"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 p-3 overflow-auto">
            {error && (
              <div className="mb-3 p-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                <span className="h-6 w-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mr-2"></span>
                Running query...
              </div>
            ) : response ? (
              <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all">
                {response}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Info className="w-6 h-6 opacity-60" />
                <p>Write a query and click "Run Query" to see the response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
