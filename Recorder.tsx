import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, StopCircle, Mic, MicOff,
  MousePointerClick, Keyboard, Navigation,
  Camera, Monitor, Wand2, LayoutDashboard,
  ShoppingCart, Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecordingIndicator from '../components/RecordingIndicator';
import SimulatedPMApp from '../components/SimulatedPMApp';
import SimulatedEcommerceApp from '../components/SimulatedEcommerceApp';
import SimulatedHabitTrackerApp from '../components/SimulatedHabitTrackerApp';
import RecordingControls from '../components/RecordingControls';
import VibeCodingInput from '../components/VibeCodingInput';
import { eventRecorder } from '../lib/event-recorder';
import { MediaRecordingResult, startMicRecording, stopMicRecording, isMicRecordingSupported } from '../lib/media-recorder';

type DemoType = 'flowboard' | 'shopwave' | 'habitspark';

const DEMO_META: Record<DemoType, { name: string; icon: typeof LayoutDashboard; gradient: string }> = {
  flowboard: { name: 'FlowBoard Demo', icon: LayoutDashboard, gradient: 'from-primary/30 to-accent/30' },
  shopwave: { name: 'ShopWave Demo', icon: ShoppingCart, gradient: 'from-emerald-400/30 to-cyan-500/30' },
  habitspark: { name: 'HabitSpark Demo', icon: Flame, gradient: 'from-amber-400/30 to-orange-500/30' },
};

export default function Recorder() {
  const navigate = useNavigate();
  const { state, addEvents, setSessionStatus, setDuration, setRecordingMedia } = useApp();
  const { currentSession, userProfile } = state;
  const [isRecording, setIsRecording] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showTooltip, setShowTooltip] = useState(true);
  const [stage, setStage] = useState<'record' | 'review' | 'vibe-coding'>('record');
  const [mediaResult, setMediaResult] = useState<MediaRecordingResult | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTime, setVoiceTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const voiceTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Determine which demo to show from the session URL
  const demoType: DemoType = useMemo(() => {
    const url = currentSession?.targetUrl || '';
    if (url.includes('shopwave')) return 'shopwave';
    if (url.includes('habitspark')) return 'habitspark';
    return 'flowboard';
  }, [currentSession?.targetUrl]);

  const demoMeta = DEMO_META[demoType];

  const demoUrl = `demo://${demoType}`;

  // Map demo type to component
  const DemoComponent = useMemo(() => {
    switch (demoType) {
      case 'shopwave': return SimulatedEcommerceApp;
      case 'habitspark': return SimulatedHabitTrackerApp;
      default: return SimulatedPMApp;
    }
  }, [demoType]);

  // Auto-start recording when page loads
  useEffect(() => {
    if (currentSession) {
      eventRecorder.start(demoUrl);
      setIsRecording(true);
      setEventCount(0);
      setShowTooltip(true);
      const tooltipTimer = setTimeout(() => setShowTooltip(false), 6000);
      return () => clearTimeout(tooltipTimer);
    }
  }, [currentSession, demoUrl]);

  // Timer for elapsed recording time
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsed(eventRecorder.getDuration());
        setEventCount(eventRecorder.getEventCount());
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Poll for new events from the demo app
  useEffect(() => {
    const interval = setInterval(() => {
      const count = eventRecorder.getEventCount();
      if (count > eventCount) {
        setEventCount(count);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [eventCount]);

  const stopRecording = useCallback(() => {
    if (isVoiceRecording) {
      try { stopMicRecording(); } catch {}
      setIsVoiceRecording(false);
      setVoiceTime(0);
      clearInterval(voiceTimerRef.current);
    }
    const events = eventRecorder.stop();
    addEvents(events);
    setDuration(eventRecorder.getDuration());
    setIsRecording(false);
    setStage('review');
  }, [addEvents, setDuration, isVoiceRecording]);

  const handleMediaRecordingComplete = useCallback((result: MediaRecordingResult) => {
    setMediaResult(result);
    if (result.screenBlob || result.audioBlob) {
      setRecordingMedia({
        screenBlob: result.screenBlob || undefined,
        audioBlob: result.audioBlob || undefined,
        screenDurationMs: result.screenDurationMs,
        audioDurationMs: result.audioDurationMs,
      });
    }
  }, [setRecordingMedia]);

  const toggleVoiceRecording = useCallback(async () => {
    if (isVoiceRecording) {
      const result = stopMicRecording();
      setIsVoiceRecording(false);
      setVoiceTime(0);
      clearInterval(voiceTimerRef.current);
      handleMediaRecordingComplete(result);
    } else {
      if (!isMicRecordingSupported()) return;
      try {
        await startMicRecording();
        setIsVoiceRecording(true);
        setVoiceTime(0);
        let secs = 0;
        voiceTimerRef.current = setInterval(() => {
          secs += 1;
          setVoiceTime(secs * 1000);
        }, 1000);
      } catch (err: any) {
        console.error('Failed to start mic:', err);
      }
    }
  }, [isVoiceRecording, handleMediaRecordingComplete]);

  const handleVibeCodingSubmit = (prompt: string) => {
    setSessionStatus('processing');
    if (currentSession) {
      currentSession.vibeCodingPrompt = prompt;
    }
    navigate('/processing');
  };

  const handleProceedWithoutVibe = () => {
    setSessionStatus('processing');
    navigate('/processing');
  };

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const recentEvents = eventRecorder.getEvents();
  const lastEvent = recentEvents[recentEvents.length - 1];

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">No session active</h2>
          <p className="text-text-muted text-sm mb-6">Start a new demo from the dashboard to begin recording.</p>
          <button onClick={() => navigate('/templates')} className="btn-primary py-2 px-6 cursor-pointer">
            Start Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <div className="glass border-b border-border/50 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/templates')}
            className="text-text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${demoMeta.gradient} flex items-center justify-center`}>
              <demoMeta.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{demoMeta.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live event feed */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-dim max-w-[200px] truncate">
            {lastEvent && stage === 'record' && (
              <>
                {lastEvent.type === 'click' && <MousePointerClick className="w-3 h-3 text-primary shrink-0" />}
                {lastEvent.type === 'input' && <Keyboard className="w-3 h-3 text-accent shrink-0" />}
                {lastEvent.type === 'navigation' && <Navigation className="w-3 h-3 text-success shrink-0" />}
                <span className="truncate">{lastEvent.target}</span>
              </>
            )}
          </div>

          <RecordingIndicator isRecording={isRecording && stage === 'record'} eventCount={eventCount} />

          {/* Voice recording toggle */}
          {isRecording && stage === 'record' && isMicRecordingSupported() && (
            <button
              onClick={toggleVoiceRecording}
              title={isVoiceRecording ? 'Stop voice recording' : 'Start voice narration'}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                isVoiceRecording
                  ? 'bg-recording/15 text-recording border border-recording/30'
                  : 'bg-surface border border-border/50 text-text-muted hover:text-foreground hover:border-primary/30'
              }`}
            >
              {isVoiceRecording ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-recording opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-recording" />
                  </span>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{formatTime(voiceTime)}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voice</span>
                </>
              )}
            </button>
          )}

          {isRecording && stage === 'record' && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-recording text-white text-sm font-medium hover:bg-red-600 transition-all active:scale-95 cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Finish & Review</span>
              <span className="sm:hidden">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      {stage === 'record' && (
        <div className="px-4 sm:px-6 py-1.5 border-b border-border/20 flex items-center justify-between text-xs text-text-dim shrink-0">
          <span className="flex items-center gap-1">
            <Camera className="w-3 h-3" />
            Recording · {formatTime(elapsed)}
          </span>
          <span>{eventCount} events captured</span>
        </div>
      )}

      {/* Tooltip hint */}
      {showTooltip && stage === 'record' && (
        <div className="px-4 sm:px-6 py-2 bg-primary/10 border-b border-primary/20 text-center shrink-0">
          <p className="text-sm text-primary/90">
            {demoType === 'flowboard' && 'Interact with the demo project management app — create projects, add tasks, change statuses. Echo is recording everything.'}
            {demoType === 'shopwave' && 'Browse products, add items to your cart, and go through checkout. Echo is recording everything.'}
            {demoType === 'habitspark' && 'Track your habits, check off daily goals, and explore stats. Echo is recording everything.'}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Demo App */}
        <div className={`flex-1 relative overflow-hidden bg-surface/50 ${stage !== 'record' ? 'hidden lg:block' : ''}`}>
          <DemoComponent />
        </div>

        {/* Review / Vibe Coding Panel */}
        {stage === 'review' && (
          <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Recording summary */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recording Complete</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Events captured</span>
                    <span className="text-foreground font-medium">{eventCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Duration</span>
                    <span className="text-foreground font-medium">{formatTime(elapsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Screen recording</span>
                    <span className="text-foreground font-medium">{mediaResult?.screenBlob ? '✓ Captured' : 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Voice recording</span>
                    <span className="text-foreground font-medium">{mediaResult?.audioBlob ? '✓ Captured' : 'Not recorded'}</span>
                  </div>
                </div>
              </div>

              {/* Media Recording Controls */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Record Screen & Voice (optional)</span>
                </div>
                <RecordingControls
                  onRecordingComplete={handleMediaRecordingComplete}
                  disabled={false}
                  initialMode="both"
                />
              </div>

              {/* Proceed button */}
              <button
                onClick={handleProceedWithoutVibe}
                className="w-full py-3 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer"
              >
                Generate App Now
              </button>
            </div>
          </div>
        )}

        {/* Vibe Coding Panel */}
        {stage === 'vibe-coding' && (
          <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              <VibeCodingInput
                onSubmit={handleVibeCodingSubmit}
                contextInfo={`Based on ${eventCount} recorded interactions from the ${demoMeta.name} demo. ${userProfile?.displayName ? `Personalized for ${userProfile.displayName}.` : ''}`}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs text-text-dim">
                  <span className="bg-surface px-2">or</span>
                </div>
              </div>

              <button
                onClick={handleProceedWithoutVibe}
                className="w-full py-2.5 rounded-lg border border-border text-text-muted text-sm hover:border-primary/40 hover:text-foreground transition-all cursor-pointer"
              >
                Skip Vibe Coding & Generate App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}