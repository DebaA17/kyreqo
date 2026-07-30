import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Trash2,
} from 'lucide-react';
import useCollectionStore, { Collection } from '../store/collectionStore';

interface CollectionsExplorerProps {
  workspaceId: string;
}

interface TreeNode extends Collection {
  children: TreeNode[];
}

const CollectionsExplorer: React.FC<CollectionsExplorerProps> = ({ workspaceId }) => {
  const { collections, fetchCollections, createCollection, deleteCollection, isLoading } =
    useCollectionStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchCollections(workspaceId);
    }
  }, [workspaceId, fetchCollections]);

  // Build tree structure from flat collections list
  const buildTree = (parentId: string | null = null): TreeNode[] => {
    return collections
      .filter(c => c.parent === parentId)
      .map(c => ({
        ...c,
        children: buildTree(c.id),
      })) as TreeNode[];
  };

  const treeData = buildTree(null);

  const toggleFolder = (id: string) => {
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
      parent: parentId,
    });

    if (result) {
      setNewCollectionName('');
      setParentId(null);
      setShowCreateModal(false);
    }
  };

  const renderTree = (items: TreeNode[], level: number = 0) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedFolders.has(item.id);

      return (
        <div key={item.id} style={{ paddingLeft: `${level * 16}px` }}>
          <div className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-800/50 rounded-lg group">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleFolder(item.id)}
                  className="p-0.5 hover:bg-zinc-700 rounded transition"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}

              {hasChildren ? (
                <Folder className="h-4 w-4 text-amber-400 flex-shrink-0" />
              ) : (
                <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
              )}

              <span className="text-sm text-zinc-300 truncate">{item.name}</span>
            </div>

            {/* Action buttons on hover */}
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
                  // For now, just show alert - can be extended to create request
                  alert('Create request inside folder: ' + item.name);
                }}
                className="p-1 hover:bg-zinc-700 rounded transition"
                title="Add request"
              >
                <FilePlus className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${item.name}"?`)) {
                    deleteCollection(item.id);
                  }
                }}
                className="p-1 hover:bg-red-900/30 rounded transition"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Render children if expanded */}
          {hasChildren && isExpanded && <div>{renderTree(item.children, level + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Collections</h3>
        <button
          onClick={() => {
            setParentId(null);
            setShowCreateModal(true);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
        >
          + New
        </button>
      </div>

      {/* Tree view */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Folder className="h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No collections yet</p>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-[160px]">
              Create your first collection or folder to organize your API requests.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">{renderTree(treeData)}</div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              {parentId ? 'Create Sub-Folder' : 'Create New Collection'}
            </h3>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyPress={e => e.key === 'Enter' && handleCreateCollection()}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName('');
                  setParentId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsExplorer;
