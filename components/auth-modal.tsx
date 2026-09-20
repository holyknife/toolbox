'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSupabaseConfig } from '@/lib/supabase';

export const OPEN_AUTH_MODAL_EVENT = 'toolbox:open-auth-modal';

export function openAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_AUTH_MODAL_EVENT));
  }
}

export default function AuthModal() {
  const { signInWithOtp, verifyOtp, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { isConfigured } = getSupabaseConfig();

  // Listen for open events
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setStep('email');
      setError(null);
      setOtp('');
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
        if (step === 'email') emailInputRef.current?.focus();
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

  // If user is already signed in and opens modal, show logged-in state or close
  useEffect(() => {
    if (user && open && step !== 'success') {
      setOpen(false);
    }
  }, [user, open, step]);

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
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

        {!isConfigured && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>Setup Needed:</strong> Add your <code className="bg-amber-500/20 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-500/20 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="bg-amber-500/20 px-1 py-0.5 rounded">.env.local</code> to activate live login.
            </div>
          </div>
        )}

        {step === 'email' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="tool-icon w-10 h-10 rounded-lg">
                <Mail size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold m-0">Sign in to Toolbox</h2>
                <p className="text-xs text-dim m-0">Sync your favorites and recent tools across devices</p>
              </div>
            </div>

            <p className="text-xs text-dim mt-4 mb-5 leading-relaxed">
              Enter your email to receive a 6-digit one-time passcode. No password needed.
            </p>

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
                className="primary-button w-full justify-center py-2.5 text-sm mt-2"
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
                className="primary-button w-full justify-center py-2.5 text-sm mt-2"
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
                    setStep('email');
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
