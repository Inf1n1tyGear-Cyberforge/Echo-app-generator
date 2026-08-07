import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Clock, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const OAUTH_PROVIDERS = [
  { provider: 'google', label: 'Google', icon: 'G' },
  { provider: 'github', label: 'GitHub', icon: 'GH' },
] as const;

const RATE_LIMIT_COOLDOWN_MS = 60_000; // 60 seconds between auth attempts

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useApp();

  const isSignUp = searchParams.get('signup') === '1';
  const [mode, setMode] = useState<'login' | 'signup'>(isSignUp ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'rate-limit' | 'validation' | 'auth' | 'unknown'>('auth');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastAttemptRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = () => {
    lastAttemptRef.current = Date.now();
    setCooldownRemaining(RATE_LIMIT_COOLDOWN_MS / 1000);

    cooldownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastAttemptRef.current;
      const remaining = Math.max(0, RATE_LIMIT_COOLDOWN_MS - elapsed);
      setCooldownRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(cooldownTimerRef.current);
      }
    }, 1000);
  };

  const isOnCooldown = cooldownRemaining > 0;

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (isOnCooldown) return;
    setOauthLoading(provider);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      const msg = err.message || `${provider} sign-in failed`;
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('too many')) {
        setError('Rate limit reached. Please wait a moment and try again.');
        setErrorType('rate-limit');
        startCooldown();
      } else {
        setError(msg);
        setErrorType('auth');
      }
      setOauthLoading(null);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (isOnCooldown) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      if (data.user) {
        setUser({ id: data.user.id, email: 'guest@echo.app' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('too many')) {
        setError('Temporary rate limit. Please try again in a minute.');
        setErrorType('rate-limit');
        startCooldown();
      } else {
        setError(msg);
        setErrorType('auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOnCooldown) return;

    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // If email confirmation is disabled, user is signed in immediately
          if (data.session) {
            setUser({ id: data.user.id, email: data.user.email || email });
            navigate('/dashboard');
          } else {
            // Email confirmation required
            setError('Check your email for the confirmation link, then sign in.');
            setErrorType('auth');
            setMode('login');
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || email });
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
        setError(
          'You hit the email rate limit (the built-in email service allows 4 emails/hour). ' +
          'Try using Google/GitHub sign-in, or wait a few minutes.'
        );
        setErrorType('rate-limit');
        startCooldown();
      } else if (msg.includes('invalid login credentials')) {
        setError('Incorrect email or password. Please try again or reset your password.');
        setErrorType('validation');
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email address first. Check your inbox for the confirmation link.');
        setErrorType('auth');
      } else if (msg.includes('already registered')) {
        setError('An account with this email already exists. Try signing in instead.');
        setErrorType('validation');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
        setErrorType('unknown');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-6 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-xl">Echo</span>
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-text-muted mt-2 text-sm">
            {mode === 'signup'
              ? 'Start building mobile apps from your workflows'
              : 'Sign in to continue building your apps'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Error display */}
          {error && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              errorType === 'rate-limit'
                ? 'bg-warning/10 border border-warning/20 text-warning'
                : errorType === 'validation'
                ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}>
              {errorType === 'rate-limit' ? (
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div>
                <span>{error}</span>
                {errorType === 'rate-limit' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/templates')}
                      className="text-xs underline hover:no-underline cursor-pointer"
                    >
                      Browse templates instead
                    </button>
                    <span className="mx-2 text-text-dim">·</span>
                    <button
                      type="button"
                      onClick={handleAnonymousSignIn}
                      disabled={loading || isOnCooldown}
                      className="text-xs underline hover:no-underline cursor-pointer disabled:opacity-50"
                    >
                      Try anonymous mode
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cooldown indicator */}
          {isOnCooldown && !error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Please wait {formatCooldown(cooldownRemaining)} before trying again</span>
            </div>
          )}

          {/* OAuth Buttons - Primary */}
          <div className="space-y-2">
            {OAUTH_PROVIDERS.map(({ provider, label, icon }) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleOAuthSignIn(provider)}
                disabled={oauthLoading !== null || isOnCooldown}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border/50 bg-surface hover:bg-surface-hover text-foreground text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {oauthLoading === provider ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold text-text-muted">
                    {icon}
                  </span>
                )}
                {oauthLoading === provider ? 'Connecting...' : `Continue with ${label}`}
              </button>
            ))}

            {/* Anonymous auth */}
            <button
              type="button"
              onClick={handleAnonymousSignIn}
              disabled={loading || isOnCooldown}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-dashed border-border/30 bg-transparent hover:bg-surface/50 text-text-muted hover:text-foreground text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {loading ? 'Starting...' : 'Continue without account (guest)'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs text-text-dim">
              <span className="bg-surface px-2">or continue with email</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isOnCooldown}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError('');
              }}
              className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}