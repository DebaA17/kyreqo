import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { apiClient } from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing.');
      return;
    }

    const verify = async () => {
      try {
        await apiClient(`/api/accounts/verify-email/?token=${token}`, {
          method: 'GET',
        });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Invalid or expired verification token.'
        );
      }
    };

    void verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    try {
      await apiClient('/api/accounts/resend-verification/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-[#0c0c10] border border-[#1f1f29] rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Send className="h-6 w-6 text-white transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Email Verification
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1 uppercase">Account Activation</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></span>
            <p className="text-sm text-zinc-400">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Email Verified!</h3>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
              Your email address has been successfully verified. You now have full access to Kyreqo.
            </p>
            <Link
              to="/login"
              className="w-full py-3 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10"
            >
              Sign In to Sandbox
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-2">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Verification Failed</h3>
            <p className="text-sm text-zinc-400 text-center max-w-xs leading-relaxed mb-6">
              {errorMessage ||
                'The verification link is invalid, expired, or has already been used.'}
            </p>

            {resendSuccess ? (
              <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center">
                A new verification email has been sent. Please check your inbox.
              </div>
            ) : (
              <form
                onSubmit={handleResend}
                className="w-full flex flex-col gap-4 border-t border-zinc-800 pt-6"
              >
                <p className="text-xs text-zinc-500 text-center font-medium">
                  Need another verification link?
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {resendLoading ? 'Resending...' : 'Resend Verification Link'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
