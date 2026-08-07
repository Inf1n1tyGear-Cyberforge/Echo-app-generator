import { Camera, Wand2, Smartphone } from 'lucide-react';

const STEPS = [
  {
    icon: Camera,
    title: 'Record Your Workflow',
    description: 'Interact with any web app naturally. Echo captures every click, input, and navigation in real-time.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    step: '01',
  },
  {
    icon: Wand2,
    title: 'AI Analyzes Interactions',
    description: 'Our AI engine maps your workflow into screens, actions, and data models — understanding exactly what your app needs.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    step: '02',
  },
  {
    icon: Smartphone,
    title: 'Echo Generates Your App',
    description: 'Get a complete, production-ready React Native app with all the features you demonstrated. Deploy in one click.',
    color: 'text-success',
    bg: 'bg-success/10',
    step: '03',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Three simple steps from workflow to native app. No coding required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative group">
                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-[2px] bg-gradient-to-r from-border/50 to-border/20" />
                )}
                <div className="card p-8 text-center relative z-10 h-full border-border/40 hover:border-primary/30 transition-all duration-300">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-dim bg-background px-3 py-1 rounded-full border border-border/30">
                    {step.step}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
