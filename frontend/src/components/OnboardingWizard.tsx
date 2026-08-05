import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Send,
  Folder,
  Database,
} from 'lucide-react';
import useOnboardingStore from '../store/onboardingStore';

const OnboardingWizard: React.FC = () => {
  const { isOpen, currentStep, totalSteps, nextStep, prevStep, closeWizard, completeOnboarding } =
    useOnboardingStore();
  const [isCompleting, setIsCompleting] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      closeWizard();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const steps = [
    {
      title: 'Welcome to Kyreqo! 🚀',
      icon: <Sparkles className="h-10 w-10 text-indigo-400" />,
      content: (
        <div className="text-center">
          <p className="text-zinc-300 text-sm mb-2">
            Kyreqo is a modern API testing platform designed for fast, safe, and collaborative API
            request design.
          </p>
          <p className="text-zinc-400 text-xs">Let's take a quick tour to get you started!</p>
        </div>
      ),
    },
    {
      title: 'Your First Request',
      icon: <Send className="h-10 w-10 text-emerald-400" />,
      content: (
        <div className="text-center">
          <p className="text-zinc-300 text-sm mb-2">
            To test an API, simply enter a URL and click{' '}
            <strong className="text-indigo-400">Send</strong>.
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-left text-xs font-mono text-zinc-300">
            <span className="text-emerald-400">GET</span>
            <span className="text-zinc-400"> https://jsonplaceholder.typicode.com/todos/1</span>
          </div>
          <p className="text-zinc-500 text-xs mt-2">Try it yourself after the tour!</p>
        </div>
      ),
    },
    {
      title: 'Organize with Workspaces',
      icon: <Folder className="h-10 w-10 text-amber-400" />,
      content: (
        <div className="text-center">
          <p className="text-zinc-300 text-sm mb-2">
            Use <strong className="text-amber-400">Workspaces</strong> to organize your projects and
            collections.
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-left text-xs text-zinc-300">
            <div className="flex items-center gap-2 mb-1">
              <Folder className="h-3.5 w-3.5 text-amber-400" />
              <span>My Project</span>
            </div>
            <div className="pl-5 text-zinc-400 text-[10px]">└── API Collections</div>
          </div>
          <p className="text-zinc-500 text-xs mt-2">Switch workspaces from the sidebar dropdown.</p>
        </div>
      ),
    },
    {
      title: 'Environment Variables',
      icon: <Database className="h-10 w-10 text-purple-400" />,
      content: (
        <div className="text-center">
          <p className="text-zinc-300 text-sm mb-2">
            Use <strong className="text-purple-400">Environment Variables</strong> to reuse values
            across requests.
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-left text-xs font-mono text-zinc-300">
            <span className="text-zinc-400">URL: </span>
            <span className="text-purple-400">{'{{base_url}}'}</span>
            <span className="text-zinc-400">/users</span>
          </div>
          <p className="text-zinc-500 text-xs mt-2">
            Click the 🌐 dropdown in the header to manage environments.
          </p>
        </div>
      ),
    },
    {
      title: "You're Ready! 🎉",
      icon: <Check className="h-10 w-10 text-green-400" />,
      content: (
        <div className="text-center">
          <p className="text-zinc-300 text-sm mb-2">You now know the basics of Kyreqo!</p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
            <p>✅ Test REST APIs with ease</p>
            <p>✅ Organize with workspaces and collections</p>
            <p>✅ Use environment variables</p>
            <p className="mt-1 text-indigo-400 font-semibold">Happy testing! 🚀</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={closeWizard}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-zinc-500">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition ${
                  i === currentStep
                    ? 'bg-indigo-500'
                    : i < currentStep
                      ? 'bg-indigo-500/40'
                      : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center py-4">
          <div className="mb-4">{currentStepData.icon}</div>
          <h2 className="text-lg font-bold text-white text-center mb-2">{currentStepData.title}</h2>
          <div className="w-full">{currentStepData.content}</div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg transition ${
              currentStep === 0
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {isCompleting ? 'Completing...' : 'Get Started'}
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
