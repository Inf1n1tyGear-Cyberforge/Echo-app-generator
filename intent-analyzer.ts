import { RecorderEvent, EnhancedIntentMap, PersonaProfile, WorkflowDetection } from '../types';
import { detectPersona } from './persona-detector';
import { detectWorkflows } from './workflow-detector';

/**
 * Enhanced intent analysis that combines AI-powered analysis
 * with local persona detection and workflow identification.
 */

interface AnalysisContext {
  events: RecorderEvent[];
  summary: string;
  eventTypes: string[];
  formInteractions: string[];
  navigationFlow: string[];
}

/**
 * Extract analysis context from raw events.
 */
function extractContext(events: RecorderEvent[]): AnalysisContext {
  const eventTypes = [...new Set(events.map(e => e.type))];
  const formInteractions: string[] = [];
  const navigationFlow: string[] = [];

  events.forEach((e) => {
    if (e.type === 'input') {
      formInteractions.push(`${e.target}=${e.value}`);
    }
    if (e.type === 'navigation') {
      navigationFlow.push(e.target);
    }
  });

  // Build a human-readable summary
  const summary = events.map(e => {
    const time = new Date(e.timestamp).toISOString().slice(11, 19);
    const url = e.context.currentUrl?.slice(0, 60) || '';
    let desc = '';
    switch (e.type) {
      case 'click': desc = `Clicked "${e.target}"`; break;
      case 'input': desc = `Input "${e.target}" = "${e.value}"`; break;
      case 'navigation': desc = `Navigated to ${e.target}`; break;
      case 'submit': desc = `Submitted form: ${e.value}`; break;
      default: desc = `${e.type}: ${e.target}`;
    }
    return `[${time}] ${desc} ${url ? `(${url})` : ''}`;
  }).join('\n');

  return { events, summary, eventTypes, formInteractions, navigationFlow };
}

/**
 * Build an AI prompt that includes persona and workflow context.
 */
export function buildEnhancedAnalysisPrompt(
  events: RecorderEvent[],
  persona: PersonaProfile,
  workflows: WorkflowDetection[],
): string {
  const ctx = extractContext(events);

  const workflowText = workflows.length > 0
    ? workflows.map(w => `- ${w.label} (${Math.round(w.confidence * 100)}% confidence): ${w.description}`).join('\n')
    : 'No specific workflow patterns detected.';

  return `Here are the recorded interaction events from a user performing a workflow in a web app:

EVENT LOG:
${ctx.summary}

Total events: ${events.length}
Duration: ${events.length > 0 ? `${Math.round((events[events.length-1].timestamp - events[0].timestamp) / 1000)}s` : 'N/A'}
Action types detected: ${ctx.eventTypes.join(', ')}

DETECTED USER PERSONA: ${persona.label}
Persona Description: ${persona.description}
User Priorities: ${persona.priorities.join(', ')}

DETECTED WORKFLOWS:
${workflowText}

NAVIGATION FLOW:
${ctx.navigationFlow.length > 0 ? ctx.navigationFlow.join(' → ') : 'Single screen'}

Analyze these events and return the JSON intent map. Focus on building an app that aligns with the detected persona's priorities.`;
}

/**
 * Run local analysis (persona + workflows) without AI.
 */
export function runLocalAnalysis(events: RecorderEvent[]): {
  persona: PersonaProfile;
  workflows: WorkflowDetection[];
  context: AnalysisContext;
} {
  const context = extractContext(events);
  const persona = detectPersona(events);
  const workflows = detectWorkflows(events);

  return { persona, workflows, context };
}

/**
 * Merge AI analysis with local analysis results.
 */
export function mergeAnalyses(
  aiResult: {
    screens: EnhancedIntentMap['screens'];
    actions: EnhancedIntentMap['actions'];
    models: EnhancedIntentMap['models'];
    appName?: string;
    appDescription?: string;
    summary: string;
  },
  local: {
    persona: PersonaProfile;
    workflows: WorkflowDetection[];
  },
): EnhancedIntentMap {
  return {
    screens: aiResult.screens || [],
    actions: aiResult.actions || [],
    models: aiResult.models || [],
    summary: aiResult.summary || '',
    appName: aiResult.appName,
    appDescription: aiResult.appDescription,
    persona: local.persona,
    workflows: local.workflows,
    dataRelationships: inferDataRelationships(aiResult.models || []),
    apiEndpoints: inferApiEndpoints(aiResult.actions || []),
    recommendations: [],
  };
}

/**
 * Infer data relationships from models.
 */
function inferDataRelationships(
  models: EnhancedIntentMap['models'],
): EnhancedIntentMap['dataRelationships'] {
  const relationships: EnhancedIntentMap['dataRelationships'] = [];

  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      // Check if one model references another
      const modelA = models[i];
      const modelB = models[j];

      const refersToB = modelA.fields.some(f =>
        f.name.toLowerCase().includes(modelB.name.toLowerCase()) ||
        f.name.toLowerCase().includes(`${modelB.name.toLowerCase()}_id`),
      );

      if (refersToB) {
        relationships.push({
          from: modelA.name,
          to: modelB.name,
          type: 'belongs_to',
        });
      }
    }
  }

  return relationships;
}

/**
 * Infer likely API endpoints from actions.
 */
function inferApiEndpoints(
  actions: EnhancedIntentMap['actions'],
): EnhancedIntentMap['apiEndpoints'] {
  const endpoints: EnhancedIntentMap['apiEndpoints'] = [];

  actions.forEach(action => {
    const name = action.name.toLowerCase();

    if (name.includes('create') || name.includes('add')) {
      endpoints.push({
        method: 'POST',
        path: `/api/${name.replace(/create|add/i, '').toLowerCase().trim() || 'items'}`,
        description: `Create ${action.description}`,
      });
    } else if (name.includes('update') || name.includes('edit')) {
      endpoints.push({
        method: 'PUT',
        path: `/api/${name.replace(/update|edit/i, '').toLowerCase().trim() || 'items'}/:id`,
        description: `Update ${action.description}`,
      });
    } else if (name.includes('delete') || name.includes('remove')) {
      endpoints.push({
        method: 'DELETE',
        path: `/api/${name.replace(/delete|remove/i, '').toLowerCase().trim() || 'items'}/:id`,
        description: `Delete ${action.description}`,
      });
    }
  });

  return endpoints;
}
