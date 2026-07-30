import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import useEnvironmentStore, { EnvironmentVariable } from '../store/environmentStore';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const EnvironmentModal: React.FC<EnvironmentModalProps> = ({ isOpen, onClose, workspaceId }) => {
  const {
    environments,
    activeEnvironmentId,
    fetchEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    isLoading,
    error,
    clearError,
  } = useEnvironmentStore();

  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [envName, setEnvName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchEnvironments(workspaceId);
    }
  }, [isOpen, workspaceId, fetchEnvironments]);

  useEffect(() => {
    if (environments.length > 0 && !selectedEnvId) {
      setSelectedEnvId(activeEnvironmentId || environments[0]?.id || null);
    }
  }, [environments, activeEnvironmentId, selectedEnvId]);

  useEffect(() => {
    const selected = environments.find(e => e.id === selectedEnvId);
    if (selected) {
      setVariables(selected.variables || []);
      setEnvName(selected.name);
    } else {
      setVariables([]);
      setEnvName('');
    }
  }, [selectedEnvId, environments]);

  const handleAddVariable = () => {
    setVariables([...variables, { key: '', value: '', enabled: true }]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleVariableChange = (
    index: number,
    field: keyof EnvironmentVariable,
    value: string | boolean
  ) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const handleSaveEnvironment = async () => {
    if (!selectedEnvId) return;

    const updated = await updateEnvironment(selectedEnvId, {
      variables: variables,
    });

    if (updated) {
      await fetchEnvironments(workspaceId);
    }
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvName.trim()) return;

    const created = await createEnvironment({
      name: newEnvName.trim(),
      workspace: workspaceId,
      variables: [{ key: '', value: '', enabled: true }],
    });

    if (created) {
      setNewEnvName('');
      setIsCreatingNew(false);
      setSelectedEnvId(created.id);
      await fetchEnvironments(workspaceId);
    }
  };

  const handleDeleteEnvironment = async () => {
    if (!selectedEnvId) return;
    if (!confirm('Delete this environment and all its variables?')) return;

    await deleteEnvironment(selectedEnvId);
    setSelectedEnvId(environments.length > 1 ? environments[0]?.id || null : null);
  };

  const handleActivateEnvironment = () => {
    if (selectedEnvId) {
      setActiveEnvironment(selectedEnvId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {}
        {error && (
          <div className="mx-4 mt-4 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-300 hover:text-red-100">
              ×
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {}
          <div className="w-64 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Environments
              </h3>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + New
              </button>
            </div>

            {isCreatingNew && (
              <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-700">
                <input
                  type="text"
                  value={newEnvName}
                  onChange={e => setNewEnvName(e.target.value)}
                  placeholder="Environment name"
                  className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  onKeyPress={e => e.key === 'Enter' && handleCreateEnvironment()}
                />
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={handleCreateEnvironment}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                    disabled={!newEnvName.trim() || isLoading}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {environments.map(env => (
                <div
                  key={env.id}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition ${
                    selectedEnvId === env.id
                      ? 'bg-indigo-600/20 border border-indigo-500/30'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedEnvId(env.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {activeEnvironmentId === env.id && (
                      <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${selectedEnvId === env.id ? 'text-white' : 'text-gray-300'}`}
                    >
                      {env.name}
                    </span>
                  </div>
                  {activeEnvironmentId === env.id && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {selectedEnvId ? (
              <>
                {}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{envName}</h3>
                    {activeEnvironmentId === selectedEnvId && (
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleActivateEnvironment}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                    >
                      Activate
                    </button>
                    <button
                      onClick={handleDeleteEnvironment}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {}
                <div className="flex-1 overflow-y-auto">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Variables</span>
                    <button
                      onClick={handleAddVariable}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Variable
                    </button>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                        <th className="pb-2 w-12">#</th>
                        <th className="pb-2 w-1/3">Key</th>
                        <th className="pb-2 w-1/3">Value</th>
                        <th className="pb-2 w-16 text-center">Enabled</th>
                        <th className="pb-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variables.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-500 text-sm">
                            No variables yet. Click "Add Variable" to create one.
                          </td>
                        </tr>
                      ) : (
                        variables.map((variable, index) => (
                          <tr key={index} className="border-b border-gray-800/50">
                            <td className="py-1.5 text-xs text-gray-500">{index + 1}</td>
                            <td className="py-1.5 pr-2">
                              <input
                                type="text"
                                value={variable.key}
                                onChange={e => handleVariableChange(index, 'key', e.target.value)}
                                placeholder="KEY_NAME"
                                className="w-full px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-1.5 pr-2">
                              <input
                                type="text"
                                value={variable.value}
                                onChange={e => handleVariableChange(index, 'value', e.target.value)}
                                placeholder="value"
                                className="w-full px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={variable.enabled}
                                onChange={e =>
                                  handleVariableChange(index, 'enabled', e.target.checked)
                                }
                                className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <button
                                onClick={() => handleRemoveVariable(index)}
                                className="p-1 hover:bg-red-900/30 rounded transition"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {}
                <div className="pt-3 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={handleSaveEnvironment}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select an environment to edit</p>
                  <p className="text-sm text-gray-600 mt-1">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentModal;
