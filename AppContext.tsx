import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { RecorderEvent, IntentMap, Session, DeployConfig, UserProfile, RecordingMedia } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  user: { id: string; email: string } | null;
  currentSession: Session | null;
  sessions: Session[];
  isAuthenticated: boolean;
  // Phase 3: Onboarding
  userProfile: UserProfile | null;
  onboardingComplete: boolean;
  // Phase 1: Recording media
  recordingMedia: RecordingMedia | null;
  isMediaRecording: boolean;
  // Phase 4: Deployment
  isDeploying: boolean;
}

interface AppContextType {
  state: AppState;
  setUser: (user: { id: string; email: string } | null) => void;
  createSession: (targetUrl: string) => void;
  addEvents: (events: RecorderEvent[]) => void;
  setEventCount: (count: number) => void;
  setDuration: (ms: number) => void;
  setIntentMap: (intentMap: IntentMap) => void;
  setGeneratedCode: (code: Record<string, string>) => void;
  setDeployConfig: (config: DeployConfig) => void;
  setSessionStatus: (status: Session['status']) => void;
  logout: () => void;
  clearSession: () => void;
  // Phase 1 additions
  setRecordingMedia: (media: RecordingMedia | null) => void;
  setIsMediaRecording: (recording: boolean) => void;
  // Phase 3 additions
  loadUserProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  // Phase 4 additions
  setIsDeploying: (deploying: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    currentSession: null,
    sessions: [],
    isAuthenticated: false,
    userProfile: null,
    onboardingComplete: false,
    recordingMedia: null,
    isMediaRecording: false,
    isDeploying: false,
  });

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email || '' },
          isAuthenticated: true,
        }));
        loadSessions(session.user.id);
        loadUserProfile(session.user.id);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          sessions: [],
          isAuthenticated: false,
          currentSession: null,
          userProfile: null,
          onboardingComplete: false,
        }));
      }
    });

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email || '' },
          isAuthenticated: true,
        }));
        loadSessions(session.user.id);
        loadUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('[AppContext] Failed to load sessions:', error.message);
        return;
      }

      if (data) {
        const sessions: Session[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          targetUrl: row.target_url,
          recordingMode: row.recording_mode,
          events: [],
          eventCount: row.event_count || 0,
          duration: row.duration_ms || 0,
          intentMap: row.intent_map,
          generatedCode: row.generated_code,
          deployConfig: row.deploy_config,
          status: row.status,
          createdAt: row.created_at,
          recordingMedia: row.recording_media,
          recordingTranscript: row.recording_transcript,
          vibeCodingPrompt: row.vibe_coding_prompt,
          persona: row.persona,
          workflowDetections: row.workflow_detections,
        }));
        setState(prev => ({ ...prev, sessions }));
      }
    } catch (err) {
      console.warn('[AppContext] Error loading sessions:', err);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.warn('[AppContext] Failed to load profile:', error.message);
        return;
      }

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          userId: data.user_id,
          displayName: data.display_name || '',
          role: data.role,
          goals: data.goals || [],
          technicalLevel: data.technical_level,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setState(prev => ({
          ...prev,
          userProfile: profile,
          onboardingComplete: true,
        }));
      }
    } catch (err) {
      console.warn('[AppContext] Error loading profile:', err);
    }
  };

  const saveSessionToDb = async (session: Session) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('sessions').upsert({
        id: session.id,
        user_id: user.id,
        target_url: session.targetUrl,
        recording_mode: session.recordingMode,
        event_count: session.eventCount,
        duration_ms: session.duration,
        intent_map: session.intentMap,
        generated_code: session.generatedCode,
        deploy_config: session.deployConfig,
        status: session.status,
        recording_media: session.recordingMedia,
        recording_transcript: session.recordingTranscript,
        vibe_coding_prompt: session.vibeCodingPrompt,
        persona: session.persona,
        workflow_detections: session.workflowDetections,
      }, { onConflict: 'id' });

      if (error) {
        console.warn('[AppContext] Failed to save session:', error.message);
      }
    } catch (err) {
      console.warn('[AppContext] Error saving session:', err);
    }
  };

  const setUser = useCallback((user: { id: string; email: string } | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  }, []);

  const createSession = useCallback((targetUrl: string) => {
    const isDemo = targetUrl.startsWith('demo://');
    const session: Session = {
      id: crypto.randomUUID(),
      targetUrl,
      recordingMode: isDemo ? 'demo' : 'live',
      events: [],
      eventCount: 0,
      duration: 0,
      intentMap: null,
      generatedCode: null,
      deployConfig: null,
      status: 'recording',
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      currentSession: session,
    }));
  }, []);

  const addEvents = useCallback((events: RecorderEvent[]) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          events: [...prev.currentSession.events, ...events],
          eventCount: prev.currentSession.eventCount + events.length,
        },
      };
    });
  }, []);

  const setEventCount = useCallback((count: number) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: { ...prev.currentSession, eventCount: count },
      };
    });
  }, []);

  const setDuration = useCallback((ms: number) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: { ...prev.currentSession, duration: ms },
      };
    });
  }, []);

  const setIntentMap = useCallback((intentMap: IntentMap) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          intentMap,
        },
      };
    });
  }, []);

  const setGeneratedCode = useCallback((code: Record<string, string>) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          generatedCode: code,
          status: 'complete',
        },
      };
    });
  }, []);

  const setDeployConfig = useCallback((config: DeployConfig) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          deployConfig: config,
        },
      };
    });
  }, []);

  const setSessionStatus = useCallback((status: Session['status']) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      const updatedSession = {
        ...prev.currentSession,
        status,
      };
      // Persist to Supabase when session completes or fails
      if (status === 'complete' || status === 'failed') {
        saveSessionToDb(updatedSession);
      }
      return {
        ...prev,
        currentSession: updatedSession,
        sessions: status === 'complete' || status === 'failed'
          ? [updatedSession, ...prev.sessions]
          : prev.sessions,
      };
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      currentSession: null,
      sessions: [],
      isAuthenticated: false,
      userProfile: null,
      onboardingComplete: false,
      recordingMedia: null,
      isMediaRecording: false,
      isDeploying: false,
    });
  }, []);

  const clearSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSession: null,
      recordingMedia: null,
    }));
  }, []);

  // Phase 1: Recording media
  const setRecordingMedia = useCallback((media: RecordingMedia | null) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          recordingMedia: media || undefined,
        },
        recordingMedia: media,
      };
    });
  }, []);

  const setIsMediaRecording = useCallback((recording: boolean) => {
    setState(prev => ({
      ...prev,
      isMediaRecording: recording,
    }));
  }, []);

  // Phase 3: Profile
  const setUserProfile = useCallback((profile: UserProfile | null) => {
    setState(prev => ({
      ...prev,
      userProfile: profile,
      onboardingComplete: !!profile,
    }));
  }, []);

  // Phase 4: Deployment
  const setIsDeploying = useCallback((deploying: boolean) => {
    setState(prev => ({
      ...prev,
      isDeploying: deploying,
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      setUser,
      createSession,
      addEvents,
      setEventCount,
      setDuration,
      setIntentMap,
      setGeneratedCode,
      setDeployConfig,
      setSessionStatus,
      logout,
      clearSession,
      setRecordingMedia,
      setIsMediaRecording,
      loadUserProfile: () => loadUserProfile(state.user?.id || ''),
      setUserProfile,
      setIsDeploying,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
