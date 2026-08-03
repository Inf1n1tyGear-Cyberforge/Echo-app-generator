import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import OnboardingStep from '../components/OnboardingStep';
import OnboardingProgress from '../components/OnboardingProgress';
import { UserRole, TechnicalLevel, UserGoal } from '../types';
import { supabase } from '../lib/supabase';

const ONBOARDING_STEPS = ['Welcome', 'Your Goals', 'Experience', 'Dashboard'];

const roleOptions: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  { value: 'product-manager', label: 'Product Manager', emoji: '📋', desc: 'Define features and workflows' },
  { value: 'developer', label: 'Developer', emoji: '💻', desc: 'Build and ship the app' },
  { value: 'designer', label: 'Designer', emoji: '🎨', desc: 'Design the user experience' },
  { value: 'founder', label: 'Founder', emoji: '🚀', desc: 'Launch the product' },
  { value: 'other', label: 'Other', emoji: '✨', desc: 'Exploring Echo' },
];

const goalOptions: { value: UserGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'build-app', label: 'Build an App', emoji: '📱', desc: 'Create a complete mobile app from scratch' },
  { value: 'prototype', label: 'Prototype an Idea', emoji: '💡', desc: 'Quickly validate a concept' },
  { value: 'learn', label: 'Learn & Explore', emoji: '🧠', desc: 'Understand how Echo works' },
  { value: 'automate', label: 'Automate a Workflow', emoji: '⚡', desc: 'Turn a manual process into an app' },
  { value: 'other', label: 'Something Else', emoji: '🌟', desc: 'I have my own reason' },
];

const experienceOptions: { value: TechnicalLevel; label: string; emoji: string; desc: string }[] = [
  { value: 'no-code', label: 'No-Code', emoji: '🪄', desc: 'I prefer visual tools, no coding' },
  { value: 'low-code', label: 'Low-Code', emoji: '🔧', desc: 'I can tweak code and use APIs' },
  { value: 'developer', label: 'Developer', emoji: '⌨️', desc: 'I write production code' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [technicalLevel, setTechnicalLevel] = useState<TechnicalLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already completed onboarding
  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      // Already onboarded → go to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  const toggleGoal = (goal: UserGoal) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal],
    );
  };

  const saveProfile = async () => {
    if (!role || !technicalLevel || goals.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error: saveError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName || null,
          role,
          goals,
          technical_level: technicalLevel,
        }, { onConflict: 'user_id' });

      if (saveError) throw saveError;

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canProceedStep = (): boolean => {
    switch (currentStep) {
      case 0: return displayName.trim().length > 0 && role !== null;
      case 1: return goals.length > 0;
      case 2: return technicalLevel !== null;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-heading font-bold text-lg text-foreground">Echo</span>
        </div>

        {/* Progress */}
        <OnboardingProgress steps={ONBOARDING_STEPS} currentStep={currentStep} />

        {/* Card */}
        <div className="card p-6 sm:p-8">
          {currentStep === 0 && (
            <OnboardingStep
              title="Welcome to Echo!"
              subtitle="Let's personalize your experience"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={canProceedStep()}
              isFirstStep
            >
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field"
                    maxLength={50}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    What's your role?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRole(opt.value)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          role === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="text-lg mb-1">{opt.emoji}</div>
                        <div className={`text-xs font-medium ${role === opt.value ? 'text-foreground' : 'text-text-muted'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </OnboardingStep>
          )}

          {currentStep === 1 && (
            <OnboardingStep
              title="What are your goals?"
              subtitle="Select all that apply"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={canProceedStep()}
            >
              <div className="space-y-2">
                {goalOptions.map((opt) => {
                  const selected = goals.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleGoal(opt.value)}
                      className={`w-full p-4 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="text-xl">{opt.emoji}</div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-text-muted'}`}>
                          {opt.label}
                        </div>
                        <div className="text-xs text-text-dim">{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-on-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </OnboardingStep>
          )}

          {currentStep === 2 && (
            <OnboardingStep
              title="What's your technical experience?"
              subtitle="This helps us tailor the code output for you"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={canProceedStep()}
            >
              <div className="space-y-2">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTechnicalLevel(opt.value)}
                    className={`w-full p-4 rounded-lg border text-left transition-all cursor-pointer ${
                      technicalLevel === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{opt.emoji}</div>
                      <div>
                        <div className={`text-sm font-medium ${technicalLevel === opt.value ? 'text-foreground' : 'text-text-muted'}`}>
                          {opt.label}
                        </div>
                        <div className="text-xs text-text-dim">{opt.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </OnboardingStep>
          )}

          {currentStep === 3 && (
            <OnboardingStep
              title="You're all set!"
              subtitle="Here's what Echo will tailor for you"
              onNext={handleNext}
              onBack={handleBack}
              canProceed={true}
              isLastStep
              loading={saving}
            >
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">
                      {roleOptions.find(r => r.value === role)?.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {roleOptions.find(r => r.value === role)?.label}
                      </div>
                      <div className="text-xs text-text-dim">Your role</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">
                      {experienceOptions.find(e => e.value === technicalLevel)?.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {experienceOptions.find(e => e.value === technicalLevel)?.label}
                      </div>
                      <div className="text-xs text-text-dim">Experience level</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-text-dim mb-1.5">Your goals:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {goals.map(g => (
                        <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {goalOptions.find(opt => opt.value === g)?.label || g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-muted text-center leading-relaxed">
                  Echo will use this to personalize your experience — from tailored recommendations to code output that matches your skill level.
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}
            </OnboardingStep>
          )}
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="text-xs text-text-dim hover:text-text-muted transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
