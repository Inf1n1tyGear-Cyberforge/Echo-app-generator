import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Key, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Eye, EyeOff, ArrowLeft, Save, Trash2,
  User, Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { validateApiKey } from '../lib/openrouter';

const OPENROUTER_SIGNUP = 'https://openrouter.ai/keys';

export default function Settings() {
  const navigate = useNavigate();
  const { state } = useApp();

  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('echo_openrouter_key') || '';
    setApiKey(stored);
    setSavedKey(stored);
    if (stored) {
      setValidationResult({ valid: true });
    }
  }, []);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, error: 'Enter an API key first' });
      return;
    }
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateApiKey(apiKey.trim());
      setValidationResult(result);
      if (result.valid) {
        localStorage.setItem('echo_openrouter_key', apiKey.trim());
        setSavedKey(apiKey.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setValidationResult({ valid: false, error: err.message || 'Validation failed' });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('echo_openrouter_key', apiKey.trim());
    setSavedKey(apiKey.trim());
    setSaved(true);
    setValidationResult({ valid: true });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRemove = () => {
    localStorage.removeItem('echo_openrouter_key');
    setApiKey('');
    setSavedKey('');
    setValidationResult(null);
  };

  const hasChanged = apiKey !== savedKey;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="glass border-b border-border/50 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-heading font-bold text-lg text-foreground">Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Account info */}
        <section className="animate-fade-in">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account
          </h2>
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-dim">Signed in as</p>
                <p className="text-sm font-medium text-foreground">{state.user?.email || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* OpenRouter API Key */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            OpenRouter API Key
          </h2>

          <div className="card p-5 space-y-4">
            <p className="text-sm text-text-muted leading-relaxed">
              Echo uses OpenRouter to access AI models for analyzing your workflow and generating code.
              Enter your API key below to enable AI-powered analysis.
            </p>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setValidationResult(null); }}
                  placeholder="sk-or-v1-..."
                  className="input-field pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation result */}
            {validationResult && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                validationResult.valid
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}>
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>
                  {validationResult.valid
                    ? 'API key is valid and ready to use'
                    : validationResult.error}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleValidate}
                disabled={validating || !apiKey.trim()}
                className="btn-primary text-sm py-2.5 px-5 flex items-center justify-center gap-2"
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {validating ? 'Validating...' : 'Validate & Save'}
              </button>

              {hasChanged && savedKey && (
                <button
                  onClick={handleSave}
                  className="btn-secondary text-sm py-2.5 px-5 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Key
                </button>
              )}

              {savedKey && (
                <button
                  onClick={handleRemove}
                  className="text-sm py-2.5 px-5 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Key
                </button>
              )}
            </div>

            {saved && (
              <p className="text-xs text-success animate-fade-in">
                Key saved successfully!
              </p>
            )}

            {/* Get a key link */}
            <div className="pt-2 border-t border-border/30">
              <a
                href={OPENROUTER_SIGNUP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-accent transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Get an OpenRouter API key
              </a>
              <p className="text-xs text-text-dim mt-1">
                OpenRouter gives you access to Claude, GPT-4, and other models. Sign up for free to get your key.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
