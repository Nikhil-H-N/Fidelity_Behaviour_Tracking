/**
 * ============================================================
 * FinovaWealth — Admin Event Tracking Page
 * File: Frontend/src/pages/admin/AdminEventTracking.jsx
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Search, Filter, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react';
import { getAdminEvents } from '../../api/adminService';

export default function AdminEventTracking() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filterType) params.eventType = filterType;
      const res = await getAdminEvents(params);
      if (res.success) {
        setEvents(res.data.events);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [filterType]);

  const eventTypeColors = {
    page_view: 'bg-blue-100 text-blue-700',
    click: 'bg-purple-100 text-purple-700',
    scroll: 'bg-amber-100 text-amber-700',
    form_start: 'bg-accent-100 text-accent-700',
    form_submit: 'bg-green-100 text-green-700',
    session_start: 'bg-primary-100 text-primary-700',
    scroll_depth: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Event Tracking</h1>
        <p className="text-surface-500 mt-1">View all tracked user events across the platform</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400" />
          <select
            className="input-field py-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Event Types</option>
            <option value="page_view">Page View</option>
            <option value="click">Click</option>
            <option value="scroll">Scroll</option>
            <option value="scroll_depth">Scroll Depth</option>
            <option value="form_start">Form Start</option>
            <option value="form_submit">Form Submit</option>
            <option value="session_start">Session Start</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500 bg-white rounded-xl px-4 py-2 border border-surface-200">
          <Radio className="w-4 h-4" />
          <span>{pagination.total} total events</span>
        </div>
      </div>

      {/* Events Table */}
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
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Page</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Element</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        eventTypeColors[evt.eventType] || 'bg-surface-100 text-surface-700'
                      }`}>
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-surface-900">{evt.userId?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-surface-400">{evt.userId?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-surface-600">{evt.page || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-surface-600">{evt.element || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-surface-500">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchEvents(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchEvents(pagination.page + 1)}
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
