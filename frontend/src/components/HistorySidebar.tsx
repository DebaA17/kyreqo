import React, { useState, useEffect } from 'react';
import { Clock, X, ChevronRight, ChevronDown } from 'lucide-react';
import useHistoryStore from '../store/historyStore';
import { RequestHistory } from '../types/history';
import { useAuthStore } from '../store/authStore';

interface HistorySidebarProps {
  workspaceId: string;
  onSelectHistory: (history: RequestHistory) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ workspaceId, onSelectHistory }) => {
  const { history, fetchHistory, deleteHistoryEntry, clearHistory, isLoading } = useHistoryStore();
  const { isAuthenticated } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && workspaceId) {
      fetchHistory(workspaceId);
    }
  }, [workspaceId, fetchHistory, isAuthenticated]);

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
              {isAuthenticated ? history.length : 0}
            </span>
          </h3>
        </div>
        {isAuthenticated && history.length > 0 && (
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
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Clock className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">Sign in for History</p>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">
                Log in to save and access your request history across devices.
              </p>
            </div>
          ) : isLoading ? (
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
                        setDeleteItemId(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-950/40 rounded transition"
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

      {/* Delete Single Entry Confirmation Modal */}
      {deleteItemId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 w-full max-w-sm shadow-2xl transform scale-100 transition-all duration-200">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Delete History Entry?</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Are you sure you want to delete this history entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
                onClick={() => setDeleteItemId(null)}
              >
                Cancel
              </button>
              <button
                className="px-3.5 py-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                onClick={async () => {
                  if (deleteItemId) {
                    await deleteHistoryEntry(deleteItemId);
                    setDeleteItemId(null);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 w-full max-w-sm shadow-2xl transform scale-100 transition-all duration-200">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Clear All History?</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              This will permanently delete all history entries for this workspace. This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-3.5 py-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
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
