import { useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Echo and building your first app.',
    features: [
      '3 workflow recordings',
      '1 generated app',
      'Basic templates',
      'Community support',
      'Standard AI analysis',
    ],
    cta: 'Get Started Free',
    gradient: 'from-border/30 to-border/10',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For creators and teams building multiple apps.',
    features: [
      'Unlimited recordings',
      'Unlimited generated apps',
      'All premium templates',
      'Priority AI processing',
      'APK & IPA downloads',
      'Custom branding',
      'Email support',
      'Analytics dashboard',
    ],
    cta: 'Start Pro Trial',
    gradient: 'from-primary/30 to-accent/30',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For organizations needing advanced features and support.',
    features: [
      'Everything in Pro',
      'Custom AI model fine-tuning',
      'Dedicated support',
      'SLA guarantee',
      'SSO & SAML',
      'Advanced collaboration',
      'White-label exports',
      'API access',
    ],
    cta: 'Contact Sales',
    gradient: 'from-border/30 to-border/10',
    highlighted: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-surface/30 border-t border-border/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Start free. Upgrade when you are ready to build more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`card p-8 relative flex flex-col ${
                plan.highlighted
                  ? 'border-primary/40 scale-[1.02] shadow-lg shadow-primary/10'
                  : 'border-border/40'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-text-dim">{plan.period}</span>
                </div>
                <p className="text-xs text-text-muted">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm text-text-muted">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(plan.highlighted ? '/auth' : '/auth')}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                  plan.highlighted
                    ? 'gradient-bg text-white hover:opacity-90'
                    : 'border border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
