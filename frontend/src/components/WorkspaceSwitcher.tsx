import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useWorkspaceStore from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { CreateWorkspacePayload } from '../types/workspace';

const WorkspaceSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuthStore();
  const {
    workspaces,
    currentWorkspaceId,
    fetchWorkspaces,
    setCurrentWorkspace,
    createWorkspace,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [fetchWorkspaces, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
        <span className="text-zinc-400 text-xs font-semibold">Guest Workspace</span>
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    const payload: CreateWorkspacePayload = {
      name: newWorkspaceName.trim(),
      description: newWorkspaceDescription.trim() || undefined,
    };

    const result = await createWorkspace(payload);
    if (result) {
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setShowCreateModal(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {}
      <div
        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {currentWorkspace ? (
            <>
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {getInitials(currentWorkspace.name)}
              </div>
              <span className="text-white font-medium truncate">{currentWorkspace.name}</span>
            </>
          ) : (
            <span className="text-gray-400">{isLoading ? 'Loading...' : 'Select Workspace'}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {}
      {error && (
        <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-red-100">
            ×
          </button>
        </div>
      )}

      {}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700">
          <div className="max-h-60 overflow-y-auto">
            {workspaces.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm">
                {isLoading ? 'Loading workspaces...' : 'No workspaces found'}
              </div>
            ) : (
              workspaces.map(workspace => (
                <div
                  key={workspace.id}
                  className={`px-4 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    workspace.id === currentWorkspaceId ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    setCurrentWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        workspace.id === currentWorkspaceId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {getInitials(workspace.name)}
                    </div>
                    <span
                      className={`truncate ${workspace.id === currentWorkspaceId ? 'text-white' : 'text-gray-300'}`}
                    >
                      {workspace.name}
                    </span>
                  </div>
                  {workspace.id === currentWorkspaceId && (
                    <svg
                      className="w-4 h-4 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>

          {}
          <div className="border-t border-gray-700 p-2">
            <button
              className="w-full px-4 py-2.5 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2"
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Workspace
            </button>
          </div>
        </div>
      )}

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">Create New Workspace</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Workspace Name *</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyPress={e => e.key === 'Enter' && handleCreateWorkspace()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newWorkspaceDescription}
                  onChange={e => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyPress={e => e.key === 'Enter' && handleCreateWorkspace()}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                  setNewWorkspaceDescription('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim() || isLoading}
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

export default WorkspaceSwitcher;
