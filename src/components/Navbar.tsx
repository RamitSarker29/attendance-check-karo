import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Calculator,
  History,
  Settings,
  Sun,
  Moon,
  WifiOff,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    user,
    isAuthenticated,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    isOffline,
    triggerCelebration,
  } = useApp();

  interface NavItem {
    id: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routine', label: 'Routine', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'simulator', label: 'Bunk Simulator', icon: Calculator, badge: 'What-If' },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Semester & Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-zinc-950/85 border-b border-slate-200/90 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                triggerCelebration();
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    Attendance Check karo
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">
                  check your attendance efficiently
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold border border-slate-200/60 dark:border-zinc-700/50'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1 py-0.2 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20 dark:border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline indicator */}
            {isOffline && (
              <div
                title="Running in offline mode. All data is saved locally on your device."
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* User Profile / Auth Button */}
            {isAuthenticated ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 transition-all text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px]">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-slate-800 dark:text-zinc-200 font-medium leading-none truncate max-w-[100px]">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight truncate">{user?.semesterName || 'Semester'}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800/90 px-2 py-1.5 transition-colors">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-emerald-500 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className={`p-1 rounded-md ${isActive ? 'bg-emerald-500/15' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[60px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
