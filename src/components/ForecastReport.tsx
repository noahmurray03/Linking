
import React, { useRef } from 'react';
import { X, Download, FileText, Printer, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessData, CalculationResult } from '../types';
import { formatAmount } from '../lib/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ForecastReportProps {
  isOpen: boolean;
  onClose: () => void;
  data: BusinessData;
  results: CalculationResult;
}

export const ForecastReport: React.FC<ForecastReportProps> = ({ isOpen, onClose, data, results }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Attempt to fix oklch colors in the cloned document if needed
          // but using hex colors in the component is safer
          const report = clonedDoc.getElementById('report-content-inner');
          if (report) {
            report.style.fontFamily = 'Arial, sans-serif';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Lathund_Budget_${data.businessIdea.substring(0, 20).replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      // PDF Error hidden
      // Fallback to print if html2canvas fails
      window.print();
    }
  };

  if (!isOpen) return null;

  const forecast = results.forecastBreakdown || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#0f172a] border border-[#1e293b] w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1e293b] rounded-lg">
                <FileText className="w-6 h-6 text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ekonomisk Lathund</h2>
                <p className="text-sm text-[#94a3b8]">Månadsvis prognos för intäkter och kostnader</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Spara som PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white print-container" id="report-content">
            <div className="max-w-4xl mx-auto space-y-12 text-[#0f172a]" id="report-content-inner" ref={reportRef}>
              {/* Report Header */}
              <div className="border-b-2 border-[#0f172a] pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-semibold uppercase tracking-tight text-[#0f172a]">Budgetprognos</h1>
                    <p className="text-lg text-[#475569] font-medium mt-1">{data.businessIdea}</p>
                    <p className="text-sm text-[#64748b] mt-4">Bransch: {data.industry.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0f172a]">Datum: {new Date().toLocaleDateString('sv-SE')}</p>
                    <p className="text-sm text-[#64748b]">Skapad med AI Lasse</p>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Total Intäkt (År 1)</p>
                  <p className="text-xl font-semibold text-[#0f172a] mt-1">{formatAmount(results.forecast?.slice(0, 12).reduce((sum, m) => sum + m.revenue, 0) || 0)} kr</p>
                </div>
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Vinst (År 1)</p>
                  <p className="text-xl font-semibold text-[#059669] mt-1">{formatAmount(results.year1Profit || 0)} kr</p>
                </div>
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Break-even Månad</p>
                  <p className="text-xl font-semibold text-[#2563eb] mt-1">{results.breakEvenMonth ? `Månad ${results.breakEvenMonth}` : 'Ej nådd'}</p>
                </div>
                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Vinstmarginal</p>
                  <p className="text-xl font-semibold text-[#0f172a] mt-1">{results.profitMargin.toFixed(1)}%</p>
                </div>
              </div>

              {/* Detailed Monthly Breakdown */}
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-[#0f172a] border-l-4 border-[#2563eb] pl-4">Månadsvis Detaljplan</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-white">
                        <th className="p-3 text-sm font-bold uppercase tracking-wider">Kategori</th>
                        {forecast.slice(0, 12).map(m => (
                          <th key={m.month} className="p-3 text-sm font-bold uppercase tracking-wider text-right">Mån {m.month}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      <tr className="bg-[#f8fafc]">
                        <td colSpan={13} className="p-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">Intäkter</td>
                      </tr>
                      {data.revenueStreams.map(stream => (
                        <tr key={stream.id} className="hover:bg-[#f8fafc] transition-colors line-item-row">
                          <td className="p-3 text-sm font-medium text-[#334155]">{stream.label}</td>
                          {forecast.slice(0, 12).map(m => {
                            const rev = m.revenues.find(r => r.label === stream.label);
                            return (
                              <td key={m.month} className="p-3 text-sm text-right text-[#0f172a]">
                                {rev ? formatAmount(rev.value) : '0'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-[#eff6ff] font-bold">
                        <td className="p-3 text-sm text-[#1e3a8a]">Totala Intäkter</td>
                        {forecast.slice(0, 12).map(m => (
                          <td key={m.month} className="p-3 text-sm text-right text-[#1e3a8a]">{formatAmount(m.totalRevenue)}</td>
                        ))}
                      </tr>
                      <tr className="bg-[#f8fafc]">
                        <td colSpan={13} className="p-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mt-4">Kostnader</td>
                      </tr>
                      {data.costCategories.map(cat => (
                        <tr key={cat.id} className="hover:bg-[#f8fafc] transition-colors line-item-row">
                          <td className="p-3 text-sm font-medium text-[#334155]">{cat.title}</td>
                          {forecast.slice(0, 12).map(m => {
                            const exp = m.expenses.find(e => e.category === cat.title);
                            return (
                              <td key={m.month} className="p-3 text-sm text-right text-[#0f172a]">
                                {exp ? formatAmount(exp.value) : '0'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-[#fef2f2] font-bold">
                        <td className="p-3 text-sm text-[#7f1d1d]">Totala Kostnader</td>
                        {forecast.slice(0, 12).map(m => (
                          <td key={m.month} className="p-3 text-sm text-right text-[#7f1d1d]">{formatAmount(m.totalExpenses)}</td>
                        ))}
                      </tr>
                      <tr className="bg-[#0f172a] text-white font-semibold">
                        <td className="p-4 text-sm uppercase tracking-wider">Nettoresultat</td>
                        {forecast.slice(0, 12).map(m => (
                          <td key={m.month} className="p-4 text-sm text-right">
                            {formatAmount(m.profit)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-12 border-t border-[#e2e8f0] text-center">
                <p className="text-xs text-[#94a3b8]">
                  Denna rapport är genererad som ett beslutsunderlag och bör verifieras av en auktoriserad revisor eller ekonomisk rådgivare. 
                  Siffrorna är baserade på angivna antaganden och marknadsförhållanden kan förändras.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
