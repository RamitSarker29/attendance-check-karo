import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { WelcomeView } from './components/WelcomeView';
import { Dashboard } from './components/Dashboard';
import { RoutineManager } from './components/RoutineManager';
import { SubjectList } from './components/SubjectList';
import { LeaveSimulator } from './components/LeaveSimulator';
import { HistoryLog } from './components/HistoryLog';
import { SemesterManager } from './components/SemesterManager';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated, enterDemoMode } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onOpenAuth={() => handleOpenAuth('login')} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {!isAuthenticated ? (
          <WelcomeView
            onOpenAuth={handleOpenAuth}
            onEnterDemo={enterDemoMode}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'routine' && <RoutineManager />}
            {activeTab === 'subjects' && <SubjectList />}
            {activeTab === 'simulator' && <LeaveSimulator />}
            {activeTab === 'history' && <HistoryLog />}
            {activeTab === 'settings' && <SemesterManager />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950 py-6 text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-zinc-300">Attendance Check karo</span>
            <span>—</span>
            <span className="text-slate-500 dark:text-zinc-400">check your attendance efficiently</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              100% Offline Capable
            </span>
            <span>•</span>
            <span>Clean Dark / Light Theme</span>
          </div>
        </div>
      </footer>

      {/* Auth / Account Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
