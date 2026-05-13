import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Zap, ShieldAlert, Trash2, Cpu, 
  Settings, Radio, Clock, BarChart3, LogOut, Menu, X, Bell, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/' },
    { name: 'Behavioral Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'System Alerts', icon: Bell, path: '/alerts' },
    { name: 'Live Stream', icon: Radio, path: '/live' },
    { name: 'Event Tracking', icon: Zap, path: '/events' },
    { name: 'Session Timeline', icon: Clock, path: '/timeline' },
    { name: 'Notification Engine', icon: Send, path: '/notifications' },
    { name: 'ML Intelligence', icon: Cpu, path: '/ml' },
  ];

  const handleReset = async () => {
    if (confirm('Wipe engine state?')) {
      await fetch('http://localhost:8000/admin/reset-all-sessions', { method: 'POST' });
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex text-surface-50 font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-surface-800 bg-surface-900 flex flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-surface-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold tracking-tight text-lg">MASTER CONSOLE</span>}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} 
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group
                ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}
              `}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-800 space-y-2">
          <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl font-medium transition-colors group">
            <Trash2 className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Flush Engine</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-surface-400 hover:bg-surface-800 rounded-xl font-medium transition-colors group">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-surface-800 bg-surface-900/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-surface-800 rounded-lg transition-colors lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 tracking-wider">ENGINE LIVE</span>
            </div>
            <span className="text-surface-500 text-sm hidden sm:block">v1.0.4-enterprise</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-surface-200">Admin User</span>
              <span className="text-[10px] text-surface-500 font-mono">ID: FID-8829-X</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center font-bold shadow-lg">AD</div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-surface-950">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
