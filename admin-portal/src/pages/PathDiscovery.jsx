import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, ArrowRight, Map, Globe, Navigation,
  ChevronRight, TrendingUp, Users, Clock, Activity
} from 'lucide-react';
import { engineApi } from '../utils/apiBase';

const sentimentClass = (sentiment) => {
  if (sentiment === 'High Intent') return 'bg-emerald-500/20 text-emerald-400';
  if (sentiment === 'Friction') return 'bg-red-500/20 text-red-400';
  if (sentiment === 'Hesitant') return 'bg-amber-500/20 text-amber-400';
  return 'bg-primary-500/10 text-primary-400';
};

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

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

const hasConversion = (user) => (user.events || []).some((event) => (
  ['form_submit', 'form_complete', 'form_completion', 'checkout_complete', 'investment_intent', 'contact_advisor']
    .includes(displayEventType(event))
));

const buildPathsFromUsers = (users) => {
  const pathMap = new Map();
  const prefixCounts = new Map();
  const totalSessions = users.length;
  let convertedSessions = 0;

  users.forEach((user) => {
    const flow = user.navigation_flow?.length
      ? user.navigation_flow
      : (user.events || []).filter((event) => ['page_view', 'page_visit', 'return_visit', 'repeated_page_visit'].includes(displayEventType(event)));

    const nodes = [];
    flow.forEach((step) => {
      const page = String(step.page || step.page_id || '').replace(/^\/+/, '').replace(/_/g, '-') || 'landing';
      if (page && nodes[nodes.length - 1] !== page) nodes.push(page);
    });

    if (!nodes.length) return;

    const keyNodes = nodes.slice(0, 6);
    const key = keyNodes.join('>');
    const converted = hasConversion(user);
    if (converted) convertedSessions += 1;

    keyNodes.forEach((_, index) => {
      const prefix = keyNodes.slice(0, index + 1).join('>');
      prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    });

    const current = pathMap.get(key) || {
      nodes: keyNodes,
      users: 0,
      duration: 0,
      score: 0,
      conversions: 0,
      hesitations: 0,
      frustrations: 0,
      repeats: 0,
    };

    current.users += 1;
    current.duration += user.total_duration || 0;
    current.score += user.total_score || 0;
    current.conversions += converted ? 1 : 0;
    current.hesitations += user.intent_state === 'HESITATING' ? 1 : 0;
    current.frustrations += user.intent_state === 'FRUSTRATED' ? 1 : 0;
    current.repeats += user.repeated_page_visits || 0;
    pathMap.set(key, current);
  });

  const avgConversion = totalSessions ? Number(((convertedSessions / totalSessions) * 100).toFixed(1)) : 0;
  const paths = [...pathMap.values()]
    .sort((a, b) => b.users - a.users)
    .slice(0, 12)
    .map((entry, index) => {
      const conversionRate = entry.users ? Number(((entry.conversions / entry.users) * 100).toFixed(1)) : 0;
      const avgScore = entry.users ? Number((entry.score / entry.users).toFixed(1)) : 0;
      const sentiment = conversionRate >= Math.max(50, avgConversion + 10) || avgScore >= 75
        ? 'High Intent'
        : entry.frustrations > 0
          ? 'Friction'
          : entry.hesitations > 0 || entry.repeats > 0
            ? 'Hesitant'
            : 'Positive';

      const edges = entry.nodes.slice(0, -1).map((node, nodeIndex) => {
        const fromPrefix = entry.nodes.slice(0, nodeIndex + 1).join('>');
        const toPrefix = entry.nodes.slice(0, nodeIndex + 2).join('>');
        const fromCount = prefixCounts.get(fromPrefix) || 0;
        const toCount = prefixCounts.get(toPrefix) || 0;
        return {
          from: pageLabel(node),
          to: pageLabel(entry.nodes[nodeIndex + 1]),
          rate: fromCount ? Math.round((toCount / fromCount) * 100) : 0,
          users: toCount,
        };
      });

      return {
        id: `fallback-path-${index + 1}`,
        nodes: entry.nodes.map(pageLabel),
        nodeKeys: entry.nodes,
        frequency: totalSessions ? Number(((entry.users / totalSessions) * 100).toFixed(1)) : 0,
        frequencyLabel: `${totalSessions ? Number(((entry.users / totalSessions) * 100).toFixed(1)) : 0}%`,
        users: entry.users,
        avgDuration: Math.round(entry.duration / entry.users),
        timeSpent: formatDuration(entry.duration / entry.users),
        sentiment,
        conversionRate,
        conversionLift: Number((conversionRate - avgConversion).toFixed(1)),
        avgScore,
        edges,
      };
    });

  return {
    summary: {
      total_sessions: totalSessions,
      unique_paths: pathMap.size,
      converted_sessions: convertedSessions,
      avg_conversion_rate: avgConversion,
    },
    paths,
  };
};

export default function PathDiscovery() {
  const [paths, setPaths] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPaths = async () => {
    try {
      const res = await fetch(engineApi('/admin/analytics/navigation-paths'));
      if (!res.ok) throw new Error(`navigation-paths ${res.status}`);

      const payload = await res.json();
      const nextPaths = payload.paths || [];
      setPaths(nextPaths);
      setSummary(payload.summary || null);
      setActivePath((current) => {
          if (!nextPaths.length) return null;
          return nextPaths.find((path) => path.id === current?.id) || nextPaths[0];
      });
    } catch (error) {
      try {
        const fallbackRes = await fetch(engineApi('/admin/active-users?event_limit=250'));
        if (!fallbackRes.ok) throw error;
        const users = await fallbackRes.json();
        const payload = buildPathsFromUsers(users || []);
        const nextPaths = payload.paths || [];
        setPaths(nextPaths);
        setSummary(payload.summary || null);
        setActivePath((current) => {
          if (!nextPaths.length) return null;
          return nextPaths.find((path) => path.id === current?.id) || nextPaths[0];
        });
      } catch (fallbackError) {
        console.error('Failed to fetch navigation paths:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
    const interval = setInterval(fetchPaths, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Path Discovery</h1>
          <p className="text-surface-400 mt-1">Common user navigation sequences mined from live session telemetry</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          {[
            ['Sessions', summary?.total_sessions || 0],
            ['Unique Paths', summary?.unique_paths || 0],
            ['Avg Conversion', `${summary?.avg_conversion_rate || 0}%`],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2 bg-surface-900 border border-surface-800 rounded-xl">
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{label}</p>
              <p className="text-sm font-black text-white mt-1">{value}</p>
            </div>
          ))}
          <div className="px-4 py-2 bg-surface-900 border border-surface-800 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Top Navigation Paths
          </h3>
          {paths.map((path) => (
            <button
              key={path.id}
              onClick={() => setActivePath(path)}
              className={`w-full p-6 rounded-2xl border text-left transition-all ${activePath?.id === path.id ? 'bg-primary-600/10 border-primary-500 shadow-lg shadow-primary-900/10' : 'bg-surface-900 border-surface-800 hover:border-surface-700'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${sentimentClass(path.sentiment)}`}>
                  {path.sentiment}
                </span>
                <span className="text-sm font-black text-white">{path.frequencyLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-400 text-xs font-bold overflow-hidden whitespace-nowrap overflow-ellipsis">
                {path.nodes.join(' -> ')}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-black text-surface-500 uppercase tracking-tighter">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {path.users} Users</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {path.timeSpent}</span>
              </div>
            </button>
          ))}

          {paths.length === 0 && !loading && (
            <div className="p-8 rounded-2xl border border-dashed border-surface-800 bg-surface-900/30 text-center">
              <Navigation className="w-10 h-10 text-surface-700 mx-auto mb-3" />
              <p className="text-sm text-surface-500 italic">No navigation paths captured yet.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-[2.5rem] p-10 h-full flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-12">
              <h3 className="font-bold text-white text-xl flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-primary-400" /> Path Visualizer
              </h3>
              <div className="flex items-center gap-2 rounded-xl border border-surface-800 bg-surface-950 px-3 py-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                  {activePath ? `${activePath.conversionRate}% Convert` : 'Awaiting Data'}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-x-auto overflow-y-hidden custom-scrollbar">
              {activePath ? (
                <div className="flex items-center gap-6 relative z-10 min-w-max px-4">
                  {activePath.nodes.map((node, idx) => {
                    const edge = activePath.edges?.[idx];

                    return (
                      <div key={`${node}-${idx}`} className="flex items-center gap-6">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-32 h-32 rounded-[2rem] bg-surface-950 border border-surface-800 flex flex-col items-center justify-center p-4 text-center shadow-2xl group hover:border-primary-500 transition-all cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3 text-primary-400 group-hover:scale-110 transition-transform">
                            {idx === 0 && <Globe className="w-5 h-5" />}
                            {idx > 0 && idx < activePath.nodes.length - 1 && <Map className="w-5 h-5" />}
                            {idx === activePath.nodes.length - 1 && <TrendingUp className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{node}</span>
                        </motion.div>
                        {idx < activePath.nodes.length - 1 && (
                          <div className="flex flex-col items-center gap-1">
                            <ArrowRight className="w-6 h-6 text-surface-700" />
                            <span className="text-[8px] font-black text-surface-500 uppercase tracking-tighter">
                              {edge?.rate || 0}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-surface-600">
                  <GitBranch className="w-14 h-14 mx-auto mb-4 opacity-20" />
                  <p className="text-sm italic">Waiting for page-view events.</p>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
              </div>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-surface-950 border border-surface-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Conversion Efficiency</p>
                  <p className="text-xs text-surface-500">
                    {activePath
                      ? `${activePath.conversionLift >= 0 ? '+' : ''}${activePath.conversionLift}% versus the live average. Avg score ${activePath.avgScore}.`
                      : 'Live conversion comparison will appear once sessions arrive.'}
                  </p>
                </div>
              </div>
              <button className="text-xs font-black text-primary-400 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Analyze Node Data <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
