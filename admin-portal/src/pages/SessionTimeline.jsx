import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Activity, Zap, CheckCircle2, 
  AlertCircle, Info, User, Search,
  TrendingUp, BarChart3, Target, MessageSquare
} from 'lucide-react';
import InterventionModal from '../components/InterventionModal';

const API_BASE = 'http://localhost:8000';

export default function SessionTimeline() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/active-users`);
      if (res.ok) {
        const data = await res.json();
        setActiveUsers(data);
        if (data.length > 0 && !selectedUser) {
          // Don't auto-select to avoid jumping
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user-report/${userId}`);
      if (res.ok) {
        setReport(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch user report:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchReport(selectedUser);
      const interval = setInterval(() => fetchReport(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const filteredUsers = activeUsers.filter(u => u.user_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Session Intelligence</h1>
        <p className="text-surface-400 mt-1">Deep behavioral reconstruction and psychological profiling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* User Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Filter sessions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-surface-800 rounded-xl text-sm focus:border-primary-500 outline-none transition-colors text-white"
            />
          </div>
          
          <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-800 bg-surface-900/50">
              <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Active Sessions</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredUsers.map(user => (
                <button 
                  key={user.user_id}
                  onClick={() => setSelectedUser(user.user_id)}
                  className={`w-full p-4 text-left border-b border-surface-800/50 transition-all hover:bg-surface-800/50 flex items-center gap-3 ${selectedUser === user.user_id ? 'bg-primary-600/10 border-l-4 border-l-primary-500' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${selectedUser === user.user_id ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                    {user.user_id.charAt(5).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-surface-200 truncate">{user.user_id}</p>
                    <p className="text-[10px] text-surface-500 font-medium uppercase tracking-tighter">{user.intent_state} · {Math.round(user.total_score)}pt</p>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="p-8 text-center text-xs text-surface-600 italic">No matching sessions</p>
              )}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center bg-surface-900/30 border-2 border-dashed border-surface-800 rounded-3xl p-12 text-center text-surface-600">
              <User className="w-16 h-16 mb-4 opacity-10" />
              <h3 className="text-xl font-bold text-surface-500">No Session Selected</h3>
              <p className="max-w-xs mt-2 italic">Select an active session from the sidebar to perform deep behavioral analysis and narrative reconstruction.</p>
            </div>
          ) : !report ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-6 rounded-2xl bg-surface-950 border border-surface-800">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary-900/20">
                    {selectedUser.charAt(5).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-white">{selectedUser}</h2>
                      <span className="px-3 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {report.summary.persona.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-surface-400 text-sm">
                      Engine Assessment: <span className="font-bold text-primary-400 uppercase tracking-tighter">{report.summary.final_intent.replace(/_/g, ' ')}</span>
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => setIsInterventionModalOpen(true)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-900/20"
                      >
                        <MessageSquare className="w-4 h-4" /> SEND CUSTOM MESSAGE
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-4xl font-black text-white leading-none">{report.summary.overall_score}</span>
                    <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest mt-1">INTENT SCORE</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary-500" /> Behavioral Reconstruction
                      </h3>
                      <div className="p-5 rounded-2xl bg-primary-500/5 border border-primary-500/10 italic text-surface-300 text-sm leading-relaxed relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500/40 rounded-full" />
                        "{report.narrative}"
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
                        <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest mb-1">Active Ratio</p>
                        <p className="text-xl font-bold text-white font-mono">{report.engagement_metrics.active_ratio}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
                        <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest mb-1">Avg Scroll</p>
                        <p className="text-xl font-bold text-white font-mono">{report.engagement_metrics.avg_scroll_depth}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-4">Psychological Indicators</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(report.psychological_flags).map(([flag, active]) => (
                          <div key={flag} className={`flex items-center justify-between p-3 rounded-xl border ${active ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{flag.replace(/_/g, ' ')}</span>
                            {active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-4">ML Predictions</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-surface-500 uppercase">CONV. PROBABILITY</span>
                            <span className="text-primary-400">{Math.round(report.ml_intelligence.conversion_probability * 100)}%</span>
                          </div>
                          <div className="w-full bg-surface-950 h-2 rounded-full overflow-hidden border border-surface-800">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${report.ml_intelligence.conversion_probability * 100}%` }}
                              className="h-full bg-gradient-to-r from-primary-600 to-indigo-500" />
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
                          <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Drop-off Risk</p>
                          <p className={`text-xs font-bold ${report.ml_intelligence.drop_off_prediction === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {report.ml_intelligence.drop_off_prediction} RISK
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-amber-500" /> Engine Interventions
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-amber-200 uppercase tracking-tight">{rec.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {report.recommendations.length === 0 && (
                    <p className="text-sm text-surface-600 italic py-4">No proactive recommendations generated.</p>
                  )}
                </div>
              </div>

              {/* Content Interest */}
              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-indigo-400" /> Page Engagement Depth
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {report.top_pages.map(([page, count]) => (
                    <div key={page} className="p-4 rounded-xl bg-surface-950 border border-surface-800 text-center">
                      <p className="text-2xl font-bold text-white mb-1">{count}</p>
                      <p className="text-[10px] text-surface-500 font-bold truncate uppercase tracking-tighter">{page.split('/').pop() || 'landing'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterventionModal 
        isOpen={isInterventionModalOpen} 
        onClose={() => setIsInterventionModalOpen(false)} 
        userId={selectedUser}
      />
    </div>
  );
}
