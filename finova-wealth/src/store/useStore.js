import { create } from 'zustand';

<<<<<<< HEAD
const useStore = create((set) => ({
  // Auth state
  isAuthenticated: false,
  user: null,
=======
// Generate a persistent user ID if not exists
const getUserId = () => {
  let id = localStorage.getItem('fidelity_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fidelity_user_id', id);
  }
  return id;
};

const useStore = create((set, get) => ({
  // Auth state
  isAuthenticated: false,
  user: null,
  userId: getUserId(),
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
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
<<<<<<< HEAD
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 100) })),
=======
  engineResponse: null,
  activeInterventions: [],
  addEvent: async (eventData) => {
    const { userId } = get();
    const event = {
      user_id: userId,
      event_type: eventData.type,
      page_id: eventData.page || window.location.pathname,
      element_id: eventData.element || eventData.form || null,
      timestamp: Date.now() / 1000,
      metadata: eventData.metadata || {},
      scroll_depth: parseFloat(eventData.depth) || 0,
    };

    // Update local state
    set((s) => ({ events: [event, ...s.events].slice(0, 100) }));

    // Sync to backend engine
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (response.ok) {
        const data = await response.json();
        set({ engineResponse: data });
        
        // Handle interventions if any
        if (data.interventions && data.interventions.length > 0) {
          set((s) => ({ activeInterventions: [...s.activeInterventions, ...data.interventions] }));
        }
      }
    } catch (error) {
      console.error('Failed to sync event to engine:', error);
    }
  },
  clearIntervention: (index) => set((s) => ({
    activeInterventions: s.activeInterventions.filter((_, i) => i !== index)
  })),
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)

  // Theme
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));

export default useStore;
