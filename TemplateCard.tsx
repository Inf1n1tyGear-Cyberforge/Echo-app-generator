import { Star, Download, Heart, MessageSquare, Eye } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  intent_map: Record<string, unknown> | null;
  screenshot_urls: string[];
  rating: number;
  download_count: number;
  is_public: boolean;
  created_at: string;
  likeCount?: number;
  commentCount?: number;
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  index?: number;
}

export default function TemplateCard({ template, onSelect, index = 0 }: TemplateCardProps) {
  const screenCount = (template.intent_map as { screens?: unknown[] })?.screens?.length ?? 0;

  return (
    <div
      onClick={() => onSelect(template)}
      className="group card p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Thumbnail area */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-br from-primary/5 via-surface to-accent/5 border border-border/30 mb-4 flex items-center justify-center overflow-hidden">
        {template.screenshot_urls?.length > 0 ? (
          <img
            src={template.screenshot_urls[0]}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <Eye className="w-8 h-8 text-primary/30 mx-auto mb-1" />
            <p className="text-xs text-text-dim">{screenCount} screen{screenCount !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
        {template.name}
      </h3>
      <p className="text-sm text-text-muted line-clamp-2 mb-4 min-h-[2.5rem]">
        {template.description || 'No description'}
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-text-dim">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Star className={`w-3.5 h-3.5 ${template.rating > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
            {template.rating > 0 ? template.rating.toFixed(1) : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {template.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {template.commentCount ?? 0}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Download className="w-3.5 h-3.5" />
          {template.download_count}
        </span>
      </div>
    </div>
  );
}
