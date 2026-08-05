import { create } from 'zustand';
import { apiClient } from '../api/client';

interface OnboardingState {
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleting: boolean;
  hasCompletedOnboarding: boolean;

  openWizard: () => void;
  closeWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  resetWizard: () => void;
  reset: () => void;
  syncFromUser: (user: { has_completed_onboarding?: boolean }) => void;
}

const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOpen: false,
  currentStep: 0,
  totalSteps: 5,
  isCompleting: false,
  hasCompletedOnboarding: localStorage.getItem('onboarding_completed') === 'true',

  openWizard: () => set({ isOpen: true, currentStep: 0 }),

  closeWizard: () => set({ isOpen: false }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step: number) => set({ currentStep: step }),

  completeOnboarding: async () => {
    set({ isCompleting: true });
    try {
      await apiClient('/api/accounts/complete-onboarding/', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      localStorage.setItem('onboarding_completed', 'true');
      set({ hasCompletedOnboarding: true, isCompleting: false });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      set({ isCompleting: false });
    }
  },

  resetWizard: () => set({ isOpen: false, currentStep: 0, isCompleting: false }),
  reset: () => {
    localStorage.removeItem('onboarding_completed');
    set({ isOpen: false, currentStep: 0, isCompleting: false, hasCompletedOnboarding: false });
  },

  syncFromUser: user => {
    const completed = !!user?.has_completed_onboarding;
    localStorage.setItem('onboarding_completed', completed ? 'true' : 'false');
    set({ hasCompletedOnboarding: completed });
  },
}));

export default useOnboardingStore;
