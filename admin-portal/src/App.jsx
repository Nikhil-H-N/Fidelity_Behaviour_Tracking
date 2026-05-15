import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Overview from './pages/Overview';
import BehavioralAnalytics from './pages/BehavioralAnalytics';
import Alerts from './pages/Alerts';
import LiveStream from './pages/LiveStream';
import EventTracking from './pages/EventTracking';
import SessionTimeline from './pages/SessionTimeline';
import MLIntelligence from './pages/MLIntelligence';
import NotificationEngine from './pages/NotificationEngine';
import Heatmap from './pages/Heatmap';
import FunnelAnalytics from './pages/FunnelAnalytics';
import PathDiscovery from './pages/PathDiscovery';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/analytics" element={<BehavioralAnalytics />} />
          <Route path="/funnel" element={<FunnelAnalytics />} />
          <Route path="/path-discovery" element={<PathDiscovery />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/live" element={<LiveStream />} />
          <Route path="/events" element={<EventTracking />} />
          <Route path="/timeline" element={<SessionTimeline />} />
          <Route path="/notifications" element={<NotificationEngine />} />
          <Route path="/ml" element={<MLIntelligence />} />
          <Route path="/heatmap" element={<Heatmap />} />
        </Route>
      </Routes>
    </Router>
  );
}
