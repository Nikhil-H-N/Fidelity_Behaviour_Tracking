import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bell,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FormInput,
  MousePointer2,
  MousePointerClick,
  Radio,
  Repeat2,
  RotateCcw,
  TimerOff,
  Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { engineApi } from '../utils/apiBase';

const API_BASE = engineApi('');

const CORE_EVENTS = [
  { type: 'page_view', label: 'page_view', description: 'User opened page', icon: Eye },
  { type: 'button_click', label: 'button_click', description: 'CTA clicked', icon: MousePointerClick },
  { type: 'scroll_depth', label: 'scroll_depth', description: 'Reading engagement', icon: Activity },
  { type: 'time_spent', label: 'time_spent', description: 'User interest', icon: Clock },
  { type: 'form_start', label: 'form_start', description: 'Started investing', icon: FormInput },
  { type: 'form_submit', label: 'form_submit', description: 'Conversion', icon: FileCheck2 },
  { type: 'form_abandon', label: 'form_abandon', description: 'Drop-off', icon: TimerOff },
  { type: 'notification_open', label: 'notification_open', description: 'Re-engagement success', icon: Bell },
  { type: 'return_visit', label: 'return_visit', description: 'User came back', icon: RotateCcw },
];

const EXTRA_FEATURES = [
  { key: 'mouse_movement_events', label: 'Mouse movement tracking', icon: MousePointer2 },
  { key: 'repeated_page_visits', label: 'Repeated page visits', icon: Repeat2 },
  { key: 'rapid_clicks', label: 'Rapid click detection', icon: Zap },
  { key: 'inactive_sessions', label: 'Inactive session detection', icon: TimerOff },
  { key: 'bounce_rate', label: 'Bounce detection', icon: Activity, suffix: '%' },
];

const displayEventType = (event) => (
  event.raw_event_type ||
  event.metadata?.raw_event_type ||
  event.metadata?.rawEventType ||
  event.event_type ||
  'unknown'
);

const eventColor = (eventType) => {
  if (eventType.includes('form')) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
  if (eventType.includes('click')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  if (eventType.includes('inactive') || eventType.includes('bounce')) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
  if (eventType.includes('mouse')) return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]';
  return 'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
};

export default function EventTracking() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, summaryRes] = await Promise.all([
          fetch(engineApi('/admin/active-users?event_limit=25')),
          fetch(engineApi('/admin/analytics/summary')),
        ]);
        if (usersRes.ok) setActiveUsers(await usersRes.json());
        if (summaryRes.ok) setSummary(await summaryRes.json());
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

  const counts = summary?.event_counts || {};
  const eventTypeData = CORE_EVENTS.map((event) => ({
    type: event.label.replace('_', ' '),
    count: counts[event.type] || 0,
  }));

  const allEvents = activeUsers
    .flatMap((user) => (user.events || []).map((event) => ({ ...event, user_id: user.user_id })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 40);

  const totalEvents = summary?.total_events || allEvents.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Tracking Engine</h1>
          <p className="text-surface-400 mt-1">Core behavioral events, friction signals, and conversion telemetry</p>
        </div>
        <button className="flex w-fit items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-bold border border-surface-700 transition-all">
          <Download className="w-4 h-4" /> Export logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: totalEvents, icon: Activity, color: 'text-primary-400 bg-primary-400/10' },
          { label: 'Active Users', value: summary?.total_users || 0, icon: Radio, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Return Visits', value: counts.return_visit || 0, icon: RotateCcw, color: 'text-indigo-400 bg-indigo-400/10' },
          { label: 'Rapid Clicks', value: summary?.rapid_clicks || 0, icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
          { label: 'Bounce Rate', value: `${(summary?.bounce_rate || 0).toFixed(1)}%`, icon: TimerOff, color: 'text-red-400 bg-red-400/10' },
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

      <div className="grid xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" /> Event Type Frequency
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#F8FAFC' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white mb-6">Extra Features</h3>
          <div className="space-y-3">
            {EXTRA_FEATURES.map((feature) => {
              const value = feature.key === 'bounce_rate'
                ? (summary?.bounce_rate || 0).toFixed(1)
                : summary?.[feature.key] || 0;

              return (
                <div key={feature.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-950 border border-surface-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-300">
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-surface-200 truncate">{feature.label}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary-400">
                    {value}{feature.suffix || ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" /> Live Telemetry Stream
        </h3>
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
          {allEvents.map((event, index) => {
            const eventType = displayEventType(event);

            return (
              <motion.div
                key={`${event.timestamp}-${event.user_id}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-3 p-3 rounded-xl bg-surface-950/50 border border-surface-800 hover:border-surface-700 transition-colors text-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${eventColor(eventType)}`} />
                  <div className="min-w-0">
                    <span className="font-bold text-surface-200 uppercase text-[10px] tracking-widest mr-3">
                      {eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-surface-500 font-medium">
                      {event.page_id || 'unknown'} {event.element_id ? <span className="mx-1 text-surface-700">/</span> : ''} {event.element_id || ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-surface-500 md:gap-6">
                  <span className="truncate">ID: {event.user_id}</span>
                  <span className="text-primary-500 font-bold">
                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {allEvents.length === 0 && !loading && (
            <p className="text-center py-10 text-surface-600 italic">Listening for telemetry...</p>
          )}
        </div>
      </div>
    </div>
  );
}
