import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Brain, FileCode, Smartphone, Rocket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeEvents } from '../lib/openrouter';
import { generateReactNativeCode } from '../lib/code-generator';
import { getRecommendations } from '../lib/recommendations';

const steps = [
  { id: 'analyzing', label: 'Analyzing your workflow with AI...', icon: Brain },
  { id: 'mapping', label: 'Mapping screens, actions & data models...', icon: Smartphone },
  { id: 'generating', label: 'Generating React Native code...', icon: FileCode },
  { id: 'optimizing', label: 'Optimizing and polishing...', icon: Rocket },
  { id: 'complete', label: 'Your app is ready!', icon: Sparkles },
];

const textOnlySteps = [
  { id: 'designing', label: 'Designing your app architecture...', icon: Brain },
  { id: 'mapping', label: 'Mapping screens, actions & data models...', icon: Smartphone },
  { id: 'generating', label: 'Generating React Native code...', icon: FileCode },
  { id: 'optimizing', label: 'Optimizing and polishing...', icon: Rocket },
  { id: 'complete', label: 'Your app is ready!', icon: Sparkles },
];

export default function Processing() {
  const navigate = useNavigate();
  const { state, setIntentMap, setGeneratedCode, setSessionStatus } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [progressLabel, setProgressLabel] = useState('');
  const processedRef = useRef(false);

  const isTextToApp = state.currentSession?.targetUrl?.startsWith('text-to-app://');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    const process = async () => {
      const session = state.currentSession;

      // Check if we already have an intent map (text-to-app flow)
      if (session?.intentMap) {
        console.log('[Processing] Intent map already present, skipping analysis');
        setCurrentStep(1);
        setProgressLabel(`App has ${session.intentMap.screens.length} screens, ${session.intentMap.actions.length} actions`);
        await delay(800);

        setCurrentStep(2);
        setProgressLabel('Building component files and navigation...');
        await delay(400);

        const code = generateReactNativeCode(session.intentMap);
        setGeneratedCode(code);

        setCurrentStep(3);
        const fileCount = Object.keys(code).length;
        setProgressLabel(`${fileCount} files created and optimized`);
        await delay(600);

        // Generate recommendations
        try {
          const recommendations = await getRecommendations(session.intentMap);
          sessionStorage.setItem('echo_recommendations', JSON.stringify(recommendations));
        } catch {
          // Non-critical
        }

        setCurrentStep(4);
        setProgressLabel(`Generated ${fileCount} files for ${session.intentMap.appName || 'your app'}`);
        await delay(500);

        setSessionStatus('complete');
        navigate('/results');
        return;
      }

      // Recording flow: need events
      if (!session || session.events.length === 0) {
        setError('No recording data found. Please record your workflow first.');
        setSessionStatus('failed');
        return;
      }

      try {
        // Step 1: Analyze events with AI
        setCurrentStep(0);
        setProgressLabel('Sending to AI analysis engine...');
        await delay(800);
        const intentMap = await analyzeEvents(session.events);
        setIntentMap(intentMap);

        // Step 2: Map features
        setCurrentStep(1);
        setProgressLabel(`Identified ${intentMap.screens.length} screens, ${intentMap.actions.length} actions`);
        await delay(1200);

        // Step 3: Generate code
        setCurrentStep(2);
        setProgressLabel('Building component files and navigation...');
        await delay(600);
        const code = generateReactNativeCode(intentMap);
        setGeneratedCode(code);

        // Step 4: Optimize
        setCurrentStep(3);
        const fileCount = Object.keys(code).length;
        setProgressLabel(`${fileCount} files created and optimized`);
        await delay(800);

        // Generate AI recommendations
        try {
          const recommendations = await getRecommendations(intentMap);
          sessionStorage.setItem('echo_recommendations', JSON.stringify(recommendations));
        } catch {
          // Non-critical
        }

        // Step 5: Complete
        setCurrentStep(4);
        setProgressLabel(`Generated ${fileCount} files for ${intentMap.appName || 'your app'}`);
        await delay(500);

        setSessionStatus('complete');
        navigate('/results');
      } catch (err: any) {
        setError(err.message || 'Something went wrong during processing');
        setSessionStatus('failed');
      }
    };

    process();
  }, []);

  const handleRetry = () => {
    setError('');
    setCurrentStep(0);
    navigate('/templates');
  };

  const activeSteps = isTextToApp && state.currentSession?.intentMap ? textOnlySteps : steps;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative inline-flex">
            <Sparkles className="w-10 h-10 text-primary animate-spin-slow" />
            {currentStep < 4 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-recording rounded-full animate-pulse-recording" />
            )}
          </div>
        </div>

        {error ? (
          /* Error state */
          <div className="card p-8 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Generation Failed
            </h2>
            <p className="text-text-muted text-sm mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRetry} className="btn-primary py-2 px-6 cursor-pointer">
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary py-2 px-6 cursor-pointer">
                Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Processing steps */
          <div className="card p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">
              Building your app
            </h2>
            <p className="text-text-muted text-sm mb-8">
              {progressLabel || "Echo's AI is working on your app"}
            </p>

            <div className="space-y-3 text-left">
              {activeSteps.map((step, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-primary/10 scale-[1.02]' : isDone ? 'bg-success/5' : ''
                    }`}
                  >
                    {isDone ? (
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                    ) : isActive ? (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-text-dim" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${
                        isDone ? 'text-success' :
                        isActive ? 'text-foreground font-medium' :
                        'text-text-dim'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / activeSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}