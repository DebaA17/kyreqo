import React, { useState, useEffect } from 'react';
import { Clock, X, ChevronRight, ChevronDown } from 'lucide-react';
import useHistoryStore from '../store/historyStore';
import { RequestHistory } from '../types/history';

interface HistorySidebarProps {
  workspaceId: string;
  onSelectHistory: (history: RequestHistory) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ workspaceId, onSelectHistory }) => {
  const { history, fetchHistory, deleteHistoryEntry, clearHistory, isLoading } = useHistoryStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchHistory(workspaceId);
    }
  }, [workspaceId, fetchHistory]);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'POST':
        return 'text-amber-400 bg-amber-500/10';
      case 'PUT':
        return 'text-indigo-400 bg-indigo-500/10';
      case 'PATCH':
        return 'text-sky-400 bg-sky-500/10';
      case 'DELETE':
        return 'text-rose-400 bg-rose-500/10';
      case 'QUERY':
        return 'text-purple-400 bg-purple-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-amber-400';
    if (status >= 400 && status < 500) return 'text-rose-400';
    if (status >= 500) return 'text-red-500';
    return 'text-gray-400';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const handleClearHistory = async () => {
    if (workspaceId) {
      await clearHistory(workspaceId);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <button className="p-0.5 hover:bg-zinc-700 rounded transition">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>
          <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            History
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {history.length}
            </span>
          </h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setShowClearConfirm(true);
            }}
            className="text-[10px] text-red-400 hover:text-red-300 font-medium transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* History List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No history yet</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[160px]">
                Send your first request to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map(item => (
                <div
                  key={item.id}
                  className="group px-2 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition"
                  onClick={() => onSelectHistory(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getMethodColor(item.method)}`}
                      >
                        {item.method}
                      </span>
                      <span className="text-xs text-zinc-300 truncate flex-1">{item.url}</span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Delete this history entry?')) {
                          deleteHistoryEntry(item.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded transition"
                    >
                      <X className="h-3 w-3 text-red-400/60 hover:text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <span
                      className={`text-[10px] font-medium ${getStatusColor(item.response_status)}`}
                    >
                      {item.response_status}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatTime(item.response_time)}
                    </span>
                    <span className="text-[10px] text-zinc-500">{formatDate(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-2">Clear All History?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete all history entries for this workspace. This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={handleClearHistory}
                disabled={isLoading}
              >
                {isLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorySidebar;
