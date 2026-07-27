import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 px-6 overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col items-center text-center max-w-md z-10">
        <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/5 mb-6 animate-pulse">
          <ShieldAlert className="h-8 w-8 text-rose-400" />
        </div>

        <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-zinc-100 to-zinc-600 bg-clip-text text-transparent drop-shadow-md select-none">
          404
        </h1>

        <h2 className="text-xl font-bold mt-4 text-zinc-100">Endpoint Not Found</h2>

        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          The view path or resources you are trying to request does not exist. Verify the path name
          or head back to the playground workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-indigo-600/10 select-none"
          >
            <Home className="h-4 w-4" />
            Playground
          </button>
        </div>
      </div>
    </div>
  );
}
