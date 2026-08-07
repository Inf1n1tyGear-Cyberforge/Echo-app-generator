import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor, Mic, MicOff, Video, VideoOff,
  Play, Pause, Square, Clock, Sparkles,
  Loader2,
} from 'lucide-react';
import {
  startScreenRecording,
  stopScreenRecording,
  startMicRecording,
  stopMicRecording,
  pauseRecording,
  resumeRecording,
  getRecordingDuration,
  isCurrentlyRecording,
  isScreenRecordingSupported,
  isMicRecordingSupported,
  MediaRecordingResult,
} from '../lib/media-recorder';

export type RecordingMode = 'none' | 'screen' | 'mic' | 'both';

interface RecordingControlsProps {
  onRecordingComplete: (result: MediaRecordingResult) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  initialMode?: RecordingMode;
}

export default function RecordingControls({
  onRecordingComplete,
  onRecordingStateChange,
  disabled = false,
  initialMode = 'both',
}: RecordingControlsProps) {
  const [mode, setMode] = useState<RecordingMode>(initialMode);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [activeModes, setActiveModes] = useState<{ screen: boolean; mic: boolean }>({
    screen: mode === 'screen' || mode === 'both',
    mic: mode === 'mic' || mode === 'both',
  });
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const screenSupported = isScreenRecordingSupported();
  const micSupported = isMicRecordingSupported();

  // Timer for elapsed time
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed(getRecordingDuration());
      }, 200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const shouldIncludeMic = mode === 'both' || mode === 'mic';
      const shouldIncludeScreen = mode === 'both' || mode === 'screen';

      if (shouldIncludeScreen) {
        await startScreenRecording(shouldIncludeMic);
      } else if (shouldIncludeMic) {
        await startMicRecording();
      }

      setActiveModes({
        screen: shouldIncludeScreen && isScreenRecordingSupported(),
        mic: shouldIncludeMic && isMicRecordingSupported(),
      });
      setIsRecording(true);
      setIsPaused(false);
      setShowModeSelector(false);
      onRecordingStateChange?.(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, [mode, onRecordingStateChange]);

  const stopRecording = useCallback(() => {
    let result: MediaRecordingResult;

    if (activeModes.screen) {
      result = stopScreenRecording();
    } else {
      result = stopMicRecording();
    }

    setIsRecording(false);
    setIsPaused(false);
    setElapsed(0);
    setShowModeSelector(true);
    clearInterval(timerRef.current);
    onRecordingStateChange?.(false);
    onRecordingComplete(result);
  }, [activeModes, onRecordingComplete, onRecordingStateChange]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      setIsPaused(false);
    } else {
      pauseRecording();
      setIsPaused(true);
    }
  }, [isPaused]);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    const s = secs % 60;
    const m = mins % 60;
    if (hrs > 0) return `${hrs}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const modeOptions: { value: RecordingMode; label: string; icon: typeof Monitor; desc: string }[] = [
    { value: 'screen', label: 'Screen Only', icon: Monitor, desc: 'Record your screen' },
    { value: 'both', label: 'Screen + Voice', icon: Video, desc: 'Record screen with narration' },
    { value: 'mic', label: 'Voice Only', icon: Mic, desc: 'Record voice narration only' },
  ];

  return (
    <div className="rounded-lg bg-surface border border-border p-4">
      {/* Mode selector (shown before recording starts) */}
      {showModeSelector && !isRecording && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Recording Mode</span>
          </div>

          {!screenSupported && (
            <div className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-md">
              Screen recording is not supported in this browser. Try Chrome or Edge.
            </div>
          )}
          {!micSupported && (
            <div className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-md">
              Microphone access is not available in this browser.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {modeOptions.map((opt) => {
              const isDisabled = (opt.value === 'screen' || opt.value === 'both') && !screenSupported;
              const isMicOnly = opt.value === 'mic';
              const isDisabledMic = isMicOnly && !micSupported;

              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  disabled={isDisabled || isDisabledMic || disabled}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    mode === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 bg-transparent'
                  } ${(isDisabled || isDisabledMic) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <opt.icon className={`w-4 h-4 mb-1.5 ${mode === opt.value ? 'text-primary' : 'text-text-muted'}`} />
                  <div className={`text-xs font-medium ${mode === opt.value ? 'text-foreground' : 'text-text-muted'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={startRecording}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-recording text-white text-sm font-medium hover:bg-red-600 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Video className="w-4 h-4" />
            Start Recording
          </button>
        </div>
      )}

      {/* Active recording controls */}
      {isRecording && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Recording indicator */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-recording opacity-75 ${isPaused ? 'hidden' : ''}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-warning' : 'bg-recording'}`} />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-text-muted text-sm">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(elapsed)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Active modes indicator */}
              <div className="flex items-center gap-1.5 text-xs text-text-dim">
                {activeModes.screen && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10">
                    <Monitor className="w-3 h-3 text-primary" />
                    Screen
                  </span>
                )}
                {activeModes.mic && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10">
                    <Mic className="w-3 h-3 text-accent" />
                    Mic
                  </span>
                )}
              </div>

              {/* Pause/Resume */}
              <button
                onClick={togglePause}
                className="p-2 rounded-lg bg-muted hover:bg-surface-hover text-text-muted hover:text-foreground transition-all cursor-pointer"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Stop */}
              <button
                onClick={stopRecording}
                className="p-2 rounded-lg bg-recording/20 hover:bg-recording/30 text-recording transition-all cursor-pointer"
                title="Stop recording"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPaused ? 'bg-warning' : 'bg-recording'
              }`}
              style={{ width: `${Math.min((elapsed / 300000) * 100, 100)}%` }}
            />
          </div>

          {isPaused && (
            <div className="text-xs text-warning text-center">
              Recording paused. Tap the play button to continue.
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
