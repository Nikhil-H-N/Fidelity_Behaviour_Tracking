/**
 * ============================================================
 * FinovaWealth — Admin Dashboard Overview Page
 * File: Frontend/src/pages/admin/AdminDashboard.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Activity, Radio, Clock, TrendingUp, UserPlus,
  ArrowUpRight, ArrowDownRight, BarChart3, Loader2,
} from 'lucide-react';
import { getAdminAnalytics } from '../../api/adminService';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
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
    </div>
  );
}
