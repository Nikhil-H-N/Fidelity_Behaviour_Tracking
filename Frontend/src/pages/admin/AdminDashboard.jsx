/**
 * ============================================================
 * FinovaWealth — Admin Dashboard Overview Page
 * File: Frontend/src/pages/admin/AdminDashboard.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, Radio, Clock, TrendingUp, UserPlus,
  ArrowUpRight, ArrowDownRight, BarChart3, Loader2,
  MousePointer2, Eye, Scroll, Layout
} from 'lucide-react';
import { getAdminAnalytics, getActiveEngineUsers } from '../../api/adminService';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

// Interaction Icon Helper
const InteractionIcon = ({ type }) => {
  switch (type) {
    case 'click': return <MousePointer2 className="w-3 h-3 text-blue-500" />;
    case 'view': return <Eye className="w-3 h-3 text-emerald-500" />;
    case 'scroll': return <Scroll className="w-3 h-3 text-purple-500" />;
    case 'form_start':
    case 'form_complete': return <Layout className="w-3 h-3 text-amber-500" />;
    default: return <Activity className="w-3 h-3 text-surface-400" />;
  }
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminAnalytics();
        if (res.success) setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll for live events from engine
    const liveInterval = setInterval(async () => {
      try {
        const engineRes = await getActiveEngineUsers().catch(() => []);
        // Flatten all events from all active sessions
        const allEvents = engineRes.flatMap(session => 
          (session.events || []).map(ev => ({
            ...ev,
            user_id: session.user_id,
            persona: session.persona
          }))
        );
        // Sort by timestamp desc and take top 20
        const latestEvents = allEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
        setLiveEvents(latestEvents);
      } catch (err) {
        console.error('Failed to fetch live events:', err);
      }
    }, 3000);

    return () => clearInterval(liveInterval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const overview = analytics?.overview || {};

  const kpis = [
    {
      title: 'Total Users',
      value: overview.totalUsers || 0,
      change: `+${overview.newUsersToday || 0} today`,
      icon: Users,
      color: 'primary',
      trend: 'up',
    },
    {
      title: 'New Users (7d)',
      value: overview.newUsersWeek || 0,
      change: `+${overview.newUsersToday || 0} today`,
      icon: UserPlus,
      color: 'accent',
      trend: 'up',
    },
    {
      title: 'Total Events',
      value: overview.totalEvents || 0,
      change: `${overview.eventsToday || 0} today`,
      icon: Radio,
      color: 'purple',
      trend: 'up',
    },
    {
      title: 'Active Sessions',
      value: overview.activeSessions || 0,
      change: `of ${overview.totalSessions || 0} total`,
      icon: Clock,
      color: 'amber',
      trend: 'neutral',
    },
  ];

  const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', icon: 'bg-primary-100' },
    accent: { bg: 'bg-accent-50', text: 'text-accent-600', icon: 'bg-accent-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Admin Dashboard</h1>
        <p className="text-surface-500 mt-1">Monitor platform activity and user behavior in real-time</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => {
          const c = colorMap[kpi.color];
          return (
            <motion.div
              key={kpi.title}
              {...fadeIn}
              transition={{ delay: i * 0.1 }}
              className="kpi-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                  kpi.trend === 'up' ? 'text-accent-600' : 'text-surface-400'
                }`}>
                  {kpi.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-surface-900">{kpi.value.toLocaleString()}</p>
              <p className="text-sm text-surface-500 mt-1">{kpi.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Event Types & Auth Providers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Event Types */}
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="kpi-card">
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary-600" />
            Top Event Types
          </h3>
          {analytics?.eventsByType?.length > 0 ? (
            <div className="space-y-3">
              {analytics.eventsByType.map((evt, i) => {
                const maxCount = analytics.eventsByType[0].count;
                const pct = maxCount > 0 ? (evt.count / maxCount) * 100 : 0;
                return (
                  <div key={evt._id || i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-surface-700 font-medium">{evt._id || 'Unknown'}</span>
                      <span className="text-surface-500">{evt.count}</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-surface-400">No events recorded yet</p>
          )}
        </motion.div>

        {/* Auth Providers */}
        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-600" />
            Users by Auth Provider
          </h3>
          {analytics?.usersByProvider?.length > 0 ? (
            <div className="space-y-4">
              {analytics.usersByProvider.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      p._id === 'google' ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-600'
                    }`}>
                      {p._id === 'google' ? 'G' : '✉'}
                    </div>
                    <span className="font-medium text-surface-900 capitalize">{p._id}</span>
                  </div>
                  <span className="text-lg font-bold text-surface-900">{p.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400">No users yet</p>
          )}
        </motion.div>
      </div>

      {/* Daily Signups */}
      {analytics?.dailySignups?.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="kpi-card">
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Daily Signups (Last 30 days)
          </h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.dailySignups.map((d, i) => {
              const maxCount = Math.max(...analytics.dailySignups.map((x) => x.count));
              const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              return (
                <div
                  key={d._id}
                  className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm transition-all hover:from-primary-600 hover:to-primary-500 cursor-pointer group relative"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${d._id}: ${d.count} signups`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.count}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Global Live Event Stream */}
      <motion.div {...fadeIn} transition={{ delay: 0.6 }} className="kpi-card overflow-hidden">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-600 animate-pulse" />
            Global Live Event Stream
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-accent-50 text-accent-700 rounded-full uppercase tracking-wider">
            Real-time Feed
          </span>
        </h3>
        <div className="bg-surface-50 rounded-xl border border-surface-100 overflow-hidden h-64 overflow-y-auto">
          {liveEvents.length > 0 ? (
            <div className="divide-y divide-surface-100">
              <AnimatePresence initial={false}>
                {liveEvents.map((ev, i) => (
                  <motion.div
                    key={`${ev.user_id}-${ev.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-3 flex items-center justify-between hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <InteractionIcon type={ev.event_type} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-900 capitalize">{ev.event_type.replace('_', ' ')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-surface-900 text-white rounded font-bold uppercase tracking-tighter">
                            {ev.persona?.replace('_', ' ') || 'GUEST'}
                          </span>
                        </div>
                        <span className="text-[10px] text-surface-500 truncate max-w-[200px]">
                          User <span className="font-mono">{ev.user_id.slice(-6)}</span> on <span className="font-medium">{ev.page_id}</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-surface-400 font-medium">
                      {Math.floor(Date.now() / 1000 - ev.timestamp)}s ago
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
              <p className="text-sm text-surface-400 italic">Waiting for platform-wide interactions...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
