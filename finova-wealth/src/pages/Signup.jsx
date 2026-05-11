import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, TrendingUp, ArrowRight, Globe, Check, Phone } from 'lucide-react';
import { usePageTracking, useFormTracking } from '../hooks/useTracking';

function PasswordStrength({ password }) {
  const getStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = getStrength();
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-accent-500'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">{[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? colors[strength-1] : 'bg-surface-200'}`} />)}</div>
      <p className="text-xs text-surface-500">{labels[strength-1] || 'Too weak'}</p>
    </div>
  );
}

export default function Signup() {
  usePageTracking('signup');
  const { trackFormStart } = useFormTracking('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-600 via-accent-500 to-primary-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" /><div className="absolute -bottom-40 -left-20 w-96 h-96 bg-white/5 rounded-full" /></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
            <span className="font-display font-bold text-2xl">FinovaWealth</span>
          </Link>
          <h1 className="font-display text-4xl font-bold leading-tight mb-6">Begin your wealth creation journey</h1>
          <p className="text-lg text-white/70 max-w-md">Join 1.25 lakh+ investors. Set up in under 5 minutes with zero paperwork.</p>
        </div>
        <div className="relative z-10 space-y-3">
          {['100% digital onboarding', 'SEBI registered platform', 'No hidden charges'].map(t => (
            <div key={t} className="flex items-center gap-3"><Check className="w-5 h-5 text-white/80" /><span className="text-white/80">{t}</span></div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <span className="font-display font-bold text-xl text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-500'}`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-surface-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Create your account</h2>
              <p className="text-surface-500 mb-8">Start investing in 5 minutes</p>

              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-surface-200 rounded-xl font-medium text-surface-700 hover:bg-surface-50 transition-all shadow-sm mb-6">
                <Globe className="w-5 h-5" /> Continue with Google
              </button>
              <div className="flex items-center gap-4 mb-6"><div className="flex-1 h-px bg-surface-200" /><span className="text-sm text-surface-400">or</span><div className="flex-1 h-px bg-surface-200" /></div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4" onFocus={trackFormStart}>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label>
                  <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type="text" className="input-field pl-11" placeholder="Your full name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                  <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type="email" className="input-field pl-11" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
                  <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type="tel" className="input-field pl-11" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                  <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input-field pl-11 pr-11" placeholder="Create password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 gap-2 mt-2">Continue <ArrowRight className="w-5 h-5" /></button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Verify your phone</h2>
              <p className="text-surface-500 mb-8">We sent a 6-digit OTP to {form.phone || '+91 XXXXX XXXXX'}</p>
              <div className="flex gap-3 mb-6">
                {otp.map((d, i) => (
                  <input key={i} type="text" maxLength={1} className="w-12 h-14 text-center text-xl font-bold border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    value={d} onChange={(e) => {
                      const newOtp = [...otp]; newOtp[i] = e.target.value; setOtp(newOtp);
                      if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                    }} />
                ))}
              </div>
              <Link to="/onboarding" className="btn-primary w-full py-3.5 gap-2">Verify & Continue <ArrowRight className="w-5 h-5" /></Link>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-surface-500 mt-4 hover:text-primary-600">← Back to registration</button>
              <p className="text-center text-sm text-surface-400 mt-4">Didn't receive? <button className="text-primary-600 font-semibold">Resend OTP</button></p>
            </>
          )}

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
