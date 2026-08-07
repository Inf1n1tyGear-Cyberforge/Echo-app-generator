import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Check, Zap, Shield, ArrowRight,
  Crown, Building2, ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Subscription, PlanType } from '../types';

const PLANS = [
  {
    id: 'free' as PlanType,
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Zap,
    features: ['3 workflow recordings', '1 generated app', 'Basic templates', 'Community support'],
    color: '',
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    features: ['Unlimited recordings', 'Unlimited apps', 'All premium templates', 'APK & IPA downloads', 'Custom branding', 'Priority AI processing', 'Analytics dashboard', 'Email support'],
    color: 'border-primary/40',
    highlighted: true,
  },
  {
    id: 'enterprise' as PlanType,
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    icon: Building2,
    features: ['Everything in Pro', 'Custom AI fine-tuning', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'White-label exports', 'API access'],
    color: '',
  },
];

export default function Billing() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { addToast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSubscription({
          id: data.id,
          userId: data.user_id,
          planType: data.plan_type,
          status: data.status,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          currentPeriodEnd: data.current_period_end,
          recordingsUsed: data.recordings_used,
          appsGenerated: data.apps_generated,
          maxRecordings: data.max_recordings,
          maxApps: data.max_apps,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (err) {
      console.warn('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === 'free') {
      addToast({ type: 'info', title: 'Free plan', message: 'You are already on the free plan.' });
      return;
    }

    // In production this would redirect to Stripe Checkout
    addToast({
      type: 'info',
      title: 'Upgrade requested',
      message: `Redirecting to secure checkout for the ${plan === 'pro' ? 'Pro' : 'Enterprise'} plan...`,
    });

    // Simulate: in production, call Edge Function to create Stripe Checkout Session
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Demo mode',
        message: 'In production, Stripe Checkout would be integrated here. Contact sales for early access.',
      });
    }, 1500);
  };

  const currentPlan = subscription?.planType || 'free';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Billing & Plans</h1>
        <p className="text-sm text-text-muted">Manage your subscription and payment method.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-6 skeleton h-48" />)}
        </div>
      ) : (
        <>
          {/* Current plan */}
          <div className="card p-6 mb-8 bg-primary/5 border-primary/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-foreground">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${subscription?.status === 'active' ? 'bg-success/10 text-success' : 'bg-text-dim/10 text-text-dim'}`}>
                      {subscription?.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {currentPlan === 'free' ? '1 app · 3 recordings' : currentPlan === 'pro' ? 'Unlimited apps · Unlimited recordings' : 'Everything + Custom support'}
                  </p>
                </div>
              </div>

              {currentPlan === 'free' && (
                <button onClick={() => handleUpgrade('pro')} className="btn-primary text-sm py-2 px-5 cursor-pointer flex items-center gap-1.5">
                  Upgrade to Pro <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {subscription && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/20">
                <div>
                  <p className="text-xs text-text-dim">Recordings Used</p>
                  <p className="text-sm font-semibold text-foreground">{subscription.recordingsUsed} / {subscription.maxRecordings === 999 ? '∞' : subscription.maxRecordings}</p>
                </div>
                <div>
                  <p className="text-xs text-text-dim">Apps Generated</p>
                  <p className="text-sm font-semibold text-foreground">{subscription.appsGenerated} / {subscription.maxApps === 999 ? '∞' : subscription.maxApps}</p>
                </div>
                {subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-text-dim">Renewal Date</p>
                    <p className="text-sm font-semibold text-foreground">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan selection */}
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              const isCurrent = currentPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`card p-6 flex flex-col relative ${plan.highlighted ? 'border-primary/40 scale-[1.02]' : 'border-border/40'} ${isCurrent ? 'ring-1 ring-primary/30' : ''}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Popular
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-primary' : 'text-text-dim'}`} />
                    <span className="font-bold text-foreground">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-text-dim">{plan.period}</span>
                  </div>

                  <div className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span className="text-sm text-text-muted">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                      isCurrent
                        ? 'bg-surface border border-border text-text-dim cursor-default'
                        : plan.highlighted
                          ? 'gradient-bg text-white hover:opacity-90'
                          : 'border border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-text-dim text-center mt-8">
            All plans include a 14-day free trial. No credit card required for the free plan.{' '}
            <a href="#" className="text-primary hover:underline">View full pricing details</a>.
          </p>
        </>
      )}
    </div>
  );
}
