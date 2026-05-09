
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, X } from 'lucide-react';
import { FinancialItem } from '../types';
import { formatAmount } from '../lib/calculations';

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: FinancialItem | null;
}

export const AmortizationModal: React.FC<AmortizationModalProps> = ({ isOpen, onClose, loan }) => {
  const loanAmount = Number(loan?.loanAmount) || 0;
  const interestRate = (Number(loan?.interestRate) || 0) / 100 / 12;
  const amortizationMonths = Number(loan?.amortizationMonths) || 60;
  const loanStart = Number(loan?.loanStartMonth) || 1;
  const startMonth = Number(loan?.amortizationStartMonth) || 1;
  const graceMonths = Number(loan?.gracePeriodMonths) || 0;
  const actualAmortStart = Math.max(startMonth, loanStart + graceMonths);

  const schedule = [];
  let remainingBalance = 0;
  const totalMonths = Math.max(amortizationMonths + actualAmortStart - 1, 24, loanStart + 12); 

  if (loan) {
    for (let m = 1; m <= totalMonths; m++) {
      if (m === loanStart) {
        remainingBalance = loanAmount;
      }

      const interest = remainingBalance * interestRate;
      let amortization = 0;
      if (m >= actualAmortStart && remainingBalance > 0) {
        amortization = loanAmount / amortizationMonths;
        if (amortization > remainingBalance) amortization = remainingBalance;
      }
      const currentInterest = interest;
      const currentAmortization = amortization;
      const currentTotal = currentInterest + currentAmortization;
      
      remainingBalance -= amortization;

      schedule.push({
        month: m,
        interest: currentInterest,
        amortization: currentAmortization,
        remainingBalance: Math.max(0, remainingBalance),
        totalPayment: currentTotal
      });

      if (remainingBalance <= 0 && m >= actualAmortStart && m >= loanStart) break;
    }
  }

  const totalCreditCost = schedule.length > 0 ? schedule.reduce((sum, row) => sum + row.interest, 0) : 0;
  const monthlyAmortization = loanAmount / amortizationMonths;
  const firstMonthInterest = schedule.find(r => r.month === loanStart)?.interest || 0;

  return (
    <AnimatePresence>
      {(isOpen && loan) && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
          >
        <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-slate-50 to-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Landmark className="text-amber-600" size={24} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight">
                Amorteringsplan
              </h3>
            </div>
            <p className="text-lg font-bold text-slate-500">{loan.label}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all hover:rotate-90">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-10 py-6">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2 border-slate-100">
                <th className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Månad</th>
                <th className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Ränta</th>
                <th className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Amortering</th>
                <th className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Totalt</th>
                <th className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Skuld</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schedule.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 text-xs font-bold text-slate-500 group-hover:text-slate-900 flex items-center gap-2">
                    Månad {row.month}
                    {row.amortization === 0 && row.interest > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-xs rounded uppercase font-semibold tracking-tight">Amorteringsfri</span>
                    )}
                  </td>
                  <td className="py-4 text-xs font-mono font-medium text-slate-600 text-right">{formatAmount(row.interest)}</td>
                  <td className="py-4 text-xs font-mono font-bold text-emerald-600 text-right">-{formatAmount(row.amortization)}</td>
                  <td className="py-4 text-xs font-mono font-semibold text-slate-900 text-right">{formatAmount(row.totalPayment)}</td>
                  <td className="py-4 text-xs font-mono font-bold text-slate-300 text-right group-hover:text-slate-400">{formatAmount(row.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-200 rounded-2xl bg-white overflow-hidden mb-6 shadow-sm">
            <div className="p-4 border-r border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Total skuld</span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold text-slate-900 tabular-nums mb-1">{formatAmount(loanAmount)}</span>
                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
              </div>
            </div>
            
            <div className="p-4 border-r border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Amortering</span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold text-emerald-600 tabular-nums mb-1">{formatAmount(monthlyAmortization)}</span>
                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
              </div>
            </div>

            <div className="p-4 border-r border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Ränta (Mån {loanStart})</span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold text-amber-600 tabular-nums mb-1">{formatAmount(firstMonthInterest)}</span>
                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
              </div>
            </div>

            <div className="p-4 border-r border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Total kreditkostnad</span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold text-slate-900 tabular-nums mb-1">{formatAmount(totalCreditCost)}</span>
                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 px-2">
            <div className="relative">
              <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                Resultaträkning (P&L)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Endast räntan räknas som en kostnad som minskar din vinst. Amortering är en skuldreglering, inte en kostnad.
              </p>
            </div>

            <div className="relative">
              <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Kassaflöde (Cash Flow)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Både ränta och amortering dras från kassan varje månad. Detta påverkar din likviditet direkt.
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="text-xs text-slate-400 font-medium max-w-xs">
            * Beräkningen är baserad på rak amortering och månatlig räntebetalning.
          </div>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Stäng Plan
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
);
};
