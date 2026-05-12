/**
 * ============================================================
 * FinovaWealth — Admin Dashboard Layout
 * File: Frontend/src/components/dashboard/AdminDashboardLayout.jsx
 * ============================================================
 * Sidebar layout for admin pages with admin-specific navigation
 * items: Dashboard overview, Users, Behavioral Analytics,
 * Event Tracking, Session Timeline, and Admin Analytics.
 * ============================================================
 */


import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Activity, Radio, Clock, BarChart3,
  TrendingUp, Menu, X, Search, Bell, Shield, LogOut, HelpCircle,
  Settings,
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  {
    section: 'Admin',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'All Users', icon: Users, path: '/admin/users' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { name: 'Behavioral', icon: Activity, path: '/admin/behavioral-analytics' },
      { name: 'Event Tracking', icon: Radio, path: '/admin/event-tracking' },
      { name: 'Session Timeline', icon: Clock, path: '/admin/session-timeline' },
      { name: 'Admin Analytics', icon: BarChart3, path: '/admin/analytics' },
    ],
  },
  {
    section: 'System',
    items: [
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
  },
];

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFirstName(name) {
  if (!name) return 'Admin';
  return name.trim().split(/\s+/)[0];
}

export default function AdminDashboardLayout() {
  const { sidebarOpen, toggleSidebar } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = getInitials(user?.fullName);
  const firstName = getFirstName(user?.fullName);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + Admin Badge */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-surface-900 to-surface-700 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-surface-900">
              Finova<span className="text-primary-600">Admin</span>
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {adminNavItems.map((group) => (
          <div key={group.section}>
            {sidebarOpen && (
              <p className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 px-3 mb-2">
                {group.section}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link-active' : 'sidebar-link'
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      {sidebarOpen && (
        <div className="border-t border-surface-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-surface-800 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-surface-400 truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-surface-100 fixed inset-y-0 left-0 z-30 transition-all duration-300`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden shadow-elevated"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        {/* TopBar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-surface-100 h-16 flex items-center px-4 sm:px-6 gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(true);
              else toggleSidebar();
            }}
            className="p-2 rounded-lg hover:bg-surface-50 text-surface-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-900 text-white text-xs font-semibold">
              <Shield className="w-3 h-3" />
              Admin Mode
            </span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search users, events…"
                className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-surface-50">
              <Bell className="w-5 h-5 text-surface-500" />
            </button>
            <NavLink
              to="/admin/settings"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-800 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                {initials}
              </div>
              <span className="text-sm font-medium text-surface-700 hidden sm:block">
                {firstName}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
