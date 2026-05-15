import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Target, Zap, Activity, 
  BarChart3, RefreshCw, Eye, Timer
} from 'lucide-react';
import { KPICard } from '../components/UIComponents';
import { getStatusColor } from '../utils/formatters';
import { engineApi } from '../utils/apiBase';

const API_BASE = engineApi('');

export default function BehavioralAnalytics() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        fetch(engineApi('/admin/active-users?include_events=false')),
        fetch(engineApi('/admin/analytics/summary'))
      ]);
      
      if (usersRes.ok && summaryRes.ok) {
        setActiveUsers(await usersRes.json());
        setSummary(await summaryRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Behavioral Intelligence</h1>
          <p className="text-surface-400 mt-1">Advanced intent tracking and session classification</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-surface-800 rounded-xl transition-all border border-surface-800">
          <RefreshCw className={`w-5 h-5 text-surface-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} label="Active Users" value={summary?.total_users || 0} trend="+12.4%" />
        <KPICard icon={Target} label="Avg Intent Score" value={Math.round(summary?.avg_score || 0)} trend="+2.3%" />
        <KPICard icon={Timer} label="Conv. Probability" value={`${((summary?.avg_conversion_probability || 0) * 100).toFixed(1)}%`} trend="+4%" />
        <KPICard icon={Eye} label="Global Model" value={summary?.global_model_status || 'Offline'} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Behavioral Distribution */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary-400" /> State Distribution
          </h3>
          <div className="space-y-5">
            {Object.entries(summary?.behavioral_distribution || {}).map(([state, count]) => {
              const percentage = Math.round((count / (summary?.total_users || 1)) * 100);
              return (
                <div key={state} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-surface-300 uppercase tracking-widest">{state.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-mono text-surface-500">{count} sessions ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-surface-950 rounded-full h-5 overflow-hidden border border-surface-800 p-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-indigo-500 flex items-center justify-end pr-2 min-w-[20px]">
                      {percentage > 10 && <span className="text-[10px] font-bold text-white/80">{percentage}%</span>}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Intent Tracking */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" /> Active Session Scores
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[450px] custom-scrollbar pr-2">
            {activeUsers.map(user => (
              <div key={user.user_id} className="p-4 rounded-xl bg-surface-950/50 border border-surface-800 hover:border-surface-700 transition-all group">
                {(() => {
                  const nextAction = user.metadata?.next_action_prediction;
                  return nextAction ? (
                    <div className="mb-3 rounded-xl bg-primary-500/10 border border-primary-500/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">Predicted next action</span>
                        <span className="text-[10px] font-mono text-primary-200">{Math.round((nextAction.probability || 0) * 100)}%</span>
                      </div>
                      <p className="text-sm font-bold text-white mt-1">{nextAction.label || nextAction.action}</p>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-surface-500 bg-surface-900 px-1.5 py-0.5 rounded w-fit mb-1">{user.user_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${getStatusColor(user.intent_state)}`}>{user.intent_state}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-400 leading-none">{Math.round(user.total_score)}</span>
                    <p className="text-[8px] font-bold text-surface-600 uppercase tracking-widest mt-1">INTENT SCORE</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-surface-900 rounded-lg text-[10px] text-surface-400 font-bold border border-surface-800">
                    PERSONA: {user.persona.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-1 bg-surface-900 rounded-lg text-[10px] text-surface-400 font-bold border border-surface-800">
                    EVENTS: {user.event_count}
                  </span>
                  {user.manual_interventions_pending > 0 && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold border border-red-500/20 animate-pulse">
                      INTERVENTION REQUIRED
                    </span>
                  )}
                </div>
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-surface-600 opacity-20 italic">
                <Activity className="w-12 h-12 mb-2" />
                <p>No active user sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
