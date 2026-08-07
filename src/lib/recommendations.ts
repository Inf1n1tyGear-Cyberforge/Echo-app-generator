import { IntentMap, Recommendation, PersonaType } from '../types';
import { generateAIRecommendations } from './openrouter';
import { getRoleRecommendations, mergeRecommendations } from './role-recommendations';

/**
 * Enhanced recommendation engine.
 * Generates feature recommendations based on intent map, persona, and role.
 * Uses AI-powered suggestions when available, falls back to role-based + rule-based.
 */
export async function getRecommendations(
  intentMap: IntentMap,
  personaOverride?: PersonaType,
): Promise<Recommendation[]> {
  // If we have a enhanced intent map with persona info, use it
  const personaType = personaOverride ||
    (intentMap as any).persona?.type ||
    'general';

  // Try AI-powered recommendations first
  try {
    const aiRecs = await generateAIRecommendations(intentMap);
    if (aiRecs && aiRecs.length > 0) {
      // Merge AI recommendations with role-specific ones
      return mergeRecommendations(aiRecs, personaType as PersonaType);
    }
  } catch {
    console.log('[Recommendations] AI generation failed, using role-based fallback');
  }

  // Fallback: role-based + rule-based
  return mergeRoleAndRuleRecommendations(intentMap, personaType as PersonaType);
}

/**
 * Merge role-based and rule-based recommendations.
 */
function mergeRoleAndRuleRecommendations(
  intentMap: IntentMap,
  personaType: PersonaType,
): Recommendation[] {
  // Get role-based recommendations
  const roleRecs = getRoleRecommendations(personaType);

  // Get rule-based recommendations
  const ruleRecs = generateRuleRecommendations(intentMap);

  // Merge with role recs taking priority
  const usedIds = new Set<string>();
  const merged: Recommendation[] = [];

  // Role recommendations first
  for (const rec of roleRecs) {
    if (!usedIds.has(rec.id)) {
      merged.push(rec);
      usedIds.add(rec.id);
    }
  }

  // Then rule-based
  for (const rec of ruleRecs) {
    if (!usedIds.has(rec.id) && merged.length < 5) {
      merged.push(rec);
      usedIds.add(rec.id);
    }
  }

  return merged.slice(0, 5);
}

/**
 * Rule-based fallback recommendations.
 */
function generateRuleRecommendations(intentMap: IntentMap): Recommendation[] {
  const allRecommendations: Recommendation[] = [];
  const actionNames = intentMap.actions.map(a => a.name.toLowerCase());
  const modelNames = intentMap.models.map(m => m.name.toLowerCase());
  const screenNames = intentMap.screens.map(s => s.name.toLowerCase());

  // Push notifications for apps with create actions
  if (actionNames.some(a => a.includes('create') || a.includes('add'))) {
    allRecommendations.push({
      id: 'push-notifications',
      title: 'Push Notifications',
      description: `Send real-time alerts when items are created or updated. Keep users engaged with timely updates about their ${modelNames[0] || 'content'}.`,
      icon: 'Bell',
      difficulty: 'medium',
    });
  }

  // File attachments for task/content-heavy apps
  if (actionNames.some(a => a.includes('upload') || a.includes('attach') || a.includes('add'))) {
    allRecommendations.push({
      id: 'file-attachments',
      title: 'File Attachments',
      description: 'Let users attach images, documents, and files. Essential for sharing and collaboration.',
      icon: 'Paperclip',
      difficulty: 'easy',
    });
  }

  // Due dates for apps with status management
  if (actionNames.some(a => a.includes('status') || a.includes('change'))) {
    allRecommendations.push({
      id: 'due-dates',
      title: 'Due Dates & Reminders',
      description: 'Set deadlines with automatic push reminders. Never miss important milestones.',
      icon: 'Calendar',
      difficulty: 'easy',
    });
  }

  // Search for apps with lists
  if (screenNames.some(s => s.includes('list') || s.includes('board') || s.includes('grid'))) {
    allRecommendations.push({
      id: 'search-filters',
      title: 'Search & Filters',
      description: 'Help users quickly find what they need with powerful search and multi-criteria filtering.',
      icon: 'Search',
      difficulty: 'easy',
    });
  }

  // Auth for apps with user-specific data
  if (modelNames.some(m => m.includes('user') || m.includes('project') || m.includes('task'))) {
    allRecommendations.push({
      id: 'user-auth',
      title: 'User Authentication',
      description: 'Add sign-up, login, and role-based access. Let each user have their own secure account.',
      icon: 'Shield',
      difficulty: 'medium',
    });
  }

  // Offline mode (always a good suggestion)
  allRecommendations.push({
    id: 'offline-mode',
    title: 'Offline Support',
    description: 'Enable offline-first architecture so users can browse and interact with data without internet.',
    icon: 'Download',
    difficulty: 'advanced',
  });

  return allRecommendations;
}

export function generateRecommendations(intentMap: IntentMap): Recommendation[] {
  return generateRuleRecommendations(intentMap).slice(0, 3);
}
