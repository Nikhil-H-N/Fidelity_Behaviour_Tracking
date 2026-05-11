import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Bell, Lock, Save, Camera } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

export default function ProfileSettings() {
  usePageTracking('profile-settings');
  const [tab, setTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>

      <div className="flex gap-2 border-b border-surface-200 pb-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}><t.icon className="w-4 h-4" /> {t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl">PS</div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-card flex items-center justify-center border border-surface-200 hover:bg-surface-50">
                <Camera className="w-4 h-4 text-surface-500" />
              </button>
            </div>
            <div><p className="text-lg font-bold text-surface-900">Prateek Sharma</p><p className="text-sm text-surface-500">Premium Investor · Since Jan 2023</p></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label><input type="text" className="input-field" defaultValue="Prateek Sharma" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label><input type="email" className="input-field" defaultValue="prateek@email.com" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label><input type="tel" className="input-field" defaultValue="+91 98765 43210" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">PAN</label><input type="text" className="input-field" defaultValue="ABCDE1234F" disabled /></div>
          </div>
          <button className="btn-primary mt-6 gap-2"><Save className="w-4 h-4" /> Save Changes</button>
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-6">
          <div>
            <h3 className="font-semibold text-surface-900 mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Current Password</label><input type="password" className="input-field" /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label><input type="password" className="input-field" /></div>
              <button className="btn-primary gap-2"><Lock className="w-4 h-4" /> Update Password</button>
            </div>
          </div>
          <div className="pt-4 border-t border-surface-100">
            <h3 className="font-semibold text-surface-900 mb-3">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div><p className="text-sm font-medium text-surface-900">2FA via SMS</p><p className="text-xs text-surface-500">Receive OTP on your phone</p></div>
              <div className="w-12 h-6 bg-accent-500 rounded-full p-0.5 cursor-pointer"><div className="w-5 h-5 bg-white rounded-full shadow-sm ml-auto" /></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
          {['SIP Reminders', 'Market Alerts', 'AI Recommendations', 'Transaction Updates', 'Goal Milestones', 'Weekly Reports'].map((n, i) => (
            <div key={n} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div><p className="text-sm font-medium text-surface-900">{n}</p></div>
              <div className={`w-12 h-6 rounded-full p-0.5 cursor-pointer ${i < 4 ? 'bg-accent-500' : 'bg-surface-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${i < 4 ? 'ml-auto' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
