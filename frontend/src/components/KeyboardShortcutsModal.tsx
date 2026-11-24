import { HelpCircle, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: 'Ctrl/Cmd + Enter', description: 'Send the current HTTP request' },
  { keys: 'H', description: 'Toggle between History and Collections' },
  { keys: '?', description: 'Open this keyboard shortcuts guide' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="w-full max-w-md bg-[#0c0c10] border border-[#1f1f29] rounded-xl p-6 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 id="keyboard-shortcuts-title" className="text-sm font-semibold text-white">
                Keyboard shortcuts
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Work faster with these shortcuts.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {shortcuts.map(shortcut => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5"
            >
              <span className="text-xs text-zinc-300">{shortcut.description}</span>
              <kbd className="shrink-0 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-indigo-300">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
