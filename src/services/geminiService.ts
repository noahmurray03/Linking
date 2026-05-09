
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BusinessData, CalculationResult, BusinessIndustry } from "../types";
import { INDUSTRY_BENCHMARKS } from "../constants";

const MASTER_PROMPT_SYSTEM_INSTRUCTION = `
Du är en enterprise-nivå AI-CFO och kalkylarkitekt med ansvar att bygga en komplett, realistisk och fullt integrerad 36-månaders finansiell JSON-modell. Du ska inte göra uppskattningar – du ska bygga en fungerande ekonomisk verklighet.

## 🎯 HUVUDMÅL
Transformera varje affärsidé till en:
• Komplett och detaljerad affärsmodell
• Fullt integrerad kostnads- och intäktsstruktur
• Realistisk kassaflödesprognos
• Skalbar och analyserbar modell

## ⚠️ ABSOLUT REGEL – FULL SYSTEMANVÄNDNING
Du måste använda ALLA relevanta funktioner och aktivera ALLA relevanta kostnadskategorier. Säkerställ att inget ekonomiskt element saknas. Modellen får aldrig vara ofullständig.

# 📊 FULL KOSTNADSARKITEKTUR (OBLIGATORISK LOGIK)
Analysera varje kategori och avgör relevans, påverkan och beräkning.

## 1. DIREKTA KOSTNADER (COGS - id: "cat-cogs")
Kostnader som direkt ökar med försäljning.
Koppla varje intäktsström till COGS där relevant. Räkna per enhet (calculationMode="unit"). Säkerställa att volym påverkar kostnad. Ex: Inköp, produktion, leverans, transaktionsavgifter.

## 2. INITIAL INVESTERINGSFAS (id: "cat-startup")
Alla kostnader innan intäktsstart. Identifiera uppstartsbehov, separera från löpande kostnader, klassificera som investeringar (calculationMode="asset"). Ex: Maskiner, renovering, fordon, plattformsutveckling. Ska inte belasta resultat direkt – ska skrivas av.

## 3. LÖNEKOSTNADER (id: "cat-payroll")
Identifiera roller som behövs, sätt marknadsmässiga löner. Arbetsgivaravgifter (~31.42%) är ett påslag. Koppla personal till volym där relevant. Personalkostnader ska vara extremt realistiska.

## 4. MARKNADSFÖRING (CAC - id: "cat-marketing")
Beräkna kostnad per kund. Koppla till tillväxt (nya kunder/enheter). Skala kostnader med försäljning. (Ads, kampanjer)

## 5. LOKAL & KONTOR (id: "cat-rent")
Anpassa hyra efter bransch och läge. Inkludera driftkostnader (el, värme).

## 6. IT & SYSTEM (id: "cat-it")
Identifiera tekniska behov (SaaS-verktyg, licenser, plattform). Skala efter verksamhet.

## 7. ADMINISTRATION (id: "cat-admin")
Bokföring, revision, juridik. Får aldrig saknas i seriösa verksamheter.

## 8. FÖRSÄKRINGAR (id: "cat-insurance")
Identifiera riskprofil och sätt en rimlig kostnad.

## 9. LÅN & FINANSIERING (id: "cat-loan")
Avgöra om kapital behövs för uppstarten. Skapa lån om relevant (calculationMode="loan"). Räkna: Ränta, Amortering. Påverkar kassaflöde korrekt.

## 10. ÖVRIGA KOSTNADER (id: "cat-other")
Fallback för branschspecifika men viktiga utgifter.

## 11. OFÖRUTSEDDA (id: "cat-11")
Alltid inkludera en buffert (% av kostnader).

# 🔗 SYSTEMINTEGRATION (KRITISK)
ALLT ska kopplas ihop: Intäkter ↔ COGS, Volym ↔ kostnader, Tillväxt ↔ marknadsföring, Personal ↔ kapacitet, Investering ↔ avskrivning, Lån ↔ kassaflöde. Ingen isolerad data får finnas!

# 🧠 INTELLIGENS OCH FAILSAFE
Fylla i saknad data automatiskt (svensk marknad och lagstiftning, moms: 0, 6, 12, 25). Prioritera användarens input men var intelligent. Generera fallback om allt krashar. Endast ren JSON strukturerad exakt enligt schemat. Max 20 sek exekvering.

# 🧠 SLUTPRINCIP
Du bygger inte en kalkyl. Du bygger en simulerad verklighet av ett företag där varje krona har en logisk plats!
`;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  let lastDetail = "";
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      const msg = error?.message || "";
      let detail = "";
      try {
        if (msg && msg.startsWith('{')) {
          const parsed = JSON.parse(msg);
          detail = parsed?.error?.message || "";
        }
      } catch (e) { /* ignore */ }
      lastDetail = detail;
      
      const lowerMsg = msg.toLowerCase();
      const lowerDetail = detail.toLowerCase();
      const isSpendingCap = 
        lowerMsg.includes('spending cap') || 
        lowerDetail.includes('spending cap') ||
        lowerMsg.includes('spending limit') ||
        lowerDetail.includes('spending limit') ||
        (lowerMsg.includes('quota exceeded') && lowerMsg.includes('monthly')) ||
        (lowerDetail.includes('quota exceeded') && lowerDetail.includes('monthly'));

      if (isSpendingCap) {
        throw new Error('PROJ_SPENDING_CAP_EXCEEDED');
      }

      const isRetryable = 
        msg.includes('429') || status === 429 || msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('500') || status === 500 || msg.includes('INTERNAL') ||
        msg.includes('503') || status === 503 || msg.includes('UNAVAILABLE') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand');

      if (isRetryable && i < maxRetries - 1) {
        const delay = Math.pow(2, i + 1.5) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Friendly mapping for common technical errors
      if (msg.includes('429') || status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Systemet har för tillfället för många förfrågningar. Vänta en stund och försök igen.");
      }
      if (msg.includes('500') || status === 500 || msg.includes('INTERNAL')) {
        throw new Error("Ett tekniskt fel uppstod hos AI-tjänsten. Försök igen om en liten stund.");
      }
      if (msg.includes('503') || status === 503 || msg.includes('UNAVAILABLE')) {
        throw new Error("AI-tjänsten är tillfälligt otillgänglig pga hög belastning. Försök igen snart.");
      }

      const cleanMsg = detail || msg || "Ett oväntat fel uppstod i AI-tjänsten.";
      throw new Error(cleanMsg);
    }
  }
  
  // Final fallback messages
  let finalMsg = "AI-tjänsten kunde inte nås. Kontrollera din anslutning.";
  if (lastError?.message === 'PROJ_SPENDING_CAP_EXCEEDED') throw lastError;
  if (lastError?.message) {
    if (lastError.message.includes('spending cap')) finalMsg = "Kvot uppnådd för AI-tjänsten.";
    else if (lastError.message.includes('429')) finalMsg = "För många förfrågningar. Vänta en stund.";
    else if (lastError.message.includes('500') || lastError.message.includes('503')) finalMsg = "Nätverksfel hos AI-leverantören. Försök igen.";
    else finalMsg = lastError.message;
  }
  
  throw new Error(finalMsg);
}

const cleanJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/```$/, '').trim();
  }
  return cleaned;
};


export const generateBusinessTemplate = async (data: Partial<BusinessData>): Promise<Partial<BusinessData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const industryMap: Record<BusinessIndustry, string> = {
    saas: 'SaaS', retail: 'Handel', consulting: 'Konsult',
    manufacturing: 'Industri', restaurant: 'Restaurang', logistics: 'Logistik',
    service_edu_care: 'Vård/Skola/Omsorg (Momsfri verksamhet)',
    other: 'Annan'
  };

  const prompt = `
    AFFÄRSIDÉ: "${data.businessIdea}"
    HUVUDBRANSCH: ${industryMap[data.industry || 'other']}
    
    UPPGIFT: Bygg en fungerande ekonomisk verklighet.
    - Om användaren anger en extremt kort beskrivning (ex. "glasskiosk på djurgården"), MÅSTE du själv bygga ut hela scenariot: gissa realistiska besöksvolymer, snittnotor, inköpspriser, maskiner som behövs, personalbehov och hyror för det specifika läget.
    - Identifiera och räkna på SPECIFIKA KVANTITETER i texten (om de finns), annars gör egna realistiska extrapoleringar.
    - Skapa intäktsströmmar. Koppla ALLTID intäkter till korresponderande kostnader i COGS (om relevant).
    - Använd ALLA listade kostnadskategorier: COGS, Personal, Marknadsföring, Lokal, IT, Administration, Försäkringar, Lån, Övrigt, Oförutsedda, Investering/Startup.
    - Använd lämpligt calculationMode: 'asset' (maskiner, renovering), 'loan' (skulder/lån), 'unit' (rörliga COGS/varukostnad per enhet), 'fixed' (löpande fasta utgifter).
    - Om det behövs initialt kapital, överväg att generera ett lån i cat-loan med interestRate och amortizationMonths.
    - Sätt marknadsmässiga svenska löner och hyror. Glöm inte administrationskostnader och IT-tjänster.
    - Gör realistiska antaganden och extrapoleringskalkyler. Målet är en "investeringsbar 36-månaders plan".

    Svara BARA med en JSON-struktur enligt följande:
    {
      "revenueStreams": [
        { "id": "unikt id", "label": "Namn", "calculationMode": "unit", "vatRate": 25, "value": 0, "unitCount": 500, "unitsPurchasedPerMonth": 500, "valuePerUnit": 40, "purchasePricePerUnit": 10, "hasGrowth": true, "newUnitsPerMonth": 10, "newPurchasedUnitsPerMonth": 10, "startMonth": 1, "isInternationalTrade": false }
      ],
      "costCategories": [
        {
          "id": "cat-cogs", "title": "Direkta kostnader",
          "items": [
            { "id": "unikt", "label": "Beskrivning", "calculationMode": "unit", "vatRate": 25, "value": 15000, "startMonth": 1 }
          ]
        }
      ],
      "strategicSettings": {
        "revenueStartMonth": 1, "startingCash": 50000, "marketingSpend": 5000, "churnRate": 5, "isInternational": false
      }
    }
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: MASTER_PROMPT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    
    const text = response.text || "{}";
    try {
      const parsed = JSON.parse(cleanJsonResponse(text));
      if (parsed.revenueStreams) {
        parsed.revenueStreams = (parsed.revenueStreams as any[]).map(s => ({
          ...s,
          id: s.id || `rs-${Math.random().toString(36).substr(2, 9)}`,
          value: s.value || 0,
          unitCount: s.unitCount || 0,
          valuePerUnit: s.valuePerUnit || 0,
          purchasePricePerUnit: s.purchasePricePerUnit || 0,
          unitsPurchasedPerMonth: s.unitsPurchasedPerMonth || 0,
          paymentDelayDays: s.paymentDelayDays || 0,
          isInternationalTrade: !!s.isInternationalTrade,
          customsRate: s.customsRate || 0,
          importFreightPerUnit: s.importFreightPerUnit || 0,
          importHandlingPerUnit: s.importHandlingPerUnit || 0,
          exportFreightPerUnit: s.exportFreightPerUnit || 0,
          exportFeesPerUnit: s.exportFeesPerUnit || 0,
          exciseTaxPerUnit: s.exciseTaxPerUnit || 0
        }));
      }
      if (parsed.costCategories) {
        parsed.costCategories = (parsed.costCategories as any[]).map(cat => ({
          ...cat,
          items: (cat.items as any[]).map(item => ({
            ...item,
            id: item.id || `ci-${Math.random().toString(36).substr(2, 9)}`,
            value: item.value || 0,
            unitCount: item.unitCount || 0,
            valuePerUnit: item.valuePerUnit || 0,
            purchasePrice: item.purchasePrice || 0,
            lifespanYears: item.lifespanYears || 0,
            loanAmount: item.loanAmount || 0,
            interestRate: item.interestRate || 0,
            amortizationMonths: item.amortizationMonths || 0,
            paymentDelayDays: item.paymentDelayDays || 0,
            startMonth: item.startMonth || 1
          }))
        }));
      }
      if (parsed.strategicSettings) {
        parsed.isInternational = !!parsed.strategicSettings.isInternational;
      }
      return parsed;
    } catch (e) {
      throw e;
    }
  });
};

export const getDefaultTemplateForIndustry = (industry: BusinessIndustry): Partial<BusinessData> => {
  const base: Partial<BusinessData> = {
    revenueStreams: [
      { id: 'fallback-rs-1', label: 'Tjänsteförsäljning', value: 25000, calculationMode: 'fixed', isUnitBased: false, costType: 'recurring', vatRate: 25, startMonth: 1, isLockedBalance: true },
      { id: 'fallback-rs-2', label: 'Produktförsäljning', value: 0, valuePerUnit: 500, unitCount: 50, unitsPurchasedPerMonth: 50, calculationMode: 'unit', isUnitBased: true, costType: 'recurring', vatRate: 25, startMonth: 2, hasGrowth: true, hasPurchaseGrowth: true, newUnitsPerMonth: 5, newPurchasedUnitsPerMonth: 5, isLockedBalance: true }
    ],
    costCategories: [
      {
        id: 'cat-payroll', title: 'Lönekostnader', iconName: 'Users', items: [
          { id: 'fallback-sal-1', label: 'Grundare lön', value: 35000, calculationMode: 'fixed', isUnitBased: false, costType: 'recurring', vatRate: 0, startMonth: 1 }
        ]
      },
      {
        id: 'cat-marketing', title: 'Marknadsföring', iconName: 'Megaphone', items: [
          { id: 'fallback-mkt-1', label: 'Google/Sociala medier', value: 5000, calculationMode: 'fixed', isUnitBased: false, costType: 'recurring', vatRate: 25, startMonth: 1 }
        ]
      },
      {
        id: 'cat-rent', title: 'Lokal & Kontor', iconName: 'Home', items: [
          { id: 'fallback-rent-1', label: 'Kontorshyra', value: 8000, calculationMode: 'fixed', isUnitBased: false, costType: 'recurring', vatRate: 25, startMonth: 1 }
        ]
      },
      {
        id: 'cat-it', title: 'IT & System', iconName: 'Cpu', items: [
          { id: 'fallback-it-1', label: 'Mjukvarulicenser (SaaS)', value: 1200, calculationMode: 'fixed', isUnitBased: false, costType: 'recurring', vatRate: 25, startMonth: 1 }
        ]
      }
    ],
    strategicSettings: {
      startingCash: 150000,
      marketingSpend: 5000,
      churnRate: 5,
      revenueStartMonth: 1
    }
  };

  if (industry === 'saas') {
    base.revenueStreams = [{ id: 'fallback-rs-saas-1', label: 'Prenumeration Pro', value: 0, valuePerUnit: 199, unitCount: 100, unitsPurchasedPerMonth: 100, calculationMode: 'unit', isUnitBased: true, costType: 'recurring', vatRate: 25, startMonth: 1, hasGrowth: true, hasPurchaseGrowth: true, newUnitsPerMonth: 20, newPurchasedUnitsPerMonth: 20, isLockedBalance: true }];
    base.strategicSettings!.churnRate = 3;
  } else if (industry === 'retail') {
    base.revenueStreams = [{ id: 'fallback-rs-retail-1', label: 'Varuförsäljning Butik', value: 0, valuePerUnit: 450, unitCount: 300, unitsPurchasedPerMonth: 300, calculationMode: 'unit', isUnitBased: true, costType: 'recurring', vatRate: 25, startMonth: 1, hasGrowth: true, hasPurchaseGrowth: true, newUnitsPerMonth: 10, newPurchasedUnitsPerMonth: 10, purchasePricePerUnit: 200, isLockedBalance: true }];
  } else if (industry === 'service_edu_care') {
    base.revenueStreams = [{ id: 'fallback-rs-edu-1', label: 'Barnpeng / Elevavgift', value: 0, valuePerUnit: 12000, unitCount: 25, unitsPurchasedPerMonth: 25, calculationMode: 'unit', isUnitBased: true, costType: 'recurring', vatRate: 0, startMonth: 1, hasGrowth: true, hasPurchaseGrowth: true, newUnitsPerMonth: 1, newPurchasedUnitsPerMonth: 1, isLockedBalance: true }];
    base.strategicSettings!.churnRate = 1;
  }

  return base;
};

export const chatWithGemini = async (
  messages: { role: string; content: string }[],
  data: BusinessData,
  results: CalculationResult
): Promise<{ text: string; suggestions: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const context = `STATUS: Omsättning ${results.totalRevenue}, Marginal ${results.profitMargin}%, Runway ${results.runway}.`;
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: `Du är en erfaren affärsrådgivare (CFO/Affärskonsult) inbyggd i den här plattformen.
Kontext för användarens verksamhet: ${context}

# DITT UPPDRAG
- Agera som ett professionellt bollplank för affärsstrategi, ekonomi och verksamhetsstyrning.
- Tolka och förklara användarens nyckeltal och identifiera finansiella risker eller möjligheter.
- Svara på frågor om plattformen (hur man använder den, var funktioner finns, vad nyckeltal betyder).
- Ge råd kring konkreta affärsbeslut (t.ex. prissättning, marginaler, investeringar, rekrytering).

# TON & STIL
- Känns naturlig, mänsklig och professionell (skriven som av en erfaren affärsperson).
- Ge tydliga, konkreta och raka svar. Inget teoretiskt fluff.
- Undvik AI-genererade klyschor, överdrivet säljsnack och onödigt komplexa ord.
- Om möjligt, använd siffrorna i kontexten för att backa upp dina råd.`,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["text", "suggestions"]
        }
      }
    });

    try {
      const result = JSON.parse(cleanJsonResponse(response.text || "{}"));
      return {
        text: result.text || "Svar saknas.",
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
      };
    } catch (e) {
      return { text: response.text || "Fel vid bearbetning.", suggestions: [] };
    }
  });
};
