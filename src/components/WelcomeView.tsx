import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Calculator,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Laptop,
} from 'lucide-react';

interface WelcomeViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onEnterDemo: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onOpenAuth, onEnterDemo }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-12 animate-in fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Student Attendance Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Never get barred from college exams again.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          <strong className="text-slate-800 dark:text-zinc-200">Attendance Check karo</strong> accurately tracks your college timetable, calculates safe bunk limits in real time, and simulates future leave impacts before you take them.
        </p>

        {/* Primary Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Personal Workspace</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Device Account</span>
          </button>
        </div>

        {/* Demo Mode Sandbox Banner */}
        <div className="pt-2">
          <button
            onClick={onEnterDemo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Try Live Demo Account (Aman Sharma with preloaded sample data)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Feature Value Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Real-Time Target Math</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Instantly computes whether you are above the mandatory 75% theory threshold or 90% lab criteria. Shows exact consecutive classes required if in shortage.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Safe Bunk Cushion</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Never guess how many lectures you can afford to skip. Tells you precisely: <em>"You can safely bunk 3 classes and remain eligible."</em>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">What-If Leave Simulator</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Planning to miss tomorrow's first two classes? Select them in the interactive simulator to see your projected percentage drop and recovery plan.
          </p>
        </div>
      </div>

      {/* Device Privacy Notice */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Local-First & Offline Capable</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Your personal workspace is stored securely inside this browser. Works with zero internet connection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Zero Data Leakage
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            JSON Backup Support
          </span>
        </div>
      </div>
    </div>
  );
};
