import React, { useState } from 'react';
import { Terminal, X, AlertCircle } from 'lucide-react';
import { parseCurl, ParsedCurl } from '../utils/curlParser';

interface ImportCurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedCurl) => void;
}

export default function ImportCurlModal({ isOpen, onClose, onImport }: ImportCurlModalProps) {
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      setError(null);
      const parsed = parseCurl(curlCommand);
      onImport(parsed);
      setCurlCommand('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to parse cURL command');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleImport();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-curl-title"
        className="w-full max-w-lg bg-[#0c0c10] border border-[#1f1f29] rounded-xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Terminal className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 id="import-curl-title" className="text-sm font-semibold text-white">
                Import from cURL
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Paste a cURL command to populate method, URL, headers, and body.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            value={curlCommand}
            onChange={e => {
              setCurlCommand(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            rows={7}
            placeholder={`curl -X POST https://api.example.com/v1/users \\\n  -H "Authorization: Bearer <token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "Alice"}'`}
            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition resize-y"
            autoFocus
          />

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-zinc-500">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                Ctrl/Cmd + Enter
              </kbd>{' '}
              to import
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!curlCommand.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                <Terminal className="h-3.5 w-3.5" />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
