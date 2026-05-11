import { motion } from 'framer-motion';

export function KPICard({ icon: Icon, label, value, trend, color = "text-primary-400" }) {
  return (
    <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl hover:border-surface-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-surface-950 ${color.replace('text', 'text').replace('400', '400/10')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && <span className="text-[10px] font-bold text-emerald-500">{trend} ↑</span>}
      </div>
      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

export function ProgressBar({ value, max = 100, label, percentage }) {
  const progress = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span className="uppercase text-surface-400">{label}</span>
        <span className="text-white">{percentage || `${Math.round(progress)}%`}</span>
      </div>
      <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary-500" />
      </div>
    </div>
  );
}
