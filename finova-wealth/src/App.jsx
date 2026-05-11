import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from './components/dashboard/DashboardLayout';
<<<<<<< HEAD
=======
import InterventionNotification from './components/common/InterventionNotification';
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)

// Lazy load pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Transactions = lazy(() => import('./pages/Transactions'));
const MutualFunds = lazy(() => import('./pages/MutualFunds'));
const SIPPlans = lazy(() => import('./pages/SIPPlans'));
const InvestmentPlans = lazy(() => import('./pages/InvestmentPlans'));
const GoalPlanning = lazy(() => import('./pages/GoalPlanning'));
const RetirementPlanning = lazy(() => import('./pages/RetirementPlanning'));
<<<<<<< HEAD
const BehavioralAnalytics = lazy(() => import('./pages/BehavioralAnalytics'));
const EventTracking = lazy(() => import('./pages/EventTracking'));
const SessionTimeline = lazy(() => import('./pages/SessionTimeline'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
const Notifications = lazy(() => import('./pages/Notifications'));
=======
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const Help = lazy(() => import('./pages/Help'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
<<<<<<< HEAD
=======
      <InterventionNotification />
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />

          {/* Dashboard pages (with sidebar layout) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/sip-plans" element={<SIPPlans />} />
            <Route path="/investment-plans" element={<InvestmentPlans />} />
            <Route path="/goal-planning" element={<GoalPlanning />} />
            <Route path="/retirement-planning" element={<RetirementPlanning />} />
<<<<<<< HEAD
            <Route path="/behavioral-analytics" element={<BehavioralAnalytics />} />
            <Route path="/event-tracking" element={<EventTracking />} />
            <Route path="/session-timeline" element={<SessionTimeline />} />
            <Route path="/admin-analytics" element={<AdminAnalytics />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
            <Route path="/notifications" element={<Notifications />} />
=======
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
>>>>>>> d2fc22b (Updated backend engine and finova-wealth)
            <Route path="/profile" element={<ProfileSettings />} />
          </Route>

          {/* Redirect for nav links */}
          <Route path="/invest" element={<Landing />} />
          <Route path="/plan" element={<Landing />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
