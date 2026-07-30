import React, { useState, useEffect } from 'react';
import { Globe, Check, ChevronDown, Edit } from 'lucide-react';
import useEnvironmentStore from '../store/environmentStore';
import EnvironmentModal from './EnvironmentModal';

interface EnvironmentSelectorProps {
  workspaceId: string;
}

const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({ workspaceId }) => {
  const { environments, activeEnvironmentId, fetchEnvironments, setActiveEnvironment, isLoading } =
    useEnvironmentStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchEnvironments(workspaceId);
    }
  }, [workspaceId, fetchEnvironments]);

  const activeEnvironment = environments.find(e => e.id === activeEnvironmentId);

  const handleSelect = (id: string) => {
    setActiveEnvironment(id);
    setIsOpen(false);
  };

  const handleOpenManager = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative">
        {/* Selector Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg hover:border-zinc-700 transition text-sm"
        >
          <Globe className="h-4 w-4 text-indigo-400" />
          <span className="text-zinc-200 font-medium">
            {isLoading ? 'Loading...' : activeEnvironment?.name || 'No Environment'}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <div className="max-h-60 overflow-y-auto">
              {environments.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm text-center">
                  No environments created yet
                </div>
              ) : (
                environments.map(env => (
                  <div
                    key={env.id}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-700 transition ${
                      env.id === activeEnvironmentId ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => handleSelect(env.id)}
                  >
                    <span
                      className={`text-sm ${env.id === activeEnvironmentId ? 'text-white' : 'text-gray-300'}`}
                    >
                      {env.name}
                    </span>
                    {env.id === activeEnvironmentId && <Check className="h-4 w-4 text-green-400" />}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-700 p-2">
              <button
                onClick={handleOpenManager}
                className="w-full px-4 py-2 text-sm text-indigo-400 hover:bg-gray-700 rounded transition flex items-center justify-center gap-2"
              >
                <Edit className="h-3.5 w-3.5" />
                Manage Environments
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Environment Modal */}
      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
      />
    </>
  );
};

export default EnvironmentSelector;
