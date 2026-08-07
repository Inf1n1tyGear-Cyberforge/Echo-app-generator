import { RecorderEvent, IntentMap, Recommendation, PersonaProfile, WorkflowDetection } from '../types';
import { buildEnhancedAnalysisPrompt, runLocalAnalysis, mergeAnalyses } from './intent-analyzer';
import { supabase } from './supabase';

function getApiKey(): string {
  return localStorage.getItem('echo_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Supabase Edge Function proxy for OpenRouter
// Uses server-side API key (OPENROUTER_API_KEY secret) or per-request x-api-key header
const SUPABASE_FUNCTIONS_URL = 'https://udkmhxmcmaykawkdynor.supabase.co/functions/v1/openrouter-proxy';

// Use Claude Opus for deep analysis, Sonnet for speed where appropriate
const ANALYSIS_MODEL = 'anthropic/claude-3.7-sonnet';
const RECOMMENDATION_MODEL = 'anthropic/claude-opus-4-20250514';
const VIBE_CODING_MODEL = 'anthropic/claude-3.7-sonnet';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

function getSystemPrompt(): string {
  return `You are Echo AI, an expert mobile app reverse-engineer and React Native developer.

Given a sequence of user interactions recorded from a web application, you must:
1. Identify each distinct screen the user visited
2. Identify the data models (entities) involved
3. Identify the actions the user performed
4. Name the app and describe its purpose
5. Provide a brief summary

Return a JSON object with this exact structure:
{
  "screens": [
    {
      "name": "ScreenName",
      "description": "What this screen shows in detail",
      "components": ["Component1", "Component2"]
    }
  ],
  "actions": [
    {
      "name": "ActionName",
      "description": "What this action does",
      "trigger": "What triggers it"
    }
  ],
  "models": [
    {
      "name": "ModelName",
      "fields": [
        { "name": "fieldName", "type": "string|number|boolean|date" }
      ]
    }
  ],
  "appName": "SuggestedAppName",
  "appDescription": "A brief description of what this app does",
  "summary": "Overall summary of the app with key observations"
}

Rules:
- Screen names: PascalCase, no spaces, no "Screen" suffix
- Component names: PascalCase
- Be thorough about data models — infer fields from form inputs and displayed data
- The summary should be 1-2 sentences describing the core purpose`;
}

function getPersonaAwareSystemPrompt(persona: PersonaProfile): string {
  return `${getSystemPrompt()}

ADDITIONAL CONTEXT — User Persona:
The user appears to be a ${persona.label}. Their priorities are: ${persona.priorities.join(', ')}.
When identifying screens, actions, and models, keep this persona's perspective in mind.
${persona.type === 'developer' ? 'Focus on technical accuracy and data architecture.' : ''}
${persona.type === 'product-manager' ? 'Focus on workflow completeness and user stories.' : ''}
${persona.type === 'designer' ? 'Pay special attention to UI components and visual patterns.' : ''}
${persona.type === 'founder' ? 'Focus on core value proposition and what makes the app marketable.' : ''}`;
}

function getRecommendationSystemPrompt(intentMap: IntentMap, persona?: PersonaProfile): string {
  return `You are a senior React Native product consultant at Echo AI.

Given this analyzed intent map of a web application that will be converted to a mobile app, suggest 3 impactful feature recommendations.

The app: "${intentMap.appName || 'Unnamed App'}"
Purpose: ${intentMap.appDescription || intentMap.summary}

${persona ? `User persona: ${persona.label}
Priorities: ${persona.priorities.join(', ')}
Tailor recommendations to this user's role.` : ''}

Return a JSON array of exactly 3 recommendations with this structure:
[
  {
    "id": "kebab-case-id",
    "title": "Feature Title",
    "description": "A compelling 1-2 sentence description of why this feature matters for THIS specific app",
    "icon": "Bell|Paperclip|Calendar|Shield|Search|Palette|BarChart|Share2|QrCode|Download|Globe|Smartphone",
    "difficulty": "easy|medium|advanced"
  }
]

Rules:
- Recommendations MUST be contextually relevant to this specific app's screens and actions
- Mix difficulties: suggest at least one easy win and one advanced feature
- Descriptions should feel tailored, not generic
- Use Lucide icon names only from the list above`;
}

function getVibeCodingSystemPrompt(): string {
  return `You are Echo AI's Vibe Coding assistant. You help users describe changes to their generated app using natural language.

Given:
1. The app's current intent map (screens, data models, actions)
2. The user's natural language request

You must:
1. Interpret what the user wants to change or add
2. Return a structured modification plan that can be applied to the generated code

Return a JSON object with this exact structure:
{
  "type": "add_screen|modify_screen|add_feature|modify_feature|other",
  "description": "Clear description of what the user wants",
  "targetScreen": "Screen name if applicable, or null",
  "changes": [
    {
      "component": "Component name to add/modify",
      "description": "What to change",
      "codeHint": "Brief implementation hint"
    }
  ],
  "newScreens": [
    {
      "name": "NewScreenName",
      "description": "What this screen does",
      "components": ["Component1"]
    }
  ],
  "newModels": [
    {
      "name": "ModelName",
      "fields": [{ "name": "field", "type": "string" }]
    }
  ],
  "summary": "One sentence summary of the changes"
}`;
}

/**
 * Validate that an OpenRouter API key works by making a lightweight test call.
 */
export async function validateApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    if (response.ok) {
      return { valid: true };
    }
    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key. Check your key and try again.' };
    }
    return { valid: false, error: `API returned status ${response.status}` };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Could not connect to OpenRouter' };
  }
}

/**
 * Extract JSON from a response that might be wrapped in markdown code blocks.
 */
function extractJson(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code block fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/gm, '').replace(/```\s*$/gm, '');
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  return cleaned;
}

/**
 * Call OpenRouter API with the given messages and model.
 */
async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature = 0.3,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Add your API key in Settings.');
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Echo - App Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ] as OpenRouterMessage[],
      temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data: OpenRouterResponse = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenRouter');

  return content;
}

/**
 * Analyze recorded events using OpenRouter AI to produce a structured intent map.
 * Uses persona detection to tailor the analysis.
 */
export async function analyzeEvents(events: RecorderEvent[]): Promise<IntentMap> {
  // Run local analysis first
  const local = runLocalAnalysis(events);

  // Build enhanced prompt
  const userPrompt = buildEnhancedAnalysisPrompt(events, local.persona, local.workflows);
  const systemPrompt = getPersonaAwareSystemPrompt(local.persona);

  console.log(`[Echo] Analyzing ${events.length} events (persona: ${local.persona.type}) via ${ANALYSIS_MODEL}...`);

  try {
    const content = await callOpenRouter(systemPrompt, userPrompt, ANALYSIS_MODEL, 0.2);
    const jsonStr = extractJson(content);
    const aiResult = JSON.parse(jsonStr);

    // Merge AI result with local analysis
    const merged = mergeAnalyses(aiResult, local);
    console.log('[Echo] Analysis complete:', merged.summary);
    return merged;
  } catch (error) {
    console.error('[Echo] OpenRouter analysis failed:', error);
    console.log('[Echo] Falling back to local-only analysis...');
    // Return a basic intent map from local analysis
    return {
      screens: [],
      actions: [],
      models: [],
      appName: 'MyMobileApp',
      appDescription: 'A mobile app generated from your workflow',
      summary: `A mobile app with ${local.persona.label.toLowerCase()} focus.`,
    };
  }
}

/**
 * Generate AI-powered feature recommendations based on the intent map and persona.
 */
export async function generateAIRecommendations(
  intentMap: IntentMap,
  persona?: PersonaProfile,
): Promise<Recommendation[]> {
  try {
    const systemPrompt = getRecommendationSystemPrompt(intentMap, persona);
    const screenSummary = intentMap.screens.map(s =>
      `- ${s.name}: ${s.description} (components: ${s.components.join(', ')})`
    ).join('\n');
    const actionSummary = intentMap.actions.map(a =>
      `- ${a.name}: ${a.description} (trigger: ${a.trigger})`
    ).join('\n');

    const userPrompt = `Here is the analyzed intent map for a web app being converted to mobile:

APP NAME: ${intentMap.appName || 'Unnamed'}
DESCRIPTION: ${intentMap.appDescription || intentMap.summary}

SCREENS:
${screenSummary}

ACTIONS:
${actionSummary}

Generate 3 contextual feature recommendations for the mobile version of this app.`;

    const content = await callOpenRouter(systemPrompt, userPrompt, RECOMMENDATION_MODEL, 0.4);
    const jsonStr = extractJson(content);
    const recommendations = JSON.parse(jsonStr) as Recommendation[];
    console.log(`[Echo] Generated ${recommendations.length} AI recommendations`);
    return recommendations.slice(0, 3);
  } catch (error) {
    console.error('[Echo] AI recommendations failed:', error);
    // Fall back to rule-based recommendations
    return generateFallbackRecommendations(intentMap);
  }
}

/**
 * Process a Vibe Coding prompt — interpret natural language changes for the generated app.
 */
export async function processVibeCoding(
  prompt: string,
  intentMap: IntentMap,
): Promise<{
  type: string;
  description: string;
  targetScreen: string | null;
  changes: any[];
  newScreens: any[];
  newModels: any[];
  summary: string;
}> {
  try {
    const systemPrompt = getVibeCodingSystemPrompt();

    const screenSummary = intentMap.screens.map(s =>
      `- ${s.name}: ${s.description} (${s.components.join(', ')})`
    ).join('\n');
    const modelSummary = intentMap.models.map(m =>
      `- ${m.name}: ${m.fields.map(f => `${f.name} (${f.type})`).join(', ')}`
    ).join('\n');
    const actionSummary = intentMap.actions.map(a =>
      `- ${a.name}: ${a.description}`
    ).join('\n');

    const userPrompt = `Current app state:

APP: ${intentMap.appName || 'Unnamed'}
DESCRIPTION: ${intentMap.appDescription || intentMap.summary}

SCREENS:
${screenSummary || 'No screens defined'}

DATA MODELS:
${modelSummary || 'No models defined'}

ACTIONS:
${actionSummary || 'No actions defined'}

User's request: "${prompt}"

Interpret what the user wants to change or add to this app. Return the structured modification JSON.`;

    const content = await callOpenRouter(systemPrompt, userPrompt, VIBE_CODING_MODEL, 0.3);
    const jsonStr = extractJson(content);
    const result = JSON.parse(jsonStr);

    console.log('[Echo] Vibe coding processed:', result.summary);
    return result;
  } catch (error) {
    console.error('[Echo] Vibe coding failed:', error);
    return {
      type: 'add_feature',
      description: prompt,
      targetScreen: null,
      changes: [],
      newScreens: [],
      newModels: [],
      summary: `Add feature: ${prompt}`,
    };
  }
}

/**
 * Fallback: rule-based recommendations when AI is unavailable.
 */
function generateFallbackRecommendations(intentMap: IntentMap): Recommendation[] {
  const recs: Recommendation[] = [];
  const hasForms = intentMap.actions.some(a =>
    a.name.toLowerCase().includes('create') || a.name.toLowerCase().includes('add') || a.name.toLowerCase().includes('submit')
  );
  const hasLists = intentMap.screens.some(s =>
    s.name.toLowerCase().includes('list') || s.name.toLowerCase().includes('board')
  );

  if (hasForms) {
    recs.push({
      id: 'push-notifications',
      title: 'Push Notifications',
      description: `Keep users engaged with real-time alerts for ${intentMap.appName || 'your app'}. Notify them when items are created, updated, or assigned.`,
      icon: 'Bell',
      difficulty: 'medium',
    });
  }

  if (hasLists) {
    recs.push({
      id: 'search-filters',
      title: 'Search & Filters',
      description: 'Add powerful search and multi-criteria filtering to help users quickly find what they need across large datasets.',
      icon: 'Search',
      difficulty: 'easy',
    });
  }

  recs.push({
    id: 'offline-mode',
    title: 'Offline Support',
    description: 'Enable offline-first architecture so users can browse and interact with data even without an internet connection.',
    icon: 'Download',
    difficulty: 'advanced',
  });

  return recs.slice(0, 3);
}
