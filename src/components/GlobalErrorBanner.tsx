import React from 'react';
import { usePatientStore } from '@/src/app/store/patientStore';
import { useAuthStore } from '@/src/app/store/authStore';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function GlobalErrorBanner() {
  const patientError = usePatientStore((state) => state.error);
  const authError = useAuthStore((state) => state.error);
  const clearPatientError = usePatientStore((state) => state.clearError);
  const clearAuthError = useAuthStore((state) => state.clearError);

  const error = patientError || authError;
  const clearError = patientError ? clearPatientError : clearAuthError;

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-50 border-b border-red-100 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
