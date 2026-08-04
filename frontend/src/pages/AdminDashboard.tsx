import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import {
  ArrowLeft,
  Users,
  ShieldAlert,
  Laptop,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  last_login_ip?: string | null;
  last_login_browser?: string | null;
  last_login_os?: string | null;
}

interface LoginLog {
  id: number;
  email: string;
  user: number | null;
  ip_address: string | null;
  user_agent: string | null;
  browser: string;
  os: string;
  is_successful: boolean;
  timestamp: string;
}

export default function AdminDashboard() {
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [logsList, setLogsList] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'staff'>('all');
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    if (!accessToken) {
      navigate('/');
      return;
    }

    if (!user) {
      return;
    }

    if (!user.is_staff && !user.is_superuser) {
      navigate('/');
    }
  }, [user, accessToken, navigate]);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const [usersData, logsData] = await Promise.all([
        apiClient<AdminUser[]>('/api/accounts/admin/users/'),
        apiClient<LoginLog[]>('/api/accounts/admin/login-logs/'),
      ]);
      setUsersList(usersData);
      setLogsList(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.is_staff || user?.is_superuser)) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const filteredUsers = usersList.filter(usr => {
    if (userFilter === 'active') return usr.is_active;
    if (userFilter === 'inactive') return !usr.is_active;
    if (userFilter === 'staff') return usr.is_staff || usr.is_superuser;
    return true;
  });

  const filteredLogs = logsList.filter(log => {
    if (logFilter === 'success') return log.is_successful;
    if (logFilter === 'failed') return !log.is_successful;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-500/20">
                Admin Console
              </span>
              <h1 className="text-xl font-bold tracking-tight">Security & User Governance</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-50 text-xs font-semibold text-zinc-200 rounded-lg border border-zinc-800 transition-colors flex items-center space-x-1.5"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.28 15m-.73-3H15"
                />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <span className="text-zinc-800">|</span>
            <span className="text-sm text-zinc-400">Logged in as:</span>
            <span className="text-sm font-medium text-zinc-200">{user?.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-zinc-400 font-medium">Total Users</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold">{usersList.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Active registered accounts</p>
          </div>

          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-zinc-400 font-medium">Total Login Attempts</span>
              <Laptop className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold">{logsList.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Audit log records tracked</p>
          </div>

          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-zinc-400 font-medium">Successful Logins</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">
              {logsList.filter(log => log.is_successful).length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Success rate:{' '}
              {logsList.length
                ? Math.round((logsList.filter(l => l.is_successful).length / logsList.length) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Users List
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Login Audit Logs
          </button>
        </div>

        {}
        <div className="flex justify-between items-center mb-6 bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/60 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-medium">
            Showing {activeTab === 'users' ? filteredUsers.length : filteredLogs.length} of{' '}
            {activeTab === 'users' ? usersList.length : logsList.length} entries
          </div>
          {activeTab === 'users' ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-500">Filter Status:</span>
              <select
                value={userFilter}
                onChange={e =>
                  setUserFilter(e.target.value as 'all' | 'active' | 'inactive' | 'staff')
                }
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="inactive">Suspended Only</option>
                <option value="staff">Staff/Admin Only</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-500">Filter Logins:</span>
              <select
                value={logFilter}
                onChange={e => setLogFilter(e.target.value as 'all' | 'success' | 'failed')}
                className="bg-zinc-955 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Attempts</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
          )}
        </div>

        {}
        {activeTab === 'users' ? (
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Staff Status</th>
                    <th className="px-6 py-4">Superuser</th>
                    <th className="px-6 py-4">Active</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-sm">
                  {filteredUsers.map(usr => (
                    <tr key={usr.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              usr.avatar ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${usr.email}`
                            }
                            alt="Avatar"
                            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-zinc-200">
                              {usr.first_name} {usr.last_name || ''}
                            </div>
                            <div className="text-xs text-zinc-400">{usr.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            usr.is_staff
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {usr.is_staff ? 'Staff' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            usr.is_superuser
                              ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {usr.is_superuser ? 'Superuser' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            usr.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {usr.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(usr.date_joined).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {usr.last_login ? (
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-medium">
                              {new Date(usr.last_login).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                            {usr.last_login_browser && (
                              <span className="text-[11px] text-zinc-500 mt-1 flex items-center space-x-1.5">
                                <span>
                                  {usr.last_login_browser} ({usr.last_login_os})
                                </span>
                                <span>•</span>
                                <span className="font-mono">{usr.last_login_ip}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-550 italic text-xs">Never</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-500">
                        No users match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Browser & OS</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-sm">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {log.is_successful ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 text-xs font-medium">Success</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 text-xs font-medium">Failure</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-200">{log.email}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-450">
                        {log.ip_address || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-zinc-300">
                          <span className="flex items-center space-x-1">
                            <Globe className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{log.browser}</span>
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span className="flex items-center space-x-1">
                            <Laptop className="w-3.5 h-3.5 text-purple-400" />
                            <span>{log.os}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              dateStyle: 'medium',
                              timeStyle: 'medium',
                            })}
                          </span>
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-xs text-zinc-500 font-mono max-w-xs truncate"
                        title={log.user_agent || ''}
                      >
                        {log.user_agent || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-500">
                        No login attempts match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
