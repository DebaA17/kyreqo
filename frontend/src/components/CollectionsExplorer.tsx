import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
  Trash2,
} from 'lucide-react';
import useCollectionStore, { Collection, SavedRequest } from '../store/collectionStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

interface CollectionsExplorerProps {
  workspaceId: string;
  onSelectRequest?: (request: SavedRequest) => void;
}

interface TreeNode extends Collection {
  children: TreeNode[];
}

const CollectionsExplorer: React.FC<CollectionsExplorerProps> = ({
  workspaceId,
  onSelectRequest,
}) => {
  const { user } = useAuthStore();
  const { collections, fetchCollections, createCollection, deleteCollection, isLoading } =
    useCollectionStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [newRequestName, setNewRequestName] = useState('');
  const [targetCollectionId, setTargetCollectionId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
    type: 'folder' | 'request';
  } | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchCollections(workspaceId);
    }
  }, [workspaceId, fetchCollections]);

  const buildTree = (parentId: number | null = null): TreeNode[] => {
    return collections
      .filter(c => (c.parent_collection || null) === parentId)
      .map(c => ({
        ...c,
        children: buildTree(c.id),
      })) as TreeNode[];
  };

  const treeData = buildTree(null);

  // Filter tree based on search query
  const filterTree = (items: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();

    return items
      .map(item => {
        // Check if current item matches
        const nameMatches = item.name.toLowerCase().includes(lowerQuery);
        // Recursively filter children
        const filteredChildren = filterTree(item.children, query);
        // Keep item if name matches OR it has matching children
        if (nameMatches || filteredChildren.length > 0) {
          return {
            ...item,
            children: nameMatches ? item.children : filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeNode[];
  };

  const toggleFolder = (id: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const result = await createCollection({
      name: newCollectionName.trim(),
      workspace: workspaceId,
      parent_collection: parentId,
    });

    if (result) {
      setNewCollectionName('');
      setParentId(null);
      setShowCreateModal(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestName.trim() || !targetCollectionId) return;

    try {
      await apiClient('/api/requests/', {
        method: 'POST',
        body: JSON.stringify({
          collection: targetCollectionId,
          name: newRequestName.trim(),
          url: 'https://jsonplaceholder.typicode.com/todos/1',
          method: 'GET',
          headers: {},
          query_params: {},
          body: '',
        }),
      });
      setNewRequestName('');
      setTargetCollectionId(null);
      setShowCreateRequestModal(false);
      fetchCollections(workspaceId);
    } catch (err) {
      alert('Failed to save request.');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    try {
      await apiClient(`/api/requests/${id}/`, { method: 'DELETE' });
      fetchCollections(workspaceId);
    } catch (err) {
      alert('Failed to delete request.');
    }
  };

  const renderTree = (items: TreeNode[], level: number = 0) => {
    return items.map(item => {
      const hasSubfolders = item.children && item.children.length > 0;
      const hasRequests = item.requests && item.requests.length > 0;
      const hasChildren = hasSubfolders || hasRequests;
      const isExpanded = expandedFolders.has(item.id);

      return (
        <div key={item.id} style={{ paddingLeft: `${level * 12}px` }}>
          <div className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-800/50 rounded-lg group select-none">
            <div
              className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
              onClick={() => toggleFolder(item.id)}
            >
              {hasChildren ? (
                <span className="p-0.5 hover:bg-zinc-700 rounded transition">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </span>
              ) : (
                <span className="w-4 h-4 flex-shrink-0" />
              )}

              <Folder className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-zinc-300 font-medium truncate">{item.name}</span>
            </div>

            {}
            {user && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => {
                    setParentId(item.id);
                    setShowCreateModal(true);
                  }}
                  className="p-1 hover:bg-zinc-700 rounded transition"
                  title="Add sub-folder"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
                </button>
                <button
                  onClick={() => {
                    setTargetCollectionId(item.id);
                    setShowCreateRequestModal(true);
                  }}
                  className="p-1 hover:bg-zinc-700 rounded transition"
                  title="Add request"
                >
                  <FilePlus className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget({
                      id: item.id,
                      name: item.name,
                      type: 'folder',
                    });
                  }}
                  className="p-1 hover:bg-red-900/30 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                </button>
              </div>
            )}
          </div>

          {}
          {isExpanded && (
            <div className="space-y-0.5">
              {}
              {hasSubfolders && <div>{renderTree(item.children, level + 1)}</div>}

              {}
              {hasRequests &&
                item.requests?.map(req => (
                  <div
                    key={req.id}
                    style={{ paddingLeft: `${(level + 1) * 16}px` }}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-800/40 rounded-lg cursor-pointer group/req"
                    onClick={() => onSelectRequest?.(req)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`text-[9px] font-extrabold px-1 py-0.5 rounded flex-shrink-0 w-11 text-center border
                        ${req.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                        ${req.method === 'POST' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                        ${req.method === 'PUT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                        ${req.method === 'PATCH' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : ''}
                        ${req.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                        ${req.method === 'QUERY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                      `}
                      >
                        {req.method}
                      </span>
                      <span className="text-xs text-zinc-400 truncate group-hover/req:text-zinc-200 transition">
                        {req.name}
                      </span>
                    </div>

                    {user && (
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover/req:opacity-100 transition"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setDeleteTarget({
                              id: req.id,
                              name: req.name,
                              type: 'request',
                            });
                          }}
                          className="p-1 hover:bg-red-900/30 rounded transition"
                          title="Delete saved request"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {}
      <div className="flex items-center justify-between mb-2 select-none">
        <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Collections</h3>
        {user && (
          <button
            onClick={() => {
              setParentId(null);
              setShowCreateModal(true);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            + New
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
        />
      </div>

      {}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center select-none">
            <Folder className="h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No collections yet</p>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-[160px]">
              Create your first collection or folder to organize your API requests.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {(() => {
              const filteredData = filterTree(treeData, searchQuery);
              if (filteredData.length === 0 && searchQuery.trim() !== '') {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-zinc-400 font-medium">No collections found</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Try a different search term</p>
                  </div>
                );
              }
              return renderTree(filteredData);
            })()}
          </div>
        )}
      </div>

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">
              {parentId ? 'Create Sub-Folder' : 'Create New Collection'}
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Name *</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-3 py-2 bg-zinc-950 text-white rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 transition"
                onKeyPress={e => e.key === 'Enter' && handleCreateCollection()}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName('');
                  setParentId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showCreateRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Create Saved Request</h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Request Name *</label>
              <input
                type="text"
                value={newRequestName}
                onChange={e => setNewRequestName(e.target.value)}
                placeholder="e.g. Fetch Current User"
                className="w-full px-3 py-2 bg-zinc-950 text-white rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 transition"
                onKeyPress={e => e.key === 'Enter' && handleCreateRequest()}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                onClick={() => {
                  setShowCreateRequestModal(false);
                  setNewRequestName('');
                  setTargetCollectionId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
                onClick={handleCreateRequest}
                disabled={!newRequestName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-905 border border-red-500/20 rounded-xl p-6 w-full max-w-sm shadow-2xl shadow-red-500/5 select-none transform transition duration-200 scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 animate-pulse">
                <Trash2 className="h-5 w-5 animate-bounce-slow" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Delete {deleteTarget.type === 'folder' ? 'Folder' : 'Request'}?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 leading-relaxed break-all">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteTarget.name}"</strong>?
              {deleteTarget.type === 'folder' &&
                ' All nested folders and requests within will also be removed.'}
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold bg-red-600/90 hover:bg-red-500 text-white rounded-lg transition"
                onClick={async () => {
                  const { id, type } = deleteTarget;
                  setDeleteTarget(null);
                  if (type === 'folder') {
                    await deleteCollection(id);
                  } else {
                    await handleDeleteRequest(id);
                  }
                }}
              >
                Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsExplorer;
