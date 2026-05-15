import { useState, useEffect, useMemo } from 'react';
import { 
  Users, TrendingUp, Zap, Activity, 
  Settings, Save, Cpu, Globe, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { KPICard } from '../components/UIComponents';
import { engineApi } from '../utils/apiBase';

const API_BASE = engineApi('');

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, configRes, usersRes] = await Promise.all([
        fetch(engineApi('/admin/analytics/summary')),
        fetch(engineApi('/admin/config')),
        fetch(engineApi('/admin/active-users?include_events=false'))
      ]);
      
      if (summaryRes.ok && configRes.ok && usersRes.ok) {
        setSummary(await summaryRes.json());
        setConfig(await configRes.json());
        setActiveUsers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const externalCount = useMemo(() => {
    return activeUsers.filter(u => u.metadata?.connection_origin === 'remote').length;
  }, [activeUsers]);

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      await fetch(engineApi('/admin/config/update'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config),
      });
      alert('Config Synced to Engine');
    } catch (e) { alert('Update Failed'); }
    setSaving(false);
  };

  const handleTrain = async () => {
    await fetch(engineApi('/admin/train-global-model'), { 
      method: 'POST'
    });
    alert('Global ML training started');
  };

  if (loading && !summary) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Overview</h1>
          <p className="text-surface-400 mt-1">Real-time health and behavioral aggregates</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrain} className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-bold transition-all border border-surface-700">
            <Cpu className="w-4 h-4 text-primary-400" /> Train ML Model
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} label="LIVE SESSIONS" value={summary?.total_users || 0} trend="+12%" />
        <KPICard icon={Globe} label="REMOTE USERS" value={externalCount} color="text-amber-400" />
        <KPICard icon={TrendingUp} label="AVG INTENT" value={Math.round(summary?.avg_score || 0)} trend="+4.2" />
        <KPICard icon={Zap} label="CONV. PROB" value={`${((summary?.avg_conversion_probability || 0) * 100).toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Behavioral Distribution */}
        <div className="lg:col-span-2 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 text-lg text-white">
              <Zap className="w-5 h-5 text-primary-400" /> Behavioral States Distribution
            </h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-surface-800 rounded text-surface-400 uppercase tracking-widest">LIVE DATA</span>
          </div>
          <div className="space-y-6">
            {Object.entries(summary?.behavioral_distribution || {}).map(([state, count]) => {
              const percentage = Math.round((count / (summary?.total_users || 1)) * 100);
              return (
                <div key={state} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="uppercase text-surface-300 tracking-wider">{state.replace(/_/g, ' ')}</span>
                    <span className="text-primary-400">{count} users ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Config */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 text-lg text-white">
              <Settings className="w-5 h-5 text-surface-500" /> Engine Config
            </h3>
            <button onClick={handleUpdateConfig} disabled={saving} className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all shadow-lg shadow-primary-900/40">
              <Save className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Priority Weights</h4>
              <div className="space-y-4">
                {config && Object.entries(config.page_weights).slice(0, 5).map(([page, w]) => (
                  <div key={page} className="flex items-center justify-between">
                    <span className="text-xs text-surface-400">{page}</span>
                    <input type="number" value={w} onChange={(e) => setConfig({...config, page_weights: {...config.page_weights, [page]: parseFloat(e.target.value)}})}
                      className="w-12 h-7 bg-surface-950 border border-surface-800 rounded text-center text-[10px] font-bold text-primary-400 focus:border-primary-500 outline-none transition-colors" />
                  </div>
                ))}
                <p className="text-[10px] text-center text-surface-600 italic mt-4 underline cursor-pointer">View all weights in ML Settings</p>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-800">
              <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">State Thresholds</h4>
              <div className="space-y-5">
                {config && Object.entries(config.score_thresholds).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-surface-400 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                      <span className="text-primary-400">{val}</span>
                    </div>
                    <input type="range" min="0" max="150" value={val} onChange={(e) => setConfig({...config, score_thresholds: {...config.score_thresholds, [key]: parseFloat(e.target.value)}})}
                      className="w-full h-1 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages & Persona Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
           <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-white">
            <Eye className="w-5 h-5 text-indigo-400" /> Top Visited Pages
          </h3>
          <div className="space-y-4">
            {summary?.top_pages?.map(([page, count], idx) => (
              <div key={page} className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-surface-600 font-mono">#{idx + 1}</span>
                  <span className="text-sm text-surface-300 truncate max-w-[150px]">{page}</span>
                </div>
                <span className="text-sm font-bold text-primary-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-white">
            <Activity className="w-5 h-5 text-emerald-400" /> Psychological Persona Clustering
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary?.clustering_segments || {}).map(([persona, count]) => (
              <div key={persona} className="p-5 rounded-2xl bg-surface-950 border border-surface-800 hover:border-surface-700 transition-all group">
                <p className="text-[10px] font-bold text-surface-500 uppercase mb-3 tracking-widest group-hover:text-surface-300 transition-colors">{persona.replace(/_/g, ' ')}</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-white tracking-tighter">{count}</p>
                  <div className="w-1.5 h-8 bg-surface-800 rounded-full overflow-hidden">
                    <div className="w-full bg-primary-500" style={{ height: `${(count / (summary?.total_users || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
