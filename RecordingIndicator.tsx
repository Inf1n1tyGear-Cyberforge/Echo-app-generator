import { Circle } from 'lucide-react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  eventCount: number;
}

export default function RecordingIndicator({ isRecording, eventCount }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-recording/10 border border-recording/30">
      <Circle className="w-3 h-3 text-recording fill-recording animate-pulse-recording" />
      <span className="text-xs font-medium text-recording">
        Recording · {eventCount} events
      </span>
    </div>
  );
}