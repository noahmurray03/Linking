
import React, { useState, useMemo, useRef } from 'react';
import { 
  X, FileText, Download, Calendar, TrendingUp, TrendingDown, 
  DollarSign, PieChart as PieChartIcon, ArrowRight, CheckCircle2,
  Mail, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessData, CalculationResult, MonthlyData } from '../types';
import { formatAmount, formatNumber } from '../lib/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BusinessData;
  results: CalculationResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data, results }) => {
  const [period, setPeriod] = useState<{ start: number; end: number }>({ start: 1, end: 12 });
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredForecast = useMemo(() => {
    if (!results.forecast) return [];
    return results.forecast.slice(period.start - 1, period.end);
  }, [results.forecast, period]);

  const summary = useMemo(() => {
    const totalRevenue = filteredForecast.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = filteredForecast.reduce((sum, m) => sum + m.expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      margin
    };
  }, [filteredForecast]);

  const debts = useMemo(() => {
    let totalLoans = 0;
    data.costCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.isLoan && item.loanAmount) {
          totalLoans += item.loanAmount;
        }
      });
    });
    return {
      totalLoans,
      holidayPayDebt: results.holidayPayDebt,
      peakCapitalNeed: results.peakCapitalNeed
    };
  }, [data, results]);


  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      // Create a clone for rendering to ensure consistent width and styles
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI is ~794px
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.print-container') as HTMLElement;
          if (el) {
            el.style.width = '794px';
            el.style.padding = '40px';
            el.style.margin = '0';
            
            // Sanitize all elements to remove oklch/oklab colors which html2canvas can't parse
            const allElements = el.querySelectorAll('*');
            allElements.forEach((child) => {
              const style = window.getComputedStyle(child);
              const element = child as HTMLElement;
              
              // Helper to check if a color string contains oklch or oklab
              const isUnsupported = (color: string) => color.includes('oklch') || color.includes('oklab');
              
              if (isUnsupported(style.backgroundColor)) element.style.backgroundColor = '#ffffff';
              if (isUnsupported(style.color)) element.style.color = '#000000';
              if (isUnsupported(style.borderColor)) element.style.borderColor = '#e2e8f0';
              if (isUnsupported(style.boxShadow)) element.style.boxShadow = 'none';
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Ekonomisk_Sammanstallning_${(data.businessIdea || 'Rapport').substring(0, 20).replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      // PDF Error hidden
      alert("Det gick inte att generera PDF-filen. Kontrollera din anslutning och försök igen.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-slate-100 no-print">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2.5 rounded-xl">
                <FileText className="text-amber-400 w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Ekonomisk Rapport</h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Controls */}
              <div className="lg:col-span-3 space-y-6 no-print">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Period</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Slutmånad</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="120"
                        value={period.end}
                        onChange={(e) => setPeriod(p => ({ ...p, end: Math.min(120, parseInt(e.target.value) || 1) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[12, 36, 60, 120].map(m => (
                        <button 
                          key={m}
                          onClick={() => setPeriod({ start: 1, end: m })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${period.end === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {m/12} År
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 shadow-lg"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    Ladda ner PDF
                  </button>

                </div>
              </div>

              {/* Main Preview */}
              <div className="lg:col-span-9">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none">
                  <div className="p-12 bg-white print-container" ref={reportRef}>
                    <div className="max-w-3xl mx-auto">
                      {/* Minimalist Header */}
                      <div className="mb-16 relative">
                        <div className="absolute -top-8 right-0 px-3 py-1 bg-slate-900 text-amber-400 text-xs font-semibold uppercase tracking-wider rounded">
                          Sekretessbelagd Handling
                        </div>
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">Beslutsunderlag / Analys</p>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{data.businessIdea || 'Affärsplan'}</h1>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                          <span>Period: Månad 1 — {period.end}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span>{new Date().toLocaleDateString('sv-SE')}</span>
                        </div>
                      </div>

                      {/* Core Totals Grid */}
                      <div className="grid grid-cols-2 gap-12 mb-16">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Totala Intäkter</p>
                          <p className="text-3xl font-bold text-slate-900">{formatAmount(summary.totalRevenue)} <span className="text-sm font-normal text-slate-300">SEK</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Totala Kostnader</p>
                          <p className="text-3xl font-bold text-slate-900">{formatAmount(summary.totalExpenses)} <span className="text-sm font-normal text-slate-300">SEK</span></p>
                        </div>
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nettoresultat</p>
                          <p className={`text-3xl font-bold ${summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatAmount(summary.totalProfit)} <span className="text-sm font-normal text-slate-300">SEK</span>
                          </p>
                        </div>
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vinstmarginal</p>
                          <p className={`text-3xl font-bold ${summary.margin >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            {formatNumber(summary.margin, 1)}%
                          </p>
                        </div>
                      </div>

                      {/* Debts & Capital Section */}
                      <div className="mb-16">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Skulder & Kapitalbehov</h3>
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Låneskuld</p>
                            <p className="text-lg font-bold text-slate-900">{formatAmount(debts.totalLoans)} <span className="text-xs font-normal text-slate-300">SEK</span></p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Semesterskuld</p>
                            <p className="text-lg font-bold text-slate-900">{formatAmount(debts.holidayPayDebt)} <span className="text-xs font-normal text-slate-300">SEK</span></p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Max. Kapitalbehov</p>
                            <p className="text-lg font-bold text-slate-900">{formatAmount(debts.peakCapitalNeed || 0)} <span className="text-xs font-normal text-slate-300">SEK</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Breakdown - Minimalist Table */}
                      <div className="mb-16">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Månadsvis Utveckling</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-50">
                                <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Månad</th>
                                <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Intäkt</th>
                                <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Kostnad</th>
                                <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Resultat</th>
                                <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Ack. Res</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {filteredForecast.map((m, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="py-2.5 text-xs font-medium text-slate-500">Mån {period.start + idx}</td>
                                  <td className="py-2.5 text-xs font-bold text-slate-900 text-right">{formatAmount(m.revenue)}</td>
                                  <td className="py-2.5 text-xs font-bold text-slate-900 text-right">{formatAmount(m.expenses)}</td>
                                  <td className={`py-2.5 text-xs font-bold text-right ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {formatAmount(m.profit)}
                                  </td>
                                  <td className={`py-2.5 text-xs font-bold text-right ${m.cumulativeProfit >= 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {formatAmount(m.cumulativeProfit)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Key KPIs Section */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">Viktiga Nyckeltal</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Break-even</p>
                            <p className="text-sm font-bold text-slate-900">Månad {results.breakEvenMonth || '—'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Burn Rate</p>
                            <p className="text-sm font-bold text-slate-900">{formatAmount(results.burnRate)} <span className="text-xs font-normal text-slate-400">/mån</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Runway</p>
                            <p className="text-sm font-bold text-slate-900">{results.runway === Infinity ? '∞' : results.runway} <span className="text-xs font-normal text-slate-400">mån</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Säkerhetsmarginal</p>
                            <p className="text-sm font-bold text-slate-900">{formatNumber(results.safetyMargin, 1)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Minimalist Footer */}
                      <div className="mt-24 pt-8 border-t border-slate-100 grid grid-cols-2 gap-12 mb-8">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-8">Signatur Verkställande Direktör</p>
                          <div className="border-b border-slate-200 w-full h-px"></div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-8">Datum & Ort</p>
                          <div className="border-b border-slate-200 w-full h-px"></div>
                        </div>
                      </div>

                      <div className="mt-8 p-6 bg-slate-50 rounded-2xl">
                        <p className="text-[7px] text-slate-400 leading-relaxed">
                          DISCLAIMER: Denna finansiella sammanställning är genererad av Linking (Linking Group) som ett simuleringsunderlag. Siffrorna är baserade på användarens inmatade parametrar och marknadens generella variabler. Rapporten ersätter inte professionell juridisk eller ekonomisk rådgivning. Utvecklingen av en verklig verksamhet kan skilja sig väsentligt från simulerade scenarier.
                        </p>
                      </div>

                      <div className="mt-8 pt-4 flex justify-between items-center text-slate-300">
                        <p className="text-xs font-bold uppercase tracking-wide">Linking Precision Audit</p>
                        <p className="text-xs">Sidan 1 av 1</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
