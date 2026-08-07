import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, LayoutDashboard, Clock, BarChart3,
  Plus, ExternalLink, Code, Download, MoreVertical,
  Smartphone, TrendingUp, Star, Flame, Grid3X3,
  Play, ArrowRight, Trash2, Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { GeneratedApp, AppStatus, Template } from '../types';

// ── Mock recent activity ────────────────────────────────
const RECENT_ACTIVITY = [
  { user: 'Sarah Chen', action: 'created "Team Dashboard"', time: '2 min ago', initials: 'SC' },
  { user: 'Marcus Johnson', action: 'deployed "CRM Pro"', time: '15 min ago', initials: 'MJ' },
  { user: 'Elena Rodriguez', action: 'forked "Task Tracker"', time: '1 hour ago', initials: 'ER' },
  { user: 'David Kim', action: 'generated "Blog Platform"', time: '2 hours ago', initials: 'DK' },
  { user: 'Alex Turner', action: 'published "Survey App"', time: '3 hours ago', initials: 'AT' },
];

const RECOMMENDED_TEMPLATES: Template[] = [
  { id: 'rt1', name: 'Project Management Pro', description: 'Manage projects, tasks, and team assignments', category: 'Productivity', features: [], iconName: 'LayoutDashboard', gradient: 'from-violet-500/30 to-purple-600/30', isFeatured: true, isTrending: false, appType: 'web', rating: 4.8, downloadCount: 1250, screenshotUrls: [] },
  { id: 'rt2', name: 'CRM Dashboard', description: 'Customer management and sales tracking', category: 'CRM', features: [], iconName: 'Users', gradient: 'from-amber-400/30 to-orange-500/30', isFeatured: true, isTrending: false, appType: 'web', rating: 4.5, downloadCount: 720, screenshotUrls: [] },
  { id: 'rt3', name: 'E-Commerce Store', description: 'Product catalog, cart, and checkout', category: 'E-Commerce', features: [], iconName: 'ShoppingCart', gradient: 'from-emerald-400/30 to-cyan-500/30', isFeatured: false, isTrending: true, appType: 'web', rating: 4.7, downloadCount: 980, screenshotUrls: [] },
];

const STATUS_COLORS: Record<AppStatus, string> = {
  draft: 'bg-text-dim',
  building: 'bg-warning animate-pulse-recording',
  built: 'bg-success',
  published: 'bg-primary',
  archived: 'bg-text-dim',
};

const STATUS_LABELS: Record<AppStatus, string> = {
  draft: 'Draft', building: 'Building...', built: 'Ready', published: 'Published', archived: 'Archived',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { addToast } = useToast();
  const [apps, setApps] = useState<GeneratedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'apps' | 'activity'>('apps');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('generated_apps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        setApps(data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          sessionId: r.session_id,
          appName: r.app_name,
          description: r.description,
          codeFiles: r.code_files || {},
          status: r.status,
          appType: r.app_type,
          buildProgress: r.build_progress || 0,
          apkUrl: r.apk_url,
          ipaUrl: r.ipa_url,
          sourceZipUrl: r.source_zip_url,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })));
      }
    } catch (err) {
      console.warn('Failed to load apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewApp = () => {
    navigate('/templates');
  };

  const handleDeleteApp = async (appId: string) => {
    const { error } = await supabase.from('generated_apps').delete().eq('id', appId);
    if (!error) {
      setApps(prev => prev.filter(a => a.id !== appId));
      addToast({ type: 'success', title: 'App deleted', message: 'The app has been removed.' });
    } else {
      addToast({ type: 'error', title: 'Failed to delete', message: 'Please try again.' });
    }
  };

  const copyToClipboard = (app: GeneratedApp) => {
    const code = JSON.stringify(app.codeFiles, null, 2);
    navigator.clipboard.writeText(code).then(() => {
      addToast({ type: 'success', title: 'Copied!', message: 'Source code copied to clipboard.' });
    });
  };

  const stats = useMemo(() => ({
    total: apps.length,
    published: apps.filter(a => a.status === 'published').length,
    building: apps.filter(a => a.status === 'building').length,
    drafts: apps.filter(a => a.status === 'draft').length,
  }), [apps]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
            {state.userProfile?.displayName ? `Welcome back, ${state.userProfile.displayName}` : 'My Apps'}
          </h1>
          <p className="text-sm text-text-muted">Manage your generated apps and create new ones.</p>
        </div>
        <button onClick={handleNewApp} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Create New App
        </button>
      </div>

      {/* Stats row */}
      {apps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Apps', value: stats.total, icon: Grid3X3, color: 'text-primary' },
            { label: 'Published', value: stats.published, icon: ExternalLink, color: 'text-success' },
            { label: 'Building', value: stats.building, icon: Clock, color: 'text-warning' },
            { label: 'Drafts', value: stats.drafts, icon: Code, color: 'text-text-dim' },
          ].map((s, i) => (
            <div key={i} className="card p-4 text-center">
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-text-dim">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setActiveView('apps')} className={`text-sm font-medium pb-2 border-b-2 transition-colors cursor-pointer ${activeView === 'apps' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-foreground'}`}>
          My Apps
        </button>
        <button onClick={() => setActiveView('activity')} className={`text-sm font-medium pb-2 border-b-2 transition-colors cursor-pointer ${activeView === 'activity' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-foreground'}`}>
          Activity Feed
        </button>
      </div>

      {activeView === 'apps' ? (
        <>
          {/* Apps grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="skeleton h-32 mb-4" />
                  <div className="skeleton h-4 w-2/3 mb-2" />
                  <div className="skeleton h-3 w-full" />
                </div>
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No apps yet</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
                Record a workflow or use a template to generate your first mobile app with Echo.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleNewApp} className="btn-primary text-sm py-2.5 px-5 cursor-pointer">
                  Create Your First App
                </button>
                <button onClick={() => navigate('/templates')} className="btn-secondary text-sm py-2.5 px-5 cursor-pointer">
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {apps.map(app => (
                <div key={app.id} className="card p-5 group">
                  {/* Top bar with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[app.status]}`} />
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">{STATUS_LABELS[app.status]}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(app)} className="p-1.5 rounded text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer" title="Copy code">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteApp(app.id)} className="p-1.5 rounded text-text-dim hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-1">{app.appName}</h3>
                  {app.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{app.description}</p>}

                  {/* Code preview stub */}
                  <div className="w-full h-28 rounded-lg bg-surface-hover border border-border/30 flex items-center justify-center mb-3 overflow-hidden">
                    <div className="w-full h-full p-3 font-mono text-[10px] text-text-dim overflow-hidden">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-destructive/60" />
                        <div className="w-2 h-2 rounded-full bg-warning/60" />
                        <div className="w-2 h-2 rounded-full bg-success/60" />
                        <span className="text-text-dim ml-1">App.tsx</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1 w-3/4 rounded bg-border/50" />
                        <div className="h-1 w-1/2 rounded bg-border/50" />
                        <div className="h-1 w-2/3 rounded bg-border/50" />
                        <div className="h-1 w-1/3 rounded bg-border/50" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-dim">
                    <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      {app.buildProgress > 0 && app.status === 'building' && (
                        <span className="text-warning">{app.buildProgress}%</span>
                      )}
                      {app.status === 'built' && (
                        <button onClick={() => addToast({ type: 'info', title: 'Download', message: 'Build download starting soon...' })} className="flex items-center gap-1 text-primary hover:text-accent transition-colors cursor-pointer">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                      <button onClick={() => navigate('/results')} className="flex items-center gap-1 text-text-muted hover:text-foreground transition-colors cursor-pointer">
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Activity Feed */
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/20 bg-surface/50">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border/10">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">{act.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground"><span className="font-medium">{act.user}</span> <span className="text-text-muted">{act.action}</span></p>
                  <p className="text-xs text-text-dim">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended For You */}
      {apps.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">Recommended For You</h3>
            </div>
            <button onClick={() => navigate('/templates')} className="text-xs text-primary hover:text-accent transition-colors cursor-pointer">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RECOMMENDED_TEMPLATES.map(t => (
              <div key={t.id} className="card p-4 group cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate('/templates')}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                  <span className="text-xs text-text-dim">{t.rating} · {t.downloadCount}+ downloads</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</h4>
                <p className="text-xs text-text-muted mt-1">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting started guide for new users */}
      {apps.length === 0 && !loading && (
        <div className="mt-12 card p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2">Getting Started with Echo</h3>
              <div className="space-y-2">
                {[
                  'Choose a demo app or template to get started, or record your own workflow.',
                  'Interact with the demo naturally — Echo captures every click and input.',
                  'Our AI analyzes your interactions and generates a complete React Native app.',
                  'Download your app, customize it, or deploy directly to app stores.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-primary mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-text-muted">{step}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleNewApp} className="btn-primary text-sm py-2.5 px-5 mt-4 cursor-pointer">
                Start Building
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
