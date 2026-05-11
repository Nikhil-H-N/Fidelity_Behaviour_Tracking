<<<<<<< HEAD
import { motion } from 'framer-motion';
import { Clock, Eye, MousePointerClick, Activity, FormInput, Navigation, CheckCircle2 } from 'lucide-react';
import { sessionTimeline } from '../data/mockData';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = {
  session: Clock, scroll: Activity, click: MousePointerClick,
  navigation: Navigation, form: FormInput, conversion: CheckCircle2,
};
const colorMap = {
  session: 'bg-surface-100 text-surface-600', scroll: 'bg-purple-50 text-purple-600',
  click: 'bg-blue-50 text-blue-600', navigation: 'bg-primary-50 text-primary-600',
  form: 'bg-amber-50 text-amber-600', conversion: 'bg-accent-50 text-accent-600',
=======
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, MousePointerClick, Activity, FormInput, Navigation, CheckCircle2, User, Info, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = {
  session: Clock, 
  scroll: Activity, 
  click: MousePointerClick,
  cta_click: MousePointerClick,
  page_visit: Eye,
  navigation: Navigation, 
  form: FormInput, 
  form_start: FormInput,
  conversion: CheckCircle2,
  form_complete: CheckCircle2,
};

const colorMap = {
  session: 'bg-surface-100 text-surface-600', 
  scroll: 'bg-purple-50 text-purple-600',
  click: 'bg-blue-50 text-blue-600', 
  cta_click: 'bg-blue-50 text-blue-600',
  page_visit: 'bg-primary-50 text-primary-600',
  navigation: 'bg-primary-50 text-primary-600',
  form: 'bg-amber-50 text-amber-600', 
  form_start: 'bg-amber-50 text-amber-600',
  conversion: 'bg-accent-50 text-accent-600',
  form_complete: 'bg-accent-50 text-accent-600',
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
};

export default function SessionTimeline() {
  usePageTracking('session-timeline');
<<<<<<< HEAD
=======
  const userId = useStore(s => s.userId);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res = await fetch(`http://localhost:8000/admin/user-report/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch user report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) return <div className="p-10 text-center text-surface-500">Loading your behavioral report...</div>;
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)

  return (
    <div className="space-y-6">
      <div>
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-surface-900">Session Timeline</h1>
        <p className="text-surface-500 text-sm mt-1">Detailed user session replay</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-surface-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">U</div>
          <div>
            <p className="font-semibold text-surface-900">user_4821 · Session #1284</p>
            <p className="text-sm text-surface-500">Duration: 3m 30s · 11 events · Mobile · Mumbai</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200" />
          <div className="space-y-1">
            {sessionTimeline.map((event, i) => {
              const Icon = iconMap[event.type] || Eye;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex items-start gap-4 pl-2 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${colorMap[event.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-surface-900">{event.action}</p>
                      <span className="text-xs text-surface-400 font-mono">{event.time}</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{event.page}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
=======
        <h1 className="text-2xl font-bold text-surface-900">Your Session Intelligence</h1>
        <p className="text-surface-500 text-sm mt-1">Real-time behavioral analysis of your journey</p>
      </div>

      {!report ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No active session found in engine</p>
            <p className="text-xs text-amber-700 mt-1">Try navigating to other pages first to generate behavioral data.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Report Card */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-surface-50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                    {userId.charAt(5).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-surface-900">{userId}</p>
                    <p className="text-sm text-surface-500">
                      Score: <span className="font-bold text-primary-600">{report.summary.overall_score}</span> · 
                      State: <span className="font-bold text-accent-600">{report.summary.final_intent}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {report.summary.persona}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary-500" /> Behavioral Narrative
                  </h3>
                  <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100 italic text-surface-700 text-sm leading-relaxed">
                    "{report.narrative}"
                  </div>
                </div>

                <div className="relative">
                  <h3 className="text-sm font-bold text-surface-900 mb-4">Activity Timeline</h3>
                  <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-surface-200" />
                  <div className="space-y-1">
                    {/* Note: User report doesn't return full events in this endpoint, 
                        but we can see top pages or add events to the report endpoint if needed.
                        For now, let's show the summary metrics. */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                        <p className="text-xs text-surface-500 mb-1">Active Ratio</p>
                        <p className="text-xl font-bold text-surface-900">{report.engagement_metrics.active_ratio}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                        <p className="text-xs text-surface-500 mb-1">Avg Scroll</p>
                        <p className="text-xl font-bold text-surface-900">{report.engagement_metrics.avg_scroll_depth}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
                <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Smart Recommendations
                </h3>
                <div className="grid gap-3">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900 uppercase tracking-tight">{rec.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {report.recommendations.length === 0 && (
                    <p className="text-sm text-surface-400">No recommendations generated yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Psychological Profile */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
                <h3 className="font-semibold text-surface-900 mb-4">Psychological Flags</h3>
                <div className="space-y-3">
                  {Object.entries(report.psychological_flags).map(([flag, active]) => (
                    <div key={flag} className={`flex items-center justify-between p-3 rounded-xl ${active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      <span className="text-xs font-bold uppercase">{flag.replace(/_/g, ' ')}</span>
                      {active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ML Intelligence */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
                <h3 className="font-semibold text-surface-900 mb-4">ML Intelligence</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-surface-500 uppercase">Conv. Probability</span>
                      <span className="text-primary-600">{Math.round(report.ml_intelligence.conversion_probability * 100)}%</span>
                    </div>
                    <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${report.ml_intelligence.conversion_probability * 100}%` }}
                        className="h-full bg-primary-500" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <p className="text-[10px] text-surface-400 font-bold uppercase mb-1">Drop-off Prediction</p>
                    <p className={`text-sm font-bold ${report.ml_intelligence.drop_off_prediction === 'HIGH' ? 'text-red-600' : 'text-green-600'}`}>
                      {report.ml_intelligence.drop_off_prediction} RISK
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Pages */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
                <h3 className="font-semibold text-surface-900 mb-4">Top Pages</h3>
                <div className="space-y-2">
                  {report.top_pages.map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between text-sm">
                      <span className="text-surface-600 truncate mr-2">{page}</span>
                      <span className="font-bold text-surface-900">{count}v</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
    </div>
  );
}
