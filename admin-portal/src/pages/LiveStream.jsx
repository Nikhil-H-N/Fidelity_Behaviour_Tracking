import { useState, useEffect } from 'react';
import { 
  Radio, Eye, MousePointerClick, FormInput, Zap,
  MousePointer2, Focus, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

const displayEventType = (event) => (
  event.raw_event_type ||
  event.metadata?.raw_event_type ||
  event.metadata?.rawEventType ||
  event.event_type ||
  'unknown'
);

export default function LiveStream() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/active-users`);
      if (res.ok) {
        setActiveUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const allEvents = activeUsers.flatMap(u => (u.events || []).map(e => ({...e, user_id: u.user_id})))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Live Behavioral Stream</h1>
        <p className="text-surface-400 mt-1">Real-time raw event ingestion across all active sessions</p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-surface-800 flex items-center justify-between bg-surface-900/50">
          <h3 className="font-bold flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" /> ENGINE ADAPTER: INCOMING
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-surface-500">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-500" /> PAGE VIEW</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> CLICK</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> FORM</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> HOVER</span>
          </div>
        </div>

        <div className="min-h-[600px] p-6 space-y-3">
          <AnimatePresence initial={false}>
            {allEvents.map((e, idx) => {
              const eventType = displayEventType(e);

              return (
              <motion.div
                key={`${e.timestamp}-${e.user_id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-950/50 border border-surface-800 hover:border-primary-500/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    eventType.includes('page') ? 'bg-primary-500/10 text-primary-400' :
                    eventType.includes('click') ? 'bg-emerald-500/10 text-emerald-400' :
                    eventType.includes('form') ? 'bg-amber-500/10 text-amber-400' :
                    eventType.includes('hover') ? 'bg-indigo-500/10 text-indigo-400' :
                    eventType.includes('focus') ? 'bg-purple-500/10 text-purple-400' :
                    eventType.includes('idle') || eventType.includes('inactive') ? 'bg-red-500/10 text-red-400' :
                    'bg-surface-800 text-surface-500'
                  }`}>
                    {eventType.includes('page') ? <Eye className="w-5 h-5" /> :
                     eventType.includes('click') ? <MousePointerClick className="w-5 h-5" /> :
                     eventType.includes('form') ? <FormInput className="w-5 h-5" /> :
                     eventType.includes('hover') ? <MousePointer2 className="w-5 h-5" /> :
                     eventType.includes('focus') ? <Focus className="w-5 h-5" /> :
                     eventType.includes('idle') || eventType.includes('inactive') ? <Clock className="w-5 h-5" /> :
                     <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{eventType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-surface-600 font-mono tracking-tighter bg-surface-900 px-1.5 py-0.5 rounded">UID: {e.user_id}</span>
                    </div>
                    <p className="text-sm font-medium text-surface-500 mt-0.5">
                      {e.page_id} {e.element_id ? <span className="text-surface-600 mx-1">/</span> : ''} 
                      <span className="text-surface-400">{e.element_id}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-primary-500 font-bold">{new Date(e.timestamp * 1000).toLocaleTimeString()}</p>
                  <p className="text-[10px] text-surface-600 mt-1">{new Date(e.timestamp * 1000).toLocaleDateString()}</p>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
          
          {allEvents.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-32 text-surface-600">
              <Radio className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
              <p className="text-lg font-medium italic">Listening for behavioral signals...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
