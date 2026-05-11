import { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Zap, 
  MousePointerClick, Info, User,
  CheckCircle2, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

export default function Alerts() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/active-users`);
      if (res.ok) {
        setActiveUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Flatten all psychological flags and interventions into "alerts"
  const allAlerts = activeUsers.flatMap(u => {
    const alerts = [];
    
    // Check flags
    if (u.intent_state === 'FRUSTRATED' || u.intent_state === 'HESITATING') {
      alerts.push({
        id: `state-${u.user_id}`,
        user_id: u.user_id,
        type: u.intent_state === 'FRUSTRATED' ? 'CRITICAL' : 'WARNING',
        title: `${u.intent_state} Session Detected`,
        message: `User ${u.user_id} is showing signs of ${u.intent_state.toLowerCase()}.`,
        timestamp: Date.now() / 1000,
        icon: u.intent_state === 'FRUSTRATED' ? ShieldAlert : AlertTriangle,
      });
    }

    // Check manual interventions pending
    if (u.manual_interventions_pending > 0) {
      alerts.push({
        id: `intervention-${u.user_id}`,
        user_id: u.user_id,
        type: 'INFO',
        title: 'Intervention Required',
        message: `There are ${u.manual_interventions_pending} pending interventions for this user.`,
        timestamp: Date.now() / 1000,
        icon: Zap,
      });
    }

    return alerts;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const filteredAlerts = filter === 'ALL' ? allAlerts : allAlerts.filter(a => a.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Alerts</h1>
          <p className="text-surface-400 mt-1">Proactive behavioral triggers and engine exceptions</p>
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
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                alert.type === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                alert.type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                'bg-primary-500/20 text-primary-500'
              }`}>
                <alert.icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-lg">{alert.title}</h3>
                  <span className="text-xs font-mono text-surface-500 bg-surface-950 px-2 py-1 rounded">UID: {alert.user_id}</span>
                </div>
                <p className="text-surface-400 text-sm leading-relaxed mb-4">{alert.message}</p>
                <div className="flex items-center gap-4">
                  <button className="text-[10px] font-bold uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1.5">
                    <User className="w-3 h-3" /> View Session Timeline
                  </button>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Mark as Resolved
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Just Now</span>
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
