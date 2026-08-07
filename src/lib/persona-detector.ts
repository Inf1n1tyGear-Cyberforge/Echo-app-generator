import { RecorderEvent, PersonaType, PersonaProfile } from '../types';

/**
 * Detect user persona from recorded interaction patterns.
 * Analyzes event types, targets, and timing to infer the user's role.
 */

const PERSONA_SIGNATURES: Record<PersonaType, PersonaProfile> = {
  'product-manager': {
    type: 'product-manager',
    label: 'Product Manager',
    description: 'Focused on workflows, user stories, and feature sets',
    icon: 'Lightbulb',
    priorities: ['User experience', 'Feature completeness', 'Workflow logic'],
    commonFeatures: ['Analytics', 'Push notifications', 'User roles', 'Onboarding'],
  },
  'developer': {
    type: 'developer',
    label: 'Developer',
    description: 'Focused on technical implementation and data architecture',
    icon: 'Code',
    priorities: ['Clean architecture', 'API design', 'Data models', 'Performance'],
    commonFeatures: ['API endpoints', 'Webhooks', 'Database views', 'Error handling'],
  },
  'designer': {
    type: 'designer',
    label: 'Designer',
    description: 'Focused on visual design, interactions, and brand consistency',
    icon: 'Palette',
    priorities: ['Visual polish', 'Animations', 'Design system', 'Responsive layout'],
    commonFeatures: ['Dark mode', 'Animations', 'Custom themes', 'Design tokens'],
  },
  'founder': {
    type: 'founder',
    label: 'Founder',
    description: 'Focused on business value, speed to market, and monetization',
    icon: 'Sparkles',
    priorities: ['Time to market', 'Monetization', 'User acquisition', 'Core MVP'],
    commonFeatures: ['Stripe payments', 'Analytics', 'Auth', 'Landing page'],
  },
  'business-analyst': {
    type: 'business-analyst',
    label: 'Business Analyst',
    description: 'Focused on data, reporting, and business processes',
    icon: 'BarChart',
    priorities: ['Data accuracy', 'Reporting', 'Process automation', 'Compliance'],
    commonFeatures: ['Charts', 'Export', 'Audit logs', 'Approval workflows'],
  },
  'general': {
    type: 'general',
    label: 'General',
    description: 'General purpose user',
    icon: 'User',
    priorities: ['Usability', 'Reliability', 'Simplicity'],
    commonFeatures: ['Core functionality', 'Simple navigation'],
  },
};

/**
 * Analyze events to determine the most likely user persona.
 */
export function detectPersona(events: RecorderEvent[]): PersonaProfile {
  if (!events || events.length === 0) {
    return PERSONA_SIGNATURES['general'];
  }

  const scores: Record<PersonaType, number> = {
    'product-manager': 0,
    'developer': 0,
    'designer': 0,
    'founder': 0,
    'business-analyst': 0,
    'general': 1, // Default baseline
  };

  // Analyze event types
  const typeCounts: Record<string, number> = {};
  events.forEach(e => {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  });

  const totalEvents = events.length;
  const clickRatio = (typeCounts['click'] || 0) / totalEvents;
  const inputRatio = (typeCounts['input'] || 0) / totalEvents;
  const navRatio = (typeCounts['navigation'] || 0) / totalEvents;

  // PMs tend to navigate between many screens (exploring workflows)
  if (navRatio > 0.25) scores['product-manager'] += 3;
  if (typeCounts['navigation'] && typeCounts['navigation'] > 5) scores['product-manager'] += 2;

  // Developers tend to interact heavily with forms and data
  if (inputRatio > 0.4) scores['developer'] += 3;
  if (typeCounts['input'] && typeCounts['input'] > 10) scores['developer'] += 2;

  // Designers tend to click more (exploring visual elements)
  if (clickRatio > 0.7 && inputRatio < 0.2) scores['designer'] += 3;

  // Founders tend to have balanced but focused sessions
  if (totalEvents < 20 && navRatio > 0.15) scores['founder'] += 2;
  if (totalEvents < 15) scores['founder'] += 1;

  // Business analysts tend to view lists and details (data exploration)
  if (clickRatio > 0.5 && navRatio > 0.1 && inputRatio < 0.3) scores['business-analyst'] += 2;

  // Analyze targets/keywords in events
  const allTargets = events.map(e => e.target.toLowerCase()).join(' ');
  const keywordChecks: [RegExp, PersonaType, number][] = [
    [/dashboard|analytics|report|chart|metric/, 'business-analyst', 3],
    [/task|workflow|process|approve|review/, 'product-manager', 2],
    [/api|endpoint|database|schema|migration/, 'developer', 3],
    [/pricing|payment|plan|subscribe|checkout/, 'founder', 3],
    [/color|theme|font|style|layout|design/, 'designer', 3],
    [/user|login|register|profile|auth/, 'founder', 1],
    [/edit|create|new|add|form/, 'developer', 1],
    [/list|view|detail|card|grid/, 'designer', 1],
  ];

  keywordChecks.forEach(([regex, persona, score]) => {
    if (regex.test(allTargets)) {
      scores[persona] += score;
    }
  });

  // Determine winner
  let bestType: PersonaType = 'general';
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as PersonaType;
    }
  }

  return PERSONA_SIGNATURES[bestType];
}

/**
 * Get role-specific feature recommendations based on persona.
 */
export function getRoleSpecificFeatures(persona: PersonaType): string[] {
  const profile = PERSONA_SIGNATURES[persona] || PERSONA_SIGNATURES['general'];
  return profile.commonFeatures;
}

export { PERSONA_SIGNATURES };
