import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Send,
  Mail,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import Turnstile from '../components/Turnstile';

const PRESET_AVATARS = [
  { name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Bottts', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka' },
  { name: 'Lorelei', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jack' },
  { name: 'Avataaars', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dusty' },
];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { register, isLoading, error, isAuthenticated, clearError, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setValidationError(null);
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user && !user.email_verified) {
        navigate(`/verify-email?email=${encodeURIComponent(user.email)}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password || !passwordConfirm) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (password !== passwordConfirm) {
      setValidationError('Passwords do not match.');
      return;
    }

    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocal && !turnstileToken) {
      setValidationError('Please complete the security check.');
      return;
    }

    const finalAvatar = customAvatar.trim() ? customAvatar.trim() : avatar;

    try {
      await register({
        email,
        password,
        password_confirm: passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        avatar: finalAvatar,
        turnstile_token: turnstileToken || '',
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      void err;
    }
  };

  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-y-auto relative py-12">
      {}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-xl p-8 bg-[#0c0c10] border border-[#1f1f29] rounded-2xl shadow-2xl relative z-10 my-auto">
        {}
        <div className="flex flex-col items-center mb-6 select-none">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Send className="h-6 w-6 text-white transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Create an Account
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">START YOUR DEVSANDBOX TODAY</p>
        </div>

        {}
        {(error || validationError) && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs leading-relaxed">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-rose-300">Registration Issue</p>
              <p className="mt-0.5">{validationError || error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                First Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
              </div>
            </div>

            {}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                Last Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
              Profile Avatar
            </label>

            {}
            <div className="flex gap-3 justify-between items-center bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3">
              <div className="flex gap-2">
                {PRESET_AVATARS.map(av => (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => {
                      setAvatar(av.url);
                      setCustomAvatar('');
                    }}
                    className={`h-11 w-11 rounded-lg border overflow-hidden p-0.5 transition cursor-pointer bg-zinc-900
                      ${avatar === av.url && !customAvatar ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-zinc-800 hover:border-zinc-700'}
                    `}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="h-full w-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium select-none">PICK A PRESET</div>
            </div>

            {}
            <div className="relative mt-1">
              <ImageIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="url"
                value={customAvatar}
                onChange={e => setCustomAvatar(e.target.value)}
                placeholder="Or paste a custom avatar image URL"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>
          </div>

          {isLocal ? (
            <div className="text-[11px] text-zinc-500 text-center my-3 select-none py-2 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
              🛡️ Turnstile Bypassed (Localhost)
            </div>
          ) : (
            <Turnstile sitekey="0x4AAAAAAEB_3tNUFCUROX6P" onVerify={setTurnstileToken} />
          )}

          {}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {}
        <div className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
