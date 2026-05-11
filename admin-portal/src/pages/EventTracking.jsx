import { motion } from 'framer-motion';
import { Radio, Eye, MousePointerClick, Activity, FormInput, Zap, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function EventTracking() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/admin/active-users`),
          fetch(`${API_BASE}/admin/analytics/summary`)
        ]);
        if (usersRes.ok && summaryRes.ok) {
          setActiveUsers(await usersRes.json());
          setSummary(await summaryRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const eventTypeData = [
    { type: 'Page Views', count: summary?.event_counts?.page_view || 0 },
    { type: 'Clicks', count: summary?.event_counts?.button_click || summary?.event_counts?.cta_click || 0 },
    { type: 'Scrolls', count: summary?.event_counts?.scroll_depth || 0 },
    { type: 'Form Starts', count: summary?.event_counts?.form_start || 0 },
    { type: 'Completes', count: summary?.event_counts?.form_complete || 0 },
  ];

  const allEvents = activeUsers.flatMap(u => (u.events || []).map(e => ({...e, user_id: u.user_id})))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Distribution</h1>
          <p className="text-surface-400 mt-1">Cross-session event metrics and telemetry</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-bold border border-surface-700 transition-all">
          <Download className="w-4 h-4" /> Export logs
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" /> Event Type Frequency
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white mb-6">Aggregate Telemetry</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Ingested', value: summary?.total_events || 0, icon: Activity, color: 'text-primary-400 bg-primary-400/10' },
              { label: 'Avg Session Depth', value: '4.2', icon: Eye, color: 'text-emerald-400 bg-emerald-400/10' },
              { label: 'Events / User', value: (summary?.total_events / (summary?.total_users || 1)).toFixed(1), icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
              { label: 'Friction Rate', value: '12.4%', icon: FormInput, color: 'text-red-400 bg-red-400/10' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-950 border border-surface-800">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-tight">{s.value}</p>
                  <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" /> Telemetry Stream
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {allEvents.map((e, i) => (
            <motion.div key={`${e.timestamp}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-950/50 border border-surface-800 hover:border-surface-700 transition-colors text-sm">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  e.event_type.includes('form') ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                  e.event_type.includes('click') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                }`} />
                <div>
                  <span className="font-bold text-surface-200 uppercase text-[10px] tracking-widest mr-3">
                    {e.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-surface-500 font-medium">
                    {e.page_id} {e.element_id ? <span className="mx-1">·</span> : ''} {e.element_id || ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs font-mono">
                <span className="text-surface-600">ID: {e.user_id}</span>
                <span className="text-primary-500 font-bold">{new Date(e.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
            </motion.div>
          ))}
          {allEvents.length === 0 && <p className="text-center py-10 text-surface-600 italic">Listening for telemetry...</p>}
        </div>
      </div>
    </div>
  );
}
