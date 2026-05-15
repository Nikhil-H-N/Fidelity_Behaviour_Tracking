import { useState, useEffect } from 'react';
import { 
  Cpu, Settings, Save, Trash2, 
  ShieldCheck, AlertTriangle, Zap,
  BarChart3, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { engineApi } from '../utils/apiBase';

const API_BASE = engineApi('');

export default function MLIntelligence() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch(engineApi('/admin/config'));
      if (res.ok) {
        setConfig(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      await fetch(engineApi('/admin/config/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      alert('Engine synchronized successfully');
    } catch (e) { alert('Update Failed'); }
    setSaving(false);
  };

  const handleTrain = async () => {
    await fetch(engineApi('/admin/train-global-model'), { method: 'POST' });
    alert('Global ML training cycle started in background');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">ML Intelligence & Configuration</h1>
          <p className="text-surface-400 mt-1">Fine-tune the behavioral brain and heuristic weights</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrain} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-900/40 transition-all">
            <Cpu className="w-4 h-4" /> Start Global Training
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Config Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Page Importance */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary-400" /> Behavioral Weight Matrix
              </h3>
              <button onClick={handleUpdateConfig} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'SYNCING...' : 'SYNC CHANGES'}
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {config && Object.entries(config.page_weights).map(([page, w]) => (
                <div key={page} className="flex items-center justify-between group p-3 rounded-xl hover:bg-surface-950/50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-surface-200 uppercase tracking-tighter">{page.split('/').pop() || 'landing'}</span>
                    <span className="text-[10px] text-surface-500 font-mono">{page}</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    value={w} 
                    onChange={(e) => setConfig({...config, page_weights: {...config.page_weights, [page]: parseFloat(e.target.value)}})}
                    className="w-16 h-9 bg-surface-950 border border-surface-800 rounded-lg text-center text-xs font-bold text-primary-400 focus:border-primary-500 outline-none transition-colors" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Detectors */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Cognitive Detectors
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config && Object.entries(config.detectors_enabled).map(([detector, enabled]) => (
                <label key={detector} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${enabled ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-surface-950 border-surface-800 text-surface-600'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{detector.replace(/_/g, ' ')}</span>
                  <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={(e) => setConfig({...config, detectors_enabled: {...config.detectors_enabled, [detector]: e.target.checked}})}
                    className="w-4 h-4 rounded border-surface-800 bg-surface-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-surface-900" 
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Thresholds */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-surface-500" /> Sensitivity Thresholds
            </h3>
            <div className="space-y-6">
              {config && Object.entries(config.score_thresholds).map(([key, val]) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-surface-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                    <span className="text-primary-400">{val}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={val} 
                    onChange={(e) => setConfig({...config, score_thresholds: {...config.score_thresholds, [key]: parseFloat(e.target.value)}})}
                    className="w-full h-1.5 bg-surface-950 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Training Info */}
          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 rounded-2xl p-6 shadow-2xl shadow-primary-900/20 text-white relative overflow-hidden">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
            <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
              <Cpu className="w-5 h-5" /> Model Lifecycle
            </h3>
            <p className="text-sm text-primary-100 mb-6 relative z-10 leading-relaxed">
              Global ML models are updated periodically using cross-session anonymized behavioral data. Training improves persona clustering and conversion probability accuracy.
            </p>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Last Train</span>
                <span>2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Dataset Size</span>
                <span>12,842 events</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-200 leading-normal">
              <strong>Warning:</strong> Modifying behavioral weights and thresholds directly affects real-time intent classification and re-engagement triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
