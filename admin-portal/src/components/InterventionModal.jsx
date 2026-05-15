import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, MessageSquare, AlertCircle, 
  Zap, Info, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { engineApi } from '../utils/apiBase';

export default function InterventionModal({ isOpen, onClose, userId }) {
  const [type, setType] = useState('INFO');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const res = await fetch(engineApi('/admin/manual-intervention'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type,
          message,
          reason: 'Admin Manual Intervention'
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setMessage('');
          onClose();
        }, 2000);
      }
    } catch (error) {
      alert('Failed to send intervention');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-900 border border-surface-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-surface-800 flex items-center justify-between bg-surface-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Manual Intervention</h3>
                  <p className="text-[10px] text-surface-500 font-mono tracking-widest uppercase mt-0.5">Pushing to UID: {userId}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Message Dispatched</h4>
                  <p className="text-surface-400 text-sm">Target user will receive the prompt on their next interaction.</p>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Intervention Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'INFO', icon: Info, color: 'text-primary-400', bg: 'bg-primary-500/10' },
                        { id: 'WARNING', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { id: 'CRITICAL', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${
                            type === t.id ? `bg-surface-800 border-primary-500 ${t.color}` : 'bg-surface-950 border-surface-800 text-surface-600 grayscale hover:grayscale-0'
                          }`}
                        >
                          <t.icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold tracking-widest">{t.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Message Content</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter the message or assistance prompt for the user..."
                      className="w-full h-32 bg-surface-950 border border-surface-800 rounded-2xl p-4 text-sm text-white focus:border-primary-500 outline-none transition-colors resize-none custom-scrollbar"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={sending || !message.trim()}
                      className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-900/20 group"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                          DISPATCH INTERVENTION
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
