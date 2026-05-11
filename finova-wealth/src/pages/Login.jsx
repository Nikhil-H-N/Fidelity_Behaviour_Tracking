import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, TrendingUp, ArrowRight, Globe } from 'lucide-react';
import { useFormTracking, usePageTracking } from '../hooks/useTracking';

export default function Login() {
  usePageTracking('login');
  const { trackFormStart } = useFormTracking('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" /><div className="absolute -bottom-40 -left-20 w-96 h-96 bg-white/5 rounded-full" /></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
            <span className="font-display font-bold text-2xl">FinovaWealth</span>
          </Link>
          <h1 className="font-display text-4xl font-bold leading-tight mb-6">Welcome back to your financial journey</h1>
          <p className="text-lg text-white/70 max-w-md">Track your investments, monitor goals, and get AI-powered recommendations — all in one place.</p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[{ v: '₹2,840 Cr', l: 'AUM' }, { v: '1.25L+', l: 'Investors' }, { v: '26.5%', l: 'Avg Returns' }].map(s => (
            <div key={s.l}><p className="text-2xl font-bold">{s.v}</p><p className="text-sm text-white/60">{s.l}</p></div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <span className="font-display font-bold text-xl text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Sign in to your account</h2>
          <p className="text-surface-500 mb-8">Enter your credentials to access your portfolio</p>

          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-surface-200 rounded-xl font-medium text-surface-700 hover:bg-surface-50 transition-all shadow-sm mb-6">
            <Globe className="w-5 h-5" /> Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6"><div className="flex-1 h-px bg-surface-200" /><span className="text-sm text-surface-400">or</span><div className="flex-1 h-px bg-surface-200" /></div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4" onFocus={trackFormStart}>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="email" className="input-field pl-11" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-surface-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type={showPassword ? 'text' : 'password'} className="input-field pl-11 pr-11" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Link to="/dashboard" className="btn-primary w-full py-3.5 gap-2 mt-2">
              Sign In <ArrowRight className="w-5 h-5" />
            </Link>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account? <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
