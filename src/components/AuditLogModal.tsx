
import React, { useState, useMemo, useRef } from 'react';
import { X, Download, FileSpreadsheet, Info, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessData, CalculationResult } from '../types';
import { formatAmount, formatNumber } from '../lib/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BusinessData;
  results: CalculationResult;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, data, results }) => {
  const [viewRange, setViewRange] = useState({ start: 0, end: 12 });
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const months = useMemo(() => {
    if (!results.forecastBreakdown) return [];
    return results.forecastBreakdown;
  }, [results.forecastBreakdown]);

  const forecastData = useMemo(() => {
    if (!results.forecast) return [];
    return results.forecast;
  }, [results.forecast]);

  const visibleMonths = useMemo(() => {
    return months.slice(viewRange.start, viewRange.end);
  }, [months, viewRange]);

  const visibleForecast = useMemo(() => {
    return forecastData.slice(viewRange.start, viewRange.end);
  }, [forecastData, viewRange]);

  const cogsCategories = useMemo(() => {
    return data.costCategories.filter(c => c.id === 'cat-cogs' || c.title.toLowerCase().includes('direkta') || c.title.toLowerCase().includes('cogs'));
  }, [data.costCategories]);

  const opexCategories = useMemo(() => {
    return data.costCategories.filter(c => !(c.id === 'cat-cogs' || c.title.toLowerCase().includes('direkta') || c.title.toLowerCase().includes('cogs')));
  }, [data.costCategories]);

  const nextRange = () => {
    if (viewRange.end < 120) {
      setViewRange({ start: viewRange.start + 12, end: Math.min(120, viewRange.end + 12) });
    }
  };

  const prevRange = () => {
    if (viewRange.start > 0) {
      setViewRange({ start: Math.max(0, viewRange.start - 12), end: viewRange.start });
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove sticky positioning for capture
          const stickyElements = clonedDoc.querySelectorAll('.sticky');
          stickyElements.forEach((el) => {
            (el as HTMLElement).style.position = 'static';
          });
          
          // Ensure the table is fully expanded in the clone
          const container = clonedDoc.querySelector('.print-container') as HTMLElement;
          if (container) {
            container.style.overflow = 'visible';
            container.style.height = 'auto';
            container.style.width = 'auto';
            container.style.padding = '40px'; // Add padding for PDF
            
            // Show all calculation details in PDF
            const details = container.querySelectorAll('.group\\/cell div');
            details.forEach((d) => {
              const detail = d as HTMLElement;
              detail.style.display = 'block';
              detail.style.position = 'static';
              detail.style.backgroundColor = 'transparent';
              detail.style.color = '#64748b';
              detail.style.fontSize = '6px';
              detail.style.marginTop = '2px';
              detail.style.boxShadow = 'none';
              detail.style.padding = '0';
            });
            
            // Sanitize all elements to remove oklch/oklab colors which html2canvas can't parse
            const allElements = container.querySelectorAll('*');
            allElements.forEach((el) => {
              const style = window.getComputedStyle(el);
              const element = el as HTMLElement;
              
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
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for the table
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20; // Margin
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      // If the image is taller than one page, we might need multiple pages
      // but for a wide table in landscape, it usually fits or needs to be scaled
      if (imgHeight > pdfHeight - 20) {
        // Scale down further to fit height if necessary
        const scaleFactor = (pdfHeight - 20) / imgHeight;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth * scaleFactor, imgHeight * scaleFactor);
      } else {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }
      
      const fileName = `Audit_Log_Year_${Math.floor(viewRange.start / 12) + 1}_${(data.businessIdea || 'Rapport').substring(0, 20).replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      // PDF status logged internally
      alert("Det gick inte att generera PDF-filen. Kontrollera din anslutning och försök igen.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col"
          >
          {/* Header */}
          <div className="bg-slate-900 px-8 py-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                <FileSpreadsheet className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white uppercase tracking-tight">10-Års Revisionslogg <span className="text-emerald-400">Excel-Master</span></h2>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">Fullständig finansiell spårbarhet – Granska beräkningar månad för månad i 10 år</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 mr-4">
                <button 
                  onClick={prevRange}
                  disabled={viewRange.start === 0}
                  className="p-2 hover:bg-slate-700 disabled:opacity-20 text-white rounded-lg transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                  År {Math.floor(viewRange.start / 12) + 1}
                </span>
                <button 
                  onClick={nextRange}
                  disabled={viewRange.end >= 120}
                  className="p-2 hover:bg-slate-700 disabled:opacity-20 text-white rounded-lg transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                {isGenerating ? 'Genererar...' : 'Exportera PDF'}
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Spreadsheet View */}
          <div className="flex-1 overflow-auto bg-slate-100 p-1 custom-scrollbar print-container" ref={reportRef}>
            <div className="min-w-max bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse text-xs font-medium">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="sticky left-0 z-30 bg-slate-900 px-4 py-3 border-r border-slate-800 text-emerald-400 font-semibold uppercase tracking-wide text-left min-w-[250px]">
                      Finansiell Post
                    </th>
                    {visibleMonths.map((m, idx) => (
                      <th key={idx} className="px-4 py-3 border-r border-slate-800 text-white font-semibold uppercase tracking-wide text-right min-w-[100px]">
                        Mån {viewRange.start + idx + 1}
                      </th>
                    ))}
                    <th className="px-4 py-3 bg-slate-800 text-emerald-400 font-semibold uppercase tracking-wide text-right min-w-[120px]">
                      Årstotal
                    </th>
                  </tr>
                </thead>
                <tbody>{/* I. REVENUE SECTION */}<tr className="bg-slate-900 text-white">
                    <td className="sticky left-0 z-10 bg-slate-900 px-4 py-2 font-semibold uppercase tracking-wider border-r border-slate-800 text-xs text-emerald-400">
                      I. INTÄKTSFLÖDEN (GROSS REVENUE)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-800" />)}
                    <td className="bg-slate-800" />
                  </tr>
                  {data.revenueStreams.map((stream, sIdx) => {
                    const yearTotal = visibleMonths.reduce((sum, m) => sum + (m.revenues.find(r => r.label === stream.label)?.value || 0), 0);
                    return (
                      <tr key={stream.id} className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors group ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="sticky left-0 z-10 bg-inherit group-hover:bg-emerald-50/50 px-4 py-2.5 border-r border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {stream.label}
                        </td>
                        {visibleMonths.map((m, idx) => {
                          const streamData = m.revenues.find(r => r.label === stream.label);
                          const streamVal = streamData?.value || 0;
                          return (
                            <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right tabular-nums text-emerald-600 font-bold group/cell relative">
                              {formatAmount(streamVal)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 bg-emerald-50/30 text-right tabular-nums text-emerald-700 font-semibold border-l border-slate-200">
                          {formatAmount(yearTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-emerald-50 font-semibold border-b border-emerald-100">
                    <td className="sticky left-0 z-10 bg-emerald-50 px-4 py-2 border-r border-emerald-200 text-emerald-700 text-sm font-medium">TOTAL BRUTTOINTÄKT</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className="px-4 py-2 border-r border-emerald-100 text-right tabular-nums text-emerald-700">
                        {formatAmount(m.totalRevenue)}
                      </td>
                    ))}
                    <td className="px-4 py-2 bg-emerald-100 text-right tabular-nums text-emerald-900 border-l border-emerald-200">
                      {formatAmount(visibleMonths.reduce((sum, m) => sum + m.totalRevenue, 0))}
                    </td>
                  </tr>{/* INVENTORY SECTION */}{data.revenueStreams.some(s => s.calculationMode === 'product') && (
                    <React.Fragment>
                      <tr className="bg-blue-900 text-white">
                        <td className="sticky left-0 z-10 bg-blue-900 px-4 py-2 font-semibold uppercase tracking-wide border-r border-blue-800">
                          Lager & Varukostnad (Inventory)
                        </td>
                        {visibleMonths.map((_, i) => <td key={i} className="border-r border-blue-800" />)}
                        <td className="bg-blue-800" />
                      </tr>
                      {data.revenueStreams.filter(s => s.calculationMode === 'product').map((stream) => (
                        <React.Fragment key={stream.id}>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <td className="sticky left-0 z-10 bg-slate-50 px-4 py-1.5 font-semibold text-slate-400 text-sm font-medium border-r border-slate-200">
                              {stream.label} - Lagerstatus
                            </td>
                            {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-100" />)}
                            <td className="bg-slate-100/50" />
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="sticky left-0 z-10 bg-white px-8 py-1.5 border-r border-slate-200 text-slate-500">Inköpta enheter</td>
                            {visibleMonths.map((m, idx) => (
                              <td key={idx} className="px-4 py-1.5 border-r border-slate-100 text-right tabular-nums text-blue-600">
                                {m.inventory?.[stream.label]?.purchased || 0}
                              </td>
                            ))}
                            <td className="bg-blue-50/30" />
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="sticky left-0 z-10 bg-white px-8 py-1.5 border-r border-slate-200 text-slate-500">Sålda enheter</td>
                            {visibleMonths.map((m, idx) => (
                              <td key={idx} className="px-4 py-1.5 border-r border-slate-100 text-right tabular-nums text-emerald-600">
                                {m.inventory?.[stream.label]?.sold || 0}
                              </td>
                            ))}
                            <td className="bg-emerald-50/30" />
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50 font-bold">
                            <td className="sticky left-0 z-10 bg-white px-8 py-1.5 border-r border-slate-200 text-slate-700">Kvar i lager</td>
                            {visibleMonths.map((m, idx) => (
                              <td key={idx} className="px-4 py-1.5 border-r border-slate-100 text-right tabular-nums text-slate-900">
                                {m.inventory?.[stream.label]?.remaining || 0}
                              </td>
                            ))}
                            <td className="bg-slate-100" />
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="sticky left-0 z-10 bg-white px-8 py-1.5 border-r border-slate-200 text-slate-400 text-xs uppercase">Lagersaldo (Värde)</td>
                            {visibleMonths.map((m, idx) => (
                              <td key={idx} className="px-4 py-1.5 border-r border-slate-100 text-right tabular-nums text-slate-500 font-bold">
                                {formatAmount(m.inventory?.[stream.label]?.inventoryValue || 0)}
                              </td>
                            ))}
                            <td className="bg-slate-100" />
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td colSpan={visibleMonths.length + 2} className="px-4 py-2 text-xs text-blue-800">
                          * Pedagogisk förklaring: Inköp av varor påverkar kassaflödet direkt, men kostnaden (COGS) uppstår först när varan säljs. 
                          {data.isInternational && " Tull och importkostnader inkluderas i lagervärdet och periodiseras som en del av varukostnaden vid försäljning."}
                        </td>
                      </tr>
                    </React.Fragment>
                  )}{/* II. COGS SECTION */}<tr className="bg-slate-900 text-white">
                    <td className="sticky left-0 z-10 bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.15em] border-r border-slate-800 text-xs text-orange-400">
                      II. DIREKTA KOSTNADER (COGS)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-800" />)}
                    <td className="bg-slate-800" />
                  </tr>
                  {cogsCategories.map((cat, cIdx) => (
                    <React.Fragment key={cat.id}>
                      <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                        <td className="sticky left-0 z-10 bg-slate-800 px-4 py-2 font-semibold text-slate-300 text-sm font-medium border-r border-slate-700">
                          {cIdx + 1}. {cat.title}
                        </td>
                        {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-700" />)}
                        <td className="bg-slate-700" />
                      </tr>
                      {cat.items.map((item, iIdx) => {
                        const subLabels = Array.from(new Set(visibleMonths.flatMap(m => {
                          const catData = m.expenses.find(e => e.category === cat.title);
                          if (!catData) return [];
                          return catData.items
                            .filter(it => it.label === item.label || it.label.startsWith(`${item.label} - `))
                            .map(it => it.label);
                        })));

                        if (subLabels.length === 0) {
                          subLabels.push(item.label);
                        }

                        return subLabels.map((subLabel, sIdx) => {
                          const yearTotal = visibleMonths.reduce((sum, m) => {
                            const catData = m.expenses.find(e => e.category === cat.title);
                            return sum + (catData?.items.find(it => it.label === subLabel)?.value || 0);
                          }, 0);
                          
                          return (
                            <tr key={`${item.id}-${sIdx}`} className={`border-b border-slate-100 hover:bg-orange-50/20 transition-colors group ${iIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${sIdx > 0 ? 'opacity-80' : ''}`}>
                              <td className="sticky left-0 z-10 bg-inherit group-hover:bg-orange-50/40 px-4 py-2.5 border-r border-slate-200 font-medium text-slate-600 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                  <div className="flex flex-col">
                                    <span className={`font-bold ${sIdx > 0 ? 'text-xs text-slate-500 pl-2' : 'text-xs'}`}>{subLabel}</span>
                                    <span className="text-[7px] text-slate-400 uppercase tracking-tight">COGS {cIdx + 1}.{iIdx + 1}{sIdx > 0 ? `.${sIdx}` : ''}</span>
                                  </div>
                                </div>
                              </td>
                              {visibleMonths.map((m, idx) => {
                                const catData = m.expenses.find(e => e.category === cat.title);
                                const itemData = catData?.items.find(it => it.label === subLabel);
                                const itemVal = itemData?.value || 0;
                                
                                return (
                                  <td key={idx} className="px-4 py-2.5 border-r border-slate-100 text-right tabular-nums text-orange-600/80 font-bold group/cell relative">
                                    {formatAmount(itemVal)}
                                    {itemData?.calculationDetails && (
                                      <div className="hidden group-hover/cell:block absolute bottom-full right-0 mb-1 z-50 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                                        {itemData.calculationDetails}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2.5 bg-orange-50/30 text-right tabular-nums text-orange-700 font-semibold border-l border-slate-200">
                                {formatAmount(yearTotal)}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </React.Fragment>
                  ))}
                  
                  <tr className="bg-emerald-50 font-semibold border-y-2 border-emerald-900 shadow-sm text-emerald-900">
                    <td className="sticky left-0 z-10 bg-emerald-50 px-4 py-2 border-r border-emerald-200 text-emerald-900 text-sm font-medium">III. BRUTTOVINST (GROSS PROFIT)</td>
                    {visibleMonths.map((m, idx) => {
                      const mCogsVal = cogsCategories.reduce((sum, cat) => {
                        const cData = m.expenses.find(e => e.category === cat.title);
                        return sum + (cData ? cData.value : 0);
                      }, 0);
                      return (
                        <td key={idx} className="px-4 py-2 border-r border-emerald-100 text-right tabular-nums">
                          {formatAmount(m.totalRevenue - mCogsVal)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 bg-emerald-100 text-right tabular-nums border-l border-emerald-200">
                      {formatAmount(visibleMonths.reduce((sum, m) => {
                        const mCogsVal = cogsCategories.reduce((s, cat) => {
                          const cData = m.expenses.find(e => e.category === cat.title);
                          return s + (cData ? cData.value : 0);
                        }, 0);
                        return sum + (m.totalRevenue - mCogsVal);
                      }, 0))}
                    </td>
                  </tr>

                  {/* IV. EXPENSES SECTION */}<tr className="bg-slate-900 text-white">
                    <td className="sticky left-0 z-10 bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.15em] border-r border-slate-800 text-xs text-amber-400">
                      IV. RÖRELSEKOSTNADER (OPERATING EXPENSES)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-800" />)}
                    <td className="bg-slate-800" />
                  </tr>
                  {opexCategories.map((cat, cIdx) => (
                    <React.Fragment key={cat.id}>
                      <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                        <td className="sticky left-0 z-10 bg-slate-800 px-4 py-2 font-semibold text-slate-300 text-sm font-medium border-r border-slate-700">
                          {cIdx + 1 + cogsCategories.length}. {cat.title}
                        </td>
                        {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-700" />)}
                        <td className="bg-slate-700" />
                      </tr>
                      {cat.items.map((item, iIdx) => {
                        const subLabels = Array.from(new Set(visibleMonths.flatMap(m => {
                          const catData = m.expenses.find(e => e.category === cat.title);
                          if (!catData) return [];
                          return catData.items
                            .filter(it => it.label === item.label || it.label.startsWith(`${item.label} - `))
                            .map(it => it.label);
                        })));

                        if (subLabels.length === 0) {
                          subLabels.push(item.label);
                        }

                        return subLabels.map((subLabel, sIdx) => {
                          const yearTotal = visibleMonths.reduce((sum, m) => {
                            const catData = m.expenses.find(e => e.category === cat.title);
                            return sum + (catData?.items.find(it => it.label === subLabel)?.value || 0);
                          }, 0);
                          
                          return (
                            <tr key={`${item.id}-${sIdx}`} className={`border-b border-slate-100 hover:bg-red-50/20 transition-colors group ${iIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${sIdx > 0 ? 'opacity-80' : ''}`}>
                              <td className="sticky left-0 z-10 bg-inherit group-hover:bg-red-50/40 px-4 py-2.5 border-r border-slate-200 font-medium text-slate-600 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  <div className="flex flex-col">
                                    <span className={`font-bold ${sIdx > 0 ? 'text-xs text-slate-500 pl-2' : 'text-xs'}`}>{subLabel}</span>
                                    <span className="text-[7px] text-slate-400 uppercase tracking-tight">Budget {cIdx + 1 + cogsCategories.length}.{iIdx + 1}{sIdx > 0 ? `.${sIdx}` : ''}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {item.isLoan && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-semibold border border-amber-200">Lån</span>}
                                  {item.calculationMode === 'asset' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-semibold border border-blue-200">Avskr.</span>}
                                </div>
                              </td>
                              {visibleMonths.map((m, idx) => {
                                const catData = m.expenses.find(e => e.category === cat.title);
                                const itemData = catData?.items.find(it => it.label === subLabel);
                                const itemVal = itemData?.value || 0;
                                
                                return (
                                  <td key={idx} className="px-4 py-2.5 border-r border-slate-100 text-right tabular-nums text-red-600/80 font-bold group/cell relative">
                                    {formatAmount(itemVal)}
                                    {itemData?.calculationDetails && (
                                      <div className="hidden group-hover/cell:block absolute bottom-full right-0 mb-1 z-50 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                                        {itemData.calculationDetails}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2.5 bg-red-50/30 text-right tabular-nums text-red-700 font-semibold border-l border-slate-200">
                                {formatAmount(yearTotal)}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </React.Fragment>
                  ))}
                  <tr className="bg-red-50 font-semibold border-b border-red-100">
                    <td className="sticky left-0 z-10 bg-red-50 px-4 py-2 border-r border-red-200 text-red-700 uppercase tracking-wide">Total Kostnad</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className="px-4 py-2 border-r border-red-100 text-right tabular-nums text-red-700">
                        {formatAmount(m.totalExpenses)}
                      </td>
                    ))}
                    <td className="px-4 py-2 bg-red-100 text-right tabular-nums text-red-900 border-l border-red-200">
                      {formatAmount(visibleMonths.reduce((sum, m) => sum + m.totalExpenses, 0))}
                    </td>
                  </tr>{/* V. RESULT SECTION */}<tr className="bg-slate-900 text-white">
                    <td className="sticky left-0 z-10 bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.15em] border-r border-slate-800 text-xs text-blue-400">
                      V. RESULTATANALYS (EBIT / EAT)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-800" />)}
                    <td className="bg-slate-800" />
                  </tr>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 font-semibold h-12">
                    <td className="sticky left-0 z-10 bg-slate-100 px-4 py-3 border-r border-slate-200 text-slate-900 uppercase">Resultat Före Skatt (EBT)</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className={`px-4 py-3 border-r border-slate-100 text-right tabular-nums text-sm ${m.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatAmount(m.profit)}
                      </td>
                    ))}
                    <td className="px-4 py-3 bg-slate-200 text-right tabular-nums text-slate-900 border-l border-slate-300">
                      {formatAmount(visibleMonths.reduce((sum, m) => sum + m.profit, 0))}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-bold text-slate-400 bg-slate-50/30">
                    <td className="sticky left-0 z-10 bg-slate-50/30 px-4 py-2 border-r border-slate-200 uppercase text-xs">Bolagsskatt (20.6%)</td>
                    {visibleMonths.map((m, idx) => {
                      const monthlyTax = m.profit > 0 ? m.profit * 0.206 : 0;
                      return (
                        <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right tabular-nums text-red-400/50">
                          {monthlyTax > 0 ? `-${formatAmount(monthlyTax)}` : '0'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 bg-slate-200 text-right tabular-nums border-l border-slate-300 font-semibold">
                      -{formatAmount(visibleMonths.reduce((sum, m) => sum + (m.profit > 0 ? m.profit * 0.206 : 0), 0))}
                    </td>
                  </tr>
                  <tr className="border-b-4 border-slate-900 bg-slate-900 text-white font-semibold h-14">
                    <td className="sticky left-0 z-10 bg-slate-900 px-4 py-3 border-r border-slate-800 text-emerald-400 uppercase underline decoration-emerald-500/30 underline-offset-4 text-sm tracking-tight">Periodens Nettoresultat (EAT)</td>
                    {visibleMonths.map((m, idx) => {
                      const monthlyTax = m.profit > 0 ? m.profit * 0.206 : 0;
                      const net = m.profit - monthlyTax;
                      return (
                        <td key={idx} className={`px-4 py-3 border-r border-slate-800 text-right tabular-nums text-[13px] ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatAmount(net)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 bg-slate-800 text-right tabular-nums text-emerald-400 border-l border-slate-700">
                      {formatAmount(visibleMonths.reduce((sum, m) => {
                        const monthlyTax = m.profit > 0 ? m.profit * 0.206 : 0;
                        return sum + (m.profit - monthlyTax);
                      }, 0))}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-semibold bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-slate-50/50 px-4 py-3 border-r border-slate-200 text-slate-900 uppercase">Vinstmarginal (%)</td>
                    {visibleMonths.map((m, idx) => {
                      const margin = m.totalRevenue > 0 ? (m.profit / m.totalRevenue) * 100 : 0;
                      return (
                        <td key={idx} className={`px-4 py-3 border-r border-slate-100 text-right tabular-nums ${margin >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                          {formatNumber(margin, 1)}%
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 bg-slate-100 text-right tabular-nums text-slate-900 border-l border-slate-200">
                      {(() => {
                        const totalRev = visibleMonths.reduce((sum, m) => sum + m.totalRevenue, 0);
                        const totalProf = visibleMonths.reduce((sum, m) => sum + m.profit, 0);
                        return totalRev > 0 ? formatNumber((totalProf / totalRev) * 100, 1) : '0';
                      })()}%
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-semibold bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-slate-50/50 px-4 py-3 border-r border-slate-200 text-slate-900 uppercase">Kassaflöde</td>
                    {visibleForecast.map((m, idx) => (
                      <td key={idx} className={`px-4 py-3 border-r border-slate-100 text-right tabular-nums ${m.cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatAmount(m.cashFlow)}
                      </td>
                    ))}
                    <td className="px-4 py-3 bg-blue-50 text-right tabular-nums text-blue-900 border-l border-slate-200">
                      {formatAmount(visibleForecast.reduce((sum, m) => sum + m.cashFlow, 0))}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-semibold bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-slate-50/50 px-4 py-3 border-r border-slate-200 text-slate-900 uppercase">Ack. Resultat</td>
                    {visibleForecast.map((m, idx) => (
                      <td key={idx} className={`px-4 py-3 border-r border-slate-100 text-right tabular-nums ${m.cumulativeProfit >= 0 ? 'text-slate-900' : 'text-red-900'}`}>
                        {formatAmount(m.cumulativeProfit)}
                      </td>
                    ))}
                    <td className="px-4 py-3 bg-slate-100 text-right tabular-nums border-l border-slate-200">
                      {formatAmount(visibleForecast[visibleForecast.length - 1]?.cumulativeProfit || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-semibold bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-slate-50/50 px-4 py-3 border-r border-slate-200 text-slate-900 uppercase">Ack. Kassaflöde</td>
                    {visibleForecast.map((m, idx) => (
                      <td key={idx} className={`px-4 py-3 border-r border-slate-100 text-right tabular-nums ${m.cumulativeCashFlow >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                        {formatAmount(m.cumulativeCashFlow)}
                      </td>
                    ))}
                    <td className="px-4 py-3 bg-blue-100 text-right tabular-nums text-blue-900 border-l border-slate-200">
                      {formatAmount(visibleForecast[visibleForecast.length - 1]?.cumulativeCashFlow || 0)}
                    </td>
                  </tr>

                  {/* DEBT SECTION */}<tr className="bg-slate-800 text-white">
                    <td className="sticky left-0 z-10 bg-slate-800 px-4 py-2 font-semibold uppercase tracking-wide border-r border-slate-700">
                      Skulder & Amortering (Debt)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-slate-700" />)}
                    <td className="bg-slate-700" />
                  </tr>
                  <tr className="border-b border-slate-100 font-bold">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-slate-200 text-slate-700 uppercase">Total Skuld</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right tabular-nums text-amber-700">
                        {formatAmount(m.totalDebt)}
                      </td>
                    ))}
                    <td className="px-4 py-2 bg-amber-50 text-right tabular-nums text-amber-900 border-l border-slate-200">
                      {formatAmount(visibleMonths[visibleMonths.length - 1]?.totalDebt || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-bold bg-slate-50/30">
                    <td className="sticky left-0 z-10 bg-slate-50/30 px-4 py-2 border-r border-slate-200 text-slate-700 uppercase">Månadens Amortering</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right tabular-nums text-amber-600">
                        {m.amortization > 0 ? `-${formatAmount(m.amortization)}` : '0'}
                      </td>
                    ))}
                    <td className="px-4 py-2 bg-amber-50 text-right tabular-nums text-amber-700 border-l border-slate-200">
                      -{formatAmount(visibleMonths.reduce((sum, m) => sum + m.amortization, 0))}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 font-bold">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-slate-200 text-slate-700 uppercase">Månadens Ränta</td>
                    {visibleMonths.map((m, idx) => (
                      <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right tabular-nums text-red-500">
                        {m.interest > 0 ? `-${formatAmount(m.interest)}` : '0'}
                      </td>
                    ))}
                    <td className="px-4 py-2 bg-red-50 text-right tabular-nums text-red-700 border-l border-slate-200">
                      -{formatAmount(visibleMonths.reduce((sum, m) => sum + m.interest, 0))}
                    </td>
                  </tr>

                  {/* LIQUIDITY EVENTS SECTION */}
                  <tr className="bg-orange-900 text-white">
                    <td className="sticky left-0 z-10 bg-orange-900 px-4 py-2 font-semibold uppercase tracking-wide border-r border-orange-800">
                      Likviditetshändelser (Cash Flow Events)
                    </td>
                    {visibleMonths.map((_, i) => <td key={i} className="border-r border-orange-800" />)}
                    <td className="bg-orange-800" />
                  </tr>
                  
                  {Array.from(new Set(visibleMonths.flatMap(m => (m.cashFlowEvents || []).map(e => e.label)))).map(label => {
                    const yearInflow = visibleMonths.reduce((sum, m) => {
                      const event = m.cashFlowEvents?.find(e => e.label === label);
                      return sum + (event?.type === 'in' ? event.value : 0);
                    }, 0);
                    const yearOutflow = visibleMonths.reduce((sum, m) => {
                      const event = m.cashFlowEvents?.find(e => e.label === label);
                      return sum + (event?.type === 'out' ? event.value : 0);
                    }, 0);
                    const yearNet = yearInflow - yearOutflow;
                    
                    return (
                      <tr key={label} className="border-b border-slate-100 hover:bg-slate-50 group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2 border-r border-slate-200 text-slate-600 font-medium">
                          {label}
                        </td>
                        {visibleMonths.map((m, idx) => {
                          const event = m.cashFlowEvents?.find(e => e.label === label);
                          if (!event) return <td key={idx} className="px-4 py-2 border-r border-slate-100 text-right text-slate-200">-</td>;
                          
                          return (
                            <td key={idx} className={`px-4 py-2 border-r border-slate-100 text-right tabular-nums font-bold group/cell relative ${event.type === 'in' ? 'text-blue-600' : 'text-orange-600'}`}>
                              {event.type === 'in' ? '+' : '-'}{formatAmount(event.value)}
                              {event.details && (
                                <div className="hidden group-hover/cell:block absolute bottom-full right-0 mb-1 z-50 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                                  {event.details}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className={`px-4 py-2 bg-orange-50/20 text-right tabular-nums font-semibold border-l border-slate-200 ${yearNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                          {yearNet >= 0 ? '+' : ''}{formatAmount(yearNet)}
                        </td>
                      </tr>
                    );
                  })}</tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-slate-900 px-8 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wide">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Info size={14} className="text-emerald-400" /> Revisionsvy: Detaljerad månadsvis analys för ökad spårbarhet och finansiell kontroll.</div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div>Valuta: SEK</div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="text-emerald-400">Kvalitetssäkrad modell med hög beräkningsprecision</div>
            </div>
            <div className="text-slate-500">Linking v12.0 — Audit Master Edition</div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
