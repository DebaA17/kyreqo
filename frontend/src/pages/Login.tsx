import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Send, Mail, Lock, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Clear errors on mount
  useEffect(() => {
    clearError();
    setValidationError(null);
  }, [clearError]);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-[#0c0c10] border border-[#1f1f29] rounded-2xl shadow-2xl relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Send className="h-6 w-6 text-white transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome to Kyreqo
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">SIGN IN TO ACCESS YOUR SANDBOX</p>
        </div>

        {/* Display Error Message */}
        {(error || validationError) && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs leading-relaxed">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-rose-300">Authentication Issue</p>
              <p className="mt-0.5">{validationError || error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-zinc-500">
          New to the platform?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
