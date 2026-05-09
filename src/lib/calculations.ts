
import { BusinessData, CalculationResult, FinancialItem, MonthlyData, MonthlyForecastBreakdown, RevenueLink } from '../types';
import { CORPORATE_TAX_RATE } from '../constants';

export const formatNumber = (val: number, decimals?: number) => {
  if (val === Infinity) return '∞';
  if (val === undefined || val === null || isNaN(val)) return '0';
  
  const formatted = decimals !== undefined 
    ? val.toFixed(decimals) 
    : val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false });
    
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(",");
};

export const formatAmount = (val: number) => {
  return formatNumber(val);
};

export const calculateUnitCount = (item: Partial<FinancialItem>, monthIndex: number, globalRevenueStartMonth: number) => {
  const startMonth = item.startMonth || globalRevenueStartMonth || 1;
  const m = Math.max(0, (monthIndex + 1) - startMonth);
  const baseCount = Number(item.unitCount) || 0;
  
  if (!item.hasGrowth) return baseCount;

  if (item.targetUnitCount !== undefined && item.rampUpMonths !== undefined && item.rampUpMonths > 0) {
    if (m >= item.rampUpMonths) return item.targetUnitCount;
    return baseCount + (item.targetUnitCount - baseCount) * (m / item.rampUpMonths);
  }

  const growth = (Number(item.newUnitsPerMonth) || 0) * m;
  return baseCount + growth;
};

export const calculatePurchasedCount = (item: Partial<FinancialItem>, monthIndex: number, globalRevenueStartMonth: number) => {
  if (item.isLockedBalance) {
    return calculateUnitCount(item, monthIndex, globalRevenueStartMonth);
  }

  const startMonth = item.startMonth || globalRevenueStartMonth || 1;
  const m = Math.max(0, (monthIndex + 1) - startMonth);
  const basePurchased = Number(item.unitsPurchasedPerMonth) || 0;

  if (!item.hasPurchaseGrowth) return basePurchased;

  if (item.targetPurchasedUnits !== undefined && item.purchaseRampUpMonths !== undefined && item.purchaseRampUpMonths > 0) {
    if (m >= item.purchaseRampUpMonths) return item.targetPurchasedUnits;
    return basePurchased + (item.targetPurchasedUnits - basePurchased) * (m / item.purchaseRampUpMonths);
  }

  const purchaseGrowth = (Number(item.newPurchasedUnitsPerMonth) || 0) * m;
  return basePurchased + purchaseGrowth;
};

export const calculateItemValue = (
  item: FinancialItem, 
  isPersonnel: boolean, 
  totalOverheadPct: number,
  monthIndex: number = 0, 
  revenueStartMonth: number = 1
) => {
  const startMonth = item.startMonth || revenueStartMonth;
  if (monthIndex + 1 < startMonth) return 0;

  if (item.calculationMode === 'asset') {
    return (Number(item.purchasePrice) || 0) / ((Number(item.lifespanYears) || 1) * 12);
  }
  
  if (item.calculationMode === 'loan') {
    const loanStart = Number(item.loanStartMonth) || 1;
    if (monthIndex + 1 < loanStart) return 0;

    const rate = (Number(item.interestRate) || 0) / 100 / 12;
    const totalAmount = Number(item.loanAmount) || 0;
    const startMonthAmort = Number(item.amortizationStartMonth) || 1;
    const amortMonths = Number(item.amortizationMonths) || 60;
    const graceMonths = Number(item.gracePeriodMonths) || 0;
    
    const actualAmortStart = Math.max(startMonthAmort, loanStart + graceMonths);
    const monthsAmortized = Math.max(0, monthIndex - (actualAmortStart - 1));
    const remainingBalance = Math.max(0, totalAmount - (totalAmount / amortMonths) * monthsAmortized);
    
    return remainingBalance * rate;
  }
  
  let val = 0;
  if (item.calculationMode === 'fixed') val += Number(item.value) || 0;
  if (item.calculationMode === 'product') {
    const count = calculateUnitCount(item, monthIndex, revenueStartMonth);
    // Revenue = Sales Price * Count
    return count * (Number(item.valuePerUnit) || 0);
  }
  
  if (item.calculationMode === 'unit') {
    const count = calculateUnitCount(item, monthIndex, revenueStartMonth);
    
    let price = Number(item.valuePerUnit) || 0;
    // Overwrite price if unitCosts are defined
    if (item.unitCosts && item.unitCosts.length > 0) {
      price = item.unitCosts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    }
    
    const excise = Number(item.exciseTaxPerUnit) || 0;
    val += count * (price - excise);
  }
  
  return isPersonnel ? val * (1 + totalOverheadPct / 100) : val;
};

export const calculateResults = (
  data: BusinessData, 
  totalOverheadPct: number, 
  holidayPayRate: number, 
  forecastDuration: number
): CalculationResult => {
  const revenueStartMonth = data.strategicSettings.revenueStartMonth;
  let totalExportCosts = 0;
  const validationWarnings: { type: 'error' | 'warning' | 'info'; message: string; category?: string }[] = [];
  
  // 1. Data Integrity Checks (Self-Audit)
  if (data.revenueStreams.length === 0) {
    validationWarnings.push({ type: 'warning', message: "Inga intäktsströmmar definierade. Modellen visar noll i försäljning.", category: 'Intäkter' });
  }

  const inventoryStreams = data.revenueStreams.filter(s => s.calculationMode === 'product' || s.calculationMode === 'unit');
  inventoryStreams.forEach(s => {
    if ((s.unitsPurchasedPerMonth || 0) < (s.unitCount || 0)) {
      validationWarnings.push({ 
        type: 'warning', 
        message: `Inköpsvolymen för "${s.label}" är lägre än försäljningsvolymen. Lagret kommer att tömmas över tid.`,
        category: 'Logistik'
      });
    }
    if ((s.purchasePricePerUnit || 0) >= (s.valuePerUnit || 0)) {
      validationWarnings.push({ 
        type: 'error', 
        message: `Inköpspriset för "${s.label}" är högre än eller lika med försäljningspriset. Negativ marginal.`,
        category: 'Prissättning'
      });
    }
  });

  const payrollCat = data.costCategories.find(c => c.id === 'cat-payroll' || c.title.toLowerCase().includes('personal'));
  if (payrollCat && payrollCat.items.length > 0 && totalOverheadPct < 20) {
    validationWarnings.push({ 
      type: 'info', 
      message: "Sociala avgifter och overhead är satta lågt (<20%). Detta kan underestimera personalkostnader.",
      category: 'Personal'
    });
  }

  // Pre-process all items once to avoid redundant work in the loop
  const allCostItems: { item: FinancialItem; isPersonnel: boolean; isVariable: boolean; catTitle: string; catId: string }[] = [];
  data.costCategories.forEach(cat => {
    const titleLower = cat.title.toLowerCase();
    const isPersonnel = cat.id === 'cat-payroll' || titleLower.includes('personal') || titleLower.includes('personnel') || titleLower.includes('lön');
    const isVariable = titleLower.includes('direkta') || titleLower.includes('varor') || titleLower.includes('rörliga');
    cat.items.forEach(item => {
      allCostItems.push({ item, isPersonnel, isVariable, catTitle: cat.title, catId: cat.id });
    });
  });

  // Deduplicate items by ID once
  const uniqueCostItems = Array.from(new Map(allCostItems.map(obj => [obj.item.id, obj])).values());

  // Helper to get totals for a specific month
  const getMonthlyTotals = (monthIdx: number) => {
    let revenue = 0;
    let expenses = 0;
    let variable = 0;
    let incomingVat = 0;
    let outgoingVat = 0;
    const revBreakdown: Record<string, { value: number; details: string; vat?: number }> = {};
    const expBreakdown: Record<string, { value: number; items: { label: string; value: number; calculationDetails: string; vat?: number }[] }> = {};
    const cashEvents: { label: string; value: number; type: 'in' | 'out'; details?: string }[] = [];

    // Initial Cash Event
    if (monthIdx === 0 && data.strategicSettings.startingCash > 0) {
      cashEvents.push({ 
        label: "Startkapital", 
        value: data.strategicSettings.startingCash, 
        type: 'in', 
        details: "Eget kapital vid start" 
      });
    }

    const revCountPerMonth: Record<string, number> = {};
    const revGrowthPerMonth: Record<string, number> = {};

    const absoluteMonth = (monthIdx % 12) + 1;
    const isOffSeason = data.strategicSettings?.hasSeasonality 
        && !(data.strategicSettings.activeMonths || []).includes(absoluteMonth);

    data.revenueStreams.forEach(s => {
      let count = calculateUnitCount(s, monthIdx, revenueStartMonth);

      let val = calculateItemValue(s, false, totalOverheadPct, monthIdx, revenueStartMonth);
      let unitsPurchased = 0;

      if (s.calculationMode === 'product' || s.calculationMode === 'unit') {
        unitsPurchased = calculatePurchasedCount(s, monthIdx, revenueStartMonth);
      }

      if (isOffSeason) {
        val = 0;
        count = 0;
        unitsPurchased = 0;
      }

      revCountPerMonth[s.id] = count;
      revGrowthPerMonth[s.id] = s.hasGrowth ? (Number(s.newUnitsPerMonth) || 0) : 0;

      revenue += val;
      
      const vatRate = s.vatRate ?? 25;
      const vatVal = val * (vatRate / 100);
      outgoingVat += vatVal;
      
      let details = "";
      if (s.calculationMode === 'product' || s.calculationMode === 'unit') {
        details = `${formatNumber(count)} st × ${formatAmount(Number(s.valuePerUnit) || 0)} kr / st`;
      } else {
        details = `Fast månadsbelopp${isOffSeason ? ' (Pausad off-season)' : ''}`;
      }

      // Calculate COGS if product or unit mode
      if (s.calculationMode === 'product' || s.calculationMode === 'unit') {
        // Landed Cost Logic
        const isIntl = data.isInternational && s.isInternationalTrade;
        // Inköpspriset är inkluderat i COGS (Direkta kostnader) automatiskt.
        const basePrice = Number(s.purchasePricePerUnit) || 0;
        const excise = Number(s.exciseTaxPerUnit) || 0;
        const customs = isIntl ? (basePrice * (Number(s.customsRate) || 0) / 100) : 0;
        const importFreight = isIntl ? (Number(s.importFreightPerUnit) || 0) : 0;
        const importHandling = isIntl ? (Number(s.importHandlingPerUnit) || 0) : 0;
        
        const landedCostPerUnit = basePrice + excise + customs + importFreight + importHandling; 

        const purchaseExpense = unitsPurchased * landedCostPerUnit;
        
        // VAT on purchases (COGS)
        // Usually 25% for inventory purchases in Sweden
        const purchaseVatRate = 25; 
        const purchaseVat = purchaseExpense * (purchaseVatRate / 100);
        incomingVat += purchaseVat;

        variable += purchaseExpense;
        expenses += purchaseExpense;
        
        if (purchaseExpense > 0) {
          const cogsCatTitle = "Varuinköp";
          if (!expBreakdown[cogsCatTitle]) expBreakdown[cogsCatTitle] = { value: 0, items: [] };
          expBreakdown[cogsCatTitle].value += purchaseExpense;
          expBreakdown[cogsCatTitle].items.push({
            label: `Inköp: ${s.label}`,
            value: purchaseExpense,
            vat: purchaseVat,
            calculationDetails: `${formatNumber(unitsPurchased)} st inköpta × ${formatAmount(landedCostPerUnit)} kr (Landed cost)`
          });
        }

        // Export Costs Logic (Still based on units SOLD)
        if (data.isInternational && s.isInternationalTrade) {
          const exportFreight = Number(s.exportFreightPerUnit) || 0;
          const exportFees = Number(s.exportFeesPerUnit) || 0;
          const totalExportCost = count * (exportFreight + exportFees);
          
          if (totalExportCost > 0) {
            totalExportCosts += totalExportCost;
            const exportCatTitle = "Exportkostnader";
            if (!expBreakdown[exportCatTitle]) expBreakdown[exportCatTitle] = { value: 0, items: [] };
            expBreakdown[exportCatTitle].value += totalExportCost;
            expBreakdown[exportCatTitle].items.push({
              label: `Export: ${s.label}`,
              value: totalExportCost,
              calculationDetails: `${formatNumber(count)} st × ${formatAmount(exportFreight + exportFees)} kr`
            });
            expenses += totalExportCost;
            variable += totalExportCost;
          }
        }
      }

      if (val > 0) {
        revBreakdown[s.label] = { value: val, details, vat: vatVal };
      }
    });

    uniqueCostItems.forEach(({ item, isPersonnel, isVariable, catTitle, catId }) => {
      let val = 0;
      let details = "";
      
      // Handle revenue links (multiple or single legacy)
      const links: RevenueLink[] = item.revenueLinks || [];
      
      // Fallback for legacy single link
      if (links.length === 0 && item.isLinkedToRevenue && item.linkedRevenueId) {
        links.push({
          id: 'legacy',
          revenueId: item.linkedRevenueId,
          unitCosts: item.unitCosts || []
        });
      }

      let subItemsToPush: { label: string, value: number, vat: number, calculationDetails: string }[] = [];

      if (links.length > 0) {
        let totalLinkedVal = 0;
        
        links.forEach(link => {
          const linkedRev = data.revenueStreams.find(rs => rs.id === link.revenueId);
          if (linkedRev) {
            // Volume remains zero until the linked revenue actually starts
            const revStart = linkedRev.startMonth || revenueStartMonth;
            if (monthIdx + 1 < revStart) return;

            const count = revCountPerMonth[link.revenueId] || 0;
            const revenueValuePerUnit = Number(linkedRev.valuePerUnit) || 0;
            
            link.unitCosts.forEach(c => {
              if ((c.label || '').toLowerCase().startsWith('inköp:')) return;

              const cVal = Number(c.value) || 0;
              const unitPrice = c.isPercentage ? (revenueValuePerUnit * cVal / 100) : cVal;
              const linkVal = count * unitPrice;
              totalLinkedVal += linkVal;
              
              if (count > 0 && linkVal > 0) {
                const calculatedStr = c.isPercentage ? `${cVal}% (${formatAmount(unitPrice)} kr)` : `${formatAmount(cVal)} kr`;
                const detailsStr = `${linkedRev.label}: ${formatNumber(count)} st × ${calculatedStr} / st`;
                
                const myVatRate = item.vatRate ?? (isPersonnel ? 0 : 25);
                const vatVal = linkVal * (myVatRate / 100);
                
                subItemsToPush.push({
                  label: c.label ? `${item.label} - ${c.label}` : item.label,
                  value: linkVal,
                  vat: vatVal,
                  calculationDetails: detailsStr
                });
              }
            });
          }
        });
        
        val = totalLinkedVal;
        // details not used for links since we push subItemsToPush directly instead
        details = "";
      } else {
        // Standard item calculation (Fixed, Asset, Loan, or Manual Units)
        val = calculateItemValue(item, isPersonnel, totalOverheadPct, monthIdx, revenueStartMonth);
        
        if (item.calculationMode === 'asset') {
          details = `${formatAmount(Number(item.purchasePrice) || 0)} kr / (${Number(item.lifespanYears) || 1} år × 12 mån)`;
        } else if (item.calculationMode === 'loan') {
          const loanAmount = Number(item.loanAmount) || 0;
          const loanStart = Number(item.loanStartMonth) || 1;
          const amortMonths = Number(item.amortizationMonths) || 60;
          const graceMonths = Number(item.gracePeriodMonths) || 0;
          const startMonthAmort = Number(item.amortizationStartMonth) || 1;
          const actualAmortStart = Math.max(startMonthAmort, loanStart + graceMonths);
          const rate = (Number(item.interestRate) || 0) / 100 / 12;
          const monthsAmortized = Math.max(0, (monthIdx + 1) - actualAmortStart);
          const totalAmortized = Math.min(loanAmount, (loanAmount / amortMonths) * monthsAmortized);
          const remainingBalance = Math.max(0, loanAmount - totalAmortized);
          details = `Ränta (${formatNumber(Number(item.interestRate) || 0)}%) på ${formatAmount(remainingBalance)} kr skuld`;
        } else if (item.calculationMode === 'unit') {
          const count = calculateUnitCount(item, monthIdx, revenueStartMonth);
          
          let price = Number(item.valuePerUnit) || 0;
          let priceDetails = formatAmount(price);
          
          if (item.unitCosts && item.unitCosts.length > 0) {
            price = item.unitCosts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
            priceDetails = item.unitCosts.map(c => `${c.label}: ${formatAmount(c.value)}`).join(' + ');
          }
          
          details = `${formatNumber(count)} st × (${priceDetails}) kr / st`;
        } else {
          details = `Fast månadsbelopp`;
        }
      }

      let isCategoryActive = true;
      if (isOffSeason) {
        // Om det är off-season kontrollerar vi om kategorin är aktiv
        isCategoryActive = (data.strategicSettings?.activeCategoriesOffSeason || []).includes(catId);
        // Tillgångar, lån och engångskostnader skyddas generellt från säsongsstopp
        if (item.calculationMode === 'asset' || item.calculationMode === 'loan' || item.costType === 'one-time') {
          isCategoryActive = true;
        }
      }

      if (!isCategoryActive) {
        val = 0;
        details = details ? `${details} (Pausad)` : `Pausad off-season`;
      }

      const vatRate = item.vatRate ?? (isPersonnel ? 0 : 25);
      const vatVal = val * (vatRate / 100);
      incomingVat += vatVal;

      if (isPersonnel && val > 0) {
        const baseVal = (links.length > 0) ? val : (Number(item.value) || 0); // Note: Simple personnel handling for linked items
        const socialFees = baseVal * (totalOverheadPct / 100);
        const vacPay = baseVal * (holidayPayRate / 100);
        details = `Total Loaded Cost: ${links.length > 0 ? "Baserat på volym" : "Bruttolön"} (${formatAmount(baseVal)}) + Skatt/Pension (${formatAmount(socialFees + vacPay)})`;
        val = baseVal * (1 + (totalOverheadPct + holidayPayRate) / 100);
        // VAT is often 0 for salaries but personnel overhead might have VAT? Usually safe to stay 0 for base salaries.
      }
      
      if (item.costType === 'recurring' || item.calculationMode === 'asset' || item.calculationMode === 'loan' || (monthIdx + 1 === (item.startMonth || 1))) {
        const effectiveCost = val;
          
        expenses += effectiveCost;
        if (val > 0) {
          if (!expBreakdown[catTitle]) expBreakdown[catTitle] = { value: 0, items: [] };
          expBreakdown[catTitle].value += effectiveCost;
          
          if (links.length > 0 && subItemsToPush.length > 0) {
            subItemsToPush.forEach(subItem => {
              expBreakdown[catTitle].items.push(subItem);
            });
          } else {
            expBreakdown[catTitle].items.push({
              label: item.label,
              value: effectiveCost,
              vat: vatVal,
              calculationDetails: details
            });
            
          }

          // Cash Flow Events tracking (One-time payments)
          if (monthIdx + 1 === (item.startMonth || 1)) {
            if (item.calculationMode === 'asset') {
              const price = Number(item.purchasePrice) || 0;
              cashEvents.push({ 
                label: `Köpt tillgång: ${item.label}`, 
                value: price, 
                type: 'out'
              });
            }
            if (item.calculationMode === 'loan') {
              cashEvents.push({ 
                label: `Låneutbetalning: ${item.label}`, 
                value: Number(item.loanAmount) || 0, 
                type: 'in', 
                details: "Kapitaltillskott från banken" 
              });
            }
            if (item.costType === 'one-time' && item.calculationMode !== 'asset' && item.calculationMode !== 'loan') {
              const price = Number(item.value) || 0;
              cashEvents.push({ 
                label: `Engångskostnad: ${item.label}`, 
                value: price, 
                type: 'out'
              });
            }
          }
        }
        if (isVariable || item.calculationMode === 'unit' || links.length > 0) variable += effectiveCost;
      }
    });

    return { 
      revenue, 
      expenses, 
      variable, 
      incomingVat,
      outgoingVat,
      netVat: outgoingVat - incomingVat,
      revBreakdown: Object.fromEntries(Object.entries(revBreakdown).map(([k, v]) => [k, v.value])),
      expBreakdown: Object.fromEntries(Object.entries(expBreakdown).map(([k, v]) => [k, v.value])),
      fullRevBreakdown: revBreakdown,
      fullExpBreakdown: expBreakdown,
      cashEvents
    };
  };

  // Pre-calculate all months once
  const calculationDuration = Math.max(forecastDuration, 120);
  const monthlyDataCache: (ReturnType<typeof getMonthlyTotals> & { fullRevBreakdown: any; fullExpBreakdown: any })[] = [];
  for (let i = 0; i < calculationDuration; i++) {
    monthlyDataCache.push(getMonthlyTotals(i) as any);
  }

  // Month 0 (Initial)
  const initial = monthlyDataCache[0];
  
  // Target Month (Month 12 or first month with revenue)
  let targetMonthIdx = 11;
  const firstRevenueMonth = monthlyDataCache.findIndex(m => m.revenue > 0);
  if (firstRevenueMonth !== -1 && firstRevenueMonth > targetMonthIdx) {
    targetMonthIdx = Math.min(firstRevenueMonth, calculationDuration - 1);
  }
  const target = monthlyDataCache[targetMonthIdx];

  // One-time expenses (Startup costs)
  let totalOneTimeExpenses = 0;
  uniqueCostItems.forEach(({ item }) => {
    if (item.costType === 'one-time' && item.calculationMode !== 'asset') {
      totalOneTimeExpenses += calculateItemValue(item, false, totalOverheadPct, 0, revenueStartMonth);
    }
  });

  // KPIs based on average over the selected period
  let sumRev = 0;
  let sumExp = 0;
  let sumVar = 0;
  for (let i = 0; i < forecastDuration; i++) {
    sumRev += monthlyDataCache[i].revenue;
    sumExp += monthlyDataCache[i].expenses;
    sumVar += monthlyDataCache[i].variable;
  }
  
  const kpiRevenue = sumRev / forecastDuration;
  const kpiExpenses = sumExp / forecastDuration;
  const kpiVariable = sumVar / forecastDuration;

  const profitBeforeTax = kpiRevenue - kpiExpenses;
  const taxAmount = profitBeforeTax > 0 ? profitBeforeTax * CORPORATE_TAX_RATE : 0;
  const netMonthlyProfit = profitBeforeTax; 
  const netProfitAfterTax = profitBeforeTax - taxAmount;
  const profitMargin = kpiRevenue > 0 ? (netMonthlyProfit / kpiRevenue) * 100 : 0;
  const grossProfit = kpiRevenue - kpiVariable; 
  const grossMargin = kpiRevenue > 0 ? (grossProfit / kpiRevenue) * 100 : 0; 
  const fixedCosts = kpiExpenses - kpiVariable;
  
  const operationalBreakEven = grossMargin > 0 ? (fixedCosts / (grossMargin / 100)) : 0;
  const safetyMargin = kpiRevenue > 0 ? ((kpiRevenue - operationalBreakEven) / kpiRevenue) * 100 : 0;

  // Burn Rate & Runway
  let totalBurn = 0;
  let burnMonths = 0;
  for (let i = 0; i < Math.min(6, calculationDuration); i++) {
    const m = monthlyDataCache[i];
    const monthlyBurn = m.revenue - m.expenses;
    if (monthlyBurn < 0) {
      totalBurn += Math.abs(monthlyBurn);
      burnMonths++;
    }
  }
  const burnRate = burnMonths > 0 ? totalBurn / burnMonths : (profitBeforeTax < 0 ? Math.abs(profitBeforeTax) : 0);
  const availableCash = Math.max(0, data.strategicSettings.startingCash - totalOneTimeExpenses);
  const runway = burnRate > 0 ? (availableCash / burnRate) : (profitBeforeTax >= 0 ? Infinity : 0);

  // Unit Economics at the end of the selected forecast period
  const endMonthIdx = forecastDuration - 1;
  const mrr = data.revenueStreams
    .filter(s => s.costType === 'recurring')
    .reduce((acc, s) => acc + calculateItemValue(s, false, totalOverheadPct, endMonthIdx, revenueStartMonth), 0);

  // Calculate total marketing spend from both strategic settings AND the Marketing category
  const marketingCategory = data.costCategories.find(c => c.title.toLowerCase().includes('marknadsföring') || c.title.toLowerCase().includes('marketing'));
  const marketingItemsTotal = marketingCategory 
    ? marketingCategory.items.reduce((acc, item) => acc + calculateItemValue(item, false, totalOverheadPct, endMonthIdx, revenueStartMonth), 0)
    : 0;
  
  const totalMarketingSpend = (data.strategicSettings.marketingSpend || 0) + marketingItemsTotal;

  const totalUnitsAtEnd = data.revenueStreams.reduce((acc, s) => {
    return acc + calculateUnitCount(s, endMonthIdx, revenueStartMonth);
  }, 0);
  const totalUnitsAtStart = data.revenueStreams.reduce((acc, s) => {
    return acc + calculateUnitCount(s, 0, revenueStartMonth);
  }, 0);

  const totalNewUnits = endMonthIdx > 0 ? (totalUnitsAtEnd - totalUnitsAtStart) / endMonthIdx : 0;
  const cac = totalNewUnits > 0 ? (totalMarketingSpend / totalNewUnits) : 0;

  const revenueAtEnd = monthlyDataCache[endMonthIdx].revenue;
  const variableCostsAtEnd = monthlyDataCache[endMonthIdx].variable;
  const contributionMarginAtEnd = revenueAtEnd - variableCostsAtEnd;
  const avgContributionMarginPerUnit = totalUnitsAtEnd > 0 ? contributionMarginAtEnd / totalUnitsAtEnd : 0;
  
  const churn = data.strategicSettings.churnRate;
  // LTV should be based on Contribution Margin (Gross Profit), not just Revenue
  const ltv = churn > 0 ? (avgContributionMarginPerUnit / (churn / 100)) : (avgContributionMarginPerUnit * 100); 
  const ltvCacRatio = cac > 0 ? (ltv / cac) : 0;
  const mrrGrowth = mrr > 0 && endMonthIdx > 0 ? (data.revenueStreams.reduce((acc, s) => acc + ((calculateUnitCount(s, endMonthIdx, revenueStartMonth) - calculateUnitCount(s, 0, revenueStartMonth)) / endMonthIdx) * (Number(s.valuePerUnit) || 0), 0) / mrr) * 100 : 0;

  // Forecast
  const forecast: MonthlyData[] = [];
  const forecastBreakdown: CalculationResult['forecastBreakdown'] = [];
  let cumulativeProfit = 0;
  let cumulativeCashFlow = data.strategicSettings.startingCash;
  let minCashFlow = cumulativeCashFlow;
  
  const yearlyProfits = Array(10).fill(0);
  const yearlyRevenues = Array(10).fill(0);
  const yearlyCashFlows = Array(10).fill(0);

  const inventoryState: Record<string, number> = {};
  data.revenueStreams.forEach(s => {
    if (s.calculationMode === 'product' || s.calculationMode === 'unit') inventoryState[s.id] = 0;
  });

  for (let m = 0; m < calculationDuration; m++) {
    const monthly = monthlyDataCache[m];
    let monthlyCashIn = 0;
    let monthlyCashOut = 0;
    const monthlyInventory: MonthlyForecastBreakdown['inventory'] = {};

    // Cash In (with delay)
    data.revenueStreams.forEach(s => {
      const delayMonths = Math.floor((s.paymentDelayDays || 0) / 30);
      const cashInMonth = m - delayMonths;
      if (cashInMonth >= 0) {
        const cashInVal = calculateItemValue(s, false, totalOverheadPct, cashInMonth, revenueStartMonth);
        monthlyCashIn += cashInVal;
      }

      // Inventory & Cash Out for Purchases (Product or Unit mode)
      if (s.calculationMode === 'product' || s.calculationMode === 'unit') {
        const unitsSold = calculateUnitCount(s, m, revenueStartMonth);
        const unitsPurchased = calculatePurchasedCount(s, m, revenueStartMonth);
        const purchasePrice = Number(s.purchasePricePerUnit) || 0;
        
        // Landed Cost Components (Internal)
        const isIntl = data.isInternational && s.isInternationalTrade;
        const basePrice = purchasePrice;
        const excise = Number(s.exciseTaxPerUnit) || 0;
        const customs = isIntl ? (basePrice * (Number(s.customsRate) || 0) / 100) : 0;
        const importFreight = isIntl ? (Number(s.importFreightPerUnit) || 0) : 0;
        const importHandling = isIntl ? (Number(s.importHandlingPerUnit) || 0) : 0;
        
        // Full landed cost for CASH OUT (cash impacts when inventory is purchased)
        const landedCostPerUnitCash = basePrice + excise + customs + importFreight + importHandling;
        
        // Cash Out
        const purchaseCost = unitsPurchased * landedCostPerUnitCash;
        monthlyCashOut += purchaseCost;
        
        // Export costs impact Cash Flow too
        if (data.isInternational && s.isInternationalTrade) {
          const exportFreight = Number(s.exportFreightPerUnit) || 0;
          const exportFees = Number(s.exportFeesPerUnit) || 0;
          const totalExportCost = unitsSold * (exportFreight + exportFees);
          monthlyCashOut += totalExportCost;
        }

        // Update Inventory
        const prevRemaining = inventoryState[s.id] || 0;
        const currentRemaining = prevRemaining + unitsPurchased - unitsSold;
        inventoryState[s.id] = currentRemaining;

        monthlyInventory[s.label] = {
          purchased: unitsPurchased,
          sold: unitsSold,
          remaining: currentRemaining,
          inflow: unitsPurchased,
          landedCostPerUnit: landedCostPerUnitCash,
          inventoryValue: currentRemaining * landedCostPerUnitCash
        };
      }
    });

    // Cash Out (with delay)
    uniqueCostItems.forEach(({ item, isPersonnel }) => {
      const delayMonths = isPersonnel ? 0 : Math.floor((item.paymentDelayDays || 0) / 30);
      const cashOutMonth = m - delayMonths;
      if (cashOutMonth < 0) return;

      let val = calculateItemValue(item, isPersonnel, totalOverheadPct, cashOutMonth, revenueStartMonth);
      
      const links: RevenueLink[] = item.revenueLinks || [];
      if (links.length === 0 && item.isLinkedToRevenue && item.linkedRevenueId) {
        links.push({
          id: 'legacy',
          revenueId: item.linkedRevenueId,
          unitCosts: item.unitCosts || []
        });
      }

      if (links.length > 0) {
        let totalLinkedVal = 0;
        links.forEach(link => {
          const linkedRev = data.revenueStreams.find(rs => rs.id === link.revenueId);
          if (linkedRev) {
            const revStart = linkedRev.startMonth || revenueStartMonth;
            if (cashOutMonth + 1 < revStart) return;

            // Generate count for cashOutMonth
            const count = calculateUnitCount(linkedRev, cashOutMonth, revenueStartMonth);

            // Only include non-inventory direct costs for cash out on sale.
            // Inventory costs (label starting with "Inköp:") are paid on purchase via Varuinköp.
            const revenueValuePerUnit = Number(linkedRev.valuePerUnit) || 0;
            const addedPriceForCashFlow = link.unitCosts
              .filter(c => !(c.label || '').toLowerCase().startsWith('inköp:'))
              .reduce((sum, c) => {
                const cVal = Number(c.value) || 0;
                return sum + (c.isPercentage ? (revenueValuePerUnit * cVal / 100) : cVal);
              }, 0);
              
            totalLinkedVal += count * addedPriceForCashFlow;
          }
        });
        val = totalLinkedVal;
      }
      
      if (item.calculationMode === 'loan') {
        const loanStart = Number(item.loanStartMonth) || 1;
        if (m + 1 === loanStart) monthlyCashIn += Number(item.loanAmount) || 0;
        
        const startMonthAmort = Number(item.amortizationStartMonth) || 1;
        const amortMonths = Number(item.amortizationMonths) || 60;
        const graceMonths = Number(item.gracePeriodMonths) || 0;
        const actualAmortStart = Math.max(startMonthAmort, loanStart + graceMonths);
        
        let amortization = 0;
        if (cashOutMonth + 1 >= actualAmortStart) {
          amortization = (Number(item.loanAmount) || 0) / amortMonths;
        }
        monthlyCashOut += val + amortization;
      } else if (item.calculationMode === 'asset') {
        if (cashOutMonth + 1 === (item.startMonth || 1)) {
          monthlyCashOut += (Number(item.purchasePrice) || 0);
        }
      } else {
        if (item.costType === 'recurring' || cashOutMonth + 1 === (item.startMonth || 1)) {
          monthlyCashOut += val;
        }
      }
    });

    const monthlyProfitBeforeTax = monthly.revenue - monthly.expenses;
    const monthlyTax = monthlyProfitBeforeTax > 0 ? monthlyProfitBeforeTax * CORPORATE_TAX_RATE : 0;
    const monthlyProfit = monthlyProfitBeforeTax; 
    
    cumulativeProfit += monthlyProfit;
    
    // VAT Impact on Cash Flow
    // In a real business, VAT is paid/received periodically. 
    // Here we show it affecting cash flow as a net event for clarity.
    if (Math.abs(monthly.netVat) > 0) {
      monthly.cashEvents.push({
        label: monthly.netVat > 0 ? "Moms att betala" : "Moms att få tillbaka",
        value: Math.abs(monthly.netVat),
        type: monthly.netVat > 0 ? 'out' : 'in',
        details: `Nettovärde från utgående (${formatAmount(monthly.outgoingVat)}) minus ingående (${formatAmount(monthly.incomingVat)}) moms`
      });
    }

    let monthlyCashFlow = monthlyCashIn - monthlyCashOut - (monthly.netVat > 0 ? monthly.netVat : 0) + (monthly.netVat < 0 ? Math.abs(monthly.netVat) : 0);
    
    // Tax impact liquidity
    if (monthlyTax > 0) {
      monthly.cashEvents.push({ 
        label: "Bolagsskatt", 
        value: monthlyTax, 
        type: 'out', 
        details: "Reserverad skatt på vinst" 
      });
    }

    cumulativeCashFlow += monthlyCashFlow;
    if (cumulativeCashFlow < minCashFlow) minCashFlow = cumulativeCashFlow;

    const yearIdx = Math.floor(m / 12);
    if (yearIdx < 10) {
      yearlyProfits[yearIdx] += monthlyProfit;
      yearlyRevenues[yearIdx] += monthly.revenue;
      yearlyCashFlows[yearIdx] += monthlyCashFlow;
    }

    forecast.push({
      month: `Mån ${m + 1}`,
      revenue: monthly.revenue,
      expenses: monthly.expenses,
      profit: monthlyProfit,
      cashFlow: monthlyCashFlow,
      cumulativeProfit: cumulativeProfit,
      cumulativeCashFlow: cumulativeCashFlow
    });

    // Debt, Amortization & Interest tracking
    let monthlyAmortization = 0;
    let monthlyInterest = 0;
    let currentTotalDebt = 0;

    uniqueCostItems.forEach(({ item }) => {
      if (item.calculationMode === 'loan') {
        const loanAmount = Number(item.loanAmount) || 0;
        const loanStart = Number(item.loanStartMonth) || 1;
        const amortMonths = Number(item.amortizationMonths) || 60;
        const graceMonths = Number(item.gracePeriodMonths) || 0;
        const startMonthAmort = Number(item.amortizationStartMonth) || 1;
        const actualAmortStart = Math.max(startMonthAmort, loanStart + graceMonths);
        const rate = (Number(item.interestRate) || 0) / 100 / 12;

        if (m + 1 >= loanStart) {
          const monthsAmortized = Math.max(0, (m + 1) - actualAmortStart);
          const totalAmortized = Math.min(loanAmount, (loanAmount / amortMonths) * monthsAmortized);
          const remainingBalance = Math.max(0, loanAmount - totalAmortized);
          currentTotalDebt += remainingBalance;
          monthlyInterest += remainingBalance * rate;
          if (m + 1 >= actualAmortStart && monthsAmortized < amortMonths) {
            const amortVal = loanAmount / amortMonths;
            monthlyAmortization += amortVal;
            monthly.cashEvents.push({ 
              label: `Amortering: ${item.label}`, 
              value: amortVal, 
              type: 'out', 
              details: "Månadsbetalning på låneskuld" 
            });
          }
        }
      }
    });

    forecastBreakdown.push({
      month: m + 1,
      monthName: `Månad ${m + 1}`,
      revenues: Object.entries(monthly.fullRevBreakdown).map(([label, data]: [string, any]) => ({ 
        label, 
        value: data.value, 
        calculationDetails: data.details 
      })),
      expenses: Object.entries(monthly.fullExpBreakdown).map(([category, data]: [string, any]) => ({ 
        category, 
        value: data.value, 
        items: data.items.map((it: any) => ({
          label: it.label,
          value: it.value,
          calculationDetails: it.calculationDetails
        }))
      })),
      totalRevenue: monthly.revenue,
      totalExpenses: monthly.expenses,
      profit: monthlyProfit,
      tax: monthlyTax,
      totalDebt: currentTotalDebt,
      amortization: monthlyAmortization,
      interest: monthlyInterest,
      incomingVat: monthly.incomingVat,
      outgoingVat: monthly.outgoingVat,
      netVat: monthly.netVat,
      cashFlowEvents: monthly.cashEvents,
      inventory: monthlyInventory
    });
  }

  const peakCapitalNeed = Math.max(0, data.strategicSettings.startingCash - minCashFlow);
  const breakEvenMonth = forecast.findIndex(f => f.cumulativeProfit > 0) + 1 || null;
  const operationalBreakEvenMonth = forecast.findIndex(f => f.profit > 0) + 1 || null;

  let totalRevenueForPeriod = 0;
  for (let i = 0; i < forecastDuration; i++) {
    totalRevenueForPeriod += monthlyDataCache[i].revenue;
  }

  return {
    totalRevenue: kpiRevenue,
    totalRevenueForPeriod,
    totalMonthlyExpenses: kpiExpenses,
    totalOneTimeExpenses,
    profitBeforeTax,
    taxAmount,
    netMonthlyProfit,
    profitMargin,
    grossProfit,
    grossMargin,
    breakEvenPoint: operationalBreakEven,
    operationalBreakEven,
    breakEvenMonth,
    operationalBreakEvenMonth,
    safetyMargin,
    holidayPayDebt: initial.expenses * (holidayPayRate / 100), // Simplified
    burnRate,
    runway,
    cac,
    ltv,
    ltvCacRatio,
    churn,
    mrr,
    mrrGrowth,
    expenseBreakdown: initial.expBreakdown,
    revenueBreakdown: initial.revBreakdown,
    forecast,
    forecastBreakdown,
    year1Profit: yearlyProfits[0],
    year2Profit: yearlyProfits[1],
    year3Profit: yearlyProfits[2],
    year4Profit: yearlyProfits[3],
    year5Profit: yearlyProfits[4],
    year6Profit: yearlyProfits[5],
    year7Profit: yearlyProfits[6],
    year8Profit: yearlyProfits[7],
    year9Profit: yearlyProfits[8],
    year10Profit: yearlyProfits[9],
    year1Revenue: yearlyRevenues[0],
    year2Revenue: yearlyRevenues[1],
    year3Revenue: yearlyRevenues[2],
    year4Revenue: yearlyRevenues[3],
    year5Revenue: yearlyRevenues[4],
    year6Revenue: yearlyRevenues[5],
    year7Revenue: yearlyRevenues[6],
    year8Revenue: yearlyRevenues[7],
    year9Revenue: yearlyRevenues[8],
    year10Revenue: yearlyRevenues[9],
    year1CashFlow: yearlyCashFlows[0],
    year2CashFlow: yearlyCashFlows[1],
    year3CashFlow: yearlyCashFlows[2],
    year4CashFlow: yearlyCashFlows[3],
    year5CashFlow: yearlyCashFlows[4],
    year6CashFlow: yearlyCashFlows[5],
    year7CashFlow: yearlyCashFlows[6],
    year8CashFlow: yearlyCashFlows[7],
    year9CashFlow: yearlyCashFlows[8],
    year10CashFlow: yearlyCashFlows[9],
    year1Margin: yearlyRevenues[0] > 0 ? (yearlyProfits[0] / yearlyRevenues[0]) * 100 : 0,
    year2Margin: yearlyRevenues[1] > 0 ? (yearlyProfits[1] / yearlyRevenues[1]) * 100 : 0,
    year3Margin: yearlyRevenues[2] > 0 ? (yearlyProfits[2] / yearlyRevenues[2]) * 100 : 0,
    year4Margin: yearlyRevenues[3] > 0 ? (yearlyProfits[3] / yearlyRevenues[3]) * 100 : 0,
    year5Margin: yearlyRevenues[4] > 0 ? (yearlyProfits[4] / yearlyRevenues[4]) * 100 : 0,
    year6Margin: yearlyRevenues[5] > 0 ? (yearlyProfits[5] / yearlyRevenues[5]) * 100 : 0,
    year7Margin: yearlyRevenues[6] > 0 ? (yearlyProfits[6] / yearlyRevenues[6]) * 100 : 0,
    year8Margin: yearlyRevenues[7] > 0 ? (yearlyProfits[7] / yearlyRevenues[7]) * 100 : 0,
    year9Margin: yearlyRevenues[8] > 0 ? (yearlyProfits[8] / yearlyRevenues[8]) * 100 : 0,
    year10Margin: yearlyRevenues[9] > 0 ? (yearlyProfits[9] / yearlyRevenues[9]) * 100 : 0,
    peakCapitalNeed,
    totalDebt: forecastBreakdown[0]?.totalDebt || 0,
    totalIncomingVat: monthlyDataCache.slice(0, forecastDuration).reduce((acc, m) => acc + m.incomingVat, 0),
    totalOutgoingVat: monthlyDataCache.slice(0, forecastDuration).reduce((acc, m) => acc + m.outgoingVat, 0),
    netVatBalance: monthlyDataCache.slice(0, forecastDuration).reduce((acc, m) => acc + m.netVat, 0),
    totalExportCosts,
    validationWarnings
  };
};
