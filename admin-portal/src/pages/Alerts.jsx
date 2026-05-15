import { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Zap, 
  MousePointerClick, Info, User,
  CheckCircle2, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineApi } from '../utils/apiBase';

const displayEventType = (event) => (
  event.raw_event_type ||
  event.metadata?.raw_event_type ||
  event.metadata?.rawEventType ||
  event.event_type ||
  'unknown'
);

const pageLabel = (page) => String(page || 'unknown')
  .replace(/^\/+/, '')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const buildAlertsFromUsers = (users) => {
  const alerts = [];
  const now = Date.now() / 1000;

  users.forEach((user) => {
    const displayName = user.metadata?.name || user.metadata?.email || user.user_id;
    const lastPage = user.navigation_flow?.[user.navigation_flow.length - 1]?.page || user.pages_visited?.[user.pages_visited.length - 1];
    const score = Number((user.total_score || 0).toFixed?.(1) || user.total_score || 0);

    if (['FRUSTRATED', 'HESITATING'].includes(user.intent_state)) {
      alerts.push({
        id: `fallback-state-${user.user_id}-${user.intent_state}`,
        user_id: user.user_id,
        type: user.intent_state === 'FRUSTRATED' ? 'CRITICAL' : 'WARNING',
        title: `${user.intent_state[0]}${user.intent_state.slice(1).toLowerCase()} Session`,
        message: `${displayName} is currently classified as ${user.intent_state.toLowerCase()} with score ${score}.`,
        timestamp: user.last_active || now,
        page: lastPage,
        score,
      });
    }

    if ((user.manual_interventions_pending || 0) > 0) {
      alerts.push({
        id: `fallback-intervention-${user.user_id}-${user.manual_interventions_pending}`,
        user_id: user.user_id,
        type: 'INFO',
        title: 'Intervention Queued',
        message: `${user.manual_interventions_pending} admin intervention is waiting for ${displayName}.`,
        timestamp: user.last_active || now,
        page: lastPage,
        score,
      });
    }

    if ((user.total_score || 0) >= 75) {
      alerts.push({
        id: `fallback-high-intent-${user.user_id}`,
        user_id: user.user_id,
        type: 'INFO',
        title: 'High Intent User Active',
        message: `${displayName} crossed the high-intent threshold with score ${score}.`,
        timestamp: user.last_active || now,
        page: lastPage,
        score,
      });
    }

    (user.events || []).slice(-40).forEach((event, index) => {
      const eventType = displayEventType(event);
      const timestamp = event.timestamp || user.last_active || now;
      const page = event.page_id || event.page || lastPage;

      if (['rage_click', 'rapid_click'].includes(eventType)) {
        alerts.push({
          id: `fallback-click-${user.user_id}-${timestamp}-${index}`,
          user_id: user.user_id,
          type: eventType === 'rage_click' ? 'CRITICAL' : 'WARNING',
          title: 'Click Friction Detected',
          message: `${displayName} triggered ${eventType.replace(/_/g, ' ')} on ${pageLabel(page)}.`,
          timestamp,
          page,
          event_type: eventType,
          score,
        });
      }

      if (['form_abandon', 'form_abandonment', 'checkout_abandon'].includes(eventType)) {
        alerts.push({
          id: `fallback-abandon-${user.user_id}-${timestamp}-${index}`,
          user_id: user.user_id,
          type: eventType === 'checkout_abandon' ? 'CRITICAL' : 'WARNING',
          title: 'Application Drop-Off',
          message: `${displayName} abandoned the application flow on ${pageLabel(page)}.`,
          timestamp,
          page,
          event_type: eventType,
          score,
        });
      }

      if (['inactive_session', 'idle_timeout', 'bounce'].includes(eventType)) {
        alerts.push({
          id: `fallback-idle-${user.user_id}-${timestamp}-${index}`,
          user_id: user.user_id,
          type: 'WARNING',
          title: eventType === 'bounce' ? 'Bounce Detected' : 'Inactive Session',
          message: `${displayName} ${eventType === 'bounce' ? 'bounced after visiting' : 'went inactive on'} ${pageLabel(page)}.`,
          timestamp,
          page,
          event_type: eventType,
          score,
        });
      }
    });
  });

  const severityRank = { CRITICAL: 3, WARNING: 2, INFO: 1 };
  const deduped = [...new Map(alerts.map((alert) => [alert.id, alert])).values()]
    .sort((a, b) => (severityRank[b.type] - severityRank[a.type]) || ((b.timestamp || 0) - (a.timestamp || 0)))
    .slice(0, 100);

  return {
    alerts: deduped,
    summary: {
      total: deduped.length,
      critical: deduped.filter((alert) => alert.type === 'CRITICAL').length,
      warning: deduped.filter((alert) => alert.type === 'WARNING').length,
      info: deduped.filter((alert) => alert.type === 'INFO').length,
    },
  };
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [resolved, setResolved] = useState(() => new Set());

  const fetchAlerts = async () => {
    try {
      const res = await fetch(engineApi('/admin/alerts'));
      if (res.ok) {
        const payload = await res.json();
        setAlerts(payload.alerts || []);
        setSummary(payload.summary || null);
      } else {
        throw new Error(`alerts ${res.status}`);
      }
    } catch (error) {
      try {
        const fallbackRes = await fetch(engineApi('/admin/active-users?event_limit=250'));
        if (!fallbackRes.ok) throw error;
        const users = await fallbackRes.json();
        const payload = buildAlertsFromUsers(users || []);
        setAlerts(payload.alerts || []);
        setSummary(payload.summary || null);
      } catch (fallbackError) {
        console.error('Failed to fetch alerts:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const iconFor = (alert) => {
    if (alert.type === 'CRITICAL') return ShieldAlert;
    if (alert.event_type?.includes('click')) return MousePointerClick;
    if (alert.title?.toLowerCase().includes('intent')) return Zap;
    if (alert.type === 'WARNING') return AlertTriangle;
    return Info;
  };

  const activeAlerts = alerts.filter((alert) => !resolved.has(alert.id));
  const filteredAlerts = filter === 'ALL' ? activeAlerts : activeAlerts.filter(a => a.type === filter);
  const markResolved = (id) => setResolved((current) => new Set([...current, id]));
  const relativeTime = (timestamp) => {
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - (timestamp || 0)));
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Alerts</h1>
          <p className="text-surface-400 mt-1">Real-time behavioral triggers, friction spikes, and intervention signals</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-800 bg-surface-900">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {summary?.total || 0} Live Alerts
            </span>
          </div>
          <div className="flex gap-2 bg-surface-900 p-1 rounded-xl border border-surface-800">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === t ? 'bg-primary-600 text-white' : 'text-surface-500 hover:text-surface-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredAlerts.map((alert) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-2xl ${
                alert.type === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' :
                alert.type === 'WARNING' ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-primary-500/5 border-primary-500/20'
              }`}
            >
              {(() => {
                const Icon = iconFor(alert);
                return (
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                alert.type === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                alert.type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                'bg-primary-500/20 text-primary-500'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
                );
              })()}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-lg">{alert.title}</h3>
                  <span className="text-xs font-mono text-surface-500 bg-surface-950 px-2 py-1 rounded">UID: {alert.user_id}</span>
                </div>
                <p className="text-surface-400 text-sm leading-relaxed mb-4">{alert.message}</p>
                <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                  {alert.page && <span className="px-2 py-1 rounded bg-surface-950 text-surface-500">Page: {alert.page}</span>}
                  {alert.event_type && <span className="px-2 py-1 rounded bg-surface-950 text-surface-500">Event: {alert.event_type}</span>}
                  {alert.score !== undefined && <span className="px-2 py-1 rounded bg-surface-950 text-primary-400">Score: {alert.score}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-[10px] font-bold uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1.5">
                    <User className="w-3 h-3" /> View Session Timeline
                  </button>
                  <button
                    onClick={() => markResolved(alert.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark as Resolved
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">{relativeTime(alert.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 bg-surface-900/30 border-2 border-dashed border-surface-800 rounded-3xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/20 mb-4" />
            <p className="text-surface-500 font-medium italic">No active system alerts detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
