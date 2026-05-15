import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, ArrowRight, TrendingDown, 
  Users, MousePointer2, FileCheck, 
  Zap, Info, RefreshCw, TimerOff
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LabelList 
} from 'recharts';
import { engineApi } from '../utils/apiBase';

const displayEventType = (event) => (
  event.raw_event_type ||
  event.metadata?.raw_event_type ||
  event.metadata?.rawEventType ||
  event.event_type ||
  'unknown'
);

const isProductPage = (page) => {
  const normalized = String(page || '').replace(/^\/+/, '').replace(/_/g, '-');
  return [
    'investment-plans',
    'mutual-funds',
    'sip-plans',
    'investment-calculator',
    'plan-comparison',
    'insurance-plans',
    'product-details',
  ].some((candidate) => normalized.startsWith(candidate));
};

const buildFunnelFromUsers = (users) => {
  const counts = {
    VISITORS: users.length,
    ENGAGED: 0,
    PRODUCT_INTEREST: 0,
    APPLICATION_STARTED: 0,
    APPLICATION_COMPLETED: 0,
  };
  let discarded = 0;

  users.forEach((user) => {
    const eventTypes = (user.events || []).map(displayEventType);
    const hasCompletion = eventTypes.some((type) => ['form_submit', 'form_complete', 'form_completion', 'checkout_complete', 'investment_intent', 'contact_advisor'].includes(type));
    const hasStarted = hasCompletion || eventTypes.some((type) => ['form_start', 'checkout_start'].includes(type));
    const hasProductInterest = hasStarted || (user.events || []).some((event) => (
      ['product_view', 'comparison', 'calculator_usage', 'download_brochure', 'investment_intent', 'cta_click', 'button_click'].includes(displayEventType(event)) ||
      isProductPage(event.page_id || event.page)
    ));
    const engaged = hasProductInterest ||
      (user.pages_visited || []).length > 1 ||
      (user.total_duration || 0) >= 30 ||
      eventTypes.some((type) => ['button_click', 'cta_click', 'scroll_depth', 'scroll', 'time_spent', 'chatbot_message'].includes(type));

    if (engaged) counts.ENGAGED += 1;
    if (hasProductInterest) counts.PRODUCT_INTEREST += 1;
    if (hasStarted) counts.APPLICATION_STARTED += 1;
    if (hasCompletion) counts.APPLICATION_COMPLETED += 1;
    if (eventTypes.some((type) => ['form_abandon', 'form_abandonment', 'checkout_abandon'].includes(type))) discarded += 1;
  });

  const stageDefs = [
    ['VISITORS', 'Visitors', '#6366f1'],
    ['ENGAGED', 'Engaged Sessions', '#3b82f6'],
    ['PRODUCT_INTEREST', 'Product Interest', '#a855f7'],
    ['APPLICATION_STARTED', 'Application Started', '#f59e0b'],
    ['APPLICATION_COMPLETED', 'Application Completed', '#10b981'],
  ];

  let previous = null;
  const stages = stageDefs.map(([stage, label, color]) => {
    const count = counts[stage];
    const baseline = previous ?? count;
    previous = count;
    return {
      stage,
      label,
      count,
      percentage: users.length ? Number(((count / users.length) * 100).toFixed(1)) : 0,
      dropOff: baseline ? Math.max(0, Number((100 - ((count / baseline) * 100)).toFixed(1))) : 0,
      color,
    };
  });

  const worstDrop = stages.slice(1).sort((a, b) => b.dropOff - a.dropOff)[0];
  return {
    stages,
    summary: {
      total_sessions: users.length,
      completion_rate: users.length ? Number(((counts.APPLICATION_COMPLETED / users.length) * 100).toFixed(1)) : 0,
      discard_rate: counts.APPLICATION_STARTED ? Number(((discarded / counts.APPLICATION_STARTED) * 100).toFixed(1)) : 0,
      discarded,
      insight: worstDrop
        ? `Largest live drop-off is before ${worstDrop.label} at ${worstDrop.dropOff}%.`
        : 'No live sessions have reached the funnel yet.',
    },
  };
};

export default function FunnelAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFunnelData = async () => {
    try {
      const res = await fetch(engineApi('/admin/analytics/conversion-funnel'));
      if (res.ok) {
        const payload = await res.json();
        setData({
          funnel: payload.stages || [],
          summary: payload.summary || {},
        });
      } else {
        throw new Error(`conversion-funnel ${res.status}`);
      }
    } catch (error) {
      try {
        const fallbackRes = await fetch(engineApi('/admin/active-users?event_limit=250'));
        if (!fallbackRes.ok) throw error;
        const users = await fallbackRes.json();
        const payload = buildFunnelFromUsers(users || []);
        setData({
          funnel: payload.stages || [],
          summary: payload.summary || {},
        });
      } catch (fallbackError) {
        console.error('Failed to fetch funnel:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Conversion Funnel</h1>
        <p className="text-surface-400 mt-1">Macro-level analysis of user drop-off across the conversion journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {data?.funnel?.map((item, idx) => {
          return (
            <div key={item.stage} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-xl bg-surface-950 border border-surface-800">
                    {idx === 0 && <Users className="w-5 h-5 text-indigo-400" />}
                    {idx === 1 && <Zap className="w-5 h-5 text-blue-400" />}
                    {idx === 2 && <MousePointer2 className="w-5 h-5 text-pink-400" />}
                    {idx === 3 && <Filter className="w-5 h-5 text-amber-400" />}
                    {idx === 4 && <FileCheck className="w-5 h-5 text-emerald-400" />}
                 </div>
                 {idx > 0 && (
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Drop-off</p>
                     <p className="text-lg font-bold text-red-400 flex items-center gap-1 justify-end">
                       <TrendingDown className="w-4 h-4" /> {item.dropOff || 0}%
                     </p>
                   </div>
                 )}
               </div>
               
               <p className="text-4xl font-black text-white tracking-tighter">{item.count}</p>
               <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">{item.label}</p>
               <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-3">{item.percentage || 0}% of visitors</p>
               
               <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Filter className="w-24 h-24 text-white" />
               </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-[2rem] p-10 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['Completion Rate', `${data?.summary?.completion_rate || 0}%`, 'text-emerald-400'],
            ['Discard Rate', `${data?.summary?.discard_rate || 0}%`, 'text-red-400'],
            ['Discarded Sessions', data?.summary?.discarded || 0, 'text-primary-400'],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-surface-950 border border-surface-800 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{label}</p>
              <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-[2rem] p-10 shadow-xl">
        <h3 className="font-bold text-white mb-10 flex items-center gap-2 text-xl">
          <Filter className="w-6 h-6 text-primary-400" /> Funnel Visualization
        </h3>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.funnel || []} layout="vertical" margin={{ left: 40, right: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="stage" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
              />
              <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={60}>
                {data?.funnel?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
                <LabelList dataKey="count" position="right" fill="#fff" fontSize={14} fontWeight={900} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Info className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-bold text-white mb-2">Intent-Driven Optimization</h4>
          <p className="text-surface-400 text-sm leading-relaxed">
            {data?.summary?.insight || 'The funnel updates from live sessions as users move from visit to engagement, product interest, application start, and completion.'}
          </p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all whitespace-nowrap">
          View Detailed Insights
        </button>
      </div>
    </div>
  );
}
