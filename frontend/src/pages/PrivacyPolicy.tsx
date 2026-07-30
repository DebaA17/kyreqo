import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, ArrowLeft, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 overflow-y-auto relative py-12 px-6">
      {}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto z-10 w-full">
        {}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 transition mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Playground
        </button>

        {}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
        </div>
        <p className="text-xs text-zinc-500 mb-8">Last Updated: July 27, 2026</p>

        {}
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl mb-8">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Kyreqo is built with a security-first architecture. This Privacy Policy details how we
            handle API request logs, user data, credentials, and environmental variables when using
            our secure proxy gateway service.
          </p>
        </div>

        {}
        <div className="space-y-8">
          {}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-400" />
              1. Information We Process
            </h2>
            <div className="pl-6 space-y-2 text-sm text-zinc-400 leading-relaxed">
              <p>
                <strong>Guest Sandbox Requests:</strong> When testing APIs in guest mode, we
                temporarily route your request parameters (URL, HTTP headers, payloads) through our
                server proxy to protect against Server-Side Request Forgery (SSRF) and bypass
                browser CORS limitations. Guest request contents are not saved to the database.
              </p>
              <p>
                <strong>User Account Credentials:</strong> If you sign up for a Kyreqo account, we
                securely hash your account password. API tokens, keys, and saved workspace
                environment variables are encrypted at rest using industry-standard cryptography.
              </p>
            </div>
          </section>

          {}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              2. SSRF Protection and Security Logging
            </h2>
            <p className="pl-6 text-sm text-zinc-400 leading-relaxed">
              To defend our platform infrastructure, our backend executes DNS lookups and IP range
              checking on every request. We log metadata of incoming connections (such as IP
              addresses, timestamps, and target hostnames) strictly for threat analysis, security
              debugging, and system maintenance.
            </p>
          </section>

          {}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-400" />
              3. Data Retention and Third-Party API Interaction
            </h2>
            <div className="pl-6 space-y-2 text-sm text-zinc-400 leading-relaxed">
              <p>
                Kyreqo operates purely as a proxy wrapper. Any data you send to third-party
                endpoints is subject to those third-parties' respective privacy policies. We
                strongly advise against sending sensitive, unencrypted production credentials when
                using public instances of Kyreqo.
              </p>
              <p>
                Request execution history records for registered accounts can be deleted instantly
                and permanently at any time from your settings console.
              </p>
            </div>
          </section>

          {}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">4. Contact Information</h2>
            <p className="pl-6 text-sm text-zinc-400 leading-relaxed">
              If you have any security or privacy questions regarding our sandbox engine routing,
              please open an issue in the Kyreqo GitHub repository.
            </p>
          </section>
        </div>

        {}
        <div className="mt-12 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-600">
            &copy; 2026 Kyreqo. Designed for secure, sandboxed API workspace management.
          </p>
        </div>
      </div>
    </div>
  );
}
