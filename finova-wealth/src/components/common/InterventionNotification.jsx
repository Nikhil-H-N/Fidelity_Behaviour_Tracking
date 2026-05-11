import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertCircle, ShieldAlert, MessageCircle, ArrowRight } from 'lucide-react';
import useStore from '../../store/useStore';

export default function InterventionNotification() {
  const { activeInterventions, clearIntervention } = useStore();

  if (activeInterventions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {activeInterventions.map((intervention, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <InterventionCard 
              intervention={intervention} 
              onClose={() => clearIntervention(index)} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function InterventionCard({ intervention, onClose }) {
  const getTypeStyles = (type) => {
    switch (type) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-500/50',
          icon: ShieldAlert,
          iconColor: 'text-red-400',
          btnBg: 'bg-red-600 hover:bg-red-500'
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-900/90',
          border: 'border-amber-500/50',
          icon: AlertCircle,
          iconColor: 'text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-500'
        };
      default:
        return {
          bg: 'bg-indigo-900/90',
          border: 'border-indigo-500/50',
          icon: Info,
          iconColor: 'text-indigo-400',
          btnBg: 'bg-indigo-600 hover:bg-indigo-500'
        };
    }
  };

  const styles = getTypeStyles(intervention.type);
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} backdrop-blur-md border ${styles.border} p-6 rounded-3xl shadow-2xl relative overflow-hidden group`}>
      {/* Decorative background element */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${styles.iconColor} opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon size={128} />
      </div>

      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl ${styles.iconColor} bg-white/10 flex items-center justify-center shrink-0 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="space-y-3">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${styles.iconColor} mb-1 block`}>
              {intervention.type} Assistant
            </span>
            <p className="text-white text-sm font-medium leading-relaxed">
              {intervention.payload?.message || "We noticed you might need some help. How can we assist you today?"}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={onClose}
              className={`${styles.btnBg} text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg`}
            >
              Get Assistance <ArrowRight className="w-3 h-3" />
            </button>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white text-xs font-bold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
