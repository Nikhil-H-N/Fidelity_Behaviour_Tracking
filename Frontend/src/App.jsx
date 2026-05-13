import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AdminDashboardLayout from './components/dashboard/AdminDashboardLayout';
import { useInteractionTracking, useScrollDepth } from './hooks/useTracking';

function GlobalTracker() {
  useInteractionTracking();
  useScrollDepth();
  return null;
}

// Lazy load pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
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
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const Help = lazy(() => import('./pages/Help'));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBehavioral = lazy(() => import('./pages/admin/AdminBehavioral'));
const AdminEventTracking = lazy(() => import('./pages/admin/AdminEventTracking'));
const AdminSessionTimeline = lazy(() => import('./pages/admin/AdminSessionTimeline'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

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
      <AuthProvider>
        <GlobalTracker />
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />

            {/* Dashboard pages (protected + sidebar layout) — regular users */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/mutual-funds" element={<MutualFunds />} />
              <Route path="/sip-plans" element={<SIPPlans />} />
              <Route path="/investment-plans" element={<InvestmentPlans />} />
              <Route path="/goal-planning" element={<GoalPlanning />} />
              <Route path="/retirement-planning" element={<RetirementPlanning />} />
              <Route path="/ai-recommendations" element={<AIRecommendations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<ProfileSettings />} />
            </Route>

            {/* Admin pages (admin-only protected + admin sidebar layout) */}
            <Route element={<AdminProtectedRoute><AdminDashboardLayout /></AdminProtectedRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/behavioral-analytics" element={<AdminBehavioral />} />
              <Route path="/admin/event-tracking" element={<AdminEventTracking />} />
              <Route path="/admin/session-timeline" element={<AdminSessionTimeline />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Redirect for nav links */}
            <Route path="/invest" element={<Landing />} />
            <Route path="/plan" element={<Landing />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
