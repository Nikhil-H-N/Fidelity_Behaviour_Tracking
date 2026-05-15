/**
 * ============================================================
 * FinovaWealth — Admin Analytics Overview Page
 * File: Frontend/src/pages/admin/AdminAnalyticsPage.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Activity, Radio, Clock, TrendingUp,
  UserPlus, ArrowUpRight, Loader2, PieChart, FileCheck2,
  TimerOff, Percent, AlertTriangle,
} from 'lucide-react';
import { getAdminAnalytics } from '../../api/adminService';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const formAnalytics = analytics?.formAnalytics || {};
  const formSummary = formAnalytics.summary || {};
  const formUsers = formAnalytics.users || [];

  const metrics = [
    { label: 'Total Users', value: overview.totalUsers || 0, icon: Users, color: 'primary', sub: `+${overview.newUsersWeek || 0} this week` },
    { label: 'Total Events', value: overview.totalEvents || 0, icon: Radio, color: 'purple', sub: `${overview.eventsToday || 0} today` },
    { label: 'Total Sessions', value: overview.totalSessions || 0, icon: Clock, color: 'amber', sub: `${overview.activeSessions || 0} active` },
    { label: 'New Today', value: overview.newUsersToday || 0, icon: UserPlus, color: 'accent', sub: 'new signups' },
  ];

  const colorClasses = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    accent: { bg: 'bg-accent-100', text: 'text-accent-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Admin Analytics</h1>
        <p className="text-surface-500 mt-1">Comprehensive analytics overview for platform administration</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => {
          const c = colorClasses[m.color];
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="kpi-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <m.icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className="text-xs text-surface-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-accent-500" />
                  {m.sub}
                </span>
              </div>
              <p className="text-2xl font-bold text-surface-900">{m.value.toLocaleString()}</p>
              <p className="text-sm text-surface-500 mt-1">{m.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Form Completion */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="kpi-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-accent-600" />
              Form Completion & Discards
            </h3>
            <p className="text-sm text-surface-500">Per-user checkout/application form status</p>
          </div>
          <span className="text-xs font-semibold text-surface-500">{formSummary.users || 0} users with form activity</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Started', value: formSummary.started || 0, icon: Activity, color: 'bg-primary-100 text-primary-600' },
            { label: 'Completed', value: formSummary.completed || 0, icon: FileCheck2, color: 'bg-accent-100 text-accent-600' },
            { label: 'Discarded', value: formSummary.discarded || 0, icon: TimerOff, color: 'bg-red-100 text-red-600' },
            { label: 'Completion Rate', value: `${formSummary.completionRate || 0}%`, icon: Percent, color: 'bg-purple-100 text-purple-600' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-50 p-4">
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-surface-900">{item.value}</p>
              <p className="text-xs text-surface-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {formUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-surface-400 border-b border-surface-100">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 px-4">Started</th>
                  <th className="pb-3 px-4">Completed</th>
                  <th className="pb-3 px-4">Discarded</th>
                  <th className="pb-3 px-4">Completion</th>
                  <th className="pb-3 pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {formUsers.map((user) => (
                  <tr key={user.userId} className="border-b border-surface-100 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-surface-900">{user.fullName}</p>
                      <p className="text-xs text-surface-400">{user.email || 'No email'}</p>
                    </td>
                    <td className="py-3 px-4 text-surface-700">{user.started}</td>
                    <td className="py-3 px-4 text-accent-700 font-semibold">{user.completed}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">{user.discarded}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-surface-100 overflow-hidden">
                          <div className="h-full rounded-full bg-accent-500" style={{ width: `${Math.min(user.completionRate || 0, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-surface-700">{user.completionRate || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 pl-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.discarded > user.completed
                          ? 'bg-red-50 text-red-700'
                          : 'bg-accent-50 text-accent-700'
                      }`}>
                        {user.discarded > user.completed && <AlertTriangle className="w-3 h-3" />}
                        {user.discarded > user.completed ? 'Needs follow-up' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-surface-400">No form activity recorded yet</p>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Event Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-600" />
            Event Distribution
          </h3>
          {analytics?.eventsByType?.length > 0 ? (
            <div className="space-y-3">
              {analytics.eventsByType.map((evt, i) => {
                const total = analytics.eventsByType.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? (evt.count / total) * 100 : 0;
                const colors = ['bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-amber-500', 'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
                return (
                  <div key={evt._id || i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                        <span className="text-surface-700 font-medium">{evt._id || 'Unknown'}</span>
                      </div>
                      <span className="text-surface-500">{evt.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div
                        className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-700`}
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

        {/* User Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-600" />
            User Growth (30 days)
          </h3>
          {analytics?.dailySignups?.length > 0 ? (
            <div className="space-y-2">
              {analytics.dailySignups.slice(-10).map((d) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-surface-400 w-20">{d._id.slice(5)}</span>
                  <div className="flex-1 bg-surface-100 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-accent-500 to-accent-400 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          (d.count / Math.max(...analytics.dailySignups.map((x) => x.count))) * 100,
                          5
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-surface-900 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400">No signup data available</p>
          )}
        </motion.div>
      </div>

      {/* Auth Provider Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="kpi-card">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          Authentication Methods
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {analytics?.usersByProvider?.map((p) => {
            const total = analytics.usersByProvider.reduce((a, b) => a + b.count, 0);
            const pct = total > 0 ? ((p.count / total) * 100).toFixed(1) : 0;
            return (
              <div key={p._id} className="bg-surface-50 rounded-xl p-4 text-center">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-bold ${
                  p._id === 'google'
                    ? 'bg-red-100 text-red-600'
                    : p._id === 'email'
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-surface-200 text-surface-600'
                }`}>
                  {p._id === 'google' ? 'G' : '✉'}
                </div>
                <p className="text-xl font-bold text-surface-900">{p.count}</p>
                <p className="text-sm text-surface-500 capitalize">{p._id} ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
