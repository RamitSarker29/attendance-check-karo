import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateEmail, validateName } from '../utils/validation';
import {
  GraduationCap,
  Mail,
  User,
  LogOut,
  Sparkles,
  Info,
  Building2,
  Users,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const {
    user,
    isAuthenticated,
    isDemoMode,
    registeredUsers,
    login,
    register,
    enterDemoMode,
    exitDemoMode,
    logout,
    switchUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    setError('');
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Email format validation for both login and register
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Please enter your name.');
        return;
      }
      const res = register(email, name, college);
      if (!res.success) {
        setError(res.error || 'Failed to create workspace.');
        return;
      }
    } else {
      const res = login(email);
      if (!res.success) {
        setError(res.error || 'Account not found.');
        return;
      }
    }

    setError('');
    setEmail('');
    setName('');
    setCollege('');
    onClose();
  };

  const handleLaunchDemo = () => {
    enterDemoMode();
    onClose();
  };

  const handleSwitchAccount = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-bold">
              <GraduationCap className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isAuthenticated
                  ? isDemoMode
                    ? 'Demo Sandbox Profile'
                    : 'Personal Student Account'
                  : mode === 'login'
                  ? 'Sign In to Workspace'
                  : 'Create Personal Workspace'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Attendance Check karo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs px-2 py-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Local-Only Architecture Transparency Banner */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-xs flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Device-Specific Local Storage</span>
            <span>
              This app runs 100% offline. Workspaces are stored inside this specific browser without remote passwords or verification emails. Format validation is performed locally. To move data to another device, use the JSON Backup Export in Settings.
            </span>
          </div>
        </div>

        {isAuthenticated && user ? (
          /* Profile view if currently signed in */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg border ${
                    isDemoMode
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{user.email}</div>
                    {user.college && <div className="text-[11px] text-slate-400 dark:text-zinc-500">{user.college}</div>}
                  </div>
                </div>

                {isDemoMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                    Demo Mode
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Current Semester:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{user.semesterName}</span>
              </div>
            </div>

            {/* Other Local Accounts on this device */}
            {registeredUsers.length > 1 && !isDemoMode && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Other Local Accounts on this Device:</span>
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {registeredUsers
                    .filter(u => u.id !== user.id)
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchAccount(u.id)}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-emerald-500">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">{u.email}</div>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          Switch <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDemoMode) {
                    exitDemoMode();
                  } else {
                    logout();
                  }
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={e => {
                          setName(e.target.value);
                          if (error) setError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      College / University Name (Optional)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={college}
                        onChange={e => {
                          setCollege(e.target.value);
                          if (error) setError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  College or Personal Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="student@college.edu or name@gmail.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">
                  Accepts college domains (.edu, .ac.in, .edu.in) or major providers (@gmail.com, @outlook.com, @yahoo.com, @icloud.com)
                </span>
              </div>

              {/* Saved accounts quick-select if in login mode */}
              {mode === 'login' && registeredUsers.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Or select an account found on this browser:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {registeredUsers.map(u => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setEmail(u.email);
                          if (error) setError('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-mono border border-slate-200 dark:border-zinc-700"
                      >
                        {u.name} ({u.email})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20"
              >
                {mode === 'login' ? 'Open Personal Workspace' : 'Create Empty Personal Workspace'}
              </button>
            </form>

            {/* Quick Demo Sandbox Option */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={handleLaunchDemo}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/30 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Launch Demo Testing Sandbox (Aman Sharma)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
