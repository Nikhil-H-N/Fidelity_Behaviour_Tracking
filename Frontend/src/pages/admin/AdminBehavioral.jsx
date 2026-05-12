/**
 * ============================================================
 * FinovaWealth — Admin Behavioral Analytics Page
 * File: Frontend/src/pages/admin/AdminBehavioral.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Users, BarChart3, Loader2, Filter } from 'lucide-react';
import { getAdminEvents, getAdminAnalytics } from '../../api/adminService';

export default function AdminBehavioral() {
  const [analytics, setAnalytics] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, eventsRes] = await Promise.all([
          getAdminAnalytics(),
          getAdminEvents({ limit: 20 }),
        ]);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (eventsRes.success) setRecentEvents(eventsRes.data.events);
      } catch (err) {
        console.error('Failed to fetch behavioral data:', err);
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Behavioral Analytics</h1>
        <p className="text-surface-500 mt-1">Analyze user behavior patterns across the platform</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Events', value: overview.totalEvents || 0, icon: Activity, color: 'primary' },
          { label: 'Events Today', value: overview.eventsToday || 0, icon: TrendingUp, color: 'accent' },
          { label: 'Active Users', value: overview.totalUsers || 0, icon: Users, color: 'purple' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="kpi-card"
          >
            <div className={`w-11 h-11 rounded-xl ${
              card.color === 'primary' ? 'bg-primary-100' :
              card.color === 'accent' ? 'bg-accent-100' : 'bg-purple-100'
            } flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${
                card.color === 'primary' ? 'text-primary-600' :
                card.color === 'accent' ? 'text-accent-600' : 'text-purple-600'
              }`} />
            </div>
            <p className="text-2xl font-bold text-surface-900">{card.value.toLocaleString()}</p>
            <p className="text-sm text-surface-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Event Types Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kpi-card">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          Event Type Distribution
        </h3>
        {analytics?.eventsByType?.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {analytics.eventsByType.map((evt) => {
              const total = analytics.eventsByType.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? ((evt.count / total) * 100).toFixed(1) : 0;
              return (
                <div key={evt._id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium text-surface-700">{evt._id || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-surface-900">{evt.count}</span>
                    <span className="text-xs text-surface-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-surface-400">No behavioral events recorded yet</p>
        )}
      </motion.div>

      {/* Recent Events Feed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-600" />
          Recent Events Feed
        </h3>
        {recentEvents.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentEvents.map((evt, i) => (
              <div key={evt._id || i} className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-900">{evt.eventType}</span>
                    {evt.page && (
                      <span className="text-xs text-surface-400 bg-surface-200 px-2 py-0.5 rounded-full">{evt.page}</span>
                    )}
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {evt.userId?.fullName || 'Unknown User'} · {new Date(evt.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-400">No recent events</p>
        )}
      </motion.div>
    </div>
  );
}
