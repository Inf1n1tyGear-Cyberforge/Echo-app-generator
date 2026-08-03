import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader2, Lightbulb, AlertCircle, Smartphone, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReactNativeCode } from '../lib/code-generator';

const SUGGESTIONS = [
  'A task management app where users can create projects, add tasks, and track progress',
  'An e-commerce app with product listings, shopping cart, and checkout flow',
  'A habit tracker app with daily check-ins, streaks, and progress charts',
  'A customer relationship management (CRM) app with contacts and deal tracking',
  'A social media feed app with posts, likes, comments, and user profiles',
  'A restaurant menu and ordering app with categories and cart',
];

const GENERATION_SYSTEM_PROMPT = `You are Echo AI, an expert mobile app designer and developer.

Given a text description of an app idea, you must generate a complete structured intent map that can be used to build a React Native app.

Return a JSON object with this exact structure:
{
  "appName": "AppName",
  "appDescription": "A brief description of what this app does",
  "summary": "1-2 sentence summary",
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
  ]
}

Rules:
- Screen names: PascalCase, no spaces, no "Screen" suffix
- Component names: PascalCase
- Include at least 2-3 screens for a complete app
- Include relevant data models with appropriate fields
- Include actions that make sense for the app type
- The appName should be a single word, PascalCase`;

function getApiKey(): string {
  return localStorage.getItem('echo_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
}

export default function DescribeYourAppTab() {
  const navigate = useNavigate();
  const { createSession, setIntentMap, setGeneratedCode } = useApp();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'input' | 'generating' | 'complete'>('input');
  const [progressLabel, setProgressLabel] = useState('');

  const handleGenerate = async () => {
    const trimmed = description.trim();
    if (!trimmed || loading) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('OpenRouter API key not configured. Add it in Settings first.');
      return;
    }

    setLoading(true);
    setError('');
    setStage('generating');
    setProgressLabel('Analyzing your app idea...');

    try {
      // Step 1: Generate the intent map via OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Echo - App Generator',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.7-sonnet',
          messages: [
            { role: 'system', content: GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: `Generate a complete mobile app structure for this description:\n\n"${trimmed}"` },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      // Extract JSON
      content = content.trim();
      content = content.replace(/^```(?:json)?\s*\n?/gm, '').replace(/```\s*$/gm, '').trim();

      const intentMap = JSON.parse(content);

      // Validate structure
      if (!intentMap.screens || !Array.isArray(intentMap.screens)) {
        throw new Error('AI response missing screens array');
      }
      if (!intentMap.appName) {
        intentMap.appName = 'MyApp';
      }

      setProgressLabel(`Designed ${intentMap.screens.length} screens with AI...`);

      // Step 2: Create a session
      createSession('text-to-app://' + intentMap.appName);

      // Step 3: Generate the code
      setProgressLabel('Generating React Native code...');
      await new Promise(r => setTimeout(r, 500));

      const code = generateReactNativeCode(intentMap);
      setIntentMap(intentMap);
      setGeneratedCode(code);

      setProgressLabel(`${Object.keys(code).length} files generated!`);
      setStage('complete');

      // Navigate to results after a brief delay
      setTimeout(() => {
        navigate('/results');
      }, 1200);
    } catch (err: any) {
      console.error('[DescribeYourApp] Generation failed:', err);
      setError(err.message || 'Failed to generate app. Please try again.');
      setStage('input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 border border-border/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Describe Your App</h3>
          <p className="text-xs text-text-muted">
            Just describe what you want to build — AI handles the rest
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {stage === 'input' && !loading && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3 h-3 text-warning" />
            <span className="text-xs text-text-muted">Try describing:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setDescription(suggestion)}
                className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {suggestion.length > 50 ? suggestion.substring(0, 50) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="block text-xs text-destructive/70 underline mt-1 hover:no-underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your app idea in detail... e.g., 'A food delivery app where users can browse restaurants, view menus, place orders, and track delivery in real-time'"
        disabled={loading}
        rows={4}
        className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-text-dim resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!description.trim() || loading}
        className="w-full mt-3 py-3 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progressLabel || 'Generating...'}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Generate App from Description
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Processing state */}
      {loading && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progressLabel}</span>
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Complete state */}
      {stage === 'complete' && (
        <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 text-sm text-success">
            <Smartphone className="w-4 h-4" />
            <span>App generated! Redirecting to results...</span>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[10px] text-text-dim mt-2">
        Powered by AI · Your description is sent to OpenRouter for processing
      </p>
    </div>
  );
}