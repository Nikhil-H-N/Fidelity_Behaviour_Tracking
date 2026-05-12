/**
 * ============================================================
 * FinovaWealth — Admin Session Timeline Page
 * File: Frontend/src/pages/admin/AdminSessionTimeline.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Monitor, Globe, User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAdminSessions } from '../../api/adminService';

export default function AdminSessionTimeline() {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSessions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminSessions(params);
      if (res.success) {
        setSessions(res.data.sessions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [statusFilter]);

  const formatDuration = (start, end) => {
    if (!start) return '—';
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const diff = Math.floor((e - s) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Session Timeline</h1>
        <p className="text-surface-500 mt-1">Track user sessions and browsing activity</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="input-field py-2 max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Sessions</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
        <div className="flex items-center gap-2 text-sm text-surface-500 bg-white rounded-xl px-4 py-2 border border-surface-200">
          <Clock className="w-4 h-4" />
          <span>{pagination.total} total sessions</span>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, i) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-surface-100 shadow-card p-5 flex flex-col sm:flex-row gap-4"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center sm:py-1">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  session.status === 'active' ? 'bg-accent-500 animate-pulse' : 'bg-surface-300'
                }`} />
                <div className="w-px flex-1 bg-surface-200 mt-1 hidden sm:block" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-surface-400" />
                    <span className="text-sm font-semibold text-surface-900">
                      {session.userId?.fullName || 'Unknown User'}
                    </span>
                  </div>
                  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                    session.status === 'active'
                      ? 'bg-accent-50 text-accent-700'
                      : 'bg-surface-100 text-surface-600'
                  }`}>
                    {session.status === 'active' ? '● Active' : '○ Ended'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(session.sessionStart, session.sessionEnd)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{session.device || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{session.browser || 'Unknown'}</span>
                  </div>
                  <div className="text-xs text-surface-400">
                    {new Date(session.sessionStart).toLocaleString('en-IN')}
                  </div>
                </div>

                {session.userId?.email && (
                  <p className="text-xs text-surface-400 mt-2">{session.userId.email}</p>
                )}
              </div>
            </motion.div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-16 text-surface-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No sessions found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchSessions(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchSessions(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
