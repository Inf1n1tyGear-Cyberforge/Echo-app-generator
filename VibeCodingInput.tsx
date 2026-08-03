import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Loader2, Lightbulb,
  Wand2, ArrowRight, MessageSquare,
} from 'lucide-react';

interface VibeCodingInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  contextInfo?: string;
}

const suggestions = [
  'Add a login screen with email and password',
  'Make the app support dark mode natively',
  'Add push notifications for new updates',
  'Create a settings page with user preferences',
  'Add a bottom tab navigation',
];

export default function VibeCodingInput({
  onSubmit,
  isProcessing = false,
  disabled = false,
  contextInfo,
}: VibeCodingInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isProcessing || disabled) return;
    setShowSuggestions(false);
    onSubmit(trimmed);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [prompt]);

  return (
    <div className="rounded-xl bg-surface border border-border p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Vibe Coding</h3>
          <p className="text-xs text-text-muted">
            Describe changes or features using natural language
          </p>
        </div>
      </div>

      {/* Context info */}
      {contextInfo && (
        <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-text-muted leading-relaxed">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-primary" />
            <span className="font-medium text-primary">Recording context available</span>
          </div>
          {contextInfo}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3 h-3 text-warning" />
            <span className="text-xs text-text-muted">Try suggesting:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build or change..."
          disabled={disabled || isProcessing}
          rows={2}
          className="w-full px-4 py-3 pr-12 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-text-dim resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isProcessing || disabled}
          className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-text-dim">
          Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-text-muted font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-text-muted font-mono text-[10px]">Shift+Enter</kbd> for new line
        </p>
        <div className="flex items-center gap-1 text-[10px] text-text-dim">
          <Sparkles className="w-3 h-3 text-primary" />
          Powered by AI
        </div>
      </div>
    </div>
  );
}
