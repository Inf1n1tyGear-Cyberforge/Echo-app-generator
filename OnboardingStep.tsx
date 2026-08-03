import { ReactNode } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingStepProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  canProceed?: boolean;
  isLastStep?: boolean;
  isFirstStep?: boolean;
  loading?: boolean;
}

export default function OnboardingStep({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  canProceed = true,
  isLastStep = false,
  isFirstStep = false,
  loading = false,
}: OnboardingStepProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-text-muted text-sm">{subtitle}</p>
      </div>

      <div className="mb-8">
        {children}
      </div>

      <div className="flex items-center justify-between gap-4">
        {!isFirstStep ? (
          <button
            onClick={onBack}
            className="btn-secondary py-2.5 px-5 flex items-center gap-1.5 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={onNext}
          disabled={!canProceed || loading}
          className="btn-primary py-2.5 px-5 flex items-center gap-1.5 text-sm disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              {isLastStep ? 'Get Started' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
