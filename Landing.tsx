import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparkles, Menu, X, Grid3X3, Layout as LayoutIcon, Settings as SettingsIcon, LogOut, ChevronDown, User, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Stats from '../components/landing/Stats';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import DescribeYourAppTab from '../components/DescribeYourAppTab';
import TemplateGallery from '../components/landing/TemplateGallery';
import Footer from '../components/landing/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { state, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-border/40 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors cursor-pointer">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-lg">Echo</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <button onClick={() => { const el = document.getElementById('templates'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-text-muted hover:text-foreground transition-colors cursor-pointer">
              Templates
            </button>
            <button onClick={() => { const el = document.getElementById('pricing'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-text-muted hover:text-foreground transition-colors cursor-pointer">
              Pricing
            </button>

            {state.isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">
                      {state.userProfile?.displayName?.[0] || state.user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-dim transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl border border-border/40 p-2 shadow-xl animate-fade-in">
                    <div className="px-3 py-2 border-b border-border/20 mb-1">
                      <p className="text-sm font-medium text-foreground">{state.userProfile?.displayName || 'User'}</p>
                      <p className="text-xs text-text-dim">{state.user?.email}</p>
                    </div>
                    <button onClick={() => { setUserDropdown(false); navigate('/dashboard'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <Grid3X3 className="w-4 h-4" /> My Apps
                    </button>
                    <button onClick={() => { setUserDropdown(false); navigate('/templates'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <Zap className="w-4 h-4" /> New App
                    </button>
                    <button onClick={() => { setUserDropdown(false); navigate('/settings'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <SettingsIcon className="w-4 h-4" /> Settings
                    </button>
                    <div className="border-t border-border/20 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate('/auth?mode=login')} className="text-sm text-text-muted hover:text-foreground transition-colors cursor-pointer">
                  Sign In
                </button>
                <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary text-sm py-2 px-5 cursor-pointer">
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <button className="sm:hidden text-foreground p-2 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="sm:hidden glass border-t border-border/40 p-4">
            <div className="flex flex-col gap-2">
              <a href="#templates" className="px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-foreground" onClick={() => setMobileOpen(false)}>Templates</a>
              <a href="#pricing" className="px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-foreground" onClick={() => setMobileOpen(false)}>Pricing</a>
              {state.isAuthenticated ? (
                <>
                  <button onClick={() => { setMobileOpen(false); navigate('/dashboard'); }} className="px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-foreground text-left cursor-pointer">My Apps</button>
                  <button onClick={handleLogout} className="px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-destructive text-left cursor-pointer">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMobileOpen(false); navigate('/auth?mode=login'); }} className="btn-secondary text-sm py-2.5 w-full cursor-pointer">Sign In</button>
                  <button onClick={() => { setMobileOpen(false); navigate('/auth?mode=signup'); }} className="btn-primary text-sm py-2.5 w-full cursor-pointer">Get Started Free</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Click-outside handler for user dropdown */}
      {userDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
      )}

      <Hero />
      <HowItWorks />
      <Stats />
      <div id="templates">
        <TemplateGallery />
      </div>
      <Testimonials />
      <div id="pricing">
        <Pricing />
      </div>
      <div id="describe-app"><DescribeYourAppTab /></div>
   <Footer />
    </div>
  );
}
