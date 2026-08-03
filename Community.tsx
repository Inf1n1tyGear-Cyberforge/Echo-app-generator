import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowLeft, Loader2, Grid3X3, List, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TemplateCard, { Template } from '../components/TemplateCard';
import TemplateDetail from '../components/TemplateDetail';
import { useApp } from '../context/AppContext';

type SortMode = 'trending' | 'newest' | 'top';

export default function Community() {
  const navigate = useNavigate();
  const { state } = useApp();
  const userId = state.user?.id;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadTemplates();
  }, [sortMode]);

  const loadTemplates = async () => {
    setLoading(true);
    const orderBy = sortMode === 'newest' ? 'created_at' : 'download_count';
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order(orderBy, { ascending: false })
      .limit(50);

    if (!error && data) {
      // Fetch like & comment counts for each template
      const templatesWithCounts = await Promise.all(
        data.map(async (t) => {
          const [likesRes, commentsRes] = await Promise.all([
            supabase.from('template_likes').select('id', { count: 'exact' }).eq('template_id', t.id),
            supabase.from('template_comments').select('id', { count: 'exact' }).eq('template_id', t.id),
          ]);
          return {
            ...t,
            screenshot_urls: (t.screenshot_urls as string[]) || [],
            likeCount: likesRes.count ?? 0,
            commentCount: commentsRes.count ?? 0,
          } as unknown as Template;
        })
      );
      setTemplates(templatesWithCounts);
    }
    setLoading(false);
  };

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortMode === 'top') return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortMode === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return (b.download_count ?? 0) - (a.download_count ?? 0);
  });

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
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">Community Templates</h1>
            <p className="text-xs text-text-dim">Discover and remix apps built by Echo users</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search & sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Sort buttons */}
            {([
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'newest', label: 'New', icon: Clock },
              { id: 'top', label: 'Top Rated', icon: Sparkles },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortMode(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  sortMode === s.id
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:text-foreground border border-border/50'
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
            <div className="w-px h-6 bg-border/50 mx-1" />
            {/* View toggle */}
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && sortedTemplates.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-text-muted text-sm">
              {searchQuery
                ? 'Try a different search term.'
                : 'Be the first to share an app with the community!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/templates')}
                className="btn-primary py-2 px-6 mt-4 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Build an App
              </button>
            )}
          </div>
        )}

        {/* Template grid */}
        {!loading && sortedTemplates.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {sortedTemplates.map((t, i) => (
              <TemplateCard
                key={t.id}
                template={t}
                index={i}
                onSelect={setSelectedTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTemplate && (
        <TemplateDetail
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onRemix={(t) => {
            setSelectedTemplate(null);
            navigate('/templates', { state: { templateToRemix: t } });
          }}
          userId={userId}
        />
      )}
    </div>
  );
}
