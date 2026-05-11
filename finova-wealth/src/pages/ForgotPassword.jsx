import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, TrendingUp, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

export default function ForgotPassword() {
  usePageTracking('forgot-password');
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow"><TrendingUp className="w-5 h-5 text-white" /></div>
          <span className="font-display font-bold text-xl text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>
        </Link>

        <div className="bg-white rounded-2xl shadow-card p-8 border border-surface-100">
          {!sent ? (
            <>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Reset your password</h2>
              <p className="text-surface-500 mb-6">Enter your email and we'll send you a reset link</p>
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email address</label>
                  <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type="email" className="input-field pl-11" placeholder="you@example.com" /></div>
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 gap-2">Send Reset Link <ArrowRight className="w-5 h-5" /></button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent-600" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Check your email</h2>
              <p className="text-surface-500 mb-6">We've sent a password reset link to your email address.</p>
              <button onClick={() => setSent(false)} className="btn-secondary w-full py-3">Resend Email</button>
            </div>
          )}
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-primary-600 mt-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
