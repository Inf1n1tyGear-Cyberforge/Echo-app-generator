import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Kanban, Users,
  Package, Calendar, FileText, ClipboardList,
  Star, Download, ArrowRight, Search, TrendingUp,
  Flame,
} from 'lucide-react';
import { Template } from '../../types';

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  ShoppingCart,
  Kanban: LayoutDashboard,
  Users,
  Package,
  Calendar,
  FileText,
  ClipboardList,
};

const TEMPLATES: Template[] = [
  {
    id: 't1', name: 'Project Management Pro',
    description: 'Manage projects, tasks, and team assignments with a powerful kanban board and progress tracking.',
    category: 'Productivity', features: ['Kanban board', 'Task assignments', 'Progress tracking'],
    iconName: 'LayoutDashboard', gradient: 'from-violet-500/30 to-purple-600/30',
    isFeatured: true, isTrending: true, appType: 'web', rating: 4.8, downloadCount: 1250, screenshotUrls: [],
  },
  {
    id: 't2', name: 'E-Commerce Store',
    description: 'Product catalog, shopping cart, and checkout flow — everything you need to sell online.',
    category: 'E-Commerce', features: ['Product catalog', 'Shopping cart', 'Checkout flow'],
    iconName: 'ShoppingCart', gradient: 'from-emerald-400/30 to-cyan-500/30',
    isFeatured: true, isTrending: true, appType: 'web', rating: 4.7, downloadCount: 980, screenshotUrls: [],
  },
  {
    id: 't3', name: 'Task Tracker',
    description: 'Kanban board with drag-and-drop, labels, priorities, and real-time sync.',
    category: 'Productivity', features: ['Drag-and-drop', 'Labels & priorities', 'Real-time sync'],
    iconName: 'Kanban', gradient: 'from-blue-400/30 to-indigo-500/30',
    isFeatured: false, isTrending: true, appType: 'web', rating: 4.6, downloadCount: 840, screenshotUrls: [],
  },
  {
    id: 't4', name: 'CRM Dashboard',
    description: 'Customer management and sales tracking — pipeline view, contacts, and deal stages.',
    category: 'CRM', features: ['Pipeline view', 'Contact management', 'Deal stages'],
    iconName: 'Users', gradient: 'from-amber-400/30 to-orange-500/30',
    isFeatured: true, isTrending: false, appType: 'web', rating: 4.5, downloadCount: 720, screenshotUrls: [],
  },
  {
    id: 't5', name: 'Inventory Management',
    description: 'Track products and stock levels with barcode scanning and low-stock alerts.',
    category: 'Operations', features: ['Stock tracking', 'Barcode scanning', 'Low-stock alerts'],
    iconName: 'Package', gradient: 'from-rose-400/30 to-pink-500/30',
    isFeatured: false, isTrending: false, appType: 'web', rating: 4.3, downloadCount: 560, screenshotUrls: [],
  },
  {
    id: 't6', name: 'Event Planner',
    description: 'Create and manage events with RSVPs, guest lists, and scheduling tools.',
    category: 'Lifestyle', features: ['Event creation', 'Guest lists', 'RSVP tracking'],
    iconName: 'Calendar', gradient: 'from-teal-400/30 to-green-500/30',
    isFeatured: false, isTrending: false, appType: 'web', rating: 4.4, downloadCount: 410, screenshotUrls: [],
  },
  {
    id: 't7', name: 'Blog Platform',
    description: 'Create, edit, and publish blog posts with rich text editing and SEO tools.',
    category: 'Content', features: ['Rich text editor', 'SEO tools', 'Media library'],
    iconName: 'FileText', gradient: 'from-sky-400/30 to-blue-500/30',
    isFeatured: false, isTrending: false, appType: 'web', rating: 4.6, downloadCount: 680, screenshotUrls: [],
  },
  {
    id: 't8', name: 'Survey Builder',
    description: 'Create and share surveys with analytics — multiple question types and real-time results.',
    category: 'Tools', features: ['Survey builder', 'Multiple question types', 'Real-time results'],
    iconName: 'ClipboardList', gradient: 'from-fuchsia-400/30 to-purple-500/30',
    isFeatured: false, isTrending: false, appType: 'web', rating: 4.2, downloadCount: 350, screenshotUrls: [],
  },
];

const CATEGORIES = ['All', 'Productivity', 'E-Commerce', 'CRM', 'Operations', 'Lifestyle', 'Content', 'Tools'];

export default function TemplateGallery() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'featured' | 'trending'>('all');

  const filtered = useMemo(() => {
    let t = [...TEMPLATES];
    if (viewMode === 'featured') t = t.filter(t => t.isFeatured);
    if (viewMode === 'trending') t = t.filter(t => t.isTrending);
    if (filter !== 'All') t = t.filter(t => t.category === filter);
    if (search) {
      const q = search.toLowerCase();
      t = t.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return t;
  }, [filter, search, viewMode]);

  const handleUseTemplate = (template: Template) => {
    navigate('/auth');
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Template Gallery
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Start with a proven template and customize it for your needs.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="input-field text-sm pl-10 py-2.5"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${viewMode === 'all' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-text-muted border border-border/40 hover:border-primary/30'}`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('featured')}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${viewMode === 'featured' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-text-muted border border-border/40 hover:border-primary/30'}`}
            >
              <Star className="w-3 h-3" /> Featured
            </button>
            <button
              onClick={() => setViewMode('trending')}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${viewMode === 'trending' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-text-muted border border-border/40 hover:border-primary/30'}`}
            >
              <TrendingUp className="w-3 h-3" /> Trending
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border/40 text-text-muted hover:text-foreground hover:border-primary/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-text-dim mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No templates found</h3>
            <p className="text-sm text-text-muted">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map(template => {
              const Icon = ICON_MAP[template.iconName] || LayoutDashboard;
              return (
                <div
                  key={template.id}
                  className="card p-5 group cursor-pointer hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  {/* Preview placeholder */}
                  <div className={`w-full h-36 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-4 overflow-hidden`}>
                    <div className="w-full h-full p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-white/80" />
                        </div>
                        <div className="h-2 w-20 rounded bg-white/10" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5 mt-2">
                        <div className="h-1.5 w-full rounded bg-white/10" />
                        <div className="h-1.5 w-3/4 rounded bg-white/10" />
                        <div className="h-1.5 w-1/2 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {template.category}
                    </span>
                    {template.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      <span className="text-xs font-medium text-foreground">{template.rating}</span>
                      <span className="text-[10px] text-text-dim">· {template.downloadCount}+</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
                      className="text-xs text-primary font-medium hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Use Template <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
