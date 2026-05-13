import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Footprints,
  Info,
  MessageSquare,
  Radio,
  RotateCcw,
  Search,
  TimerOff,
  User,
  Zap,
} from 'lucide-react';
import InterventionModal from '../components/InterventionModal';

const API_BASE = 'http://localhost:8000';

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  if (safeSeconds < 60) return `${safeSeconds}s`;
  if (safeSeconds < 3600) return `${Math.floor(safeSeconds / 60)}m ${safeSeconds % 60}s`;
  return `${Math.floor(safeSeconds / 3600)}h ${Math.floor((safeSeconds % 3600) / 60)}m`;
};

const formatClock = (timestamp) => {
  if (!timestamp) return '--:--';
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const userInitial = (userId = 'U') => userId.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || 'U';

export default function SessionTimeline() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/admin/active-users`),
        fetch(`${API_BASE}/admin/analytics/summary`),
      ]);
      if (usersRes.ok) setActiveUsers(await usersRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/user-report/${encodeURIComponent(userId)}`);
      if (res.ok) setReport(await res.json());
    } catch (error) {
      console.error('Failed to fetch user report:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setReport(null);
    if (selectedUser) {
      fetchReport(selectedUser);
      const interval = setInterval(() => fetchReport(selectedUser), 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [selectedUser]);

  const now = Date.now() / 1000;
  const filteredUsers = activeUsers.filter((user) => {
    const matchesSearch = user.user_id.toLowerCase().includes(search.toLowerCase());
    const isActive = (now - user.last_active) < 60;
    return matchesSearch && (!filterActive || isActive);
  });

  const selectedSession = useMemo(
    () => activeUsers.find((user) => user.user_id === selectedUser),
    [activeUsers, selectedUser]
  );

  const replayTimeline = report?.replay_timeline || selectedSession?.replay_timeline || [];
  const navigationFlow = report?.session?.navigation_flow || selectedSession?.navigation_flow || [];
  const pagesVisited = report?.session?.pages_visited || selectedSession?.pages_visited || [];
  const sessionDuration = report?.session?.total_duration ?? selectedSession?.total_duration ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Session Management Engine</h1>
        <p className="text-surface-400 mt-1">Full user sessions, navigation flow, bounce logic, and replay timeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Sessions', value: summary?.total_users || activeUsers.length, icon: User, color: 'text-primary-400 bg-primary-400/10' },
          { label: 'Avg Duration', value: formatDuration(summary?.avg_session_duration || 0), icon: Clock, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Bounce Rate', value: `${(summary?.bounce_rate || 0).toFixed(1)}%`, icon: TimerOff, color: 'text-red-400 bg-red-400/10' },
          { label: 'Returning Users', value: summary?.returning_users || 0, icon: RotateCcw, color: 'text-indigo-400 bg-indigo-400/10' },
        ].map((metric) => (
          <div key={metric.label} className="bg-surface-900 border border-surface-800 rounded-2xl p-5 shadow-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.color}`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mt-4">{metric.value}</p>
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Filter sessions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-surface-800 rounded-xl text-sm focus:border-primary-500 outline-none transition-colors text-white"
              />
            </div>
            <button
              onClick={() => setFilterActive(!filterActive)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${filterActive ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-surface-900 border-surface-800 text-surface-500'}`}
            >
              {filterActive ? 'Showing Active Only' : 'Show Active Only'}
            </button>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-800 bg-surface-900/50 flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Sessions</h3>
              <span className="text-[9px] font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">Recency</span>
            </div>
            <div className="max-h-[560px] overflow-y-auto custom-scrollbar">
              {filteredUsers.map((user) => {
                const isActive = (now - user.last_active) < 60;
                return (
                  <button
                    key={user.user_id}
                    onClick={() => setSelectedUser(user.user_id)}
                    className={`w-full p-4 text-left border-b border-surface-800/50 transition-all hover:bg-surface-800/50 flex items-center gap-3 ${selectedUser === user.user_id ? 'bg-primary-600/10 border-l-4 border-l-primary-500' : ''}`}
                  >
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${selectedUser === user.user_id ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                        {userInitial(user.user_id)}
                      </div>
                      {isActive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-900 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-surface-200 truncate">{user.user_id}</p>
                        {isActive && <span className="text-[8px] font-black text-emerald-400 uppercase">Active</span>}
                      </div>
                      <p className="text-[10px] text-surface-500 font-medium uppercase tracking-tighter">
                        {formatDuration(user.total_duration)} / {user.pages_visited?.length || 0} pages
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="p-8 text-center text-xs text-surface-600 italic">No matching sessions</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedUser ? (
            <div className="min-h-[560px] flex flex-col items-center justify-center bg-surface-900/30 border-2 border-dashed border-surface-800 rounded-3xl p-12 text-center text-surface-600">
              <User className="w-16 h-16 mb-4 opacity-10" />
              <h3 className="text-xl font-bold text-surface-500">No Session Selected</h3>
              <p className="max-w-xs mt-2 italic">Select a session to inspect duration, pages visited, navigation flow, and replay timeline.</p>
            </div>
          ) : !report ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-6 rounded-2xl bg-surface-950 border border-surface-800">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary-900/20">
                    {userInitial(selectedUser)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-white truncate">{selectedUser}</h2>
                      <span className="px-3 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {report.summary.persona.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-surface-400 text-sm">
                      Engine Assessment: <span className="font-bold text-primary-400 uppercase tracking-tighter">{report.summary.final_intent.replace(/_/g, ' ')}</span>
                    </p>
                    <button
                      onClick={() => setIsInterventionModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-900/20"
                    >
                      <MessageSquare className="w-4 h-4" /> Send Custom Message
                    </button>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-4xl font-black text-white leading-none">{Math.round(report.summary.overall_score)}</span>
                    <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest mt-1">Intent Score</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: 'Session Start', value: formatClock(report.session.session_start), icon: Clock },
                    { label: 'Total Duration', value: formatDuration(sessionDuration), icon: Activity },
                    { label: 'Pages Visited', value: pagesVisited.length, icon: Footprints },
                    { label: 'Bounce Status', value: report.session.bounce ? 'Bounced' : 'Engaged', icon: TimerOff },
                  ].map((metric) => (
                    <div key={metric.label} className="p-4 rounded-xl bg-surface-950 border border-surface-800">
                      <metric.icon className="w-4 h-4 text-primary-400 mb-3" />
                      <p className="text-xl font-bold text-white font-mono">{metric.value}</p>
                      <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest mt-1">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <Footprints className="w-5 h-5 text-emerald-400" /> Navigation Flow
                  </h3>
                  <div className="space-y-3">
                    {navigationFlow.map((step, index) => (
                      <div key={`${step.page}-${step.timestamp}-${index}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-950 border border-surface-800 flex items-center justify-center text-[10px] font-black text-primary-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 p-3 rounded-xl bg-surface-950/50 border border-surface-800">
                          <p className="text-sm font-bold text-surface-200">{step.page}</p>
                          <p className="text-[10px] text-surface-600 font-mono">{formatClock(step.timestamp)} / {step.event_type?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                    {navigationFlow.length === 0 && <p className="text-sm text-surface-600 italic">No navigation steps captured yet.</p>}
                  </div>
                </div>

                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5 text-primary-400" /> Session Signals
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(report.psychological_flags || {}).map(([flag, active]) => (
                      <div key={flag} className={`flex items-center justify-between p-3 rounded-xl border ${active ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{flag.replace(/_/g, ' ')}</span>
                        {active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                  <Radio className="w-5 h-5 text-red-500" /> Session Replay Timeline
                </h3>
                <div className="rounded-2xl bg-surface-950 border border-surface-800 p-5 font-mono text-sm max-h-[420px] overflow-y-auto custom-scrollbar">
                  {replayTimeline.map((entry, index) => (
                    <motion.div
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-[70px_1fr] gap-4 py-2 border-b border-surface-800/60 last:border-b-0"
                    >
                      <span className="text-primary-400 font-bold">{formatClock(entry.timestamp)}</span>
                      <span className="text-surface-200">{entry.description}</span>
                    </motion.div>
                  ))}
                  {replayTimeline.length === 0 && (
                    <p className="text-surface-600 italic">Waiting for replay events...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-400" /> Page Engagement Depth
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(report.top_pages || []).map(([page, count]) => (
                      <div key={page} className="p-4 rounded-xl bg-surface-950 border border-surface-800 text-center">
                        <p className="text-2xl font-bold text-white mb-1">{count}</p>
                        <p className="text-[10px] text-surface-500 font-bold truncate uppercase tracking-tighter">{page}</p>
                      </div>
                    ))}
                    {(report.top_pages || []).length === 0 && <p className="text-sm text-surface-600 italic">No page affinity yet.</p>}
                  </div>
                </div>

                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-amber-500" /> Engine Interventions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {(report.recommendations || []).map((recommendation) => (
                      <div key={recommendation} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-amber-200 uppercase tracking-tight">{recommendation.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {(report.recommendations || []).length === 0 && (
                      <p className="text-sm text-surface-600 italic py-4">No proactive recommendations generated.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        userId={selectedUser}
      />
    </div>
  );
}
