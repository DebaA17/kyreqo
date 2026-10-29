import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../api/client';
import { ShieldCheck, ShieldAlert, Copy, Check, Loader2 } from 'lucide-react';

interface TwoFactorSettingsProps {
  isEnabled: boolean;
  onStatusChange: () => void;
}

export default function TwoFactorSettings({ isEnabled, onStatusChange }: TwoFactorSettingsProps) {
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');

  const handleStartSetup = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ secret: string; otpauth_url: string }>(
        '/api/accounts/2fa/setup/',
        {
          method: 'POST',
        }
      );
      setSetupData(data);
      setMode('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiClient('/api/accounts/2fa/verify/', {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode }),
      });
      setMode('idle');
      setSetupData(null);
      setVerificationCode('');
      await onStatusChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      await apiClient('/api/accounts/2fa/disable/', {
        method: 'POST',
        body: JSON.stringify({ password, code: disableCode }),
      });
      setMode('idle');
      setPassword('');
      setDisableCode('');
      await onStatusChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (mode === 'setup' && setupData) {
    return (
      <div className="flex flex-col gap-4 p-4 border border-zinc-800 bg-zinc-900/50 rounded-xl">
        <h4 className="text-sm font-semibold text-white">Setup Two-Factor Authentication</h4>
        {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">{error}</div>}

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG value={setupData.otpauth_url} size={140} />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <p className="text-xs text-zinc-400">
              1. Scan the QR code with your authenticator app, or manually enter the key below.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-950 p-2 rounded text-xs font-mono text-zinc-300 break-all">
                {setupData.secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerifySetup} className="flex flex-col gap-3 mt-2">
          <p className="text-xs text-zinc-400">
            2. Enter the 6-digit code from your app to verify.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-32 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-center tracking-widest font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
            >
              {isLoading ? 'Verifying...' : 'Verify & Activate'}
            </button>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'disable') {
    return (
      <div className="flex flex-col gap-4 p-4 border border-zinc-800 bg-zinc-900/50 rounded-xl">
        <h4 className="text-sm font-semibold text-white">Disable Two-Factor Authentication</h4>
        {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">{error}</div>}

        <form onSubmit={handleDisable} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Confirm Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Current 6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="000000"
              className="w-32 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-center tracking-widest font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={isLoading || !password || disableCode.length !== 6}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
            >
              {isLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/30 rounded-xl">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
        >
          {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Two-Factor Authentication</h4>
          <p className="text-xs text-zinc-400">
            {isEnabled
              ? 'Your account is secured with 2FA.'
              : 'Add an extra layer of security to your account.'}
          </p>
        </div>
      </div>

      {isEnabled ? (
        <button
          type="button"
          onClick={() => setMode('disable')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded transition"
        >
          Disable
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStartSetup}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          Enable 2FA
        </button>
      )}
    </div>
  );
}
