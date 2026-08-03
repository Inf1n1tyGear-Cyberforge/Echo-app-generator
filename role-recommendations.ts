import { PersonaType, Recommendation } from '../types';

/**
 * Role-specific feature recommendations.
 * These serve as a strong baseline when AI recommendations are unavailable,
 * or as contextual hints to feed into the AI prompt.
 */

const ROLE_FEATURES: Record<PersonaType, Recommendation[]> = {
  'product-manager': [
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Track user engagement, feature adoption, and key metrics with a real-time analytics dashboard tailored to your workflows.',
      icon: 'BarChart',
      difficulty: 'medium',
      role: 'product-manager',
      reason: 'PMs need visibility into how users interact with features.',
    },
    {
      id: 'user-feedback',
      title: 'In-App Feedback',
      description: 'Collect user feedback and feature requests directly within the app with ratings and comments.',
      icon: 'Paperclip',
      difficulty: 'easy',
      role: 'product-manager',
      reason: 'Close the loop on user research by capturing feedback in-context.',
    },
    {
      id: 'feature-flags',
      title: 'Feature Flags',
      description: 'Gradually roll out features to user segments with toggles and A/B testing support.',
      icon: 'Shield',
      difficulty: 'advanced',
      role: 'product-manager',
      reason: 'Ship safely and test features with real users before full rollout.',
    },
  ],
  'developer': [
    {
      id: 'api-docs',
      title: 'Auto-Generated API Docs',
      description: 'Generate interactive API documentation (OpenAPI/Swagger) from your data models and actions.',
      icon: 'Search',
      difficulty: 'easy',
      role: 'developer',
      reason: 'Developers need clear API contract documentation for integrations.',
    },
    {
      id: 'webhooks',
      title: 'Webhook Integration',
      description: 'Trigger external services when key events happen in the app with configurable webhooks.',
      icon: 'Globe',
      difficulty: 'medium',
      role: 'developer',
      reason: 'Webhooks enable real-time integration with external systems.',
    },
    {
      id: 'error-monitoring',
      title: 'Error Monitoring',
      description: 'Automatic error tracking and crash reporting with stack traces and session replay.',
      icon: 'Shield',
      difficulty: 'medium',
      role: 'developer',
      reason: 'Proactive error detection saves hours of debugging.',
    },
  ],
  'designer': [
    {
      id: 'design-tokens',
      title: 'Design Token Export',
      description: 'Export colors, typography, spacing, and shadows as platform-native design tokens for consistent theming.',
      icon: 'Palette',
      difficulty: 'medium',
      role: 'designer',
      reason: 'Designers need a single source of truth for visual consistency.',
    },
    {
      id: 'animation-library',
      title: 'Micro-interactions Library',
      description: 'Pre-built animations and transitions for loading states, navigation, and UI feedback.',
      icon: 'Sparkles',
      difficulty: 'easy',
      role: 'designer',
      reason: 'Delightful micro-interactions elevate the perceived quality.',
    },
    {
      id: 'dark-mode-tool',
      title: 'Smart Dark Mode',
      description: 'Generate a polished dark mode variant automatically from your light theme tokens.',
      icon: 'Palette',
      difficulty: 'easy',
      role: 'designer',
      reason: 'Dark mode is table stakes for modern apps.',
    },
  ],
  'founder': [
    {
      id: 'stripe-payments',
      title: 'Stripe Payments',
      description: 'Accept payments with Stripe — one-time charges, subscriptions, and invoicing out of the box.',
      icon: 'Smartphone',
      difficulty: 'medium',
      role: 'founder',
      reason: 'Monetization is critical for any founder-led product.',
    },
    {
      id: 'referral-program',
      title: 'Referral Program',
      description: 'Built-in referral tracking with shareable links, QR codes, and reward distribution.',
      icon: 'Share2',
      difficulty: 'medium',
      role: 'founder',
      reason: 'Referral programs drive organic user acquisition.',
    },
    {
      id: 'launch-checklist',
      title: 'Launch Readiness Checklist',
      description: 'Automated checklist covering SEO, app store assets, legal docs, and performance before launch.',
      icon: 'Download',
      difficulty: 'easy',
      role: 'founder',
      reason: 'Founders need to move fast without missing critical launch items.',
    },
  ],
  'business-analyst': [
    {
      id: 'csv-export',
      title: 'Advanced Data Export',
      description: 'Export filtered data to CSV, Excel, and PDF with custom column selection and formatting.',
      icon: 'Download',
      difficulty: 'easy',
      role: 'business-analyst',
      reason: 'Analysts need data in a format they can analyze offline.',
    },
    {
      id: 'scheduled-reports',
      title: 'Scheduled Reports',
      description: 'Automated email reports with charts and summaries delivered daily, weekly, or monthly.',
      icon: 'Calendar',
      difficulty: 'medium',
      role: 'business-analyst',
      reason: 'Regular reporting saves manual effort and keeps stakeholders informed.',
    },
    {
      id: 'audit-trail',
      title: 'Audit Trail',
      description: 'Complete immutable log of all changes with user attribution and timestamps.',
      icon: 'Shield',
      difficulty: 'medium',
      role: 'business-analyst',
      reason: 'Compliance and accountability require a full audit history.',
    },
  ],
  'general': [
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      description: 'Keep users engaged with real-time alerts for important updates and events.',
      icon: 'Bell',
      difficulty: 'medium',
      role: 'general',
      reason: 'Notifications improve retention for every app category.',
    },
    {
      id: 'search-filters',
      title: 'Search & Filters',
      description: 'Powerful search with multi-criteria filtering to help users find what they need fast.',
      icon: 'Search',
      difficulty: 'easy',
      role: 'general',
      reason: 'Every app benefits from discoverable content.',
    },
    {
      id: 'offline-mode',
      title: 'Offline Support',
      description: 'Enable offline-first architecture so users can use the app without connectivity.',
      icon: 'Download',
      difficulty: 'advanced',
      role: 'general',
      reason: 'Offline access is expected for modern mobile apps.',
    },
  ],
};

/**
 * Get role-specific recommendations for a persona.
 */
export function getRoleRecommendations(persona: PersonaType): Recommendation[] {
  return ROLE_FEATURES[persona] || ROLE_FEATURES['general'];
}

/**
 * Merge role-specific recommendations with AI-generated ones,
 * deduplicating by ID.
 */
export function mergeRecommendations(
  aiRecs: Recommendation[],
  persona: PersonaType,
): Recommendation[] {
  const roleRecs = getRoleRecommendations(persona);
  const usedIds = new Set(aiRecs.map(r => r.id));

  // Add role recs that don't conflict with AI recs
  const merged = [...aiRecs];
  for (const rec of roleRecs) {
    if (!usedIds.has(rec.id)) {
      merged.push(rec);
      usedIds.add(rec.id);
    }
  }

  // Limit to 5 total
  return merged.slice(0, 5);
}
