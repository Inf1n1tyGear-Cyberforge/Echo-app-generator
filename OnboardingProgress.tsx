import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  steps: string[];
  currentStep: number;
}

export default function OnboardingProgress({ steps, currentStep }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            {/* Step circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                isCompleted
                  ? 'bg-primary text-on-primary'
                  : isCurrent
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-text-dim'
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>

            {/* Label (hidden on mobile) */}
            <span
              className={`hidden sm:block text-xs font-medium ${
                isCurrent ? 'text-foreground' : 'text-text-dim'
              }`}
            >
              {label}
            </span>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 ${
                  isCompleted ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
