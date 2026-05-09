
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmText = "Bekräfta", cancelText = "Avbryt", isDestructive = false 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100"
          >
        <h3 className="text-xl font-semibold text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-slate-600 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
};
