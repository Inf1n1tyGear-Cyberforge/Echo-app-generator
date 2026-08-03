import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Play, Zap, Shield, Star } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-recording" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px]" style={{ animationDelay: '1s', animation: 'pulse-recording 3s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-[80px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,45,74,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,45,74,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          AI-Powered App Generation
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] animate-fade-in">
          Turn Any Web Workflow Into a{' '}
          <span className="gradient-text">Native Mobile App</span>
        </h1>

        <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Echo observes your workflow and generates production-ready React Native apps in minutes.
          No coding required — just interact with your workflow naturally.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary text-base px-8 py-4 flex items-center gap-3 cursor-pointer"
          >
            <Zap className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="btn-secondary text-base px-8 py-4 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5" />
            Try Live Demo
          </button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-text-dim animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border-2 border-background flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
            </div>
            <span>Trusted by 500+ teams</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-warning text-warning" />
            ))}
            <span className="ml-1">4.8/5 rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-success" />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
}
