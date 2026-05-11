import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth state
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),

  // Sidebar state
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Notifications
  unreadCount: 3,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Tracking
  events: [],
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 100) })),

  // Theme
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));

export default useStore;
