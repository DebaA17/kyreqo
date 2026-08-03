import { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const { loadProfile, accessToken } = useAuthStore();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (otp.length !== 6) {
      setStatus('error');
      setErrorMessage('Please enter a valid 6-digit code.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    try {
      await apiClient('/api/accounts/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (accessToken) {
        await loadProfile();
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setStatus('error');
      setErrorMessage('Please enter your email address to resend the code.');
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    try {
      await apiClient('/api/accounts/resend-verification/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  const otpDigits = otp.split('');

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-[#0c0c10] border border-[#1f1f29] rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Verify Email
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1 uppercase">Account Activation</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></span>
            <p className="text-sm text-zinc-400">Verifying code...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Account Verified!</h3>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
              Your email address has been successfully verified. You now have full access to Kyreqo.
            </p>
            <Link
              to={accessToken ? '/' : '/login'}
              className="w-full py-3 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10"
            >
              {accessToken ? 'Go to Sandbox Dashboard' : 'Sign In to Sandbox'}
            </Link>
          </div>
        )}

        {status !== 'loading' && status !== 'success' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Verification Code</label>
              <div className="relative flex justify-between mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  autoFocus
                />
                <div className="flex gap-2 w-full justify-between">
                  {[0, 1, 2, 3, 4, 5].map(index => {
                    const digit = otpDigits[index] || '';
                    const isFocused = otp.length === index;
                    return (
                      <div
                        key={index}
                        onClick={() => inputRef.current?.focus()}
                        className={`h-12 w-12 rounded-xl bg-zinc-900/60 border text-center flex items-center justify-center text-lg font-bold transition-all cursor-text
                          ${isFocused ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-105' : 'border-zinc-850'}
                          ${digit ? 'text-zinc-200' : 'text-zinc-600'}
                        `}
                      >
                        {digit || '•'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Verify Code
            </button>

            <div className="flex items-center justify-between border-t border-zinc-900 pt-5">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50 cursor-pointer"
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
              <Link
                to="/login"
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-300 transition"
              >
                Back to Login
              </Link>
            </div>

            {resendSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center">
                ✓ Verification code resent successfully.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
