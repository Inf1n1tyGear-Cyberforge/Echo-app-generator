import React from 'react';
import {
  Bell, Paperclip, Calendar, Shield, Search, Palette,
  BarChart, Lightbulb, Share2, QrCode, Download, Globe, Smartphone,
  Sparkles, ArrowRight, Loader2,
} from 'lucide-react';
import { Recommendation } from '../types';

const iconMap: Record<string, React.ElementType> = {
  Bell, Paperclip, Calendar, Shield, Search, Palette,
  BarChart, Lightbulb, Share2, QrCode, Download, Globe, Smartphone, Sparkles,
};

const difficultyColors: Record<string, string> = {
  easy: 'text-success bg-success/10',
  medium: 'text-warning bg-warning/10',
  advanced: 'text-primary bg-primary/10',
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  onImplement?: (rec: Recommendation) => void;
  implementing?: boolean;
}

export default function RecommendationCard({
  recommendation,
  index,
  onImplement,
  implementing,
}: RecommendationCardProps) {
  const Icon = iconMap[recommendation.icon] || Lightbulb;

  return (
    <div
      className="card p-5 animate-fade-in group"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm">{recommendation.title}</h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${difficultyColors[recommendation.difficulty]}`}>
              {recommendation.difficulty}
            </span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{recommendation.description}</p>
          {onImplement && (
            <button
              onClick={() => onImplement(recommendation)}
              disabled={implementing}
              className="mt-3 text-xs text-primary hover:text-accent flex items-center gap-1 transition-colors font-medium group/btn"
            >
              {implementing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Implementing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Implement this feature
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
