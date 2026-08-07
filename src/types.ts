export type RecordingMode = 'live' | 'demo';

export interface RecorderEvent {
  type: 'click' | 'input' | 'navigation' | 'submit' | 'screenshot';
  target: string;
  value: string | null;
  timestamp: number;
  selector?: string;
  screenshot?: string;
  context: {
    currentUrl: string;
    currentTitle: string;
    viewport: { width: number; height: number };
  };
}

export interface ScreenDefinition {
  name: string;
  description: string;
  components: string[];
  screenshot?: string;
}

export interface ActionDefinition {
  name: string;
  description: string;
  trigger: string;
}

export interface ModelField {
  name: string;
  type: string;
}

export interface ModelDefinition {
  name: string;
  fields: ModelField[];
}

export interface IntentMap {
  screens: ScreenDefinition[];
  actions: ActionDefinition[];
  models: ModelDefinition[];
  summary: string;
  appName?: string;
  appDescription?: string;
}

export type SessionStatus = 'recording' | 'processing' | 'complete' | 'failed';

export interface DeployConfig {
  expoUrl: string | null;
  vercelUrl: string | null;
  judgeUrl: string | null;
  deployedAt: string | null;
}

export interface RecordingMedia {
  screenUrl?: string;
  audioUrl?: string;
  screenBlob?: Blob;
  audioBlob?: Blob;
  screenDurationMs?: number;
  audioDurationMs?: number;
}

export interface Session {
  id: string;
  userId?: string;
  targetUrl: string;
  recordingMode: RecordingMode;
  events: RecorderEvent[];
  eventCount: number;
  duration: number;
  intentMap: IntentMap | null;
  generatedCode: Record<string, string> | null;
  deployConfig: DeployConfig | null;
  status: SessionStatus;
  createdAt: string;
  recordingMedia?: RecordingMedia;
  recordingTranscript?: string;
  vibeCodingPrompt?: string;
  persona?: PersonaType;
  workflowDetections?: WorkflowDetection[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  code?: string;
  role?: PersonaType;
  reason?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export type PersonaType = 'product-manager' | 'developer' | 'designer' | 'founder' | 'business-analyst' | 'general';

export interface PersonaProfile {
  type: PersonaType;
  label: string;
  description: string;
  icon: string;
  priorities: string[];
  commonFeatures: string[];
}

export interface WorkflowDetection {
  type: 'crud' | 'approval' | 'notification' | 'search' | 'auth' | 'file-upload' | 'payments' | 'analytics' | 'chat' | 'calendar';
  label: string;
  confidence: number;
  description: string;
}

export interface EnhancedIntentMap extends IntentMap {
  persona: PersonaProfile;
  workflows: WorkflowDetection[];
  dataRelationships: { from: string; to: string; type: string }[];
  apiEndpoints: { method: string; path: string; description: string }[];
  recommendations: Recommendation[];
}

export type UserRole = 'product-manager' | 'developer' | 'designer' | 'founder' | 'other';
export type TechnicalLevel = 'no-code' | 'low-code' | 'developer';
export type UserGoal = 'build-app' | 'prototype' | 'learn' | 'automate' | 'other';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  role: UserRole;
  goals: UserGoal[];
  technicalLevel: TechnicalLevel;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeployTarget = 'expo' | 'vercel' | 'github';
export type DeployStage = 'idle' | 'building' | 'uploading' | 'deploying' | 'live' | 'failed';

export interface DeployProgress {
  target: DeployTarget;
  stage: DeployStage;
  message: string;
  progress: number;
  url?: string;
}

// ── Template (from database) ─────────────────────────────
export type AppCategory = 'Productivity' | 'E-Commerce' | 'CRM' | 'Operations' | 'Lifestyle' | 'Content' | 'Tools' | 'Other';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  features: string[];
  iconName: string;
  gradient: string;
  isFeatured: boolean;
  isTrending: boolean;
  appType: string;
  rating: number;
  downloadCount: number;
  screenshotUrls: string[];
  userId?: string;
  intentMap?: IntentMap | null;
  generatedCode?: Record<string, string> | null;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Generated App ────────────────────────────────────────
export type AppStatus = 'draft' | 'building' | 'built' | 'published' | 'archived';

export interface GeneratedApp {
  id: string;
  userId: string;
  sessionId?: string;
  appName: string;
  description?: string;
  codeFiles: Record<string, string>;
  icons?: Record<string, string>;
  status: AppStatus;
  appType: string;
  buildProgress: number;
  apkUrl?: string;
  ipaUrl?: string;
  sourceZipUrl?: string;
  customBranding?: {
    logo?: string;
    accentColor?: string;
    splashScreen?: string;
    appIcon?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ── Subscription ─────────────────────────────────────────
export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  recordingsUsed: number;
  appsGenerated: number;
  maxRecordings: number;
  maxApps: number;
  createdAt: string;
  updatedAt: string;
}

// ── Toast ────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}
