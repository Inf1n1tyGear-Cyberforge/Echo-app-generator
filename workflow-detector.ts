import { RecorderEvent, WorkflowDetection } from '../types';

/**
 * Detect common workflow patterns from recorded events.
 */

const WORKFLOW_PATTERNS: Record<string, {
  label: string;
  confidence: number;
  description: string;
  requiredActions: string[];
  optionalActions: string[];
}> = {
  'crud': {
    label: 'CRUD Operations',
    confidence: 0,
    description: 'Create, Read, Update, Delete data entities',
    requiredActions: ['create', 'edit', 'delete'],
    optionalActions: ['view', 'list', 'save'],
  },
  'approval': {
    label: 'Approval Workflow',
    confidence: 0,
    description: 'Multi-step approval process with review states',
    requiredActions: ['submit', 'approve', 'reject'],
    optionalActions: ['review', 'comment', 'assign'],
  },
  'notification': {
    label: 'Notifications',
    confidence: 0,
    description: 'User notification system for updates and alerts',
    requiredActions: ['notify', 'alert', 'bell'],
    optionalActions: ['preference', 'settings', 'mark-read'],
  },
  'search': {
    label: 'Search & Discovery',
    confidence: 0,
    description: 'Search functionality with filters and results',
    requiredActions: ['search', 'filter'],
    optionalActions: ['sort', 'browse', 'category'],
  },
  'auth': {
    label: 'Authentication',
    confidence: 0,
    description: 'User authentication and access control',
    requiredActions: ['login', 'register', 'logout'],
    optionalActions: ['profile', 'reset-password'],
  },
  'file-upload': {
    label: 'File Upload',
    confidence: 0,
    description: 'File attachment and media upload functionality',
    requiredActions: ['upload', 'attach', 'drop'],
    optionalActions: ['gallery', 'file-picker'],
  },
  'payments': {
    label: 'Payments',
    confidence: 0,
    description: 'Payment processing and billing',
    requiredActions: ['pay', 'checkout', 'purchase'],
    optionalActions: ['plan', 'subscribe', 'invoice'],
  },
  'analytics': {
    label: 'Analytics & Reporting',
    confidence: 0,
    description: 'Data analytics, charts, and reporting',
    requiredActions: ['chart', 'report', 'analytics'],
    optionalActions: ['export', 'dashboard', 'metric'],
  },
  'chat': {
    label: 'Chat & Messaging',
    confidence: 0,
    description: 'Real-time messaging and conversation',
    requiredActions: ['message', 'chat', 'conversation'],
    optionalActions: ['send', 'reply', 'thread'],
  },
  'calendar': {
    label: 'Calendar & Scheduling',
    confidence: 0,
    description: 'Calendar events, scheduling and reminders',
    requiredActions: ['calendar', 'schedule', 'event'],
    optionalActions: ['reminder', 'booking', 'timeslot'],
  },
};

/**
 * Detect workflow patterns from recorded events.
 */
export function detectWorkflows(events: RecorderEvent[]): WorkflowDetection[] {
  if (!events || events.length === 0) return [];

  const detected: WorkflowDetection[] = [];
  const allTargets = events.map(e => ({
    text: e.target.toLowerCase(),
    type: e.type,
  }));

  // Extract unique action-like words from targets
  const actionWords = new Set<string>();
  allTargets.forEach(({ text }) => {
    text.split(/[\s\-_/]+/).forEach(word => {
      actionWords.add(word.toLowerCase());
    });
  });

  // Also look at event types
  const eventTypes = new Set(events.map(e => e.type));

  for (const [key, pattern] of Object.entries(WORKFLOW_PATTERNS)) {
    let requiredMatches = 0;
    let optionalMatches = 0;

    pattern.requiredActions.forEach(action => {
      const found = Array.from(actionWords).some(word =>
        word.includes(action) || action.includes(word),
      );
      if (found) requiredMatches++;
    });

    pattern.optionalActions.forEach(action => {
      const found = Array.from(actionWords).some(word =>
        word.includes(action) || action.includes(word),
      );
      if (found) optionalMatches++;
    });

    // Calculate confidence
    const requiredTotal = pattern.requiredActions.length;
    const optionalTotal = pattern.optionalActions.length;
    let confidence = 0;

    if (requiredTotal > 0) {
      confidence = (requiredMatches / requiredTotal) * 0.7 +
        (optionalTotal > 0 ? (optionalMatches / optionalTotal) * 0.3 : 0);
    }

    // Form submit counts as CRUD
    if (key === 'crud' && eventTypes.has('submit')) {
      confidence += 0.15;
    }

    if (confidence > 0.2) {
      detected.push({
        type: key as WorkflowDetection['type'],
        label: pattern.label,
        confidence: Math.round(confidence * 100) / 100,
        description: pattern.description,
      });
    }
  }

  // Sort by confidence descending
  detected.sort((a, b) => b.confidence - a.confidence);

  // Return top workflows
  return detected.slice(0, 5);
}
