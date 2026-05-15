import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  RefreshCw, 
  Layers, 
  Map as MapIcon,
  Filter,
  Eye,
  Users
} from 'lucide-react';
import { engineApi } from '../utils/apiBase';

const CLICK_EVENT_TYPES = new Set(['button_click', 'click', 'cta_click', 'rapid_click', 'rage_click']);

// We now use an iframe to render the actual live site with adminPreview=true

const NATIVE_WIDTH = 1440;
const NATIVE_HEIGHT = 900;

const getHeatmapPoint = (click, iframeHeight) => {
  const sourceWidth = Number(click.pageWidth || click.screenWidth || NATIVE_WIDTH);
  const widthScale = sourceWidth > 0 ? NATIVE_WIDTH / sourceWidth : 1;
  const sourceX = Number(click.pageX ?? click.x ?? 0);
  const sourceY = Number(click.pageY ?? click.y ?? 0);

  return {
    x: Math.max(0, Math.min(NATIVE_WIDTH, sourceX * widthScale)),
    y: Math.max(0, Math.min(iframeHeight, sourceY * widthScale)),
  };
};

const HeatmapPreview = ({ selectedPage, clickEvents, loading, isExpanded = false, previewUser = 'Admin Preview' }) => {
  const hasClicks = clickEvents.length > 0;
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  const [iframeHeight, setIframeHeight] = React.useState(NATIVE_HEIGHT);

  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'adminPreviewHeight' && e.data.height) {
        setIframeHeight(Math.max(NATIVE_HEIGHT, e.data.height));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(isExpanded ? Math.min(containerWidth / NATIVE_WIDTH, 1) : containerWidth / NATIVE_WIDTH);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isExpanded]);

  const scaledHeight = NATIVE_HEIGHT * scale;

  return (
    <div ref={containerRef} className="relative w-full bg-white border border-gray-300 rounded-3xl shadow-2xl overflow-hidden">
      {/* Scrollable viewport — both layout and dots scroll together */}
      <div
        className="overflow-auto custom-scrollbar"
        style={{ maxHeight: isExpanded ? '80vh' : `${Math.max(480, scaledHeight)}px` }}
      >
        {/* This wrapper constrains the layout box to scaled dimensions */}
        <div style={{ width: `${NATIVE_WIDTH * scale}px`, height: `${iframeHeight * scale}px`, overflow: 'hidden' }}>
          {/* Scaled inner: native-resolution content scaled via CSS transform */}
          <div
            style={{
              width: `${NATIVE_WIDTH}px`,
              minHeight: `${iframeHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            className="relative bg-slate-50"
          >
            {/* Live website preview via iframe */}
            {selectedPage !== 'all' ? (
              <iframe
                src={`${window.location.protocol}//${window.location.hostname}:5173/${selectedPage.replace(/_/g, '-')}?adminPreview=true&previewName=${encodeURIComponent(previewUser)}`}
                style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', pointerEvents: 'none' }}
                title={`Live Preview of ${selectedPage}`}
              />
            ) : (
              <div className="w-full flex items-center justify-center text-slate-400 p-8" style={{ minHeight: `${NATIVE_HEIGHT}px` }}>
                Select a page to render its layout and heatmap overlay.
              </div>
            )}

            {/* Heatmap dots — same parent as layout, so they scroll together */}
            {clickEvents.map((click, idx) => {
              const point = getHeatmapPoint(click, iframeHeight);

              return (
                <motion.div
                  key={`glow-${click.timestamp}-${idx}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.75 }}
                  className="absolute rounded-full"
                  style={{
                    width: '40px',
                    height: '40px',
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0) 70%)',
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                  title={`${click.element || 'Unknown'} @ ${click.page}`}
                />
              );
            })}

            {hasClicks && clickEvents.map((click, idx) => {
              const point = getHeatmapPoint(click, iframeHeight);

              return (
                <div
                  key={`dot-${idx}`}
                  className="absolute bg-red-600 rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.9,
                    pointerEvents: 'none',
                    zIndex: 11,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlays — these stay fixed within the visible viewport */}
      {!hasClicks && selectedPage !== 'all' && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white/70 z-20 p-6">
          <MousePointer2 className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-xl font-semibold">No clicks recorded on this page yet</p>
          <p className="text-sm mt-2 text-center">Choose a page and refresh to view the heatmap over the rendered layout.</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 bg-white/80 z-30 p-6">
          <RefreshCw className="w-12 h-12 mb-4 animate-spin opacity-80" />
          <p className="text-lg font-bold uppercase tracking-widest">Updating preview...</p>
        </div>
      )}

      {/* Legend — sticky bottom-left */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-gray-200 p-3 rounded-2xl flex flex-col gap-2 shadow-lg z-20">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
          <span>Intensity</span>
          <span className="text-slate-400">{selectedPage === 'all' ? 'All pages' : selectedPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/30 border border-red-400"></div>
          <span className="text-[10px] text-slate-600">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600/60 border border-red-600"></div>
          <span className="text-[10px] text-slate-600">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-900/90 border border-red-900"></div>
          <span className="text-[10px] text-slate-600">High</span>
        </div>
      </div>
    </div>
  );
};

export default function Heatmap() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedPage, setSelectedPage] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(engineApi('/admin/active-users?event_limit=500'));
      if (res.ok) {
        setActiveUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const users = useMemo(() => {
    const uniqueNames = new Set();
    activeUsers.forEach(u => {
      if (u.user_id) uniqueNames.add(String(u.metadata?.email || u.metadata?.name || u.user_id));
    });
    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b));
  }, [activeUsers]);

  const filteredUsers = useMemo(() => {
    if (selectedUser === 'all') return activeUsers;
    return activeUsers.filter(u => String(u.metadata?.email || u.metadata?.name || u.user_id) === selectedUser);
  }, [activeUsers, selectedUser]);

  const pages = useMemo(() => {
    const allPages = new Set();
    filteredUsers.forEach(u => {
      u.events?.forEach(e => {
        if (e.page_id) allPages.add(e.page_id);
      });
    });
    return Array.from(allPages).sort();
  }, [filteredUsers]);

  const pageTotals = useMemo(() => {
    const totals = {};
    filteredUsers.forEach(u => {
      u.events?.forEach(e => {
        const eventType = e.event_type || e.eventType || e.type;
        if (!CLICK_EVENT_TYPES.has(eventType)) return;
        const pageId = e.page_id || 'unknown';
        totals[pageId] = (totals[pageId] || 0) + 1;
      });
    });
    return totals;
  }, [filteredUsers]);

  const clickEvents = useMemo(() => {
    const clicks = [];
    filteredUsers.forEach(u => {
      u.events?.forEach(e => {
        const eventType = e.event_type || e.eventType || e.type;
        if (CLICK_EVENT_TYPES.has(eventType)) {
          const metadata = e.metadata || {};
          const x = e.x ?? metadata.x ?? metadata.clientX;
          const y = e.y ?? metadata.y ?? metadata.clientY;
          const pageX = metadata.pageX ?? metadata.x ?? e.x;
          const pageY = metadata.pageY ?? metadata.y ?? e.y;

          if (selectedPage === 'all' || e.page_id === selectedPage) {
            if (x !== undefined && y !== undefined) {
              clicks.push({
                x,
                y,
                pageX,
                pageY,
                screenWidth: metadata.screenWidth || 1440,
                screenHeight: metadata.screenHeight || 900,
                pageWidth: metadata.pageWidth || metadata.documentWidth || metadata.screenWidth || 1440,
                pageHeight: metadata.pageHeight || metadata.documentHeight || metadata.screenHeight || 900,
                page: e.page_id,
                element: e.element_id,
                userId: u.user_id,
                timestamp: e.timestamp
              });
            }
          }
        }
      });
    });
    return clicks;
  }, [filteredUsers, selectedPage]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Click Heatmap</h1>
          <p className="text-surface-400 mt-1">Visualizing user interaction density across platform pages</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 bg-surface-900 border border-surface-800 rounded-xl text-surface-400 hover:text-white transition-colors"
            title="Refresh heatmap"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setExpanded(true)}
            className="p-2 bg-surface-900 border border-surface-800 rounded-xl text-surface-400 hover:text-white transition-colors"
            title="Expand heatmap preview"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-400" /> Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2 block">Target User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                >
                  <option value="all">All Users ({users.length})</option>
                  {users.map(name => (
                    <option key={name} value={name}>{name.length > 35 ? name.slice(0, 20) + '…' + name.slice(-10) : name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2 block">Target Page</label>
                <select 
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                >
                  <option value="all">All Pages</option>
                  {pages.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" /> Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Total Clicks</span>
                <span className="text-sm font-bold text-white font-mono">{clickEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Unique Users</span>
                <span className="text-sm font-bold text-white font-mono">
                  {new Set(clickEvents.map(c => c.userId)).size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Density</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {clickEvents.length > 0 ? (clickEvents.length / (pages.length || 1)).toFixed(1) : 0}
                </span>
              </div>
              <div className="rounded-2xl bg-surface-950 border border-surface-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-surface-500">Heatmap Target</span>
                  <span className="text-xs text-surface-400">Showing {selectedPage === 'all' ? 'all pages' : selectedPage}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pages.slice(0, 6).map((page) => (
                    <div key={page} className="rounded-xl bg-surface-900 border border-surface-800 p-2">
                      <span className="block text-surface-300 truncate">{page}</span>
                      <span className="font-bold text-white">{pageTotals[page] || 0} clicks</span>
                    </div>
                  ))}
                  {pages.length > 6 && (
                    <div className="col-span-2 rounded-xl bg-surface-900 border border-surface-800 p-2 text-surface-400 text-[10px]">
                      +{pages.length - 6} more pages
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Area */}
        <div className="lg:col-span-3">
          <HeatmapPreview
            selectedPage={selectedPage}
            clickEvents={clickEvents}
            loading={loading}
            previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser}
          />
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-6 overflow-auto">
          <div className="relative mx-auto max-w-[1500px] bg-surface-950 rounded-3xl p-6 shadow-2xl border border-surface-800">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Expanded Heatmap Preview</h2>
                <p className="text-sm text-surface-400">Full-size view — scroll to explore all click positions accurately.</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-2 rounded-full border border-surface-700 bg-surface-900 px-4 py-2 text-sm text-surface-200 hover:bg-surface-800 transition"
              >
                Close
              </button>
            </div>
            <HeatmapPreview
              selectedPage={selectedPage}
              clickEvents={clickEvents}
              loading={loading}
              isExpanded={true}
              previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}
