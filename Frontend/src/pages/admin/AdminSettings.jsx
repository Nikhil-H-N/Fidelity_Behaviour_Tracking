/**
 * ============================================================
 * FinovaWealth — Admin Settings Placeholder
 * File: Frontend/src/pages/admin/AdminSettings.jsx
 * ============================================================
 */

import { motion } from 'framer-motion';
import { Settings, Shield } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-surface-900 font-display">Admin Settings</h1>
        <p className="text-surface-500 mt-1">Configure platform settings and admin preferences</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="kpi-card text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 mb-2">Admin Settings</h3>
        <p className="text-sm text-surface-400 max-w-md mx-auto">
          Platform configuration and admin preferences will be available here. 
          This section is under development.
        </p>
      </motion.div>
    </div>
  );
}
