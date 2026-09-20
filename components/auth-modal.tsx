'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, KeyRound, ArrowRight, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export const OPEN_AUTH_MODAL_EVENT = 'toolbox:open-auth-modal';

export function openAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_AUTH_MODAL_EVENT));
  }
}

export default function AuthModal() {
  const {
    signInWithPassword,
    signUpWithPassword,
    verifySignupOtp,
    signInWithOtp,
    verifyOtp,
    user,
  } = useAuth();

  const [open, setOpen] = useState(false);
  // Main view: 'login' | 'signup' | 'otp-login' | 'verify-signup' | 'success'
  const [view, setView] = useState<'login' | 'signup' | 'otp-login' | 'verify-signup' | 'success'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Listen for open events
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setView('login');
      setError(null);
      setOtp('');
      setPassword('');
    };

    window.addEventListener(OPEN_AUTH_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, handleOpen);
  }, []);

  // Sync dialog visibility & autofocus
  useEffect(() => {
    if (!dialogRef.current) return;
    if (open) {
      if (!dialogRef.current.open) {
        dialogRef.current.showModal();
      }
      setTimeout(() => {
        if (view === 'signup') nameInputRef.current?.focus();
        else if (view === 'login' || view === 'otp-login') emailInputRef.current?.focus();
        else if (view === 'verify-signup') otpInputRef.current?.focus();
      }, 50);
    } else {
      dialogRef.current.close();
    }
  }, [open, view]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // If user is already signed in, close modal
  useEffect(() => {
    if (user && open && view !== 'success') {
      setOpen(false);
    }
  }, [user, open, view]);

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  // --- 1. Login with Password ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signInWithPassword(email.trim(), password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setView('success');
      setTimeout(() => handleClose(), 1200);
    }
  };

  // --- 2. Start Signup: validates Name, Email, Password -> sends OTP ---
  const handleSignupStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signUpWithPassword(email.trim(), password, name.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.session) {
      // Auto-confirmed by Supabase
      setView('success');
      setTimeout(() => handleClose(), 1200);
    } else {
      // OTP verification required before account is created
      setView('verify-signup');
      setResendCooldown(60);
      setOtp('');
    }
  };

  // --- 3. Verify Signup OTP ---
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifySignupOtp(email.trim(), cleanOtp);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setView('success');
      setTimeout(() => handleClose(), 1200);
    }
  };

  // --- 4. Passwordless OTP Login (Alternative) ---
  const handleOtpLoginSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signInWithOtp(email.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setView('verify-signup');
      setResendCooldown(60);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="command-dialog max-w-md p-0 overflow-hidden"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          className="icon-button absolute top-5 right-5"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* --- MAIN LOGIN & SIGNUP TABS --- */}
        {(view === 'login' || view === 'signup') && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight m-0">Welcome to Toolbox</h2>
              <p className="text-xs text-dim mt-1 mb-0">Track recently used tools and sync your favorites</p>
            </div>

            {/* High-visibility Tabs */}
            <div className="flex rounded-xl bg-muted p-1 mb-5 border border-border">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  view === 'login'
                    ? 'bg-[#385ee8] text-white shadow-sm'
                    : 'text-dim hover:text-text'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  view === 'signup'
                    ? 'bg-[#385ee8] text-white shadow-sm'
                    : 'text-dim hover:text-text'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* LOGIN FORM */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="login-email">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    ref={emailInputRef}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-dim" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('otp-login');
                        setError(null);
                      }}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Use 1-time code instead?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 pr-10 text-sm text-text outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 leading-relaxed">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-semibold shadow-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Logging in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>

                <div className="text-center pt-2 text-xs text-dim">
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('signup');
                      setError(null);
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}

            {/* SIGNUP FORM */}
            {view === 'signup' && (
              <form onSubmit={handleSignupStart} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-dim mb-1" htmlFor="signup-name">
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    ref={nameInputRef}
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-dim mb-1" htmlFor="signup-email">
                    Email address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-dim mb-1" htmlFor="signup-password">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 pr-10 text-sm text-text outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-dim m-0 leading-relaxed">
                  🔒 We will send a 6-digit code to verify your email before the account is created.
                </p>

                {error && (
                  <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 leading-relaxed">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-semibold shadow-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending verification code...
                    </>
                  ) : (
                    <>
                      Continue & Verify Email <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="text-center pt-1 text-xs text-dim">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setError(null);
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Log in
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- VERIFY EMAIL OTP CODE (BEFORE CREATING ACCOUNT) --- */}
        {view === 'verify-signup' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="tool-icon w-10 h-10 rounded-lg">
                <KeyRound size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold m-0">Verify your email</h2>
                <p className="text-xs text-dim m-0">Enter the 6-digit verification code</p>
              </div>
            </div>

            <p className="text-xs text-dim mt-3 mb-5 leading-relaxed">
              We sent a 6-digit code to <strong className="text-text">{email}</strong>. Enter it below to complete your registration:
            </p>

            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="verify-otp">
                  6-digit code
                </label>
                <input
                  id="verify-otp"
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-center tracking-[0.4em] font-mono text-lg font-bold text-text outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying & creating account...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-dim pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    setError(null);
                  }}
                  className="hover:text-accent transition-colors underline"
                >
                  ← Edit details
                </button>

                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignupStart}
                    className="hover:text-accent transition-colors underline"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* --- PASSWORDLESS OTP LOGIN --- */}
        {view === 'otp-login' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="tool-icon w-10 h-10 rounded-lg">
                <Mail size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold m-0">Sign in with email code</h2>
                <p className="text-xs text-dim m-0">No password needed</p>
              </div>
            </div>

            <p className="text-xs text-dim mt-3 mb-5 leading-relaxed">
              Enter your email and we&apos;ll send you a 6-digit login code.
            </p>

            <form onSubmit={handleOtpLoginSend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="otp-login-email">
                  Email address
                </label>
                <input
                  id="otp-login-email"
                  ref={emailInputRef}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending code...
                  </>
                ) : (
                  <>
                    Send login code <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  ← Back to password login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- SUCCESS SCREEN --- */}
        {view === 'success' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500 animate-bounce" />
            <h2 className="text-lg font-bold m-0">Successfully signed in!</h2>
            <p className="text-xs text-dim m-0">Syncing your recent tools and favorites...</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
