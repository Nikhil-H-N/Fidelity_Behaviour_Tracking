/**
 * ============================================================
 * FinovaWealth — Admin Users Page
 * File: Frontend/src/pages/admin/AdminUsers.jsx
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  Mail, Shield, Calendar, Loader2, Radio, Activity,
  Brain, Info, Zap, AlertTriangle, TrendingUp, Send,
  MousePointer2, Eye, Scroll, Clock, Layout, Fingerprint,
  RefreshCw, MousePointer, HelpCircle
} from 'lucide-react';
import { getAdminUsers, getActiveEngineUsers, triggerManualIntervention } from '../../api/adminService';
import toast from 'react-hot-toast';

// Friction Badge Component
const FrictionBadge = ({ type, count }) => {
  if (!count) return null;
  const config = {
    rage_clicks: { label: 'Rage Clicks', icon: MousePointer, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    circular_nav: { label: 'Circular Nav', icon: RefreshCw, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    backtracking: { label: 'Backtracking', icon: Activity, color: 'text-orange-600 bg-orange-50 border-orange-100' },
    hesitation: { label: 'Hesitation', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  };
  const item = config[type] || { label: type, icon: Fingerprint, color: 'text-surface-600 bg-surface-50 border-surface-100' };
  const Icon = item.icon;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold ${item.color}`}>
      <Icon className="w-3 h-3" />
      <span>{count} {item.label}</span>
    </div>
  );
};

// Helper for relative time
const timeAgo = (timestamp) => {
  if (!timestamp) return 'never';
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

// Interaction Icon Helper
const InteractionIcon = ({ type }) => {
  switch (type) {
    case 'click': return <MousePointer2 className="w-3 h-3 text-blue-500" />;
    case 'view': return <Eye className="w-3 h-3 text-emerald-500" />;
    case 'scroll': return <Scroll className="w-3 h-3 text-purple-500" />;
    case 'form_start':
    case 'form_complete': return <Layout className="w-3 h-3 text-amber-500" />;
    default: return <Clock className="w-3 h-3 text-surface-400" />;
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [sendingNudge, setSendingNudge] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const [res, engineRes] = await Promise.all([
        getAdminUsers({ page, limit: 20 }),
        getActiveEngineUsers().catch(() => [])
      ]);

      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
      setActiveSessions(engineRes);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers();
    const interval = setInterval(async () => {
      const engineRes = await getActiveEngineUsers().catch(() => []);
      setActiveSessions(engineRes);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendNudge = async (userId) => {
    if (!nudgeMessage.trim()) return;
    setSendingNudge(true);
    try {
      await triggerManualIntervention({
        user_id: userId.toString(),
        type: 'nudge',
        message: nudgeMessage,
        reason: 'Admin Manual Intervention'
      });
      toast.success('Nudge queued for user');
      setNudgeMessage('');
    } catch (err) {
      toast.error('Failed to send nudge');
    } finally {
      setSendingNudge(false);
    }
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const getSessionData = (userId) => {
    if (!userId) return null;
    return activeSessions.find(s => s.user_id === userId.toString());
  };

  const getIntentColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-surface-500 bg-surface-50 border-surface-100';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Behavioral Command Center</h1>
        <p className="text-surface-500 mt-1">Real-time psychological profiling and intent monitoring</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500 bg-white rounded-xl px-4 py-3 border border-surface-200">
          <Users className="w-4 h-4" />
          <span>{pagination.total} total users</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100 font-bold">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>{activeSessions.filter(s => (Date.now() / 1000 - s.last_active) < 60).length} Online Now</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Psychological Profile</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Intent Score</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Narrative Snippet</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((u) => {
                  const session = getSessionData(u._id);
                  const isOnline = session && (Date.now() / 1000 - session.last_active) < 60;
                  const priority = session?.metadata?.priority || (u.intentScore > 75 ? 'HIGH' : u.intentScore > 40 ? 'MEDIUM' : 'LOW');
                  const persona = session?.persona || 'Unknown';
                  const narrative = session?.metadata?.last_narrative || 'No active journey data.';
                  const isSelected = selectedUser === u._id;

                  return (
                    <React.Fragment key={u._id}>
                      <tr 
                        className={`hover:bg-surface-50 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50/50' : ''}`}
                        onClick={() => setSelectedUser(isSelected ? null : u._id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {u.fullName?.[0]?.toUpperCase() || '?'}
                              </div>
                              {isOnline && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900">{u.fullName}</p>
                              <p className="text-[10px] text-surface-400 font-mono">{u._id.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-900 text-white uppercase tracking-wider w-fit">
                              <Brain className="w-3 h-3 text-accent-400" /> {persona.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-surface-500 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> {session?.intent_state || 'STABLE'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getIntentColor(priority)}`}>
                                {priority}
                              </span>
                              <span className="text-xs font-bold text-surface-700">{Math.round(session?.total_score || u.intentScore || 0)}</span>
                            </div>
                            <div className="w-24 bg-surface-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${session?.total_score || u.intentScore || 0}%` }}
                                className="bg-gradient-to-r from-primary-500 to-accent-500 h-full rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2 max-w-[200px]">
                            <Info className="w-3 h-3 text-surface-300 mt-1 flex-shrink-0" />
                            <p className="text-[11px] text-surface-600 italic line-clamp-2">
                              "{narrative}"
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-surface-500">
                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expansion Row */}
                      {isSelected && (
                        <tr>
                          <td colSpan="5" className="p-0 border-none">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-surface-50/50 overflow-hidden border-b border-surface-100"
                            >
                              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-500" /> Behavioral Narrative
                                  </h4>
                                  <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
                                    <p className="text-sm text-surface-700 leading-relaxed italic">
                                      "{session?.metadata?.last_narrative || 'Detailed journey data is being processed by the engine...'}"
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-primary-500" /> Activity Log
                                  </h4>
                                  <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden h-48 overflow-y-auto">
                                    {session?.events?.length > 0 ? (
                                      <div className="divide-y divide-surface-100">
                                        {[...session.events].reverse().map((ev, i) => (
                                          <div key={i} className="px-3 py-2 flex items-center justify-between hover:bg-surface-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                              <InteractionIcon type={ev.event_type} />
                                              <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-surface-700 capitalize">{ev.event_type.replace('_', ' ')}</span>
                                                <span className="text-[9px] text-surface-400 truncate max-w-[80px] font-mono">
                                                  {ev.page_id} {ev.element_id ? `| ${ev.element_id}` : ''}
                                                </span>
                                              </div>
                                            </div>
                                            <span className="text-[9px] text-surface-400 font-medium">{timeAgo(ev.timestamp)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                                        <Clock className="w-6 h-6 text-surface-300 mb-2" />
                                        <p className="text-[10px] text-surface-400">Waiting for live interactions...</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                    <Brain className="w-3 h-3 text-indigo-500" /> ML Intelligence
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {['rage_clicks', 'circular_nav', 'backtracking', 'hesitation'].map(type => (
                                        <FrictionBadge 
                                          key={type} 
                                          type={type} 
                                          count={session?.metadata?.detectors?.[type] || 0} 
                                        />
                                      ))}
                                    </div>

                                    <div className="pt-2 border-t border-surface-100 space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1 group relative">
                                          <span className="text-surface-500 border-b border-dotted border-surface-300 cursor-help">Intent Score:</span>
                                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-surface-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                            Formula: (Positive - Negative) + Bonuses - Penalties. Includes decay and session continuity.
                                          </div>
                                        </div>
                                        <span className="font-bold text-primary-600">{Math.round(session?.total_score || 0)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-surface-500">Conversion Prob:</span>
                                        <span className="font-bold text-emerald-600">
                                          {((session?.metadata?.conversion_probability || 0) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-surface-500">Drop-off Risk:</span>
                                        <span className={`font-bold ${session?.metadata?.dropoff_risk === 'CRITICAL' ? 'text-rose-600' : 'text-orange-500'}`}>
                                          {session?.metadata?.dropoff_risk || 'LOW'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 text-rose-500" /> Live Intervention
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {(session?.metadata?.last_recommendations || ['Nurture Base Intent']).map((rec, i) => (
                                        <span key={i} className="px-2 py-1 bg-white border border-surface-200 rounded text-[10px] font-medium text-surface-600">
                                          {rec.replace('_', ' ')}
                                        </span>
                                      ))}
                                    </div>
                                    
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        placeholder="Send a manual nudge..."
                                        className="input-field pr-10 text-xs py-2 w-full"
                                        value={nudgeMessage}
                                        onChange={(e) => setNudgeMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendNudge(u._id)}
                                      />
                                      <button 
                                        onClick={() => handleSendNudge(u._id)}
                                        disabled={sendingNudge || !nudgeMessage.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg disabled:opacity-50"
                                      >
                                        {sendingNudge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
