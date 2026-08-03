import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Founder',
    company: 'StartupFlow',
    text: 'Echo saved us 3 months of development time. We recorded our workflow and had a working app in under an hour. Absolutely incredible technology.',
    initials: 'SC',
    gradient: 'from-primary/40 to-accent/40',
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'TechCorp',
    text: 'As a PM who cannot code, Echo is a dream. I can prototype entire apps just by showing how I want them to work. The AI understands the intent perfectly.',
    initials: 'MJ',
    gradient: 'from-accent/40 to-cyan-400/40',
  },
  {
    name: 'Elena Rodriguez',
    role: 'CTO',
    company: 'DataVista',
    text: 'We were skeptical at first, but Echo generated cleaner code than our junior devs. The React Native output is production quality and well-structured.',
    initials: 'ER',
    gradient: 'from-emerald-400/40 to-teal-400/40',
  },
  {
    name: 'David Kim',
    role: 'Indie Developer',
    company: 'SoloBuild',
    text: 'I shipped 4 apps in 2 months with Echo. What used to take me weeks now takes hours. The template marketplace is also amazing for getting started fast.',
    initials: 'DK',
    gradient: 'from-amber-400/40 to-orange-400/40',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Loved by Teams & Indie Devs
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            See what people are building with Echo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card p-6 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-text-muted leading-relaxed flex-1 mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0`}>
                  <span className="text-xs font-bold text-white">{t.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-text-dim">{t.role} at {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
