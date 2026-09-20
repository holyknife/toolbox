'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, KeyRound, Lock, ArrowRight, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export const OPEN_AUTH_MODAL_EVENT = 'toolbox:open-auth-modal';

export function openAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_AUTH_MODAL_EVENT));
  }
}

export default function AuthModal() {
  const { signInWithOtp, verifyOtp, signInWithPassword, signUpWithPassword, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'otp' | 'password'>('otp');
  const [passwordMode, setPasswordMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Listen for open events
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setStep('input');
      setError(null);
      setInfoMessage(null);
      setOtp('');
      setPassword('');
    };

    window.addEventListener(OPEN_AUTH_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, handleOpen);
  }, []);

  // Sync dialog visibility
  useEffect(() => {
    if (!dialogRef.current) return;
    if (open) {
      if (!dialogRef.current.open) {
        dialogRef.current.showModal();
      }
      setTimeout(() => {
        if (step === 'input') emailInputRef.current?.focus();
        if (step === 'otp') otpInputRef.current?.focus();
      }, 50);
    } else {
      dialogRef.current.close();
    }
  }, [open, step]);

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
    if (user && open && step !== 'success') {
      setOpen(false);
    }
  }, [user, open, step]);

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setInfoMessage(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const res = await signInWithOtp(email.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setStep('otp');
      setResendCooldown(60);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const res = await verifyOtp(email.trim(), cleanOtp);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setStep('success');
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    if (passwordMode === 'signin') {
      const res = await signInWithPassword(email.trim(), password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setStep('success');
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } else {
      const res = await signUpWithPassword(email.trim(), password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else if (res.session) {
        setStep('success');
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setInfoMessage(res.message || 'Account created! You can now sign in.');
        setPasswordMode('signin');
      }
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

        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="tool-icon w-10 h-10 rounded-lg">
                {method === 'otp' ? <Mail size={20} /> : <Lock size={20} />}
              </span>
              <div>
                <h2 className="text-lg font-semibold m-0">Sign in to Toolbox</h2>
                <p className="text-xs text-dim m-0">Sync your favorites and recent tools across devices</p>
              </div>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex rounded-lg bg-muted p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMethod('otp');
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                  method === 'otp'
                    ? 'bg-panel text-text shadow-sm'
                    : 'text-dim hover:text-text'
                }`}
              >
                Email Code (OTP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('password');
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                  method === 'password'
                    ? 'bg-panel text-text shadow-sm'
                    : 'text-dim hover:text-text'
                }`}
              >
                Password
              </button>
            </div>

            {infoMessage && (
              <div className="mb-4 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                {infoMessage}
              </div>
            )}

            {method === 'otp' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="auth-email">
                    Email address
                  </label>
                  <input
                    id="auth-email"
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
                  <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-medium"
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
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="auth-email-pwd">
                    Email address
                  </label>
                  <input
                    id="auth-email-pwd"
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
                  <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={passwordMode === 'signup' ? 'new-password' : 'current-password'}
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
                  <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing...
                    </>
                  ) : passwordMode === 'signin' ? (
                    'Sign in with password'
                  ) : (
                    'Create account'
                  )}
                </button>

                <div className="text-center pt-2 text-xs text-dim">
                  {passwordMode === 'signin' ? (
                    <span>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordMode('signup');
                          setError(null);
                          setInfoMessage(null);
                        }}
                        className="text-accent hover:underline font-medium"
                      >
                        Create account
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordMode('signin');
                          setError(null);
                          setInfoMessage(null);
                        }}
                        className="text-accent hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {step === 'otp' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="tool-icon w-10 h-10 rounded-lg">
                <KeyRound size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold m-0">Check your email</h2>
                <p className="text-xs text-dim m-0">We sent a 6-digit passcode</p>
              </div>
            </div>

            <p className="text-xs text-dim mt-3 mb-5 leading-relaxed">
              We sent a login code to <strong className="text-text">{email}</strong>. Enter the code below to sign in:
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dim mb-1.5" htmlFor="auth-otp">
                  6-digit code
                </label>
                <input
                  id="auth-otp"
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
                  className="w-full rounded-lg border border-border bg-panel px-3.5 py-2.5 text-center tracking-[0.4em] font-mono text-lg font-semibold text-text outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full justify-center py-2.5 text-sm mt-2 bg-[#385ee8] text-white hover:bg-[#2d4ec7] font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-dim pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setError(null);
                  }}
                  className="hover:text-accent transition-colors underline"
                >
                  Change email
                </button>

                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="hover:text-accent transition-colors underline"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={42} className="mx-auto text-emerald-500 animate-bounce" />
            <h2 className="text-lg font-semibold m-0">Successfully signed in!</h2>
            <p className="text-xs text-dim m-0">Syncing your recent tools and favorites...</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
