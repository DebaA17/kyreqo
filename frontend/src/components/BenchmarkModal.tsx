import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Zap,
  X,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Activity,
  BarChart2,
} from 'lucide-react';
import useEnvironmentStore from '../store/environmentStore';
import { substituteVariables, getActiveVariables } from '../utils/variables';

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  method: string;
  headers: RequestHeader[];
  body: string;
  currentWorkspaceId: string | null;
}

interface BenchmarkResult {
  index: number;
  duration: number;
  status: number;
  success: boolean;
}

export default function BenchmarkModal({
  isOpen,
  onClose,
  url,
  method,
  headers,
  body,
  currentWorkspaceId,
}: BenchmarkModalProps) {
  const [iterations, setIterations] = useState<number>(10);
  const [delayMs, setDelayMs] = useState<number>(50);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const stopRef = useRef<boolean>(false);
  const { environments, activeEnvironmentId } = useEnvironmentStore();

  useEffect(() => {
    if (!isOpen) {
      stopRef.current = true;
      setIsRunning(false);
      setCompletedCount(0);
      setResults([]);
    }
  }, [isOpen]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const durations = results.map(r => r.duration);
    const totalDurationMs = durations.reduce((acc, curr) => acc + curr, 0);
    const avgTime = Math.round(totalDurationMs / results.length);
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    const successRate = Math.round((successCount / results.length) * 100);

    const totalTimeSec = totalDurationMs / 1000 || 0.001;
    const rps = (results.length / totalTimeSec).toFixed(1);

    const fastCount = results.filter(r => r.duration < 200).length;
    const mediumCount = results.filter(r => r.duration >= 200 && r.duration <= 500).length;
    const slowCount = results.filter(r => r.duration > 500).length;

    return {
      total: results.length,
      avgTime,
      minTime,
      maxTime,
      successCount,
      failCount,
      successRate,
      rps,
      fastCount,
      mediumCount,
      slowCount,
    };
  }, [results]);

  if (!isOpen) return null;

  const runBenchmark = async () => {
    if (isRunning) return;

    setIsRunning(true);
    stopRef.current = false;
    setCompletedCount(0);
    setResults([]);

    const activeVariables = getActiveVariables(environments, activeEnvironmentId);
    const finalUrl = substituteVariables(url, activeVariables);

    const reqHeaders: Record<string, string> = {};
    headers.forEach(h => {
      if (h.enabled && h.key) {
        reqHeaders[h.key] = substituteVariables(h.value, activeVariables);
      }
    });

    const accessToken = localStorage.getItem('accessToken');
    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      proxyHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const payload = JSON.stringify({
      url: finalUrl,
      method,
      headers: reqHeaders,
      body: body || null,
      workspace: currentWorkspaceId,
      timeout: 10000,
    });

    for (let i = 0; i < iterations; i++) {
      if (stopRef.current) break;

      const startTime = performance.now();
      let statusCode = 0;
      let isSuccess = false;

      try {
        const response = await fetch('/api/requests/proxy/', {
          method: 'POST',
          headers: proxyHeaders,
          body: payload,
        });

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        if (response.ok) {
          const resData = await response.json().catch(() => ({}));
          statusCode = resData.status || 200;
          isSuccess = statusCode >= 200 && statusCode < 400;
        } else {
          statusCode = response.status;
          isSuccess = false;
        }

        setResults(prev => [
          ...prev,
          { index: i + 1, duration, status: statusCode, success: isSuccess },
        ]);
      } catch {
        const duration = Math.round(performance.now() - startTime);
        setResults(prev => [
          ...prev,
          { index: i + 1, duration, status: 0, success: false },
        ]);
      }

      setCompletedCount(i + 1);

      if (delayMs > 0 && i < iterations - 1 && !stopRef.current) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }

    setIsRunning(false);
  };

  const stopBenchmark = () => {
    stopRef.current = true;
    setIsRunning(false);
  };

  const progressPercent = Math.round((completedCount / iterations) * 100);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c0c12] border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100 font-sans">
        <div className="flex items-center justify-between p-4 bg-[#09090e] border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              API Latency & Performance Benchmarker
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Iterations (Total Requests)
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 20, 50, 100].map(count => (
                  <button
                    key={count}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setIterations(count)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                      iterations === count
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Delay Between Requests (ms)
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                disabled={isRunning}
                value={delayMs}
                onChange={e => setDelayMs(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {isRunning ? (
              <button
                type="button"
                onClick={stopBenchmark}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition shadow-md"
              >
                <Square className="w-4 h-4" />
                Stop Benchmark
              </button>
            ) : (
              <button
                type="button"
                onClick={runBenchmark}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs rounded-lg transition shadow-lg shadow-amber-500/10"
              >
                <Play className="w-4 h-4 fill-current" />
                Run Benchmark ({iterations} Requests)
              </button>
            )}

            <span className="text-xs text-zinc-400 font-mono">
              Target: <span className="text-amber-400 font-semibold">{method}</span> {url}
            </span>
          </div>

          {(isRunning || completedCount > 0) && (
            <div className="flex flex-col gap-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-300">
                  Progress: {completedCount} / {iterations} Requests
                </span>
                <span className="text-amber-400 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {stats && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Performance Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Avg Latency
                  </div>
                  <span className="text-lg font-bold text-white font-mono">
                    {stats.avgTime} <span className="text-xs text-zinc-500">ms</span>
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Success Rate
                  </div>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {stats.successRate}%
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    Throughput
                  </div>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {stats.rps} <span className="text-xs text-zinc-500">req/s</span>
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    Min / Max
                  </div>
                  <span className="text-xs font-bold text-zinc-200 font-mono mt-1">
                    {stats.minTime}ms / {stats.maxTime}ms
                  </span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    Latency Distribution
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">Fast (&lt;200ms): {stats.fastCount}</span>
                    <span className="text-amber-400">Med (200-500ms): {stats.mediumCount}</span>
                    <span className="text-rose-400">Slow (&gt;500ms): {stats.slowCount}</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden flex border border-zinc-800">
                  {stats.fastCount > 0 && (
                    <div
                      style={{ width: `${(stats.fastCount / stats.total) * 100}%` }}
                      className="bg-emerald-500 h-full"
                    />
                  )}
                  {stats.mediumCount > 0 && (
                    <div
                      style={{ width: `${(stats.mediumCount / stats.total) * 100}%` }}
                      className="bg-amber-500 h-full"
                    />
                  )}
                  {stats.slowCount > 0 && (
                    <div
                      style={{ width: `${(stats.slowCount / stats.total) * 100}%` }}
                      className="bg-rose-500 h-full"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-zinc-400">
                  Request Log Breakdown ({results.length})
                </span>
                <div className="max-h-40 overflow-y-auto border border-zinc-800/80 rounded-lg p-2 bg-[#08080c] space-y-1 font-mono text-xs">
                  {results.map(res => (
                    <div
                      key={res.index}
                      className="flex items-center justify-between p-1.5 rounded bg-zinc-900/40 border border-zinc-800/50"
                    >
                      <div className="flex items-center gap-2">
                        {res.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="text-zinc-300 font-semibold">
                          #{res.index}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            res.success
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          Status {res.status || 'ERR'}
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[11px]">
                        {res.duration} ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

