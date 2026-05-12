/**
 * ============================================================
 * FinovaWealth — Admin Login Page
 * File: Frontend/src/pages/AdminLogin.jsx
 * ============================================================
 * Separate login page for admins — same premium design as the
 * user Login page but with admin-specific branding.
 * ============================================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminLogin } from '../api/adminService';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin({ email: form.email, password: form.password });

      if (res.success) {
        setAuthData(res.data.token, res.data.user);
        toast.success('Welcome, Admin!');
        navigate('/admin/dashboard');
      } else {
        toast.error(res.message || 'Admin login failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Admin login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Admin-branded */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-900 via-surface-800 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-500/10 rounded-full" />
          <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-primary-500/10 rounded-full" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl">FinovaWealth</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/20 border border-primary-400/20 mb-8">
            <Shield className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">Admin Control Panel</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight mb-6">
            Monitor. Analyze.
            <br />
            <span className="text-primary-400">Drive Engagement.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-md">
            Access the admin dashboard to monitor user behavior, track events, analyze sessions, and manage the behavioral re-engagement engine.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {[
            { v: 'Real-time', l: 'User Monitoring' },
            { v: 'Behavioral', l: 'Event Tracking' },
            { v: 'AI-Powered', l: 'Analytics' },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-lg font-bold text-primary-400">{s.v}</p>
              <p className="text-sm text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-surface-900">
              Finova<span className="text-primary-600">Wealth</span>
            </span>
          </div>

          {/* Admin badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-900 text-white text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5" />
            Admin Portal
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-2">Admin Sign In</h2>
          <p className="text-surface-500 mb-8">Enter your admin credentials to access the control panel</p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="email"
                  className="input-field pl-11"
                  placeholder="admin@finovawealth.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 gap-2 mt-2 disabled:opacity-60 inline-flex items-center justify-center px-6 bg-gradient-to-r from-surface-900 to-surface-800 text-white font-semibold rounded-xl shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sign In as Admin
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-200">
            <p className="text-center text-sm text-surface-400">
              Not an admin?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                User Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
