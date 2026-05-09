
import React, { useState, useMemo } from 'react';
import { 
  Globe, TrendingUp, Sparkles, Scale, Info, 
  Trash2, CheckCircle2, AlertTriangle, 
  Zap, ChevronRight, Activity,
  Briefcase, Rocket, ShieldCheck,
  Users, Share2, User, RotateCcw, HelpCircle, ArrowRight,
  ArrowUpRight, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessData, CalculationResult, BudgetMember } from '../types';
import { formatNumber, formatAmount } from '../lib/calculations';
import { FormattedNumberInput } from './FormattedNumberInput';
import { InfoTooltip } from './InfoTooltip';

interface StrategySectionProps {
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  results: CalculationResult;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StrategySection: React.FC<StrategySectionProps> = ({ 
  data, setData, results, onShowToast 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sensitivity' | 'share'>('sensitivity');
  const [sensitivityInputs, setSensitivityInputs] = useState({
    priceChange: 0,
    volumeChange: 0,
    costChange: 0
  });

  // SENSITIVITY ANALYSIS
  const sensitivityResult = useMemo(() => {
    const { priceChange, volumeChange, costChange } = sensitivityInputs;
    
    // Simple linearized impact model
    // Revenue impact: baseRevenue * (1 + priceChange/100) * (1 + volumeChange/100)
    const baseRevenue = results.totalRevenue || 0;
    const baseExpenses = results.totalMonthlyExpenses || 0;
    const baseProfit = baseRevenue - baseExpenses;
    
    const newRevenue = baseRevenue * (1 + priceChange/100) * (1 + volumeChange/100);
    const newExpenses = baseExpenses * (1 + costChange/100);
    const newProfit = newRevenue - newExpenses;
    
    return {
      baseRevenue,
      baseProfit,
      revenue: newRevenue,
      profit: newProfit,
      revenueDiff: newRevenue - baseRevenue,
      profitDiff: newProfit - baseProfit,
      marginBase: baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0,
      marginNew: newRevenue > 0 ? (newProfit / newRevenue) * 100 : 0
    };
  }, [results, sensitivityInputs]);

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Header Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Strategisk Analys</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-2 flex items-center gap-2">
              <Sparkles size={12} className="text-amber-500" />
              Identifiera kritiska tillväxtfaktorer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Motor Aktiv</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1.5 border border-slate-100 max-w-sm mx-auto shadow-sm">
        {[
          { id: 'sensitivity', label: 'Simulator', icon: Activity },
          { id: 'share', label: 'Samarbeta', icon: Share2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === tab.id ? 'bg-white text-slate-950 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'sensitivity' && (
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-950 p-4 rounded-2xl shadow-xl shadow-slate-100">
                    <Activity className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Simulator</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Identifiera kritiska tillväxtfaktorer med simulering.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSensitivityInputs({ priceChange: 0, volumeChange: 0, costChange: 0 })}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all text-xs font-bold uppercase tracking-wide active:scale-95 group"
                >
                  <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                  Nollställ
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
                {/* Vertical Divider for Desktop */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2" />

                {/* Simulation Controls */}
                <div className="space-y-10 lg:pr-8">
                  <div className="space-y-8">
                    {/* Price Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold uppercase text-slate-900 tracking-wide">Prisändring</label>
                          <InfoTooltip 
                            text="Hur mycket du ändrar priset per såld enhet eller tjänst." 
                            definition="Testa vad som händer med sista raden om du lanserar nya, marginellt högre eller lägre prisnivåer."
                            calculation="Påverkar Omsättning (direkt på befintlig volym)."
                            example="En prishöjning med 5% rinner nästan alltid till 100% ner till vinsten."
                          />
                        </div>
                        <div className="text-xl font-semibold shadow-sm px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                          {sensitivityInputs.priceChange}%
                        </div>
                      </div>
                      <input 
                        type="range" min="-30" max="30" step="1" 
                        value={sensitivityInputs.priceChange}
                        onChange={(e) => setSensitivityInputs({...sensitivityInputs, priceChange: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">
                         <span>Sänk Pris</span>
                         <span>Marknadsvärde</span>
                         <span>Premium</span>
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold uppercase text-slate-900 tracking-wide">Volymändring</label>
                          <InfoTooltip 
                            text="Antalet sålda enheter eller projekt." 
                            definition="Testar bolagets känslighet för kundbortfall (churn) eller hastig försäljningstillväxt."
                            calculation="Ändrar mängden sålda enheter, vilket påverkar *både* omsättning och Rörliga Kostnader (COGS)."
                            example="Tappar du 20% volym slipper du även köpa in vissa varor, därmed slår det mildare än ett rent pristapp."
                          />
                        </div>
                        <div className="text-xl font-semibold shadow-sm px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                          {sensitivityInputs.volumeChange}%
                        </div>
                      </div>
                      <input 
                        type="range" min="-50" max="100" step="5" 
                        value={sensitivityInputs.volumeChange}
                        onChange={(e) => setSensitivityInputs({...sensitivityInputs, volumeChange: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">
                         <span>Kundtapp</span>
                         <span>Nuvarande</span>
                         <span>Skalning</span>
                      </div>
                    </div>

                    {/* Cost Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold uppercase text-slate-900 tracking-wide">Kostnadsändring</label>
                          <InfoTooltip 
                            text="Förändring i dina månatliga utgifter." 
                            definition="Gör det möjligt att stresstesta fasta avskrivningar, kontorshyra eller inflationschocker på löner m.m."
                            calculation="Slår procentuellt upp eller ned på dina fasta utgifter per månad."
                          />
                        </div>
                        <div className="text-xl font-semibold shadow-sm px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                          {sensitivityInputs.costChange}%
                        </div>
                      </div>
                      <input 
                        type="range" min="-20" max="50" step="1" 
                        value={sensitivityInputs.costChange}
                        onChange={(e) => setSensitivityInputs({...sensitivityInputs, costChange: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">
                         <span>Effektivisering</span>
                         <span>Status Quo</span>
                         <span>Expansion</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Insight Advisor */}
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] relative group mt-10">
                    <div className="flex gap-6 items-start">
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-slate-900" />
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-900">Strategisk Insikt</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {sensitivityInputs.priceChange > 5 && sensitivityInputs.volumeChange < 0 && Math.abs(sensitivityInputs.volumeChange) < sensitivityInputs.priceChange
                              ? "Ditt scenario visar att en prishöjning ger en netto-positiv effekt trots tappat volym. Detta indikerar att du har prissättningskraft. Överväg att fokusera på mer lönsamma kundsegment snarare än ren volym."
                              : sensitivityInputs.volumeChange > 20 && sensitivityInputs.costChange < 5
                              ? "Du siktar på aggressiv expansion. Med en så stor volymökning bör du analysera din leveranskapacitet – klarar organisationen trycket utan att kvaliteten sänks?"
                              : sensitivityInputs.costChange < 0 
                              ? "Varje krona sparad i fasta kostnader går direkt till sista raden. Detta stärker ditt kassaflöde utan att kräva ökad försäljningsinsats."
                              : sensitivityInputs.priceChange < 0 && sensitivityInputs.volumeChange > 10
                              ? "Du testar en penetrationsstrategi. Kontrollera täckningsbidraget per enhet så att du inte säljer dig till en förlust för varje ny kund."
                              : "Små justeringar kan transformera din lönsamhet. I din bransch (" + data.industry + ") är marginalerna känsliga. Överväg att arbeta med värde-baserad prissättning."}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 lg:pl-12">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Revenue Impact Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wide">Simulerad Omsättning</span>
                        </div>
                        <div className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${sensitivityResult.revenueDiff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {sensitivityResult.revenueDiff >= 0 ? '+' : ''}{formatNumber(sensitivityResult.revenueDiff / (sensitivityResult.baseRevenue || 1) * 100)}%
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-4xl font-bold tracking-tight text-slate-950 tabular-nums">{formatAmount(sensitivityResult.revenue)}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Kalkylvärde / Månad</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-tight">Baslinje</p>
                          <p className="text-sm font-bold text-slate-300 line-through tabular-nums">{formatAmount(sensitivityResult.baseRevenue)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Profit Impact Card */}
                    <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-900 text-white shadow-2xl shadow-slate-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={120} />
                      </div>
                      <div className="relative z-10 font-sans">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            <span className="text-xs font-bold uppercase text-slate-500 tracking-wide">Simulerat Resultat</span>
                          </div>
                          <div className={`text-xs font-bold uppercase px-3 py-1 rounded-lg bg-white/10 text-white backdrop-blur-sm`}>
                            {sensitivityResult.profitDiff >= 0 ? '+' : ''}{formatNumber(sensitivityResult.profitDiff / (Math.abs(sensitivityResult.baseProfit) || 1) * 100)}%
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-4xl font-bold tracking-tight text-white tabular-nums">{formatAmount(sensitivityResult.profit)}</p>
                            <div className="flex items-center gap-3 mt-3">
                               <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/5">
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Vinstmarginal (Netto):</span>
                                 <span className="text-xs font-bold text-emerald-400 tabular-nums">{formatNumber(sensitivityResult.marginNew)}%</span>
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1 tracking-tight">Baslinje</p>
                            <p className="text-sm font-bold text-white/30 tabular-nums">{formatAmount(sensitivityResult.baseProfit)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend/Education Footer - Minimalist version */}
                  <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Priselasticitet</h6>
                        <p className="text-xs text-slate-500 leading-snug">Visar hur känsliga dina kunder är för prisförändringar.</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Operativ Hävstång</h6>
                        <p className="text-xs text-slate-500 leading-snug">Förmågan att öka vinsten snabbare än intäkterna genom kontroll på kostnaderna.</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'share' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-700">
             <div className="flex items-center gap-3 mb-8">
               <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
                  <Share2 className="text-white w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-xl font-semibold uppercase tracking-tight text-white">Samarbeta & Dela</h3>
                  <p className="text-xs text-slate-400 mt-1">Bjud in kollegor eller investerare att se din plan.</p>
               </div>
            </div>

            <div className="p-10 bg-slate-800 rounded-3xl border border-slate-700 text-center space-y-6">
               <div className="mx-auto bg-slate-700 p-4 rounded-full w-fit">
                  <Globe size={40} className="text-blue-400" />
               </div>
               <h4 className="text-2xl font-semibold uppercase tracking-tight">Offentlig Delningslänk</h4>
               <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                 Genom att dela denna länk kan andra se (men inte ändra) din aktuella budget och prognos direkt i webbläsaren.
               </p>
               
               <div className="max-w-xl mx-auto flex items-center gap-2 p-2 bg-slate-900 rounded-2xl border border-slate-700">
                  <input 
                    readOnly 
                    value={window.location.href}
                    className="flex-1 bg-transparent px-4 text-xs font-mono text-blue-400 outline-none"
                  />
                  <button 
                    onClick={() => {
                       navigator.clipboard.writeText(window.location.href);
                       onShowToast("Länk kopierad till urklipp!", "success");
                    }}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-blue-500 transition-all"
                  >
                    Kopiera
                  </button>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800">
               <h4 className="text-xs font-semibold uppercase text-blue-400 tracking-wide mb-6 flex items-center gap-2">
                 <Users size={14} /> 
                 Bjud in medarbetare
               </h4>
               
               <form 
                 onSubmit={(e) => {
                   e.preventDefault();
                   const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                   if (!email) return;
                   
                   const newMember: BudgetMember = {
                     email: email.toLowerCase(),
                     role: 'editor',
                     joinedAt: Date.now()
                   };
                   
                   setData({
                     ...data,
                     members: [...(data.members || []), newMember]
                   });
                   onShowToast(`${email} har lagts till som medredaktör.`, "success");
                   (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value = '';
                 }}
                 className="flex items-center gap-2 mb-6"
               >
                  <input 
                    name="email"
                    placeholder="E-post till rådgivare eller kollega..."
                    type="email"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                  />
                  <button 
                    type="submit"
                    className="bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Bjud in
                  </button>
               </form>

               <div className="space-y-3">
                  {(data.members || []).map(member => (
                    <div key={member.email} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 group">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                             <User size={14} className="text-slate-400" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-200">{member.email}</p>
                             <p className="text-xs font-semibold uppercase text-slate-500 tracking-tight">{member.role === 'owner' ? 'Ägare' : 'Redaktör'}</p>
                          </div>
                       </div>
                       {member.role !== 'owner' && (
                         <button 
                           onClick={() => {
                             setData({
                               ...data,
                               members: (data.members || []).filter(m => m.email !== member.email)
                             });
                           }}
                           className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-start gap-4">
                  <Users className="text-slate-500 shrink-0" size={20} />
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1">Multi-user access</h5>
                    <p className="text-xs text-slate-500">Hanteras automatiskt via Firebase. Dina kollegor ser uppdateringar i realtid när de loggar in på samma konto.</p>
                  </div>
               </div>
               <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-start gap-4">
                  <ShieldCheck className="text-slate-500 shrink-0" size={20} />
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1">Säkerhetsnivå</h5>
                    <p className="text-xs text-slate-500">All data är krypterad och skyddas av dina inloggningsuppgifter. Delade länkar ger endast läsbehörighet.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
