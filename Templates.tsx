import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Monitor,
  LayoutDashboard, ListTodo, CheckSquare,
  Package, ShoppingCart, Star,
  Flame, Target, Award,
  CheckCircle2, ChevronRight, Pen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DescribeYourAppTab from '../components/DescribeYourAppTab';

type DemoType = 'flowboard' | 'shopwave' | 'habitspark';

interface DemoOption {
  id: DemoType;
  name: string;
  subtitle: string;
  icon: typeof LayoutDashboard;
  gradient: string;
  features: { icon: typeof LayoutDashboard; title: string; desc: string }[];
  mockupItems: { name: string; subtitle: string; color: string }[];
  color: string;
}

const DEMOS: DemoOption[] = [
  {
    id: 'flowboard',
    name: 'FlowBoard',
    subtitle: 'Project Management',
    icon: LayoutDashboard,
    gradient: 'from-primary/30 to-accent/30',
    color: '#7c3aed',
    features: [
      { icon: LayoutDashboard, title: 'Create Projects', desc: 'Name and organize your work into projects' },
      { icon: ListTodo, title: 'Manage Tasks', desc: 'Track with status, priority, due dates & notes' },
      { icon: CheckSquare, title: 'Progress & Stats', desc: 'Visual progress bars and priority breakdowns' },
    ],
    mockupItems: [
      { name: 'Website Redesign', subtitle: '12 tasks · 5 done', color: 'bg-warning' },
      { name: 'Mobile App v2', subtitle: '8 tasks · 3 done', color: 'bg-primary' },
      { name: 'Dashboard MVP', subtitle: '6 tasks · 1 done', color: 'bg-success' },
    ],
  },
  {
    id: 'shopwave',
    name: 'ShopWave',
    subtitle: 'E-commerce Store',
    icon: ShoppingCart,
    gradient: 'from-emerald-400/30 to-cyan-500/30',
    color: '#22c55e',
    features: [
      { icon: Package, title: 'Browse Products', desc: 'Filter by category and search' },
      { icon: ShoppingCart, title: 'Shopping Cart', desc: 'Add items, adjust quantities, remove' },
      { icon: Star, title: 'Full Checkout', desc: 'Shipping details and order confirmation' },
    ],
    mockupItems: [
      { name: 'Wireless Headphones', subtitle: '$79.99 · 4.5 ★', color: 'bg-primary' },
      { name: 'Sneakers Ultra', subtitle: '$129.99 · 4.8 ★', color: 'bg-accent' },
      { name: 'Smart Water Bottle', subtitle: '$34.99 · 4.2 ★', color: 'bg-success' },
    ],
  },
  {
    id: 'habitspark',
    name: 'HabitSpark',
    subtitle: 'Daily Habit Tracker',
    icon: Flame,
    gradient: 'from-amber-400/30 to-orange-500/30',
    color: '#f59e0b',
    features: [
      { icon: Target, title: 'Track Habits', desc: 'Check off daily habits and build streaks' },
      { icon: Flame, title: 'Streak Counting', desc: 'See your best streaks and stay motivated' },
      { icon: Award, title: 'Weekly Stats', desc: 'Visual charts and habit breakdowns' },
    ],
    mockupItems: [
      { name: 'Morning Reading', subtitle: '5 day streak', color: 'bg-primary' },
      { name: 'Exercise', subtitle: '3 day streak', color: 'bg-success' },
      { name: 'Drink Water', subtitle: '5 day streak', color: 'bg-accent' },
    ],
  },
];

type Tab = 'demo' | 'describe';

export default function Templates() {
  const navigate = useNavigate();
  const { createSession, clearSession } = useApp();
  const [selectedDemo, setSelectedDemo] = useState<DemoType>('flowboard');
  const [activeTab, setActiveTab] = useState<Tab>('demo');

  const demo = DEMOS.find(d => d.id === selectedDemo)!;

  const handleStartDemo = () => {
    clearSession();
    const url = `demo://${selectedDemo}`;
    createSession(url);
    navigate('/record');
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-start justify-center pt-8 sm:pt-16">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-4 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-xl">Echo</span>
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Generate a mobile app from your workflow
          </h1>
          <p className="text-text-muted text-sm max-w-lg mx-auto">
            Interact with a demo app to record your workflow, or describe your app idea
            directly — Echo's AI generates a complete React Native app either way.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface border border-border/50 text-text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Interact with Demo
          </button>
          <button
            onClick={() => setActiveTab('describe')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'describe'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface border border-border/50 text-text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            <Pen className="w-4 h-4" />
            Describe Your App
          </button>
        </div>

        {/* Demo Tab */}
        {activeTab === 'demo' && (
          <>
            {/* Demo Selector */}
            <div className="flex gap-2 mb-4 justify-center">
              {DEMOS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDemo(d.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    selectedDemo === d.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface border border-border/50 text-text-muted hover:text-foreground hover:border-primary/30'
                  }`}
                >
                  <d.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{d.name}</span>
                </button>
              ))}
            </div>

            {/* Demo App Preview Card */}
            <div key={demo.id} className="card p-6 sm:p-8 mb-6 animate-fade-in">
              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {demo.features.map((f, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-surface/50 border border-border/30">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center mx-auto mb-2`}>
                      <f.icon className="w-5 h-5" style={{ color: demo.color }} />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground mb-0.5">{f.title}</h3>
                    <p className="text-[10px] text-text-dim">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Demo app mockup preview */}
              <div className="rounded-xl border border-border/50 bg-surface overflow-hidden mb-6">
                <div className="bg-muted px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-recording animate-pulse-recording" />
                    <span className="text-xs font-medium text-foreground">{demo.name}</span>
                  </div>
                  <span className="text-[10px] text-text-dim">{demo.subtitle}</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-dim uppercase tracking-wider">
                    <demo.icon className="w-3 h-3" />
                    {demo.id === 'flowboard' ? 'All Projects' : demo.id === 'shopwave' ? 'Products' : 'Today\'s Habits'}
                  </div>
                  {demo.mockupItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30 hover:border-primary/30 transition-colors cursor-default">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${demo.gradient} flex items-center justify-center shrink-0`}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: demo.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{item.name}</p>
                        <p className="text-[10px] text-text-dim">{item.subtitle}</p>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartDemo}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base cursor-pointer"
              >
                <Monitor className="w-5 h-5" />
                Try {demo.name} Demo
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Describe Your App Tab */}
        {activeTab === 'describe' && (
          <div className="mb-6 animate-fade-in">
            <DescribeYourAppTab />
          </div>
        )}

        {/* How it works */}
        <div className="card p-4 bg-primary/5 border-primary/10">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">How it works</p>
              <p className="text-xs text-text-muted leading-relaxed">
                {activeTab === 'demo'
                  ? 'Echo loads an interactive demo app. Create projects, browse products, or track habits — just like you would in a real app. Our AI analyzes every interaction and generates a complete React Native app that mirrors your workflow.'
                  : 'Type a description of the app you want to build. Echo\'s AI designs the screens, data models, and actions — then generates production-ready React Native code automatically.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}