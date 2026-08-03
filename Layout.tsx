import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, LogOut, Menu, X, Settings as SettingsIcon,
  Grid3X3, Layout as LayoutIcon, ChevronDown, CreditCard,
  User, Sun, Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SyncIndicator from './SyncIndicator';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useRealtimeSync(state.user?.id);

  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/auth';
  const isRecorder = location.pathname === '/record';
  const isProcessing = location.pathname === '/processing';

  if (isLanding || isAuth || isRecorder || isProcessing) {
    return <Outlet />;
  }

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-lg">Echo</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigate('/community')}
              className={`text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                location.pathname === '/community'
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Community
            </button>
            <button
              onClick={() => navigate('/templates')}
              className={`text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                location.pathname === '/templates'
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              <LayoutIcon className="w-4 h-4" />
              New App
            </button>

            <SyncIndicator />

            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-text-dim hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">
                    {state.userProfile?.displayName?.[0] || state.user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-text-dim transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
              </button>
              {userDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl border border-border/40 p-2 shadow-xl z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border/20 mb-1">
                      <p className="text-sm font-medium text-foreground">{state.userProfile?.displayName || 'User'}</p>
                      <p className="text-xs text-text-dim">{state.user?.email}</p>
                    </div>
                    <button onClick={() => { setUserDropdown(false); navigate('/dashboard'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <Grid3X3 className="w-4 h-4" /> My Apps
                    </button>
                    <button onClick={() => { setUserDropdown(false); navigate('/templates'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <LayoutIcon className="w-4 h-4" /> New App
                    </button>
                    <button onClick={() => { setUserDropdown(false); navigate('/settings'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <SettingsIcon className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { setUserDropdown(false); navigate('/billing'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer">
                      <CreditCard className="w-4 h-4" /> Billing
                    </button>
                    <div className="border-t border-border/20 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-foreground p-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/50 p-4 glass">
            <div className="flex flex-col gap-2">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === '/dashboard' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-foreground'}`}>
                <Grid3X3 className="w-4 h-4" /> My Apps
              </button>
              <button onClick={() => { navigate('/community'); setMobileMenuOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === '/community' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-foreground'}`}>
                <Grid3X3 className="w-4 h-4" /> Community
              </button>
              <button onClick={() => { navigate('/templates'); setMobileMenuOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === '/templates' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-foreground'}`}>
                <LayoutIcon className="w-4 h-4" /> New App
              </button>
              <button onClick={() => { navigate('/billing'); setMobileMenuOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === '/billing' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-foreground'}`}>
                <CreditCard className="w-4 h-4" /> Billing
              </button>
              <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 justify-center cursor-pointer">
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <button onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 justify-center cursor-pointer">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
