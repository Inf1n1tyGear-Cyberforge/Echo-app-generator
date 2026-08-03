import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Download, ArrowLeft, RefreshCw, Smartphone,
  BarChart, Layers, Search, Share2, Globe,
  CheckCircle2, Loader2, QrCode, ExternalLink,
  Rocket, FileDown, Copy, Check, GitBranch, Upload,
} from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import CodePreview from '../components/CodePreview';
import WorkflowEditor from '../components/WorkflowEditor';
import RecommendationCard from '../components/RecommendationCard';
import { Recommendation } from '../types';
import { deployToExpo, generateDownloadZip } from '../lib/deployment';

export default function Results() {
  const navigate = useNavigate();
  const { state, setDeployConfig, clearSession } = useApp();
  const { currentSession } = state;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'deploy' | 'workflow'>('code');
  const [editableIntentMap, setEditableIntentMap] = useState(intentMap);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('echo_recommendations');
    if (stored) {
      try {
        setRecommendations(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Check for existing deploy config
  useEffect(() => {
    if (currentSession?.deployConfig) {
      setDeploySuccess(true);
    }
  }, [currentSession?.deployConfig]);

  if (!currentSession || !currentSession.intentMap || !currentSession.generatedCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">
            No generated app found
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Start a new generation to see your app here.
          </p>
          <button
            onClick={() => { clearSession(); navigate('/templates'); }}
            className="btn-primary py-2 px-6"
          >
            Start New Generation
          </button>
        </div>
      </div>
    );
  }

  const { intentMap, generatedCode, deployConfig } = currentSession;
  const fileCount = Object.keys(generatedCode).length;
  const appName = intentMap.appName || 'MyApp';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateDownloadZip(generatedCode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError('');
    try {
      const expoUrl = await deployToExpo(generatedCode, appName);
      const config = {
        expoUrl,
        vercelUrl: null,
        judgeUrl: null,
        deployedAt: new Date().toISOString(),
      };
      setDeployConfig(config);
      setDeploySuccess(true);
      // Auto-switch to preview tab so the QR code shows immediately
      setTimeout(() => setActiveTab('preview'), 600);
    } catch (err: any) {
      setDeployError(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2000);
  }, []);

  const handleStartNew = () => {
    clearSession();
    navigate('/templates');
  };

  const handleShareToCommunity = async () => {
    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('templates').insert({
        name: appName,
        description: intentMap.summary?.slice(0, 500) || 'Generated with Echo',
        user_id: user.id,
        intent_map: editableIntentMap,
        generated_code: generatedCode,
      });
      if (error) throw error;
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err: any) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="glass border-b border-border/50 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-foreground">{appName}</span>
          {deploySuccess && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
              Deployed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{downloading ? 'Preparing...' : 'Download ZIP'}</span>
          </button>
          <button
            onClick={handleStartNew}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">New Generation</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Completion moment */}
        <section className="animate-slide-up">
          <div className="card bg-gradient-to-br from-primary/10 via-surface to-accent/5 border-primary/20 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {appName} is ready!
                </h1>
                <p className="text-text-muted text-sm">
                  Echo analyzed your workflow and generated a complete React Native app
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-surface/60 rounded-xl p-3 sm:p-4">
                <Layers className="w-5 h-5 text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">{intentMap.screens.length}</p>
                <p className="text-xs text-text-muted">Screens</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-3 sm:p-4">
                <BarChart className="w-5 h-5 text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">{intentMap.actions.length}</p>
                <p className="text-xs text-text-muted">Actions</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-3 sm:p-4">
                <Search className="w-5 h-5 text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">{fileCount}</p>
                <p className="text-xs text-text-muted">Files</p>
              </div>
              <div className="bg-surface/60 rounded-xl p-3 sm:p-4">
                <Smartphone className="w-5 h-5 text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">
                  {intentMap.models.length}
                </p>
                <p className="text-xs text-text-muted">Data Models</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 bg-surface/40 rounded-xl p-4 border border-border/30">
              <p className="text-sm text-text-muted leading-relaxed">{intentMap.summary}</p>
            </div>

            {/* Share to Community */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleShareToCommunity}
                disabled={sharing || shared}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  shared
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-surface border border-border/50 text-text-muted hover:text-foreground hover:border-primary/30'
                }`}
              >
                {sharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : shared ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {sharing ? 'Sharing...' : shared ? 'Shared to Community!' : 'Share to Community'}
              </button>
            </div>
          </div>
        </section>

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border/50 w-fit">
          {[
            { id: 'code', label: 'Generated Code', icon: Layers },
            { id: 'workflow', label: 'Workflow', icon: GitBranch },
            { id: 'preview', label: 'Preview & QR', icon: QrCode },
            { id: 'deploy', label: 'Deploy', icon: Rocket },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Generated Code */}
        {activeTab === 'code' && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Generated Files
              </h2>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download ZIP
              </button>
            </div>
            <CodePreview files={generatedCode} />
          </section>
        )}

        {/* Tab: Workflow Editor */}
        {activeTab === 'workflow' && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Visual Workflow Editor
                </h2>
                <p className="text-text-muted text-sm">
                  Drag to rearrange. Edit screens, actions, and data models. Click <b>Apply Changes</b> to update your app.
                </p>
              </div>
            </div>
            <div className="card p-4 overflow-hidden">
              <WorkflowEditor
                intentMap={editableIntentMap}
                onChange={(updated) => {
                  setEditableIntentMap(updated);
                }}
                onClose={() => setActiveTab('code')}
              />
            </div>
          </section>
        )}

        {/* Tab: Preview & QR */}
        {activeTab === 'preview' && (
          <section className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="card p-6 sm:p-8 flex flex-col items-center justify-center">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                  Preview on your phone
                </h3>
                {deployConfig?.expoUrl ? (
                  <>
                    <div className="bg-white p-4 rounded-2xl mb-4">
                      <QRCode
                        value={deployConfig.expoUrl}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#0a0a0f"
                        level="M"
                      />
                    </div>
                    <p className="text-text-muted text-sm text-center mb-3">
                      Scan with Expo Go (iOS/Android) or your phone's camera
                    </p>
                    <button
                      onClick={() => handleCopyUrl(deployConfig.expoUrl!)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
                    >
                      {copiedUrl === deployConfig.expoUrl ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy Expo URL</>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-text-muted text-sm mb-2">No QR code yet</p>
                    <p className="text-text-dim text-xs">Deploy your app first to generate a QR code</p>
                  </div>
                )}
              </div>

              {/* Quick info */}
              <div className="card p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                  App Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-text-dim uppercase tracking-wider mb-2">Screens</p>
                    <div className="flex flex-wrap gap-2">
                      {intentMap.screens.map(s => (
                        <span key={s.name} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          {s.name.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-dim uppercase tracking-wider mb-2">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {intentMap.actions.map(a => (
                        <span key={a.name} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                          {a.name.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-dim uppercase tracking-wider mb-2">Data Models</p>
                    <div className="flex flex-wrap gap-2">
                      {intentMap.models.map(m => (
                        <span key={m.name} className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab: Deploy */}
        {activeTab === 'deploy' && (
          <section className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Expo Deploy */}
              <div className={`card p-6 ${deployConfig?.expoUrl ? 'border-success/30' : ''}`}>
                <Smartphone className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Expo Snack
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Deploy to Expo Snack for instant preview on iOS and Android. Scan the QR code to open in Expo Go.
                </p>
                {deployConfig?.expoUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Deployed to Expo</span>
                    </div>
                    <button
                      onClick={() => window.open(deployConfig.expoUrl!, '_blank')}
                      className="btn-secondary text-sm py-2 px-4 w-full flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Expo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    {deploying ? 'Deploying...' : 'Deploy to Expo'}
                  </button>
                )}
              </div>

              {/* Vercel Deploy */}
              <div className={`card p-6 ${deployConfig?.vercelUrl ? 'border-success/30' : ''}`}>
                <Globe className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Web Version
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Deploy the web version to Vercel for instant URL sharing. Works in any browser.
                </p>
                {deployConfig?.vercelUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Deployed to Vercel</span>
                    </div>
                    <button
                      onClick={() => window.open(deployConfig.vercelUrl!, '_blank')}
                      className="btn-secondary text-sm py-2 px-4 w-full flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Web App
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    {deploying ? 'Deploying...' : 'Deploy to Vercel'}
                  </button>
                )}
              </div>

              {/* Judge Link */}
              <div className={`card p-6 ${deployConfig?.judgeUrl ? 'border-success/30' : ''}`}>
                <Share2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Share & Judge
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Create a shareable judge link so others can review and provide feedback on your generated app.
                </p>
                {deployConfig?.judgeUrl ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCopyUrl(deployConfig.judgeUrl!)}
                      className="btn-secondary text-sm py-2 px-4 w-full flex items-center justify-center gap-2"
                    >
                      {copiedUrl === deployConfig.judgeUrl ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy Judge Link</>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(deployConfig.judgeUrl!, '_blank')}
                      className="btn-secondary text-sm py-2 px-4 w-full flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Judge Page
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {deploying ? 'Deploying...' : 'Generate Judge Link'}
                  </button>
                )}
              </div>
            </div>

            {/* Deploy error */}
            {deployError && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                {deployError}
              </div>
            )}

            {/* Deploy progress */}
            {deploying && (
              <div className="mt-6 card p-6 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">Deploying your app...</p>
                <p className="text-text-muted text-sm">This usually takes a few seconds</p>
              </div>
            )}
          </section>
        )}

        {/* Recommendations section */}
        {recommendations.length > 0 && (
          <section className="animate-fade-in pb-8">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">
                AI Feature Suggestions
              </h2>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Based on your workflow, here are features that could enhance your app
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={rec.id} recommendation={rec} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
