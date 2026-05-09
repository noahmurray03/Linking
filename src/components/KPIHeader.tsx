import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, Flame, Clock, Info, Landmark, Wallet, ChevronDown, Layers3, Activity } from 'lucide-react';
import { CalculationResult } from '../types';
import { formatAmount, formatNumber } from '../lib/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';

interface KPIHeaderProps {
  results: CalculationResult;
  forecastDuration: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const KPIHeader: React.FC<KPIHeaderProps> = ({ results, forecastDuration, selectedYear, onYearChange }) => {
  const [activeMetricIds, setActiveMetricIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('kpiFavorites_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) return parsed;
      } catch(e){}
    }
    return ['revenue', 'profit', 'cashFlow', 'grossMargin', 'margin', 'expenses', 'burnRate', 'netVat'];
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('kpiFavorites_v2', JSON.stringify(activeMetricIds));
  }, [activeMetricIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const yearData = React.useMemo(() => {
    if (!results.forecast || results.forecast.length === 0) return null;
    
    const startMonthIndex = (selectedYear - 1) * 12;
    const endMonthIndex = Math.min(selectedYear * 12 - 1, results.forecast.length - 1);
    
    if (startMonthIndex > endMonthIndex) return null; // year out of bounds

    const yearForecast = results.forecast.slice(startMonthIndex, endMonthIndex + 1);
    const lastMonthData = yearForecast[yearForecast.length - 1];

    const revenue = (results[`year${selectedYear}Revenue` as keyof CalculationResult] as number) || 0;
    const profit = (results[`year${selectedYear}Profit` as keyof CalculationResult] as number) || 0;
    const margin = (results[`year${selectedYear}Margin` as keyof CalculationResult] as number) || 0;
    const cashFlow = (results[`year${selectedYear}CashFlow` as keyof CalculationResult] as number) || 0;
    
    const breakdownSlice = results.forecastBreakdown?.slice(startMonthIndex, endMonthIndex + 1) || [];
    
    // Calculate year-specific gross margin
    // COGS category might be named 'Direkta kostnader (COGS)' or similar. We look for 'cogs' or 'direkta' in category name.
    let yearVariableCosts = 0;
    let yearNetVat = 0;
    
    breakdownSlice.forEach(m => {
      yearNetVat += m.netVat || 0;
      m.expenses.forEach(exp => {
        if (exp.category.toLowerCase().includes('cogs') || exp.category.toLowerCase().includes('direkta')) {
          yearVariableCosts += exp.value;
        }
      });
    });
    
    const yearGrossProfit = revenue - yearVariableCosts;
    const yearGrossMargin = revenue > 0 ? (yearGrossProfit / revenue) * 100 : 0;

    const totalExpenses = yearForecast.reduce((sum, m) => sum + m.expenses, 0);
    const avgBurnRate = totalExpenses / yearForecast.length;

    // Runway at end of the selected year
    const runwayAtEnd = lastMonthData.cumulativeCashFlow > 0 && avgBurnRate > 0 
      ? lastMonthData.cumulativeCashFlow / avgBurnRate 
      : (lastMonthData.cumulativeCashFlow > 0 ? Infinity : 0);

    return {
      revenue,
      profit,
      margin,
      cashFlow,
      grossMargin: yearGrossMargin,
      netVatBalance: yearNetVat,
      endCash: lastMonthData.cumulativeCashFlow,
      endMonthIndex: endMonthIndex + 1,
      avgBurnRate,
      runwayAtEnd,
      totalExpenses
    };
  }, [results, selectedYear]);

  const kpiDefinitions: Record<string, any> = {
    revenue: {
      id: 'revenue',
      label: 'Årets Omsättning',
      subLabel: `Total försäljning`,
      value: `${formatAmount(yearData?.revenue || 0)} kr`,
      explanation: `Total omsättning för valt år (${selectedYear}). Inkluderar alla intäktsströmmar.`,
      definition: `Den totala summa pengar som företaget drar in från sin försäljning av varor och tjänster under det valda året, exklusive moms.`,
      calculation: `Summan av inkomsterna för månaderna under år ${selectedYear}.`,
      example: `Säljer du mjukvara för 100 000 kr per månad blir årets omsättning 1 200 000 kr.`,
      icon: <DollarSign size={14} />,
      color: 'text-emerald-400',
      status: 'good',
    },
    profit: {
      id: 'profit',
      label: `Årets Resultat`,
      subLabel: `Vinst / Förlust`,
      value: `${formatAmount(yearData?.profit || 0)} kr`,
      explanation: `Ditt nettoresultat under enbart år ${selectedYear}.`,
      definition: `Företagets ekonomiska utfall under det valda året. Visar om bolaget genererar ett överskott eller underskott.`,
      calculation: `Årets Omsättning minus Årets Totala Kostnader. Omfattar inte amorteringar eller moms.`,
      example: `Omsättning 1 200 000 kr minus kostnader 1 000 000 kr ger årets resultat på 200 000 kr.`,
      icon: <TrendingUp size={14} />,
      color: (yearData?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
      status: (yearData?.profit || 0) >= 0 ? 'good' : 'critical'
    },
    cashFlow: {
      id: 'cashFlow',
      label: `Årets Kassaflöde`,
      subLabel: `In- / Utbetalningar`,
      value: `${formatAmount(yearData?.cashFlow || 0)} kr`,
      explanation: `Hur mycket kassan förändrades under enbart år ${selectedYear}.`,
      definition: `Nettoförändringen av bankkontots saldo under året.`,
      calculation: `Alla faktiska inbetalningar minus alla faktiska utbetalningar för det aktuella året. Ej ackumulerat.`,
      example: `Gick det ut mer pengar än vad som kom in blir kassaflödet negativt även om resultatet stundvis är positivt.`,
      icon: <Wallet size={14} />,
      color: (yearData?.cashFlow || 0) >= 0 ? 'text-blue-400' : 'text-orange-400',
      status: (yearData?.cashFlow || 0) >= 0 ? 'good' : 'warning'
    },
    grossMargin: {
      id: 'grossMargin',
      label: 'Bruttomarginal',
      subLabel: `Produkteffektivitet`,
      value: `${(yearData?.grossMargin || 0).toFixed(1)}%`,
      explanation: `Din bruttomarginal efter direkta kostnader för år ${selectedYear}.`,
      definition: `Vinsten på produkten/tjänsten efter rörliga COGS under det aktuella året.`,
      calculation: `(Årets Omsättning minus Årets Direkta Kostnader) dividerat med Årets Omsättning.`,
      example: `Minskar inköpspriset i år 3 så stiger bruttomarginalen.`,
      icon: <Layers3 size={14} />,
      color: (yearData?.grossMargin || 0) >= 40 ? 'text-emerald-400' : (yearData?.grossMargin || 0) >= 20 ? 'text-amber-400' : 'text-red-400',
      status: 'neutral'
    },
    margin: {
      id: 'margin',
      label: 'Vinstmarginal',
      subLabel: `Bolagets nettomarginal`,
      value: `${(yearData?.margin || 0).toFixed(1)}%`,
      explanation: `Förväntad vinstmarginal för enbart år ${selectedYear} efter alla kostnader.`,
      definition: `Visar hur många procent av årets omsättning som i slutändan blir vinst.`,
      calculation: `(Årets Resultat / Årets Omsättning) * 100.`,
      example: `Om omsättningen är 1 000 000 kr och resultatet är 150 000 kr, är nettomarginalen 15%.`,
      icon: <TrendingUp size={14} />,
      color: (yearData?.margin || 0) >= 15 ? 'text-emerald-400' : (yearData?.margin || 0) >= 0 ? 'text-amber-400' : 'text-red-400',
      status: 'neutral'
    },
    expenses: {
      id: 'expenses',
      label: 'Årets Kostnader',
      subLabel: `Alla fasta/rörliga utgifter`,
      value: `${formatAmount(yearData?.totalExpenses || 0)} kr`,
      explanation: `Dina totala omkostnader för enbart år ${selectedYear}.`,
      definition: `Exakt hur mycket företaget lajdade ut på rörelse- och rörliga utgifter under året.`,
      calculation: `Summan av lokaler, löner, inköpsvolymer och prenumerationer under år ${selectedYear}.`,
      example: `Ett värde av 1 200 000 kr betyder ett utflöde på snitt 100 000 kr/mån i drift.`,
      icon: <Flame size={14} />,
      color: 'text-orange-400',
      status: 'warning'
    },
    burnRate: {
      id: 'burnRate',
      label: 'Snitt. Burn Rate',
      subLabel: `Per snittmånad`,
      value: `${formatAmount(yearData?.avgBurnRate || 0)} kr/mån`,
      explanation: `Genomsnittlig månadskostnad under år ${selectedYear}.`,
      definition: `Här avses hur mycket bruttoutgifter bolaget i genomsnitt fakturerades varje månad under det valda året.`,
      calculation: `Årets totala utgifter dividerat med 12 månader.`,
      example: `Årets utgifter på 1,2 milj ger en burn rate på 100 000 kr/mån.`,
      icon: <Clock size={14} />,
      color: 'text-orange-400',
      status: 'warning'
    },
    netVat: {
      id: 'netVat',
      label: 'Momsbalans (Netto)',
      subLabel: `In/Ut-moms för året`,
      value: `${formatAmount(yearData?.netVatBalance || 0)} kr`,
      explanation: `Beräknad in-/ut-momsbalans enbart år ${selectedYear}.`,
      definition: `Differensen mellan den moms bolaget lade på försäljning och betalade vid inköp.`,
      calculation: `Årets Utgående Moms minus Årets Ingående Moms.`,
      example: `Momsöverskott ger andrum, men netto ska till slut betalas till SKV.`,
      icon: <Landmark size={14} />,
      color: (yearData?.netVatBalance || 0) >= 0 ? 'text-orange-400' : 'text-emerald-400',
      status: 'neutral'
    },
    endCash: {
      id: 'endCash',
      label: 'Kassa (Årsslut)',
      subLabel: `Slutet av år ${selectedYear}`,
      value: `${formatAmount(yearData?.endCash || 0)} kr`,
      explanation: `Din förväntade bankbalans vid slutet av år ${selectedYear}.`,
      definition: `Mängden likvida medel vid årets sista dag, med hänsyn tagen till historiken.`,
      calculation: `Startkapital minus historiskt utflöde fram till och med år ${selectedYear}s slut.`,
      example: `Negativt värde innebär att du kommer sakna kapital utan extern finansiering.`,
      icon: <Wallet size={14} />,
      color: (yearData?.endCash || 0) >= 0 ? 'text-blue-400' : 'text-red-400',
      status: 'neutral'
    },
    runway: {
      id: 'runway',
      label: 'Runway',
      subLabel: `Månader kvar vid årsslut`,
      value: yearData?.runwayAtEnd === Infinity ? '∞' : `${(yearData?.runwayAtEnd || 0).toFixed(1)} mån`,
      explanation: `Hur länge kapitalet räcker efter år ${selectedYear}.`,
      definition: `Kritisk metrisk som anger hur många månader företaget överlever.`,
      calculation: `Årsslutets kassa dividerat med årets snitt Burn Rate.`,
      example: `En Runway på 6 månader betyder att kassan är slut om 6 månader om intäkter uteblir.`,
      icon: <Activity size={14} />,
      color: (yearData?.runwayAtEnd || 0) > 6 ? 'text-emerald-400' : 'text-red-400',
      status: 'neutral'
    },
    mrr: {
      id: 'mrr',
      label: 'MRR (SaaS)',
      subLabel: 'Snitt per månad (Globalt)',
      value: `${formatAmount(results.mrr)} kr`,
      explanation: 'Månadsvis återkommande intäkter.',
      definition: 'Månadsvis återkommande intäkter från abonnemang i slutet av prognosen.',
      calculation: 'Summan av alla prenumerationsintäkter per månad i den sista referensmånaden.',
      example: 'Vid 100 kunder som betalar 100kr/månad blir MRR 10 000kr.',
      icon: <TrendingUp size={14} />,
      color: results.mrr > 0 ? 'text-emerald-400' : 'text-slate-600',
      status: 'neutral'
    },
    cac: {
      id: 'cac',
      label: 'CAC',
      subLabel: 'Kundanskaffningskostnad',
      value: `${formatAmount(results.cac)} kr`,
      explanation: 'Genomsnittlig kostnad för att förvärva en ny kund över hela kalkylen.',
      definition: 'Hur mycket det i genomsnitt kostar i marknadsföring att få in en ny betalande kund.',
      calculation: 'Total marknadsföring dividerat med antal nya anskaffade kunder.',
      example: 'En budget på 10 000 kr som ger 10 nya kunder betyder en CAC på 1 000 kr per kund.',
      icon: <TrendingUp size={14} />,
      color: 'text-amber-400',
      status: 'neutral'
    },
    ltv: {
      id: 'ltv',
      label: 'LTV',
      subLabel: 'Kundens Livstidsvärde',
      value: `${formatAmount(results.ltv)} kr`,
      explanation: 'Genomsnittligt värde i intäkter från en aktiverad kund överhela kalkylen.',
      definition: 'Totalt intäktsbidrag en prenumererande kund genomsnittligen förväntas generera över hela sin tid i företaget.',
      calculation: 'Snittvärde per prenumeration.',
      example: 'Betalar en kund 100 kr/mån och stannar i 2 år är LTV 2 400 kr.',
      icon: <Layers3 size={14} />,
      color: 'text-emerald-400',
      status: 'neutral'
    },
    ltvCac: {
      id: 'ltvCac',
      label: 'LTV/CAC',
      subLabel: 'Livstidsvärde / CAC',
      value: results.ltvCacRatio.toFixed(2),
      explanation: 'Mäter hur mycket en prenumerant är värd jämfört med skaffkostnaden.',
      definition: 'Värden > 3.0 anses ofta bra för SaaS-startups (LTV är 3 gånger högre än CAC).',
      calculation: 'LTV dividerat med CAC.',
      example: 'Ett LTV på 3000 kr och en CAC på 1000 kr ger 3.0 i ratio.',
      icon: <Layers3 size={14} />,
      color: results.ltvCacRatio >= 3 ? 'text-emerald-400' : (results.ltvCacRatio >= 1 ? 'text-amber-400' : 'text-red-400'),
      status: 'neutral'
    },
    churn: {
      id: 'churn',
      label: 'Churn Rate',
      subLabel: 'Månadsvist kundtapp',
      value: `${(results.churn * 100).toFixed(1)}%`,
      explanation: 'Andel kunder som avslutar sin prenumeration var 30:e dag i snitt.',
      definition: 'Bortfallet begränsar SaaS-LTV:ns potentiella uppsida.',
      calculation: 'Bortfallna prenumerationer per månad dividerat med total kundbas.',
      example: 'Tappar du 5 av 100 kunder är churn rate 5%.',
      icon: <Flame size={14} />,
      color: results.churn < 0.05 ? 'text-emerald-400' : 'text-red-400',
      status: 'neutral'
    },
    breakEvenSales: {
      id: 'breakEvenSales',
      label: 'Break-Even (Oms)',
      subLabel: 'Krav på dags-snitt',
      value: `${formatAmount(results.operationalBreakEven)} kr`,
      explanation: 'Den månatliga omsättning som krävs för operationellt nollresultat.',
      definition: 'Nollpunktsomsättning i genomsnitt över driften.',
      calculation: 'Utgifter dividerat med bruttomarginal.',
      example: 'Fasta kostnader på 50 000 och marginal på 50% = Behöver 100 000 kr in.',
      icon: <TrendingUp size={14} />,
      color: 'text-blue-400',
      status: 'neutral'
    },
    peakCapitalNeed: {
      id: 'peakCapitalNeed',
      label: 'Peak Kapitalbehov',
      subLabel: 'Lägsta dal i kassan',
      value: `${formatAmount(-results.peakCapitalNeed)} kr`,
      explanation: 'Exakt hur mycket externt nettokapital du som minst behöver skjuta in före Break-Even.',
      definition: 'Den mest negativa kassaflödespunkten under hela resan (det kapitalbehov som dikterar din minimala storlek på investeringsrunda).',
      calculation: 'Lägsta värdet av Ackumulerad Kassa under hela analysperioden.',
      example: 'Om värdet visar 500 000 kr, behöver du få in minst det för att täcka upp den initiala burn raten.',
      icon: <Landmark size={14} />,
      color: results.peakCapitalNeed < 0 ? 'text-red-400' : 'text-emerald-400',
      status: 'neutral'
    },
    totalDebt: {
      id: 'totalDebt',
      label: 'Max Belåning',
      subLabel: 'Slutlig skuld',
      value: `${formatAmount(results.totalDebt)} kr`,
      explanation: 'Nettoskuld vid slutet av analysen (kapitalbelopp).',
      definition: 'Summan av alla ingående lån som är obetalda.',
      calculation: 'Totala lån minus gjorda amorteringar.',
      example: 'Utan lån blir detta värde 0 kr. Med banklån på 1M som amorterats till 500k, står 500 000 kr.',
      icon: <Wallet size={14} />,
      color: results.totalDebt === 0 ? 'text-emerald-400' : 'text-orange-400',
      status: 'neutral'
    },
    holidayDebt: {
      id: 'holidayDebt',
      label: 'Semesterskuld',
      subLabel: 'Max P-Reserv',
      value: `${formatAmount(results.holidayPayDebt)} kr`,
      explanation: 'Bokförd skuldsättning till framtida semester.',
      definition: 'Outtagen upplupen semesterlön som ska finnas bokförd.',
      calculation: 'Upparbetade semestertillägg över alla aktuella anställningar.',
      example: 'En del av din "osynliga" latenta P-skuld till anställda.',
      icon: <Layers3 size={14} />,
      color: 'text-amber-400',
      status: 'neutral'
    },
    ebitda: {
      id: 'ebitda',
      label: 'Årets EBITDA',
      subLabel: `Est. Driftsresultat År ${selectedYear}`,
      value: `${formatAmount((yearData?.profit || 0) / 0.79)} kr`,
      explanation: 'Grov estimering av vinst före skatt för det valda året.',
      definition: 'Årets operativa vinst, vilket används som bas för typiska bolagsvärderingar (EV/EBITDA-multipel).',
      calculation: 'Årets resultat baklängesräknat för att exkludera systemets est. inkomstskatt (EBITDA-proxy).',
      example: 'Ett EBITDA på 1 miljon. Säljs bolaget värderat till 5x EBITDA så säljs det för 5 miljoner.',
      icon: <TrendingUp size={14} />,
      color: (yearData?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
      status: 'neutral'
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Visar data för:
          </span>
          <select 
            value={selectedYear} 
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-white border border-slate-200 text-black text-xs font-semibold rounded-lg px-3 py-1.5 outline-none hover:border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer shadow-sm"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>År {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <p className="text-xs font-bold text-slate-400">Du kan klicka på valfritt nyckeltal för att byta ut det mot ett annat från systemets totala bibliotek, däribland LTV, Churn eller EBITDA.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 w-full">
      {activeMetricIds.map((kpiId, index) => {
        const kpi = kpiDefinitions[kpiId];
        if (!kpi) return null;
        
        const isHighlighted = index === 0;

        return (
          <div key={index} className="relative group/wrapper">
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
              className={`${
                isHighlighted 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-100 text-slate-900'
              } border p-3 rounded-xl group hover:border-amber-300 hover:shadow-md transition-all cursor-pointer h-full relative z-10`}
            >
              <div className="flex flex-col h-full justify-between pointer-events-none">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-bold uppercase tracking-tight ${isHighlighted ? 'text-white/50' : 'text-slate-400'}`}>
                    {kpi.label}
                  </p>
                  <div className="flex items-center gap-1.5 cursor-pointer pointer-events-auto">
                    <InfoTooltip 
                      text={kpi.explanation} 
                      definition={kpi.definition}
                      calculation={kpi.calculation}
                      example={kpi.example}
                      iconSize={10} 
                    />
                    <div className={`p-0.5 rounded-md opacity-20 group-hover:opacity-100 transition-opacity ${isHighlighted ? 'bg-white/20' : 'bg-slate-100'}`}>
                      <ChevronDown size={10} className={isHighlighted ? 'text-white' : 'text-slate-600'} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <p className={`text-base font-bold tabular-nums tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </p>
                  <p className={`text-xs font-bold opacity-60 ${isHighlighted ? 'text-white' : 'text-slate-500'}`}>
                    {kpi.subLabel}
                  </p>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {editingIndex === index && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 mt-1 z-50 w-full min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-xl p-1 max-h-[300px] overflow-y-auto"
                >
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Byt ut nyckeltal (Röd färg = redan aktiv ovan)</p>
                  </div>
                  {Object.values(kpiDefinitions).map((def) => {
                    const isSelected = def.id === kpiId;
                    const isUsed = activeMetricIds.includes(def.id) && !isSelected;
                    return (
                      <button
                        key={def.id}
                        disabled={isUsed}
                        className={`w-full text-left px-2 py-2 text-xs font-bold rounded-md flex items-center justify-between transition-colors mb-0.5 ${
                          isSelected ? 'bg-amber-50 text-amber-700' : 
                          isUsed ? 'bg-red-50 text-red-300 cursor-not-allowed line-through' : 
                          'hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => {
                          if (isUsed) return;
                          const newIds = [...activeMetricIds];
                          newIds[index] = def.id;
                          setActiveMetricIds(newIds);
                          setEditingIndex(null);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {def.icon}
                          <span className="flex flex-col">
                           <span>{def.label}</span>
                           <span className="text-xs font-normal opacity-70">{def.subLabel}</span>
                          </span>
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      </div>
    </div>
  );
};
