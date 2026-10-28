import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateEmail, validateName } from '../utils/validation';
import {
  GraduationCap,
  Mail,
  User,
  LogOut,
  Sparkles,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
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
    isSupabaseConfigured,
    registeredUsers,
    login,
    register,
    resetPassword,
    enterDemoMode,
    exitDemoMode,
    logout,
    switchUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    setError('');
    setSuccessMessage('');
    setEmailConfirmationSent(false);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Email format & domain validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    // Forgot password flow
    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        const res = await resetPassword(email);
        if (!res.success) {
          setError(res.error || 'Failed to send password reset link.');
        } else {
          setSuccessMessage(`Password reset link sent to ${email}. Check your inbox!`);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Password validation for register and login if Supabase is configured
    if (isSupabaseConfigured) {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      if (mode === 'register' && password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    if (mode === 'register') {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Please enter your name.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await register(email, password, name, college);
        if (!res.success) {
          setError(res.error || 'Failed to create workspace.');
          return;
        }

        if (res.emailConfirmationRequired) {
          setEmailConfirmationSent(true);
          return;
        }

        onClose();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login flow
      setIsLoading(true);
      try {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Account not found.');
          return;
        }

        onClose();
      } finally {
        setIsLoading(false);
      }
    }
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
                  : mode === 'forgot'
                  ? 'Reset Your Password'
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




        {isAuthenticated && user ? (
          /* Profile view if currently signed in */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg border ${
                      isDemoMode
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
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
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Other Accounts on this Device:</span>
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
                onClick={async () => {
                  if (isDemoMode) {
                    exitDemoMode();
                  } else {
                    await logout();
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
        ) : emailConfirmationSent ? (
          /* Email Confirmation View */
          <div className="space-y-4 py-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verify Your Email Address</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                We've sent a verification link to <strong className="text-slate-800 dark:text-zinc-200">{email}</strong>. Please check your inbox and click the link to activate your cloud workspace.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setEmailConfirmationSent(false);
                  setMode('login');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up / Forgot Password Form */
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
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
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccessMessage('');
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
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
                {successMessage}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">
                  Accepts college domains (.edu, .ac.in, .edu.in) or major providers (@gmail.com, @outlook.com, @yahoo.com, @icloud.com)
                </span>
              </div>

              {/* Password field for login & register */}
              {mode !== 'forgot' && isSupabaseConfigured && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Saved accounts quick-select if in login mode without Supabase */}
              {mode === 'login' && !isSupabaseConfigured && registeredUsers.length > 0 && (
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
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : mode === 'forgot' ? (
                  'Send Password Reset Link'
                ) : mode === 'login' ? (
                  'Sign In to Account'
                ) : (
                  'Create Account'
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-full text-center text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 pt-1"
                >
                  Back to Sign In
                </button>
              )}
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
