import { useState } from 'react';
import { X, Heart, Download, Star, MessageSquare, Send, Sparkles, ArrowLeft } from 'lucide-react';
import type { Template } from './TemplateCard';
import { supabase } from '../lib/supabase';

interface TemplateDetailProps {
  template: Template;
  onClose: () => void;
  onRemix?: (template: Template) => void;
  userId?: string | null;
}

export default function TemplateDetail({ template, onClose, onRemix, userId }: TemplateDetailProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(template.likeCount ?? 0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const screenCount = (template.intent_map as { screens?: unknown[] })?.screens?.length ?? 0;

  const handleLike = async () => {
    if (!userId) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));

    if (newLiked) {
      await supabase.from('template_likes').insert({ template_id: template.id, user_id: userId });
    } else {
      await supabase.from('template_likes').delete().match({ template_id: template.id, user_id: userId });
    }
  };

  const handleComment = async () => {
    if (!userId || !comment.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('template_comments')
      .insert({ template_id: template.id, user_id: userId, content: comment.trim() })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as { id: string; content: string; created_at: string }]);
      setComment('');
    }
    setSubmitting(false);
  };

  const handleDownload = async () => {
    await supabase
      .rpc('increment_download_count' as any, { template_id_param: template.id })
      .catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-8 sm:pt-16 overflow-y-auto">
      <div className="relative w-full max-w-3xl mx-4 bg-surface rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-md border-b border-border/30 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">{template.name}</h2>
              <p className="text-xs text-text-dim">{screenCount} screens</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Screenshot / Preview */}
          <div className="w-full h-48 rounded-xl bg-gradient-to-br from-primary/5 via-surface to-accent/5 border border-border/30 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary/30" />
          </div>

          {/* Description */}
          <p className="text-text-muted text-sm leading-relaxed">
            {template.description || 'No description provided.'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                liked
                  ? 'bg-pink-100 text-pink-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-pink-500' : ''}`} />
              {likeCount}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              {template.commentCount ?? 0}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {template.download_count}
            </button>
            {onRemix && (
              <button
                onClick={() => onRemix(template)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition-all ml-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Remix
              </button>
            )}
          </div>

          {/* Comments */}
          {showComments && (
            <div className="space-y-4 pt-2 border-t border-border/30">
              <h3 className="font-heading font-semibold text-foreground text-sm">Comments</h3>
              {comments.length === 0 && (
                <p className="text-text-dim text-xs">No comments yet. Be the first!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-foreground">{c.content}</p>
                  <p className="text-[10px] text-text-dim mt-1">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {userId && (
                <div className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={submitting || !comment.trim()}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
