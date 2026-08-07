import { Smartphone, Users, Star, Globe } from 'lucide-react';

const STATS = [
  { icon: Smartphone, value: '500+', label: 'Apps Generated', color: 'text-primary' },
  { icon: Users, value: '1.2k+', label: 'Templates Shared', color: 'text-accent' },
  { icon: Star, value: '4.8 ★', label: 'Average Rating', color: 'text-warning' },
  { icon: Globe, value: '35+', label: 'Countries', color: 'text-success' },
];

export default function Stats() {
  return (
    <section className="py-16 sm:py-20 border-y border-border/20 bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center">
                <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <p className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
