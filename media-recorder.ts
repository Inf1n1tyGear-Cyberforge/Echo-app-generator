/**
 * MediaRecorder abstraction for screen and voice capture.
 * Uses browser MediaRecorder API (no extra packages needed).
 */

export interface MediaRecorderState {
  screenStream: MediaStream | null;
  micStream: MediaStream | null;
  combinedStream: MediaStream | null;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  isRecording: boolean;
  startTime: number;
  screenSupported: boolean;
  micSupported: boolean;
}

export type MediaType = 'screen' | 'mic' | 'both';

export interface MediaRecordingResult {
  screenBlob: Blob | null;
  audioBlob: Blob | null;
  screenDurationMs: number;
  audioDurationMs: number;
  screenStream: MediaStream | null;
}

let state: MediaRecorderState = {
  screenStream: null,
  micStream: null,
  combinedStream: null,
  recorder: null,
  chunks: [],
  isRecording: false,
  startTime: 0,
  screenSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices,
  micSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
};

/**
 * Check if screen recording is supported in this browser.
 */
export function isScreenRecordingSupported(): boolean {
  return state.screenSupported;
}

/**
 * Check if microphone recording is supported.
 */
export function isMicRecordingSupported(): boolean {
  return state.micSupported;
}

/**
 * Start recording screen (and optionally mic).
 */
export async function startScreenRecording(includeMic: boolean = false): Promise<{
  stream: MediaStream;
  recorder: MediaRecorder;
}> {
  try {
    // Get screen stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        // @ts-ignore - displaySurface is supported in modern browsers
        displaySurface: 'browser',
      },
      audio: false,
    });

    state.screenStream = screenStream;

    let combinedStream: MediaStream;
    let tracks: MediaStreamTrack[] = [...screenStream.getVideoTracks()];

    if (includeMic) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });
        state.micStream = micStream;
        tracks = [...tracks, ...micStream.getAudioTracks()];
      } catch (micErr) {
        console.warn('[MediaRecorder] Could not access mic:', micErr);
        // Continue without mic
      }
    }

    combinedStream = new MediaStream(tracks);
    state.combinedStream = combinedStream;

    // Determine best mime type
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 2_500_000, // 2.5 Mbps for good quality
    });

    state.chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        state.chunks.push(e.data);
      }
    };

    recorder.start(1000); // Collect data every second
    state.recorder = recorder;
    state.isRecording = true;
    state.startTime = Date.now();

    // If user stops sharing via browser UI button, stop recording
    screenStream.getVideoTracks()[0].onended = () => {
      if (state.isRecording) {
        stopScreenRecording();
      }
    };

    return { stream: combinedStream, recorder };
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Screen recording permission was denied. Please allow screen sharing to continue.');
    }
    throw new Error(`Could not start screen recording: ${err.message}`);
  }
}

/**
 * Start audio-only recording (mic).
 */
export async function startMicRecording(): Promise<{
  stream: MediaStream;
  recorder: MediaRecorder;
}> {
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    state.micStream = micStream;

    const mimeType = getSupportedAudioMimeType();
    const recorder = new MediaRecorder(micStream, { mimeType });

    state.chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        state.chunks.push(e.data);
      }
    };

    recorder.start(1000);
    state.recorder = recorder;
    state.isRecording = true;
    state.startTime = Date.now();

    return { stream: micStream, recorder };
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Microphone permission was denied. Please allow mic access to continue.');
    }
    throw new Error(`Could not start mic recording: ${err.message}`);
  }
}

/**
 * Stop all recording and return collected blobs.
 */
export function stopScreenRecording(): MediaRecordingResult {
  const elapsed = state.startTime ? Date.now() - state.startTime : 0;

  // Stop the recorder
  if (state.recorder && state.recorder.state !== 'inactive') {
    state.recorder.stop();
  }

  // Build blobs
  let screenBlob: Blob | null = null;
  let audioBlob: Blob | null = null;

  if (state.chunks.length > 0) {
    const fullBlob = new Blob(state.chunks, { type: state.recorder?.mimeType || 'video/webm' });

    if (state.micStream && state.screenStream) {
      // Combined recording — it's a video with audio
      screenBlob = fullBlob;
    } else if (state.screenStream) {
      screenBlob = fullBlob;
    } else {
      audioBlob = fullBlob;
    }
  }

  // Separate mic-only recording if we were doing audio-only
  if (!state.screenStream && state.micStream && state.chunks.length > 0) {
    audioBlob = new Blob(state.chunks, { type: state.recorder?.mimeType || 'audio/webm' });
  }

  const result: MediaRecordingResult = {
    screenBlob,
    audioBlob,
    screenDurationMs: elapsed,
    audioDurationMs: elapsed,
    screenStream: state.combinedStream,
  };

  // Clean up tracks
  cleanup();

  return result;
}

/**
 * Stop mic-only recording.
 */
export function stopMicRecording(): MediaRecordingResult {
  const elapsed = state.startTime ? Date.now() - state.startTime : 0;

  if (state.recorder && state.recorder.state !== 'inactive') {
    state.recorder.stop();
  }

  let audioBlob: Blob | null = null;
  if (state.chunks.length > 0) {
    audioBlob = new Blob(state.chunks, { type: state.recorder?.mimeType || 'audio/webm' });
  }

  const result: MediaRecordingResult = {
    screenBlob: null,
    audioBlob,
    screenDurationMs: 0,
    audioDurationMs: elapsed,
    screenStream: null,
  };

  cleanup();
  return result;
}

/**
 * Pause the recording.
 */
export function pauseRecording(): void {
  if (state.recorder && state.recorder.state === 'recording') {
    state.recorder.pause();
  }
}

/**
 * Resume the recording.
 */
export function resumeRecording(): void {
  if (state.recorder && state.recorder.state === 'paused') {
    state.recorder.resume();
  }
}

/**
 * Get the current recording duration in ms.
 */
export function getRecordingDuration(): number {
  if (!state.startTime) return 0;
  return Date.now() - state.startTime;
}

/**
 * Check if currently recording.
 */
export function isCurrentlyRecording(): boolean {
  return state.isRecording;
}

function cleanup(): void {
  state.isRecording = false;

  if (state.screenStream) {
    state.screenStream.getTracks().forEach(t => t.stop());
  }
  if (state.micStream) {
    state.micStream.getTracks().forEach(t => t.stop());
  }
  if (state.combinedStream) {
    state.combinedStream.getTracks().forEach(t => t.stop());
  }

  state.screenStream = null;
  state.micStream = null;
  state.combinedStream = null;
  state.recorder = null;
  state.chunks = [];
  state.startTime = 0;
}

/**
 * Find a supported video mime type.
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Find a supported audio mime type.
 */
function getSupportedAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
}

/**
 * Upload a blob to Supabase Storage and return the public URL.
 */
export async function uploadMediaToStorage(
  blob: Blob,
  userId: string,
  sessionId: string,
  type: 'screen' | 'audio',
): Promise<string | null> {
  try {
    const { supabase } = await import('./supabase');
    const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    const fileName = `${sessionId}/${type}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('[MediaRecorder] Upload failed:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('[MediaRecorder] Upload error:', err);
    return null;
  }
}
