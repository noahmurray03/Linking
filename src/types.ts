
export type CostType = 'recurring' | 'one-time';

export type CalculationMode = 'fixed' | 'unit' | 'asset' | 'loan' | 'product';

export type BusinessIndustry = 'saas' | 'retail' | 'consulting' | 'manufacturing' | 'restaurant' | 'logistics' | 'service_edu_care' | 'other';

export interface UnitCostComponent {
  id: string;
  label: string;
  value: number;
  isPercentage?: boolean;
}

export interface RevenueLink {
  id: string;
  revenueId: string;
  unitCosts: UnitCostComponent[];
}

export interface FinancialItem {
  id: string;
  label: string;
  value: number; // Fast del
  unitCount?: number; // Antal (rörlig del)
  valuePerUnit?: number; // A-pris (rörlig del)
  calculationMode: CalculationMode;
  vatRate?: number; // Momssats i % (t.ex. 25, 12, 6, 0)
  isFixed?: boolean; // Om den fasta delen är aktiv (deprecated, use calculationMode)
  isUnitBased: boolean; // Om den rörliga delen är aktiv (deprecated, use calculationMode)
  costType: CostType;
  // Growth logic
  hasGrowth?: boolean;
  newUnitsPerMonth?: number;
  targetUnitCount?: number; // Månadsvolym i normalläge
  rampUpMonths?: number; // Antal månader för att nå normalläge
  // Avskrivningslogik
  isAsset?: boolean;
  purchasePrice?: number;
  lifespanYears?: number;
  // Loan logic
  isLoan?: boolean;
  loanAmount?: number;
  interestRate?: number;
  loanStartMonth?: number;
  amortizationStartMonth?: number;
  amortizationMonths?: number;
  gracePeriodMonths?: number;
  // Product logic
  purchasePricePerUnit?: number; // Inköpspris per enhet
  unitsPurchasedPerMonth?: number; // Antal inköpta varor per månad
  hasPurchaseGrowth?: boolean;
  newPurchasedUnitsPerMonth?: number;
  targetPurchasedUnits?: number; // Inköpsvolym i normalläge
  purchaseRampUpMonths?: number; // Månader för att nå inköpsmål
  exciseTaxPerUnit?: number; // Punktskatt per enhet
  // International Trade logic
  customsRate?: number; // Tullsats i %
  importFreightPerUnit?: number; // Frakt per enhet
  importHandlingPerUnit?: number; // Hanteringsavgift per enhet
  exportFreightPerUnit?: number; // Exportfrakt per enhet
  exportFeesPerUnit?: number; // Exportavgifter per enhet
  isInternationalTrade?: boolean; // Om detta specifika uppdrag innebär internationell handel
  // View Period Settings
  viewPeriod?: 'month1' | 'recurring' | 'year1' | 'custom';
  viewPeriodMonths?: number;
  // Working Capital
  paymentDelayDays?: number; // t.ex. 30 dagar
  startMonth?: number; // Månad då posten aktiveras (1-60)
  isLockedBalance?: boolean; // Om försäljning och inköp ska synkas automatiskt
  linkedRevenueId?: string; // Legacy: Koppling till intäktsström för volymsynk
  isLinkedToRevenue?: boolean; // Legacy: Flagga för om posten är kopplad till en intäktsström
  unitCosts?: UnitCostComponent[]; // Legacy: Lista över kostnadskomponenter per enhet
  revenueLinks?: RevenueLink[]; // Stöd för flera kopplingar
  aiMotivation?: string; // AI:ns logik bakom posten
}

export interface FinancialCategory {
  id: string;
  title: string;
  iconName: string;
  items: FinancialItem[];
  description?: string;
}

export interface CustomFee {
  id: string;
  label: string;
  percentage: number;
}

export interface PersonnelSettings {
  fees: CustomFee[];
  calculationMode: 'roles' | 'average';
}

export interface StrategicSettings {
  startingCash: number;
  marketingSpend: number;
  churnRate: number; // % per månad
  revenueStartMonth: number; // Månad då intäkter börjar (1-24)
  avgCustomerLifespan?: number; // månader (kan beräknas från churn)
  isInternational?: boolean; // Om verksamheten hanterar internationell handel
  hasSeasonality?: boolean; // Om verksamheten är säsongsbaserad
  activeMonths?: number[]; // Lista med månader (1-12) som är öppna
  activeCategoriesOffSeason?: string[]; // Kategori-ID:n som fortsätter rulla under stängda månader
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetMonth: number;
  kpi: 'revenue' | 'profit' | 'cash' | 'users';
  targetValue: number;
  isReached?: boolean;
}

export interface ScenarioSnapshot {
  id: string;
  name: string;
  description: string;
  data: Omit<BusinessData, 'scenarios' | 'milestones'>;
  createdAt: number;
  isBase?: boolean;
}

export interface IndustryBenchmark {
  industry: BusinessIndustry;
  avgGrossMargin: number;
  avgProfitMargin: number;
  avgChurn: number;
  burnRateThreshold: number; // % of revenue
  marketingEfficiency: number; // LTV/CAC target
}

export interface Currency {
  code: string;
  symbol: string;
  rateToSek: number;
}

export interface ProjectComment {
  id: string;
  itemId: string; // ID för FinancialItem eller 'general'
  authorId: string;
  authorName: string;
  text: string;
  timestamp: number;
}

export interface BudgetMember {
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: number;
}

export interface BusinessData {
  businessIdea: string;
  industry: BusinessIndustry;
  isInternational?: boolean; // Om verksamheten hanterar internationell handel
  revenueStreams: FinancialItem[];
  costCategories: FinancialCategory[];
  personnelSettings: PersonnelSettings;
  strategicSettings: StrategicSettings;
  // Nya fält
  scenarios?: ScenarioSnapshot[];
  milestones?: Milestone[];
  activeScenarioId?: string;
  baseCurrency?: string; // Standard SEK
  // Multi-user & Comments
  budgetId?: string; // Unikt ID för projektet (för att kunna delas)
  members?: BudgetMember[];
}

export interface CalculationResult {
  totalRevenue: number;
  totalRevenueForPeriod?: number;
  totalMonthlyExpenses: number;
  totalOneTimeExpenses: number;
  profitBeforeTax: number;
  taxAmount: number;
  netMonthlyProfit: number;
  profitMargin: number;
  grossProfit: number;
  grossMargin: number;
  breakEvenPoint: number;
  operationalBreakEven: number;
  breakEvenMonth: number | null;
  operationalBreakEvenMonth: number | null;
  safetyMargin: number;
  holidayPayDebt: number;
  burnRate: number;
  runway: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  churn: number;
  mrr: number;
  mrrGrowth: number;
  expenseBreakdown: {
    [key: string]: number;
  };
  revenueBreakdown: {
    [key: string]: number;
  };
  totalDebt: number;
  totalIncomingVat?: number; // Moms på inköp (att få tillbaka)
  totalOutgoingVat?: number; // Moms på försäljning (att betala)
  netVatBalance?: number; // Netto momsflöde
  // Time-based data
  forecast?: MonthlyData[];
  forecastBreakdown?: MonthlyForecastBreakdown[];
  year1Profit?: number;
  year2Profit?: number;
  year3Profit?: number;
  year4Profit?: number;
  year5Profit?: number;
  year6Profit?: number;
  year7Profit?: number;
  year8Profit?: number;
  year9Profit?: number;
  year10Profit?: number;
  year1Revenue?: number;
  year2Revenue?: number;
  year3Revenue?: number;
  year4Revenue?: number;
  year5Revenue?: number;
  year6Revenue?: number;
  year7Revenue?: number;
  year8Revenue?: number;
  year9Revenue?: number;
  year10Revenue?: number;
  year1CashFlow?: number;
  year2CashFlow?: number;
  year3CashFlow?: number;
  year4CashFlow?: number;
  year5CashFlow?: number;
  year6CashFlow?: number;
  year7CashFlow?: number;
  year8CashFlow?: number;
  year9CashFlow?: number;
  year10CashFlow?: number;
  year1Margin?: number;
  year2Margin?: number;
  year3Margin?: number;
  year4Margin?: number;
  year5Margin?: number;
  year6Margin?: number;
  year7Margin?: number;
  year8Margin?: number;
  year9Margin?: number;
  year10Margin?: number;
  peakCapitalNeed?: number;
  totalExportCosts?: number; // Totala exportkostnader (frakt/avgifter)
  validationWarnings?: { type: 'error' | 'warning' | 'info'; message: string; category?: string }[];
}

export interface AnalysisResponse {
  summary: string;
  alerts: {
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
  }[];
  recommendations: {
    title: string;
    description: string;
    impact: string;
  }[];
  kpiAnalysis: {
    kpi: string;
    value: string;
    status: 'good' | 'neutral' | 'bad';
    explanation: string;
  }[];
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  cumulativeProfit: number;
  cumulativeCashFlow: number;
}

export interface MonthlyForecastBreakdown {
  month: number;
  monthName: string;
  revenues: { label: string; value: number; calculationDetails?: string }[];
  expenses: { category: string; value: number; items: { label: string; value: number; calculationDetails?: string }[] }[];
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  tax: number;
  totalDebt: number;
  amortization: number;
  interest: number;
  incomingVat: number; // Moms på inköp
  outgoingVat: number; // Moms på försäljning
  netVat: number; // Netto moms att betala/få tillbaka denna månad
  cashFlowEvents?: { label: string; value: number; type: 'in' | 'out'; details?: string }[];
  inventory?: {
    [streamLabel: string]: {
      purchased: number;
      sold: number;
      remaining: number;
      inflow: number;
      landedCostPerUnit?: number;
      inventoryValue?: number;
    };
  };
}
