
import { BusinessData, FinancialItem, FinancialCategory, CustomFee, CostType, IndustryBenchmark, Currency, BusinessIndustry } from './types';
import { 
  Truck, Users, Home, Cpu, Megaphone, Scale, ShieldCheck, Wallet, Briefcase, Building2,
  Package, Landmark, UserCircle, Rocket, Layers, DollarSign, TrendingUp, LayoutGrid, AlertTriangle
} from 'lucide-react';

export const CORPORATE_TAX_RATE = 0.206;

export const COLORS = [
  '#000000', 
  '#4f46e5', 
  '#059669', 
  '#d97706', 
  '#e11d48', 
  '#0891b2', 
  '#7c3aed', 
  '#ea580c', 
  '#2563eb', 
  '#db2777', 
  '#475569', 
  '#65a30d', 
  '#be185d', 
  '#4338ca', 
];

export const IconMap: Record<string, React.ElementType> = {
  Truck, Users, Home, Cpu, Megaphone, Scale, ShieldCheck, Wallet, Briefcase, Building2,
  Package, Landmark, UserCircle, Rocket, Layers, DollarSign, TrendingUp, LayoutGrid
};

export const SOCIAL_FEES_DEFINITION = `Ålderspensionsavgift – finansierar allmän pension
Efterlevandepensionsavgift – till förmåner till efterlevande (f.d. änkepension)
Sjukförsäkringsavgift – betalar för sjukpenning till anställda vid sjukdom
Föräldraförsäkringsavgift – finansierar föräldrapenning
Arbetsmarknadsavgift – går till arbetslöshetsförsäkring och aktiva arbetsmarknadsinsatser
Arbetslöshetsförsäkringsavgift – finansierar arbetslöshetsersättning (grundnivå)
Försäkringsavgift för sjukpenninggrundande inkomst (SGI) – säkerställer ersättning vid sjukdom
Allmän löneavgift – del som går till staten och olika trygghetssystem`;

export const DEPRECIATION_DEFINITION = `Definition:
Avskrivningar är ett sätt att fördela kostnaden för ett långlivat tillgång (t.ex. maskiner, datorer, bilar, byggnader) över dess ekonomiska livslängd istället för att ta hela kostnaden direkt när tillgången köps.

Syfte för affärssystemet:
• Visa rätt kostnad per period (månad, kvartal, år) i resultaträkningen.
• Hålla balansräkningen korrekt genom att minska tillgångens bokförda värde över tid.
• Hjälpa till att räkna ut vinst och skatt korrekt.

Exempel:
Ett företag köper en dator för 10 000 kr. Datorn har en livslängd på 5 år. Istället för att ta hela 10 000 kr som kostnad direkt, skrivs 2 000 kr av per år.

Hur affärssystemet kan hantera det:
• Spara anskaffningsvärde för tillgången.
• Ange ekonomisk livslängd (antal år eller månader).
• Beräkna årlig/månatlig avskrivning (t.ex. linjär avskrivning: samma belopp varje period).
• Minska tillgångens värde på balansräkningen varje period.
• Skapa bokföringsposter automatiskt: Debet: Avskrivningskostnad, Kredit: Ackumulerade avskrivningar.

Kortfattat:
Avskrivning = systemets sätt att sprida kostnaden för en tillgång över dess användningstid, både för korrekt bokföring och beslutsstöd.`;

interface LogicDef {
  text?: string;
  definition: string;
  calculation: string;
  example?: string;
}

export const LOGIC_DEFINITIONS: Record<string, LogicDef> = {
  "vinstmarginal": {
    definition: "Visar den faktiska vinsten efter att ALLA kostnader (löner, marknadsföring, hyra m.m.) är betalda.",
    calculation: "Nettoresultat dividerat med omsättning.",
    example: "Vid 1Mnkr intäkt och 100tkr nettoresultat är vinstmarginalen 10%."
  },
  "bruttomarginal": {
    definition: "Visar hur lönsam själva produkten/tjänsten är efter direkta kostnader (COGS), men innan övriga rörelsekostnader.",
    calculation: "Bruttoresultat dividerat med omsättning.",
    example: "Ett inköpspris på 40 kr sålt för 100 kr ger 60% bruttomarginal."
  },
  "omsättning": {
    definition: "Företagets totala försäljning.",
    calculation: "Summan av alla intäktsströmmar. Beräknas som [Fast belopp] + [Antal × A-pris].",
    example: "Säljer du 10 enheter för 100kr st är omsättningen 1000kr."
  },
  "resultat": {
    definition: "Skillnaden mellan totala intäkter och totala månadskostnader (inkl. avskrivningar och semesterlöneskuld).",
    calculation: "Totala intäkter minus alla kostnader.",
    example: "Negativt resultat kallas förlust, positivt kallas vinst."
  },
  "likviditet": {
    definition: "Faktiskt kassaflöde på bankkontot.",
    calculation: "Pengar in minus pengar ut från kontot, justerat för betalningsvillkor.",
    example: "Vid vinst på 100tkr men kunden betalar om 30 dagar är din likviditet opåverkad (oförändrad) denna månad."
  },
  "avskrivningar": {
    definition: "Ett sätt att sprida kostnaden för en investering (t.ex dator, maskin) över dess förväntade livslängd.",
    calculation: "Inköpspris dividerat med livslängd (t.ex. 60 månader) påverkar bolagets bokföringsmässiga vinst per månad.",
    example: "Köper du en 3D-skrivare för 50tkr betar du av 10tkr per år i kostnad; kassan tappas dock omedelbart."
  },
  "skatt & påslag": {
    definition: "Kostnad för att anställa någon utöver själva bruttolönen (tjänstepension och liknande påslag).",
    calculation: "Procentuellt pålägg ovanpå grundlönen."
  },
  "sociala avgifter": {
    definition: "Lagstadgade arbetsgivaravgifter i Sverige (31,42%) som läggs ovanpå allas bruttolön.",
    calculation: "Bruttolön × 0.3142."
  },
  "säkerhetsmarginal": {
    definition: "Hur mycket omsättningen kan sjunka innan företaget börjar gå med förlust.",
    calculation: "(Faktisk/prognostiserad försäljning - Break-even försäljning) / Faktisk/prognostiserad försäljning."
  },
  "burn rate": {
    definition: "Hur mycket pengar bolaget förbrukar netto per månad under uppstartsfasen.",
    calculation: "Ett uttryck för kassaflöde ut, t.ex. fasta kostnader minus befintlig omsättning."
  },
  "runway": {
    definition: "Antalet månader bolaget överlever tills pengarna tar slut (t.ex med tanke på startkapitalet).",
    calculation: "[Befintlig kassa] / [Genomsnittlig Burn Rate]."
  },
  "cac": {
    definition: "Kundanskaffningskostnad (Customer Acquisition Cost).",
    calculation: "Marknadsbudget delat på antalet nya kunder som tillkom (t.ex från kampanjer)."
  },
  "ltv": {
    definition: "Livstidsvärde för en kund (Lifetime Value).",
    calculation: "Gissat totalt intäktsbelopp man drar in innan kunden slutar köpa ens tjänster."
  },
  "churn": {
    definition: "Pensionsfrekvens – andelen kunder som säger upp sina abonnemang/prenumerationer.",
    calculation: "Antal kunder som lämnat denna månad dividerat på totala antalet kunder."
  },
  "mrr": {
    definition: "Återkommande intäkter per månad (Monthly Recurring Revenue).",
    calculation: "Prenumeranter × månadskostnad."
  },
  "startkapital": {
    definition: "Inledande kapital på bankkontot dag 1.",
    calculation: "Manuell initial kassa.",
    example: "Har du lånat eller tagit in 500k kr lägger du in detta för att se din 'Runway'."
  },
  "marknadsbudget": {
    definition: "Fasta månatliga utgifter för reklam, SEO och sälj/PR-tjänster.",
    calculation: "Addera sociala annonser etc per månad. Belastar direkt dina fasta kostnader."
  },
  "churn rate": {
    definition: "Kundtapp i procent, vilket indikerar engagemang och nöjdhet.",
    calculation: "Historiskt tapp på total stock. Visas här som ett fast procenttal i modellen."
  },
  "gemensam startmånad": {
    definition: "Den månad i simuleringen som din verksamhet startar för fullt. Alla intäkter och löpande kostnader utgår från denna period.",
    calculation: "Förskjuter starten i x-axeln."
  },
  "punktskatt": {
    definition: "Särskild skatt på specifika varor (t.ex. alkohol, tobak).",
    calculation: "Läggs som ett platt belopp per såld enhet, och dras direkt från omsättningen per såld produkt (ökar COGS)."
  },
  "tullavgifter": {
    definition: "Extern procentuell avgift för att importera/exportera varor.",
    calculation: "Inköpspriset på en enskild internationell produkt × angiven tullsats."
  },
  "landed cost": {
    definition: "Totala kostnaden för varan från fabrik fram till ditt e-handelslager.",
    calculation: "Inköpspris per enhet + tull + transporttjänster. Marginalen får bara räknas efter att denna fulla kostnad är dragen."
  },
  "kapitalbehov": {
    definition: "Det maximala behovet av investeringar för att säkerställa att din verksamhet går i lås utan konkurs. Uppkommer när affären blöder rött och förlitar sig enbart på initial kassa.",
    calculation: "Räknat som avgrunden i din kassa-graf."
  },
  "ack. vinst": {
    definition: "Den sammanlagda vinsten/förlusten under valda åren.",
    calculation: "Summan av resultat."
  },
  "kassasaldo": {
    definition: "Hur stort kapital företaget besitter i bankkontot just nu.",
    calculation: "Intäkter in, Moms att betala bort, Amorteringar dragna ut... etc."
  },
  "break-even": {
    definition: "Den tidpunkt eller försäljningsvolym där omsättning helt täcker de totala utgifterna inkl. gamla förluster.",
    calculation: "När linjen för ackumulerat resultat passerar 0."
  },
  "operativ b/e": {
    definition: "Den specifika månad när intäkterna klarar mer varandra mot dina fasta driftkostnader.",
    calculation: "Intäkter >= (Löner+Hyra+Fasta tjänster)."
  },
  "fast": {
    definition: "Fasta summor till din personal, din hyra och din administration. Kostnader ändras inte med stor orderingång.",
    calculation: "Ligger konstant till slutet av prognosen, alt tills du avslutar posten."
  },
  "antal": {
    definition: "En omsättningsströmming där en A-pris tas × det antal enheter du estimerar.",
    calculation: "Antal × Pris."
  },
  "produkt": {
    definition: "Sälja en sak, där du även måste köpa/producera den enheten (COGS).",
    calculation: "Antal × Pris minus Antal × COGS kostnader."
  },
  "investering": {
    definition: "Utbetalning idag som tillförs i balansräkningen över tid (skrivs av). Kassaflödestungt men resultatsnill.",
    calculation: "Tillgång köps för kontant → Avskrivningar görs med livslängd."
  },
  "lån": {
    definition: "Tillskott av kapital som bär på sig räntekrav.",
    calculation: "Startmånad får ett positivt kassaflöde; följande månader får minus-amortering och räntekostnad (vilket tär på vinst)."
  },
  "personal": {
    definition: "Lönekategori för att hålla stenkoll på utgifter runtomkring den anställde utöver bruttolönen i fickan.",
    calculation: "Bruttolön + (31,42% socialt)."
  }
};

export const CATEGORY_GUIDE: Record<string, string> = {
  "Uppstartsfasen": "Engångskostnader du har innan du drar igång på riktigt. T.ex. att bygga en hemsida, registrera bolag eller köpa in inredning.",
  "Intäktsströmmar": "Hur du tjänar pengar. Det kan vara fasta månadsabonnemang, timdebitering eller antalet produkter du säljer i butik.",
  "Direkta kostnader": "Kostnader som hör direkt till det du säljer. Om du säljer en sko, är detta inköpspriset och frakten för den skon. Kallas ofta COGS.",
  "Startkostnader": "Samma som 'Uppstartsfasen'. Viktiga att räkna med för att veta hur mycket pengar du behöver från dag 1.",
  "Initial Investeringsfas": "Hur mycket kapital (pengar) som krävs för att starta. Visar om du behöver lån eller investerare.",
  "Lönekostnader": "Alla kostnader för personal. Systemet räknar själv ut din bruttolön och lägger till skatter, pension och andra avgifter åt dig.",
  "Personalkostnader": "Alla kostnader för personal. Systemet räknar själv ut din bruttolön och lägger till skatter, pension och semesterersättning.",
  "Lokalkostnader": "Detta är din kontors- eller butikshyra. Fasta utgifter för att ha en fysisk plats att jobba på.",
  "Avskrivningar": DEPRECIATION_DEFINITION,
  "IT & System": "Kostnader för datorer, servrar eller mjukvaror som du betalar för (typ bokföringsprogram eller molntjänster).",
  "Marknadsföring": "De pengar du lägger på annonser, sociala medier och kundanskaffning (eller CAC som det också kallas).",
  "Administration": "Smarta kostnader för att driva bolaget, t.ex. vad revisorn och banken kostar.",
  "Försäkringar": "Kostnader för att skydda dig, ditt bolag och dina anställda om något går fel.",
  "Lån & Finansiering": "Dina lån. Systemet hjälper dig dela upp detta i räntekostnader (som syns på resultatet) och amortering.",
  "Oförutsedda": "Ditt skyddsnät! Det är alltid smart att sätta undan lite pengar varje månad för saker som helt enkelt går fel.",
  "Internationell handel": "Om du köper eller säljer saker över gränserna hjälper vi dig att räkna på tull och utlandsfrakt så din vinst blir rätt."
};

export const KPI_GUIDE = [
  {
    title: "Omsättning (Revenue)",
    definition: "Totala summan av allt du har sålt.",
    calculation: "Antal sålda varor/tjänster × Priset.",
    impact: "Detta är dina inkomster innan en enda krona i kostnad har räknats bort. En hög siffra är bra, men vinsten är det som spelar roll."
  },
  {
    title: "Resultat (Profit)",
    definition: "Vinst eller förlust. Pengarna som blir över när alla utgifter dragits av.",
    calculation: "Total omsättning - Alla månadskostnader.",
    impact: "Visar om din idé håller och faktiskt drar in mer pengar än vad den slukar."
  },
  {
    title: "Kassaflöde (Cash Flow)",
    definition: "Pengar in minus pengar ut från ditt bankkonto.",
    calculation: "Faktiska inbetalningar - faktiska utbetalningar.",
    impact: "Du kan ha ett jättebra resultat (vinst) på pappret, men om kunderna inte betalar i tid, och leverantörerna vill ha pengar direkt, går du i konkurs. Kassaflöde är livsviktigt!"
  },
  {
    title: "Burn Rate",
    definition: "Så mycket pengar företaget 'bränner' varje månad innan det börjar gå med vinst.",
    calculation: "Det belopp du minus:ar i kassan varje månad under startfasen.",
    impact: "Du vill ha koll på detta så att du inte spenderar snabbare än vad kassan tillåter."
  },
  {
    title: "Runway",
    definition: "Hur många månader företaget kan överleva innan alla pengar i kassan tar slut.",
    calculation: "Pengar på banken / Din månatliga Burn Rate.",
    impact: "Om du har 100 000 kr och förlorar 10 000 kr i månaden har du 10 månaders 'Runway'. Då har du 10 månader på dig att tjäna pengar!"
  },
  {
    title: "CAC (Kundanskaffning)",
    definition: "Vad det faktiskt kostar att få in *en* ny betalande kund.",
    calculation: "Din månatliga marknadsföringsbudget / Hur många nya kunder du fick.",
    impact: "Om du lägger 1000kr på annonser och får in 1 kund, är din CAC 1000kr. Kunder får aldrig kosta mer än vad de är värda (LTV)."
  },
  {
    title: "LTV (Kundvärde)",
    definition: "Lifetime Value – hur mycket vinst en kund ger dig totalt sett under den tid den spenderar hos dig.",
    calculation: "Vinst per köp × Hur länge / hur många gånger kunden handlar hos dig.",
    impact: "LTV måste alltid vara högre än CAC. Tidy rule of thumb: En kund bör vara värd 3 gånger så mycket som hen kostade att få in."
  },
  {
    title: "Churn Rate",
    definition: "Kundtapp – Hur många kunder som slutar handla eller säger upp sitt abonnemang.",
    calculation: "Procentuell andel som avslutar. 10 kunder av 100 som slutar = 10%.",
    impact: "En av de viktigaste mätarna överhuvudtaget. Om kunderna slutar snabbare än de tillkommer torkar kassan ut omedelbart."
  },
  {
    title: "Break-even (Nollpunkten)",
    definition: "Den magiska månaden när du drar in exakt lika mycket som du spenderar.",
    calculation: "Inkomster = Kostnader.",
    impact: "Detta är ofta första huvudmålet för startups. Du slutar blöda pengar!"
  },
  {
    title: "Säkerhetsmarginal",
    definition: "Hur mycket försäljningen kan minska innan företaget börjar gå med förlust.",
    calculation: "Din vinst-buffert uttryckt i procent av omsättningen.",
    impact: "En hög procentsats betyder att du sover tryggt, även om marknaden skulle svikta lite grann."
  }
];

export const INDUSTRY_BENCHMARKS: Record<BusinessIndustry, IndustryBenchmark> = {
  saas: { industry: 'saas', avgGrossMargin: 80, avgProfitMargin: 20, avgChurn: 3, burnRateThreshold: 40, marketingEfficiency: 3 },
  retail: { industry: 'retail', avgGrossMargin: 40, avgProfitMargin: 5, avgChurn: 15, burnRateThreshold: 15, marketingEfficiency: 2 },
  consulting: { industry: 'consulting', avgGrossMargin: 60, avgProfitMargin: 25, avgChurn: 10, burnRateThreshold: 10, marketingEfficiency: 4 },
  manufacturing: { industry: 'manufacturing', avgGrossMargin: 35, avgProfitMargin: 8, avgChurn: 5, burnRateThreshold: 20, marketingEfficiency: 2.5 },
  restaurant: { industry: 'restaurant', avgGrossMargin: 65, avgProfitMargin: 10, avgChurn: 20, burnRateThreshold: 15, marketingEfficiency: 2 },
  logistics: { industry: 'logistics', avgGrossMargin: 20, avgProfitMargin: 5, avgChurn: 8, burnRateThreshold: 10, marketingEfficiency: 1.5 },
  service_edu_care: { industry: 'service_edu_care', avgGrossMargin: 85, avgProfitMargin: 8, avgChurn: 2, burnRateThreshold: 15, marketingEfficiency: 1 },
  other: { industry: 'other', avgGrossMargin: 50, avgProfitMargin: 10, avgChurn: 10, burnRateThreshold: 20, marketingEfficiency: 2 }
};

export const CURRENCIES: Currency[] = [
  { code: 'SEK', symbol: 'kr', rateToSek: 1 },
  { code: 'USD', symbol: '$', rateToSek: 10.5 },
  { code: 'EUR', symbol: '€', rateToSek: 11.2 },
  { code: 'GBP', symbol: '£', rateToSek: 13.1 }
];

export const INITIAL_DATA: BusinessData = {
  businessIdea: "",
  industry: 'other',
  revenueStreams: [
    { 
      id: 'init-rev-1', 
      label: 'Huvudsaklig intäktskälla', 
      value: 0, 
      calculationMode: 'unit',
      isFixed: false, 
      unitCount: 0, 
      unitsPurchasedPerMonth: 0,
      valuePerUnit: 0, 
      isUnitBased: true, 
      costType: 'recurring', 
      hasGrowth: false, 
      hasPurchaseGrowth: false,
      newUnitsPerMonth: 0,
      newPurchasedUnitsPerMonth: 0,
      startMonth: 1,
      isLockedBalance: true
    }
  ],
  costCategories: [
    { id: 'cat-cogs', title: 'Direkta kostnader (COGS)', iconName: 'Truck', items: [
      { id: 'init-cogs-1', label: 'Inköp av varor', value: 0, calculationMode: 'unit', costType: 'recurring', isUnitBased: true, unitCount: 0, valuePerUnit: 0, vatRate: 25, startMonth: 1 }
    ], description: 'Rörliga kostnader som är direkt kopplade till försäljningen (t.ex. inköp av varor).' },
    { id: 'cat-startup', title: 'Initial Investeringsfas', iconName: 'Rocket', items: [
      { id: 'init-start-1', label: 'Lokalanpassning & Inredning', value: 0, calculationMode: 'asset', costType: 'one-time', isUnitBased: false, purchasePrice: 0, lifespanYears: 5, vatRate: 25, startMonth: 1 },
      { id: 'init-start-2', label: 'Utrustning & Maskiner', value: 0, calculationMode: 'asset', costType: 'one-time', isUnitBased: false, purchasePrice: 0, lifespanYears: 5, vatRate: 25, startMonth: 1 },
      { id: 'init-start-3', label: 'Systemuppsättning & Licenser', value: 0, calculationMode: 'fixed', costType: 'one-time', isUnitBased: false, vatRate: 25, startMonth: 1 }
    ], description: 'Kapitalbehov och setup-kostnader innan intäktsstart' },
    { id: 'cat-payroll', title: 'Lönekostnader', iconName: 'Users', items: [
      { id: 'init-sal-1', label: 'VD / Grundare', value: 0, calculationMode: 'fixed', costType: 'recurring', isUnitBased: false, vatRate: 0, startMonth: 1 }
    ], description: 'Här planeras bruttolöner för personal. Systemet räknar automatiskt ut sociala avgifter och påslag.' },
    { id: 'cat-marketing', title: 'Marknadsföring (CAC)', iconName: 'Megaphone', items: [], description: 'Kostnader för kundanskaffning som används för att beräkna CAC.' },
    { id: 'cat-rent', title: 'Lokal & Kontor', iconName: 'Home', items: [] },
    { id: 'cat-it', title: 'IT & System', iconName: 'Cpu', items: [] },
    { id: 'cat-admin', title: 'Administration', iconName: 'Scale', items: [] },
    { id: 'cat-insurance', title: 'Försäkringar', iconName: 'ShieldCheck', items: [] },
    { id: 'cat-loan', title: 'Lån & Finansiering', iconName: 'Landmark', items: [] },
    { id: 'cat-other', title: 'Övriga kostnader', iconName: 'Package', items: [] },
    { id: 'cat-11', title: 'Oförutsedda', iconName: 'AlertTriangle', items: [] }
  ],
  personnelSettings: {
    fees: [
      { id: 'fee-1', label: 'Sociala Avgifter', percentage: 31.42 },
      { id: 'fee-2', label: 'Tjänstepension', percentage: 4.5 },
      { id: 'fee-3', label: 'Semesterlön', percentage: 12.0 },
      { id: 'fee-4', label: 'Sjukfrånvaro (schablon)', percentage: 4.0 }
    ],
    calculationMode: 'roles'
  },
  strategicSettings: {
    startingCash: 0,
    marketingSpend: 0,
    churnRate: 0,
    revenueStartMonth: 1,
    hasSeasonality: false,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    activeCategoriesOffSeason: ['cat-rent', 'cat-it', 'cat-loan', 'cat-insurance', 'cat-admin']
  }
};
