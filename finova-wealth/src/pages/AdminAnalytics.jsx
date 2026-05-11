<<<<<<< HEAD
import { motion } from 'framer-motion';
import { Users, TrendingUp, Bell, Zap, BarChart3, Target, ArrowUpRight, Activity } from 'lucide-react';
import { KPICard } from '../components/common/UIComponents';
import { adminStats, funnelData } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { usePageTracking } from '../hooks/useTracking';

const userGrowth = [
  { month: 'Jul', users: 85000 }, { month: 'Aug', users: 92000 }, { month: 'Sep', users: 98000 },
  { month: 'Oct', users: 105000 }, { month: 'Nov', users: 115000 }, { month: 'Dec', users: 125000 },
];

const triggerData = [
  { trigger: 'Abandoned Cart', fired: 3200, converted: 890, rate: '27.8%' },
  { trigger: 'Inactive 7 days', fired: 4500, converted: 1200, rate: '26.7%' },
  { trigger: 'High Intent Score', fired: 1800, converted: 720, rate: '40.0%' },
  { trigger: 'Goal Milestone', fired: 2100, converted: 580, rate: '27.6%' },
  { trigger: 'Price Alert', fired: 1200, converted: 340, rate: '28.3%' },
];

export default function AdminAnalytics() {
  usePageTracking('admin-analytics');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Admin Analytics</h1>
        <p className="text-surface-500 text-sm mt-1">Platform-wide analytics overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Users" value={adminStats.totalUsers.toLocaleString()} change={`+${adminStats.newUsersToday} today`} changeType="positive" />
        <KPICard icon={TrendingUp} label="Total AUM" value={adminStats.totalAUM} change={`+${adminStats.monthlyGrowth}%`} changeType="positive" />
        <KPICard icon={Bell} label="Notifications Sent" value={adminStats.notificationsSent.toLocaleString()} />
        <KPICard icon={Zap} label="Triggers Fired" value={adminStats.triggersFired.toLocaleString()} change={`${adminStats.conversionFromTriggers}% CVR`} changeType="positive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${(v/1000)}K`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="users" stroke="#2E51F5" strokeWidth={2.5} dot={{ r: 4, fill: '#2E51F5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Trigger Analytics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-100">
                {['Trigger', 'Fired', 'Converted', 'Rate'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-surface-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>{triggerData.map(t => (
                <tr key={t.trigger} className="border-b border-surface-50">
                  <td className="py-3 text-sm font-medium text-surface-900">{t.trigger}</td>
                  <td className="py-3 text-sm text-surface-600">{t.fired.toLocaleString()}</td>
                  <td className="py-3 text-sm text-surface-600">{t.converted.toLocaleString()}</td>
                  <td className="py-3 text-sm font-semibold text-accent-600">{t.rate}</td>
                </tr>
              ))}</tbody>
            </table>
=======
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Bell, Zap, BarChart3, Target, ArrowUpRight, Activity, Settings, Save, Trash2, ShieldAlert, Cpu } from 'lucide-react';
import { KPICard } from '../components/common/UIComponents';
import { usePageTracking } from '../hooks/useTracking';

export default function AdminAnalytics() {
  usePageTracking('admin-analytics');
  const [config, setConfig] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [configRes, summaryRes] = await Promise.all([
        fetch('http://localhost:8000/admin/config'),
        fetch('http://localhost:8000/admin/analytics/summary')
      ]);
      
      if (configRes.ok && summaryRes.ok) {
        const configData = await configRes.ok ? await configRes.json() : null;
        const summaryData = await summaryRes.ok ? await summaryRes.json() : null;
        if (configData) setConfig(configData);
        if (summaryData) setSummary(summaryData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8000/admin/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) alert('Configuration updated successfully!');
    } catch (error) {
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleResetEngine = async () => {
    if (!confirm('Are you sure you want to wipe all session data? This cannot be undone.')) return;
    try {
      const res = await fetch('http://localhost:8000/admin/reset-all-sessions', { method: 'POST' });
      if (res.ok) {
        alert('Engine reset complete.');
        fetchData();
      }
    } catch (error) {
      alert('Failed to reset engine');
    }
  };

  const handleTrainModel = async () => {
    try {
      const res = await fetch('http://localhost:8000/admin/train-global-model', { method: 'POST' });
      if (res.ok) alert('Global ML training cycle started in background.');
    } catch (error) {
      alert('Failed to start training');
    }
  };

  if (loading) return <div className="p-10 text-center text-surface-500">Loading master control...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Master Control Panel</h1>
          <p className="text-surface-500 text-sm mt-1">Engine configuration and global behavioral metrics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleResetEngine} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Reset Engine
          </button>
          <button onClick={handleTrainModel} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
            <Cpu className="w-4 h-4" /> Train Global ML
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Live Sessions" value={summary?.total_users || 0} change="+12" changeType="positive" />
        <KPICard icon={TrendingUp} label="Platform Intent" value={Math.round(summary?.avg_score || 0)} change="+5%" changeType="positive" />
        <KPICard icon={Zap} label="ML Confidence" value={`${((summary?.avg_conversion_probability || 0) * 100).toFixed(1)}%`} />
        <KPICard icon={ShieldAlert} label="System Status" value="ACTIVE" change="Healthy" changeType="positive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Engine Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-surface-400" /> Behavioral Logic Config
              </h3>
              <button onClick={handleUpdateConfig} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 text-white rounded-lg text-xs font-bold hover:bg-accent-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">Page Importance (Weights)</h4>
                <div className="space-y-3">
                  {config && Object.entries(config.page_weights).map(([page, weight]) => (
                    <div key={page} className="flex items-center justify-between">
                      <span className="text-sm text-surface-600 font-medium">{page}</span>
                      <input type="number" value={weight} onChange={(e) => setConfig({...config, page_weights: {...config.page_weights, [page]: parseFloat(e.target.value)}})} 
                        className="w-16 px-2 py-1 bg-surface-50 border border-surface-200 rounded text-sm text-right font-mono" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">Active Detectors</h4>
                <div className="space-y-2">
                  {config && Object.entries(config.detectors_enabled).map(([detector, enabled]) => (
                    <label key={detector} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors">
                      <span className="text-sm text-surface-600 font-medium">{detector.replace(/_/g, ' ')}</span>
                      <input type="checkbox" checked={enabled} onChange={(e) => setConfig({...config, detectors_enabled: {...config.detectors_enabled, [detector]: e.target.checked}})} 
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" /> Clustering Segments (Personas)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary?.clustering_segments || {}).map(([persona, count]) => (
                <div key={persona} className="p-4 rounded-xl bg-surface-50 border border-surface-100 text-center">
                  <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">{persona.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold text-surface-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <h3 className="font-semibold text-surface-900 mb-4">Thresholds</h3>
            <div className="space-y-4">
              {config && Object.entries(config.score_thresholds).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-surface-500 uppercase">{key.replace(/_/g, ' ')}</span>
                    <span className="text-primary-600">{val}</span>
                  </div>
                  <input type="range" min="0" max="200" value={val} onChange={(e) => setConfig({...config, score_thresholds: {...config.score_thresholds, [key]: parseFloat(e.target.value)}})}
                    className="w-full h-1.5 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-400" /> Real-time Throughput
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-surface-400 text-xs font-bold uppercase">Requests / min</p>
                  <p className="text-2xl font-bold">1,284</p>
                </div>
                <div className="flex gap-1 h-12 items-end">
                  {[4,7,3,9,5,8,4,6,9,3,7,5].map((h, i) => (
                    <div key={i} className="w-1.5 bg-accent-500 rounded-t-sm" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-surface-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-surface-400">Avg Latency</span>
                  <span className="font-mono text-accent-400">42ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-surface-400">Error Rate</span>
                  <span className="font-mono text-green-400">0.02%</span>
                </div>
              </div>
            </div>
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
          </div>
        </div>
      </div>
    </div>
  );
}
