import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const TEMPLATES = [
  {
    id: 'sip_reconsider',
    label: 'SIP Nudge',
    title: 'Still thinking about SIPs?',
    message: 'Still thinking about SIPs? I can help you compare options and pick a monthly amount that feels comfortable.',
  },
  {
    id: 'retirement_setup',
    label: 'Retirement Setup',
    title: 'Complete your retirement investment setup',
    message: 'Complete your retirement investment setup. You are only a few steps away from seeing a long-term projection.',
  },
  {
    id: 'form_help',
    label: 'Form Recovery',
    title: 'Need help finishing this?',
    message: 'Need help finishing this? Your progress is safe, and I can guide you through the remaining details.',
  },
  {
    id: 'advisor_help',
    label: 'Advisor Help',
    title: 'Want a quick recommendation?',
    message: 'Want a quick recommendation? Based on your browsing, a balanced SIP plan may be a good place to start.',
  },
];

const userLabel = (user) => {
  if (!user) return 'Select user';
  const email = user.metadata?.email;
  return email ? `${user.user_id} / ${email}` : user.user_id;
};

const formatLastActive = (timestamp) => {
  if (!timestamp) return 'unknown';
  const seconds = Math.max(0, Math.round(Date.now() / 1000 - timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

export default function NotificationEngine() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(TEMPLATES[0].title);
  const [type, setType] = useState('INFO');
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [scheduleAt, setScheduleAt] = useState('');
  const [channels, setChannels] = useState({ popup: true, email: false, push: false });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const selectedUser = useMemo(
    () => activeUsers.find((user) => user.user_id === selectedUserId),
    [activeUsers, selectedUserId]
  );

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/active-users`);
      if (response.ok) {
        const users = await response.json();
        setActiveUsers(users);
        setSelectedUserId((current) => current || users[0]?.user_id || '');
      }
    } catch (error) {
      console.error('Failed to fetch active users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const email = selectedUser?.metadata?.email || '';
    setEmailTo(email);
  }, [selectedUserId, selectedUser]);

  const applyTemplate = (templateId) => {
    const next = TEMPLATES.find((item) => item.id === templateId);
    if (!next) return;
    setTemplate(templateId);
    setTitle(next.title);
    setEmailSubject(next.title);
    setMessage(next.message);
  };

  const applyRecommendation = () => {
    const state = selectedUser?.intent_state || 'EXPLORING';
    const score = Math.round(selectedUser?.total_score || 0);
    const page = selectedUser?.pages_visited?.slice(-1)?.[0] || 'the current page';

    setTemplate('recommendation_based');
    setTitle('Personalized investment help');
    setEmailSubject('Personalized investment help from FinovaWealth');
    setMessage(
      `Hi, we noticed you are currently on ${page} with an intent score of ${score}. Based on your ${state.toLowerCase().replace(/_/g, ' ')} behavior, we can help you choose the next best investment step.`
    );
  };

  const selectedChannels = Object.entries(channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !message.trim() || selectedChannels.length === 0) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/admin/notification/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          title,
          message,
          type,
          channels: selectedChannels,
          email_to: channels.email ? emailTo : null,
          email_subject: emailSubject,
          template,
          schedule_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
          reason: 'Admin Notification Engine',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Notification dispatch failed');
      setResult(data);
    } catch (error) {
      setResult({ status: 'failed', message: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notification Engine</h1>
          <p className="text-surface-400 mt-1">Send targeted popup, push, and email messages to one selected user</p>
        </div>
        <button
          onClick={fetchUsers}
          className="w-fit flex items-center gap-2 px-4 py-2 bg-surface-900 hover:bg-surface-800 rounded-xl text-sm font-bold border border-surface-800 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh users
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {[
          { label: 'Live Users', value: activeUsers.length, icon: Radio, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Popup Ready', value: channels.popup ? 'On' : 'Off', icon: MessageSquare, color: 'text-primary-400 bg-primary-400/10' },
          { label: 'Email Channel', value: channels.email ? 'On' : 'Off', icon: Mail, color: 'text-amber-400 bg-amber-400/10' },
          { label: 'Push Channel', value: channels.push ? 'On' : 'Off', icon: Bell, color: 'text-indigo-400 bg-indigo-400/10' },
        ].map((metric) => (
          <div key={metric.label} className="bg-surface-900 border border-surface-800 rounded-2xl p-5 shadow-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.color}`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mt-4">{metric.value}</p>
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{metric.label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" /> Select Target User
            </h3>

            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
            >
              <option value="">Choose active user</option>
              {activeUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {userLabel(user)}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div className="mt-5 p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Selected</span>
                  <span className="text-[10px] font-mono text-primary-400">{formatLastActive(selectedUser.last_active)}</span>
                </div>
                <p className="text-sm font-bold text-white break-all">{selectedUser.user_id}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-surface-600 uppercase font-bold">Intent</p>
                    <p className="text-sm text-surface-300">{selectedUser.intent_state}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-600 uppercase font-bold">Score</p>
                    <p className="text-sm text-surface-300">{Math.round(selectedUser.total_score || 0)}</p>
                  </div>
                </div>
                {selectedUser.metadata?.email && (
                  <p className="text-xs text-surface-500 break-all">{selectedUser.metadata.email}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Delivery Channels
            </h3>
            <div className="space-y-3">
              {[
                { id: 'popup', label: 'In-app popup', icon: MessageSquare },
                { id: 'push', label: 'Push notification', icon: Bell },
                { id: 'email', label: 'Email', icon: Mail },
              ].map((channel) => (
                <label key={channel.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-950 border border-surface-800 cursor-pointer hover:border-surface-700">
                  <span className="flex items-center gap-3 text-sm font-bold text-surface-200">
                    <channel.icon className="w-4 h-4 text-primary-400" /> {channel.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={channels[channel.id]}
                    onChange={(event) => setChannels((current) => ({ ...current, [channel.id]: event.target.checked }))}
                    className="w-4 h-4 accent-primary-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" /> Message Composer
              </h3>
              <button
                type="button"
                onClick={applyRecommendation}
                disabled={!selectedUser}
                className="px-3 py-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
              >
                Use Recommendation
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${template === item.id ? 'bg-primary-500/10 border-primary-500/40' : 'bg-surface-950 border-surface-800 hover:border-surface-700'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <Copy className="w-4 h-4 text-surface-500" />
                  </div>
                  <p className="text-xs text-surface-500 mt-2">{item.title}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Popup Title</label>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!emailSubject) setEmailSubject(event.target.value);
                  }}
                  className="mt-2 w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Message</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type the exact popup/email message for this user..."
                  className="mt-2 w-full min-h-36 bg-surface-950 border border-surface-800 rounded-xl p-4 text-sm text-white focus:border-primary-500 outline-none resize-none custom-scrollbar"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Priority</label>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="mt-2 w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Schedule</label>
                  <div className="relative mt-2">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                      className="w-full pl-10 bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Email To</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(event) => setEmailTo(event.target.value)}
                    placeholder="user@example.com"
                    disabled={!channels.email}
                    className="mt-2 w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              {channels.email && (
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Email Subject</label>
                  <input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    className="mt-2 w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-white focus:border-primary-500 outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending || !selectedUserId || !message.trim() || selectedChannels.length === 0}
              className="mt-6 w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-900/20"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" /> Send To Selected User
                </>
              )}
            </button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 ${result.status === 'failed' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}
            >
              <div className="flex items-start gap-3">
                {result.status === 'failed' ? (
                  <Clock className="w-5 h-5 text-red-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-white capitalize">{result.status}</p>
                  <p className="text-sm text-surface-400 mt-1">
                    {result.message || `Target user: ${result.user_id}. Channels: ${(result.channels || []).join(', ')}`}
                  </p>
                  {result.results?.email?.status && (
                    <p className="text-xs text-surface-500 mt-2">Email status: {result.results.email.status}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}
