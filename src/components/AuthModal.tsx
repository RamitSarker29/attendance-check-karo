import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, login, register, loginAsGuest, logout } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setError('Please enter your name.');
        return;
      }
      register(email, name);
    } else {
      login(email, name || undefined);
    }

    setError('');
    onClose();
  };

  const handleGuestLogin = () => {
    loginAsGuest();
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
                {isAuthenticated ? 'Student Account' : mode === 'login' ? 'Student Login' : 'Create Account'}
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

        {isAuthenticated && user ? (
          /* Profile view if already logged in */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{user.email}</div>
                  {user.college && <div className="text-[11px] text-slate-400 dark:text-zinc-500">{user.college}</div>}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Current Semester:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{user.semesterName}</span>
              </div>
            </div>

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
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Aman Sharma"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">College Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20"
              >
                {mode === 'login' ? 'Sign In' : 'Create Student Account'}
              </button>
            </form>

            {/* Quick Demo Student Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200 dark:border-zinc-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Continue as Demo Student (Instant 1-Click)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
