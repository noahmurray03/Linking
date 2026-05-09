import React from 'react';
import { 
  LineChart as LineChartIcon, TrendingUp, Landmark, Clock, Rocket, 
  PieChart as PieChartIcon, Target, ShieldCheck, BrainCircuit, Layers3,
  TrendingDown, Calculator, Shield, Zap, Sparkles, Info as InfoIcon,
  History as HistoryIcon, RefreshCw, FileText, BookOpen, Users
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ReferenceLine, Label
} from 'recharts';
import { CalculationResult, BusinessData } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface DashboardChartsProps {
  results: CalculationResult;
  data: BusinessData;
  forecastDuration: number;
  setForecastDuration: (d: number) => void;
  selectedYear: number;
  breakdownMode: 'costs' | 'revenue';
  setBreakdownMode: (mode: 'costs' | 'revenue') => void;
  showLogicReference: boolean;
  setShowLogicReference: (show: boolean) => void;
  aiQuery: string;
  setAiQuery: (query: string) => void;
  handleAiAnalysis: () => void;
  onOpenReport: () => void;
  isChatLoading: boolean;
  formatAmount: (val: number) => string;
  formatNumber: (val: number, decimals?: number) => string;
  getResultColor: (val: number) => string;
  getCashFlowColor: (val: number) => string;
  LOGIC_DEFINITIONS: any;
  COLORS: string[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  results,
  data,
  forecastDuration,
  setForecastDuration,
  selectedYear,
  breakdownMode,
  setBreakdownMode,
  showLogicReference,
  setShowLogicReference,
  aiQuery,
  setAiQuery,
  handleAiAnalysis,
  onOpenReport,
  isChatLoading,
  formatAmount,
  formatNumber,
  getResultColor,
  getCashFlowColor,
  LOGIC_DEFINITIONS,
  COLORS
}) => {
  const dashboardForecast = React.useMemo(() => {
    if (!results.forecast) return [];
    return results.forecast.slice(0, forecastDuration);
  }, [results.forecast, forecastDuration]);

  const yearForecastBreakdown = React.useMemo(() => {
    if (!results.forecastBreakdown) return [];
    const start = (selectedYear - 1) * 12;
    const end = Math.min(selectedYear * 12, results.forecastBreakdown.length);
    return results.forecastBreakdown.slice(start, end);
  }, [results.forecastBreakdown, selectedYear]);

  const yearExpenseBreakdown = React.useMemo(() => {
    const breakdown: Record<string, number> = {};
    yearForecastBreakdown.forEach(month => {
      month.expenses.forEach(exp => {
        breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.value;
      });
    });
    return breakdown;
  }, [yearForecastBreakdown]);

  const yearRevenueBreakdown = React.useMemo(() => {
    const breakdown: Record<string, number> = {};
    yearForecastBreakdown.forEach(month => {
      month.revenues.forEach(rev => {
        breakdown[rev.label] = (breakdown[rev.label] || 0) + rev.value;
      });
    });
    return breakdown;
  }, [yearForecastBreakdown]);

  const rawBreakdown = (breakdownMode === 'costs' ? yearExpenseBreakdown : yearRevenueBreakdown);
  const chartData = Object.entries(rawBreakdown).map(([name, value]) => ({ name, value: Number(value) }));

  const payrollCat = data.costCategories.find(c => c.id === 'cat-payroll' || c.title.toLowerCase().includes('lön'));
  const payrollTotalTitle = payrollCat?.title || 'Personalkostnader';
  const monthsInSelectedYear = yearForecastBreakdown.length || 1;
  const payrollFallbackRaw = results.expenseBreakdown[payrollTotalTitle];
  const payrollFallback = typeof payrollFallbackRaw === 'object' && payrollFallbackRaw !== null ? (payrollFallbackRaw as any).value : Number(payrollFallbackRaw || 0);
  const totalPayrollCost = (yearExpenseBreakdown[payrollTotalTitle] || payrollFallback || 0) / monthsInSelectedYear;
  const personnelFeesPct = data.personnelSettings.fees.reduce((sum, fee) => sum + (Number(fee.percentage) || 0), 0);

  const selectedYearData = React.useMemo(() => {
    if (!results.forecast || results.forecast.length === 0) return null;
    const startMonthIndex = (selectedYear - 1) * 12;
    const endMonthIndex = Math.min(selectedYear * 12 - 1, results.forecast.length - 1);
    if (startMonthIndex > endMonthIndex) return null;
    const yearForecast = results.forecast.slice(startMonthIndex, endMonthIndex + 1);
    const lastMonthData = yearForecast[yearForecast.length - 1];

    const revenue = (results[`year${selectedYear}Revenue` as keyof CalculationResult] as number) || 0;
    const profit = (results[`year${selectedYear}Profit` as keyof CalculationResult] as number) || 0;
    const margin = (results[`year${selectedYear}Margin` as keyof CalculationResult] as number) || 0;
    
    const totalExpenses = yearForecast.reduce((sum, m) => sum + m.expenses, 0);
    const avgBurnRate = totalExpenses / yearForecast.length;
    const avgRevenue = revenue / yearForecast.length;

    const lowestCash = Math.min(...yearForecast.map(m => m.cumulativeCashFlow));

    const runwayAtEnd = lastMonthData.cumulativeCashFlow > 0 && avgBurnRate > 0 
      ? lastMonthData.cumulativeCashFlow / avgBurnRate 
      : (lastMonthData.cumulativeCashFlow > 0 ? Infinity : 0);

    return {
      revenue,
      profit,
      margin,
      endCash: lastMonthData.cumulativeCashFlow,
      lowestCash,
      avgBurnRate,
      avgRevenue,
      runwayAtEnd,
      totalExpenses
    };
  }, [results, selectedYear]);

  return (
    <div className="lg:col-span-6 space-y-6 print:hidden font-sans">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 tracking-tight uppercase">
              <LineChartIcon size={16} className="text-blue-500" /> Likviditet & Resultat
            </h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1 pl-6">Simulerad bana</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogicReference(!showLogicReference)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wide transition-all ${showLogicReference ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <BookOpen size={12} />
              {showLogicReference ? 'Dölj Definitioner' : 'Visa Definitioner'}
            </button>

            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Prognoslängd</span>
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                <select 
                  value={forecastDuration} 
                  onChange={(e) => setForecastDuration(parseInt(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold uppercase tracking-wide outline-none px-2 py-0.5 cursor-pointer text-slate-700"
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i} value={(i + 1) * 12}>{(i + 1)} år</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {showLogicReference && (
          <div className="mb-8 p-8 bg-amber-50/50 border border-amber-100 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-400 rounded-xl">
                <BookOpen size={20} className="text-slate-900" />
              </div>
              <h5 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">Ekonomisk Ordbok & Logik</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(LOGIC_DEFINITIONS as Record<string, any>).slice(0, 15).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">{key}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {value.definition}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-amber-200/30 flex justify-center">
               <button 
                 onClick={() => setShowLogicReference(false)}
                 className="text-xs font-semibold text-amber-600 uppercase tracking-wide hover:text-amber-700 transition-colors"
               >
                 Stäng ordboken
               </button>
            </div>
          </div>
        )}
        
        <div className="h-[360px] w-full relative" style={{ minHeight: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                dy={10}
                interval={
                  forecastDuration <= 12 ? 1 : 
                  forecastDuration <= 24 ? 2 : 
                  forecastDuration <= 48 ? 5 : 
                  11
                }
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
                dx={-5}
              />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '8px'
                }}
                formatter={(val: number) => [`${formatAmount(val)} kr`]}
              />
              <Area 
                type="monotone" 
                dataKey="cumulativeProfit" 
                name="Resultat" 
                stroke="#0f172a" 
                strokeWidth={2} 
                fill="url(#colorProfit)" 
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="cumulativeCashFlow" 
                name="Kassaflöde" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                fill="url(#colorCash)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Financial Audit Section */}
        {results.validationWarnings && results.validationWarnings.length > 0 && (
          <div className="mt-8 p-4 bg-white border border-slate-900 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-emerald-600" />
              <h3 className="text-xs font-semibold uppercase tracking-tight text-slate-900">Systemets Självgranskning & Regelefterlevnad</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.validationWarnings.map((warning, idx) => (
                <div key={idx} className={`p-3 rounded-2xl flex items-start gap-3 transition-all ${
                  warning.type === 'error' ? 'bg-red-50 border border-red-100' : 
                  warning.type === 'warning' ? 'bg-amber-50 border border-amber-100' : 
                  'bg-blue-50 border border-blue-100'
                }`}>
                  <div className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                    warning.type === 'error' ? 'bg-red-500 animate-pulse' : 
                    warning.type === 'warning' ? 'bg-amber-500' : 
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                        warning.type === 'error' ? 'bg-red-500 text-white shadow-sm' : 
                        warning.type === 'warning' ? 'bg-amber-500 text-white shadow-sm' : 
                        'bg-blue-500 text-white shadow-sm'
                      }`}>
                        {warning.category || 'System'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-bold text-slate-900 tabular-nums">{formatAmount(selectedYearData?.avgRevenue || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Snittomsättn/Mån</p>
                <InfoTooltip 
                  text={`Genomsnittlig omsättning per månad under år ${selectedYear}.`} 
                  definition="Snittomsättning visar vad företaget i snitt fakturerar eller säljer per månad under det specifika året."
                  calculation={`Årets totala försäljning för år ${selectedYear} dividerat med 12 månader.`}
                  example="Siktar du på att sälja för 1.2M kr under året är ditt snitt 100 000 kr per månad."
                  iconSize={8} 
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className={`text-sm font-bold tabular-nums ${getResultColor(selectedYearData?.profit || 0)}`}>
                {formatAmount(selectedYearData?.profit || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Årets Resultat</p>
                <InfoTooltip 
                  text={`Verksamhetens ackumulerade resultat under år ${selectedYear}.`} 
                  definition="Bolagets netto-vinst (eller förlust) för året efter att alla räkningar är betalda."
                  calculation="Totala intäkter under året minus totala kostnader (inkl löner, hyra etc)."
                  example="Har du intäkter på 1M kr och kostnader på 800tkr blir årets resultat +200tkr."
                  iconSize={8} 
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className={`text-sm font-bold tabular-nums ${getCashFlowColor(selectedYearData?.lowestCash || 0)}`}>
                {formatAmount(selectedYearData?.lowestCash || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lägsta Kassasaldo</p>
                <InfoTooltip 
                  text={`Den lägsta nivån kassan når under år ${selectedYear}.`} 
                  definition="En 'varningsflagga' som visar hur illa till pengarna på kontot ligger under årets sämsta månad."
                  calculation="Bankkontots saldo simuleras månad för månad; minsta värdet under året presenteras här."
                  example="Även om du gör vinst år 2 kan du i juli ha ett kassasaldo på låga 10 000 kr, vilket indikerar en cash-flow risk just då."
                  iconSize={8} 
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className={`text-sm font-bold tabular-nums ${getCashFlowColor(selectedYearData?.endCash || 0)}`}>
                {formatAmount(selectedYearData?.endCash || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kassa (Slut År {selectedYear})</p>
                <InfoTooltip 
                  text={`Kassasaldo vid årets sista månad.`} 
                  definition="Så mycket pengar du förväntas ha på företagskontot i slutet av detta året."
                  calculation="Pengarna in minus pengarna ut till och med december år valt år."
                  iconSize={8} 
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-bold text-orange-500 tabular-nums">{formatAmount(selectedYearData?.avgBurnRate || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Snittkostnad/Mån</p>
                <InfoTooltip 
                  text={`Genomsnittliga kostnader per månad under år ${selectedYear}.`} 
                  definition="Belyser vad det i genomsnitt kostar att driva företaget en normal månad detta år."
                  calculation="Totalsumman av årets utgifter dividerat på tolv."
                  example="Har du tre anställda och stort kontor kan snittkostnaden vara 300 000 kr, men vissa enskilda månader kanske mer (t.ex semestermånader)."
                  iconSize={8} 
                />
              </div>
            </div>
            {data.isInternational && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in zoom-in-95 duration-500">
                <p className="text-sm font-bold text-blue-600 tabular-nums">{formatAmount(results.totalExportCosts || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Exportkostnader</p>
                  <InfoTooltip 
                    text="Totala frakt- och hanteringsavgifter för internationell försäljning under prognosperioden." 
                    definition="Summan av extra kostnader för tull, speditionsavgifter och internationell hantering."
                    calculation="Beräknas genom Exportförsäljning * (Tullavgift(%) + Fraktpåslag(%))."
                    iconSize={8}
                  />
                </div>
              </div>
            )}
        </div>
      </div>

        {forecastDuration > 12 && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg text-white">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-0.5">Strategisk Överblick (Utveckling över tid)</h5>
                  <p className="text-sm font-bold text-white tracking-tight">Årssammanställning för samtliga {Math.ceil(forecastDuration/12)} år</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                <Sparkles size={12} className="text-amber-400" />
                <p className="text-xs text-white/70 font-medium">
                  {results.year10Profit! > results.year1Profit! 
                    ? "Sunda marginaler indikerar skalbarhet." 
                    : "Analysera kostnadsutv. år 3-5."}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50">
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Period</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Omsättning</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Resultat</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Vinstmarginal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Array.from({ length: Math.ceil(forecastDuration / 12) }).map((_, i) => {
                    const year = i + 1;
                    const revenue = results[`year${year}Revenue` as keyof CalculationResult] as number || 0;
                    const profit = results[`year${year}Profit` as keyof CalculationResult] as number || 0;
                    const margin = results[`year${year}Margin` as keyof CalculationResult] as number || 0;
                    
                    return (
                      <tr key={year} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3">
                          <span className="text-xs font-bold text-white">År {year}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-xs font-bold text-white tabular-nums">{formatAmount(revenue)}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-xs font-bold tabular-nums ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatAmount(profit)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-xs font-bold text-amber-500 tabular-nums">{formatNumber(margin, 1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.costCategories.some(c => c.title.toLowerCase().includes('lån') && c.items.length > 0) && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-10 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 duration-500">
                <Landmark size={120} />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                  <TrendingUp size={20} className="text-amber-400" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Finansiell Hävstång</h5>
                  <p className="text-lg font-semibold text-slate-900">Skuldsättning & Kapital</p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                {data.costCategories.find(c => c.title.toLowerCase().includes('lån'))?.items.map(loan => (
                  <div key={loan.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{loan.label}</p>
                      <p className="text-xl font-semibold text-slate-900 tabular-nums">{formatAmount(loan.loanAmount || 0)} <span className="text-xs font-normal opacity-40">SEK</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Räntesats</p>
                      <p className="text-sm font-semibold text-amber-600">{formatNumber(loan.interestRate || 0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-10 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 duration-500">
                <HistoryIcon size={120} />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amorteringsprofil</h5>
                  <p className="text-lg font-semibold text-slate-900">Återbetalningstakt</p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                {data.costCategories.find(c => c.title.toLowerCase().includes('lån'))?.items.map(loan => (
                  <div key={loan.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Mån. Amortering</p>
                      <p className="text-xl font-semibold text-emerald-600 tabular-nums">{formatAmount((loan.loanAmount || 0) / (loan.amortizationMonths || 60))} <span className="text-xs font-normal opacity-40">SEK</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Löptid</p>
                      <p className="text-sm font-semibold text-slate-900">{loan.amortizationMonths} mån</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Rocket size={16} className="text-black" />
              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-800">Startup-analys & Break-even</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Investering & Setup (Peak)</p>
                  <InfoTooltip 
                    text="Det maximala kapitalbehovet (Peak Capital Need)." 
                    definition="Lägsta kassanivån innan företaget vänder till positivt. Visar minsta beloppet du behöver fram till självförsörjning."
                    calculation="Ackumulering av dina initiala investeringar och fasta utgifter till dess brytpunkten nås."
                    example="Satsar du mycket pengar innan lansering utan sälj blir kapitalbehovet ditt inledande underskott."
                    iconSize={10} 
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Det maximala negativa kassaflödet innan verksamheten blir självförsörjande. Detta inkluderar din <span className="font-bold">Initiala Investeringsfas</span> och de operativa förluster som uppstår innan breakeven.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-1">Operativ Break-even</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Månaden då intäkterna täcker de <span className="font-bold">löpande kostnaderna</span>. Här slutar du "bränna" pengar varje månad och verksamheten börjar generera ett överskott.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-1">Break-even (Ack)</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Månaden då den totala vinsten har täckt <span className="font-bold">alla initiala investeringar</span>. Här har du tjänat tillbaka varje krona du satsat i projektet.
                </p>
              </div>
            </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RUNWAY & BURN */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield size={60} /></div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Runway & Likviditet (Slut År {selectedYear})</h4>
              <InfoTooltip 
                text="Runway visar hur många månader kassan räcker vid snittkostnaden under det valda året." 
                definition="Talar om när pengarna potentiellt är helt slut baserat på nuläget."
                calculation="Din nuvarande Ack. Kassa dividerat med Snitt. Burn Rate."
                example="Om du har 1M kr från investerare och bränner 100k netto varje månad är Runway 10 månader."
              />
            </div>
            <p className={`text-4xl font-semibold tracking-tight ${(selectedYearData?.runwayAtEnd || 0) >= 12 ? 'text-emerald-600' : (selectedYearData?.runwayAtEnd || 0) >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {(selectedYearData?.runwayAtEnd || 0) === Infinity ? '∞' : formatNumber((selectedYearData?.runwayAtEnd || 0), 1)} <span className="text-sm uppercase">mån</span>
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Snitt. Burn Rate (År {selectedYear})</p>
              <InfoTooltip 
                text="Genomsnittligt utflöde per månad under året." 
                definition="Beloppet som lämnar ditt bankkonto i snitt varje månad oavsett intäkter."
                calculation="Kostnader (Lokaler + Löner + etc.) räknas samman och delas på 12."
              />
            </div>
            <p className="text-sm font-semibold text-slate-900">{formatAmount(selectedYearData?.avgBurnRate || 0)} kr/mån</p>
          </div>
        </div>

        {/* MARGINAL & EFFEKTIVITET */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={60} /></div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Vinstmarginal (År {selectedYear})</h4>
              <InfoTooltip 
                text={`Vinstmarginal (Netto) visar den totala lönsamheten under år ${selectedYear} efter att ALLA kostnader är betalda.`} 
                definition="Netto vinst som andel av omsättning. En kritisk parameter för långsiktig överlevnad och värdering."
                calculation="(Totala Intäkter – Alla Kostnader) dividerat med Totala Intäkter."
                example="Om din vinst är 10 kr för varje hundralapp du omsätter, har du en marginal på 10%."
              />
            </div>
            <p className={`text-4xl font-semibold tracking-tight ${(selectedYearData?.margin || 0) >= 15 ? 'text-emerald-600' : (selectedYearData?.margin || 0) >= 0 ? 'text-amber-400' : 'text-red-600'}`}>
              {formatNumber(selectedYearData?.margin || 0, 1)}<span className="text-sm">%</span>
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-wide">Efter samtliga utgifter</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bruttomarginal (Generell)</p>
                  <InfoTooltip 
                    text="Bruttomarginal = (Omsättning - direkta kostnader) / Omsättning. Generellt snittvärde." 
                    definition="Hur mycket du har kvar av din omsättning efter att du betalt material/varor men FÖRE personal och lokaler."
                    calculation="1 - (Dina Totala Direkta Kostnader / Total Omsättning)."
                    example="Tröja för 100kr kostar 30kr att köpa in, din bruttomarginal är då 70%."
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatNumber(results.grossMargin, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(0, results.grossMargin))}%` }} 
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[7px] font-semibold uppercase text-slate-400 tracking-wider mb-2">Inkluderade Direkta Kostnader:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Inköp', 'Frakt', 'Tull', 'Hantering', 'Fakturaavgifter'].map(tag => (
                  <span key={tag} className="text-[7px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-bold">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TILLVÄXT-EFFEKT */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={60} /></div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Effektivitet & LTV/CAC</h4>
              <InfoTooltip 
                text="LTV/CAC-ratio visar förhållandet mellan en kunds livstidsvärde och kostnaden för att förvärva kunden. Ett värde över 3 anses vara mycket bra." 
                definition="Magiska nyckeltalet för skalbarhet. Svarar på: 'Är det värt att spendera marknadsbudget?'"
                calculation="LTV dividerat med CAC."
                example="Om du lägger 100kr för att få kunden (CAC), och kunden ger dig 300kr totalt (LTV) i vinst, är ration 3x (jättebra!)."
              />
            </div>
            <p className={`text-4xl font-semibold tracking-tight ${results.ltvCacRatio >= 3 ? 'text-emerald-600' : results.ltvCacRatio >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatNumber(results.ltvCacRatio, 1)}<span className="text-sm">x</span>
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">CAC</p>
                <InfoTooltip 
                  text="Customer Acquisition Cost - Kostnaden för att förvärva en ny kund." 
                  definition="Betyder exakt hur många kronor i marknadsföring som det kostade att stänga EN ny kund."
                  calculation="Total marknadsbudget / Antal nya kunder per månad."
                />
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatAmount(results.cac)} kr</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1 justify-end">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">MRR</p>
                <InfoTooltip 
                  text="Monthly Recurring Revenue - Månatliga återkommande intäkter." 
                  definition="Värdet av alla fasta prenumerationer per månad."
                  calculation="Antal aktiva abonnemang * deras månadsavgift."
                />
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatAmount(results.mrr)} kr</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-semibold text-slate-800 uppercase text-xs flex items-center gap-2 tracking-wider">
              <PieChartIcon size={18} className="text-black" /> {breakdownMode === 'costs' ? `Kostnader (År ${selectedYear})` : `Intäkter (År ${selectedYear})`}
            </h4>
            <div className="flex gap-1">
              <button 
                onClick={() => setBreakdownMode('costs')}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${breakdownMode === 'costs' ? 'bg-black text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                Kostnader
              </button>
              <button 
                onClick={() => setBreakdownMode('revenue')}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${breakdownMode === 'revenue' ? 'bg-black text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                Intäkter
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-1/2 h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none" labelLine={false}>
                    {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', fontWeight: 800, fontSize: '9px', color: '#000'}} 
                    itemStyle={{color: '#000'}} 
                    formatter={(val: number) => [formatAmount(val) + ' kr']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</span>
                <span className="text-xs font-semibold text-black">{formatAmount(breakdownMode === 'costs' ? (selectedYearData?.totalExpenses || 0) : (selectedYearData?.revenue || 0))} kr</span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              {chartData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex justify-between items-center group border-b border-slate-50 pb-1 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 tabular-nums shrink-0 ml-2">
                    {formatAmount(entry.value)} kr
                  </span>
                </div>
              ))}
              {chartData.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Ingen data tillgänglig
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {breakdownMode === 'costs' ? 'Årskostnad totalt' : 'Årsintäkt totalt'}
            </span>
            <span className="text-sm font-semibold text-black">
              {formatAmount(breakdownMode === 'costs' ? (selectedYearData?.totalExpenses || 0) : (selectedYearData?.revenue || 0))} kr
            </span>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Rocket size={60} /></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Full Prognospotential ({forecastDuration} Mån)</h4>
              <InfoTooltip 
                text="Beräknad lönsamhet och marginalutveckling över samtliga år i den valda tidsperioden. Detta visar hur bolaget skalar långsiktigt och inte bara resultatet för en enskild månad." 
                definition="Bolagets slutvärden sista året du räknat på. Bra för värdering."
                calculation="Den ackumulerade historien ända till prognosens slut (t.ex månad 36 eller 60)."
              />
            </div>
            {(() => {
              const lastYear = Math.ceil(forecastDuration / 12);
              const profit = results[`year${lastYear}Profit` as keyof CalculationResult] as number || 0;
              return (
                <>
                  <p className={`text-4xl font-semibold tracking-tight ${profit > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatAmount(profit)} <span className="text-sm uppercase">kr</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-semibold uppercase tracking-wide leading-tight">
                    Årligt resultat vid periodens slut (År {lastYear})
                  </p>
                </>
              );
            })()}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ack. Vinst ({forecastDuration}m)</p>
                  <InfoTooltip 
                    text="Den totala ackumulerade vinsten bolaget har genererat under hela den valda {forecastDuration}-månadersperioden." 
                    definition="Alla dina årliga vinstpotter summerade till en siffra i slutet av prognosen."
                  />
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatAmount(dashboardForecast?.[dashboardForecast.length - 1]?.cumulativeProfit || 0)} kr</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Slutmarginal (År {Math.ceil(forecastDuration / 12)})</p>
                  <InfoTooltip 
                    text="Vinstmarginalen i slutet av hela prognosperioden, vilket visar bolagets mognad och hur väl affärsmodellen skalar över tid." 
                    definition="Hur står det till med bolaget efter alla svåra start-utgifter – en sund långtidsmarginal."
                    calculation="Slutårets Netto Vinst / Slutårets Totala Omsättning"
                  />
                </div>
                {(() => {
                  const lastYear = Math.ceil(forecastDuration / 12);
                  const margin = results[`year${lastYear}Margin` as keyof CalculationResult] as number || 0;
                  return (
                    <p className={`text-sm font-semibold ${margin >= 15 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-500'}`}>
                      {margin >= 0 ? '+' : ''}{formatNumber(margin, 1)}%
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personnel Breakdown Section - Direct Visibility Requested */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-tight">Personalkostnader & Roller</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">AI-genererade löneförslag för din affärsidé</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Belastad Kostnad</p>
              <p className="text-lg font-semibold text-slate-900 tabular-nums">
                {formatAmount(totalPayrollCost)} kr/mån
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payrollCat?.items.map((item, idx) => {
            const isUnit = item.calculationMode === 'unit';
            const baseVal = isUnit ? (Number(item.unitCount) || 0) * (Number(item.valuePerUnit) || 0) : (Number(item.value) || 0);
            const loadedCost = baseVal * (1 + personnelFeesPct / 100);

            return (
              <div key={item.id || idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">
                      {isUnit ? 'Anställd (Timme/Antal)' : 'Anställd (Fast)' }
                    </span>
                    <h5 className="text-sm font-semibold text-slate-900 leading-tight">{item.label}</h5>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${isUnit ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isUnit ? 'Rörlig' : 'Fast'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bruttolön</p>
                      <p className="text-lg font-semibold text-slate-900 tabular-nums">
                        {formatAmount(baseVal)} kr
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        {isUnit ? `${formatNumber(item.unitCount || 0)} st á ${formatAmount(item.valuePerUnit || 0)} kr` : 'Månadslön'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">Total kostnad</p>
                      <p className="text-sm font-semibold text-indigo-600 tabular-nums">{formatAmount(loadedCost)} kr</p>
                      <p className="text-xs text-indigo-300 font-bold">Inkl. soc. avg</p>
                    </div>
                  </div>
                
                  {item.aiMotivation && (
                    <div className="pt-4 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <BrainCircuit size={12} className="text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">AI Motivering</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        "{item.aiMotivation}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-lg">
                    <ShieldCheck size={12} />
                  </div>
                </div>
              </div>
            );
          })}
          {(!payrollCat?.items || payrollCat.items.length === 0) && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Users size={32} className="text-slate-300 mb-4" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ingen personal registrerad ännu</p>
              <p className="text-xs text-slate-300 mt-2">Använd AI-generatorn för att få rekommendationer</p>
            </div>
          )}
        </div>
      </div>

      {/* Financing & Loans Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-100">
              <Landmark size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-tight">Lån & Kapitalstruktur</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">Hur din satsning finansieras</p>
            </div>
          </div>

          <div className="space-y-4">
            {data.costCategories.find(c => c.id === 'cat-10')?.items.map((loan, idx) => (
              <div key={loan.id || idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-amber-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h5 className="text-sm font-semibold text-slate-800">{loan.label}</h5>
                  <div className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-semibold uppercase tracking-wide">
                    {loan.interestRate}% Ränta
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Lånebelopp</p>
                    <p className="text-md font-semibold text-slate-900">{formatAmount(Number(loan.loanAmount) || 0)} kr</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Månadskostnad</p>
                    <p className="text-md font-semibold text-amber-600">{formatAmount(Number(loan.value) || 0)} kr</p>
                  </div>
                </div>

                {loan.aiMotivation && (
                  <div className="flex gap-3 items-start bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                    <BrainCircuit size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">"{loan.aiMotivation}"</p>
                  </div>
                )}
              </div>
            ))}
            {(!data.costCategories.find(c => c.id === 'cat-10')?.items || data.costCategories.find(c => c.id === 'cat-10')?.items.length === 0) && (
              <div className="py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Inga lån i modellen</p>
                <p className="text-xs text-slate-300">Modellen är 100% egenfinansierad</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Timeline Section */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-100">
              <Rocket size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-tight">Initial Investeringsfas</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">Setup-kostnader & Tidiga Investeringar</p>
            </div>
          </div>

          <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {(data.milestones || []).map((ms, idx) => (
              <div key={ms.id || idx} className="relative group">
                <div className="absolute -left-[25px] top-1 w-4 h-4 bg-white border border-emerald-500 rounded-full z-10 group-hover:scale-125 transition-transform" />
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Månad {ms.targetMonth}</span>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">FAS {idx + 1}</span>
                  </div>
                  <h5 className="text-sm font-semibold text-slate-800 mb-2">{ms.title}</h5>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-emerald-50/50 group-hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={12} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Mål: {ms.kpi} {formatNumber(ms.targetValue)}</span>
                    </div>
                    {ms.description && (
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">"{ms.description}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!data.milestones || data.milestones.length === 0) && (
              <div className="py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ingen plan genererad</p>
                <p className="text-xs text-slate-300">AI:n skapar en plan när du genererar en modell</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative group border-b-8 border-b-amber-500/10">
          <h4 className="font-semibold text-slate-800 uppercase text-xs w-full flex items-center gap-2 tracking-wider justify-center mb-4">
            <Target size={16} className="text-black" /> Operativt Break-Even
            <InfoTooltip 
              text="Den omsättningsnivå där bolaget täcker alla sina fasta kostnader." 
              definition="Den specifika månad när intäkterna täcker dina fasta driftkostnader (inkl marknadsföring) utan rött resultat."
              calculation="När Månadens intäkt > Månadens Utgifter (exkl start-investeringar)."
            />
          </h4>
          <div className="flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-slate-900 tabular-nums">{formatAmount(results.operationalBreakEven)} <span className="text-xl">kr</span></span>
            <div className="mt-4 px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-md bg-slate-50 text-slate-600 border-slate-200">Målsättning</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative group border-b-8 border-b-emerald-500/10">
          <h4 className="font-semibold text-slate-800 uppercase text-xs w-full flex items-center gap-2 tracking-wider justify-center mb-4">
            <ShieldCheck size={16} className="text-black" /> Säkerhetsmarginal
            <InfoTooltip 
              text="Hur mycket omsättningen kan sjunka innan bolaget går med förlust." 
              definition="Mått på risk - hur mycket stötdämpning har du innan du får betalningsproblem om säljet dippar."
              calculation="(Dagens Omsättning - Omsättning vid Break-Even) / Dagens Omsättning."
              example="En marginal på 20% innebär att du kan tappa 20% av dina kunder och ändå klara kostnaderna."
            />
          </h4>
          <div className="flex flex-col items-center justify-center">
            <span className={`text-4xl font-semibold tabular-nums ${results.safetyMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{formatNumber(results.safetyMargin, 1)}<span className="text-xl">%</span></span>
            <div className={`mt-4 px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-md ${results.safetyMargin >= 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
              {results.safetyMargin >= 20 ? 'God marginal' : 'Låg marginal'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
