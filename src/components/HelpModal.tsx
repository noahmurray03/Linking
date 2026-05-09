
import React, { useState } from 'react';
import { 
  X, HelpCircle, Target, Calculator, BrainCircuit, 
  TrendingUp, ShieldCheck, FileText, Rocket, 
  ChevronRight, ChevronLeft, BookOpen, Layers,
  Users, Activity, Share2, ClipboardList, MessageSquare,
  Sparkles, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: "Välkommen till Linking",
    description: "Linking hjälper dig att förvandla din affärsidé till en tydlig ekonomisk plan.\n\nDu behöver inga förkunskaper i ekonomi – systemet bygger modellen, räknar ut skatter och ger dig full kontroll.",
    icon: <Rocket className="text-amber-500" size={48} />,
    color: "bg-amber-50",
    feature: "Introduktion"
  },
  {
    title: "1. Beskriv din idé",
    description: "Börja under fliken 'Affärsplan'. Berätta kort vad du vill sälja och till vem.\n\nKlicka sedan på den magiska knappen 'Generera Mall' så skapar vår AI ett färdigt förslag med intäkter och kostnader som passar din bransch.",
    icon: <Sparkles className="text-blue-500" size={48} />,
    color: "bg-blue-50",
    feature: "AI Mallbyggare"
  },
  {
    title: "2. Hur tjänar du pengar?",
    description: "Under 'Kalkylark' hittar du dina intäkter.\n\nDu kan lägga till inkomster som är fasta per månad (t.ex. abonnemang), eller styckbaserade (t.ex. om du säljer produkter eller timmar).",
    icon: <TrendingUp className="text-emerald-500" size={48} />,
    color: "bg-emerald-50",
    feature: "Intäkter"
  },
  {
    title: "3. Koll på utgifterna",
    description: "Dela upp dina kostnader i tydliga kategorier. \n\nVälj 'Fast' för hyra, 'Investering' för stora maskiner eller 'Löpande enheter' för saker du köper in hela tiden. Enkelt och överskådligt.",
    icon: <Layers className="text-rose-500" size={48} />,
    color: "bg-rose-50",
    feature: "Kostnader"
  },
  {
    title: "4. Sälj en, köp en",
    description: "Säljer du fysiska produkter måste du ju köpa in dem först. Detta kallas för COGS (sålda varors kostnad).\n\nUnder 'Direkta kostnader' kopplar du ihop dina försäljningar med inköpspris, frakt och emballage för att se din verkliga vinstmarginal.",
    icon: <ClipboardList className="text-cyan-500" size={48} />,
    color: "bg-cyan-50",
    feature: "Produktkalkyl"
  },
  {
    title: "5. Anställ personal",
    description: "Lägg in månadslöner under fliken 'Personal'. \n\nDu behöver inte googla procentsatser! Systemet lägger automatiskt på sociala avgifter och semesterersättning så du ser vad personalen faktiskt kostar.",
    icon: <Users className="text-purple-500" size={48} />,
    color: "bg-purple-50",
    feature: "Personal"
  },
  {
    title: "6. Handla med utlandet",
    description: "Köper du lagervaror från Asien eller säljer du till EU? \n\nBocka i 'Internationell handel' under 'Strategi'. Då hjälper systemet dig att förstå tullkostnader och utlandsfrakt.",
    icon: <Globe className="text-indigo-500" size={48} />,
    color: "bg-indigo-50",
    feature: "Handel"
  },
  {
    title: "7. Se din framtid",
    description: "Under 'Dashboard' ser du tydliga grafer över hur ditt företag mår i framtiden. \n\nDu ser exakt när pengarna kan tänkas ta slut i kassan (din Runway) och vilken månad du förväntas börja gå med vinst (Break-even).",
    icon: <Activity className="text-teal-500" size={48} />,
    color: "bg-teal-50",
    feature: "Överblick"
  },
  {
    title: "8. Revision & Rapporter",
    description: "Är du redo att visa upp din plan för en bank eller investerare?\n\nKlicka på 'Revision' för att dubbelkolla uträkningarna. Klicka sedan på 'PDF Rapport' högst upp för att få ett snyggt och professionellt underlag.",
    icon: <FileText className="text-orange-500" size={48} />,
    color: "bg-orange-50",
    feature: "Rapporter"
  },
  {
    title: "Din personliga rådgivare",
    description: "Glöm inte att du alltid har en ekonomiexpert redo!\n\nLängst ner till höger hittar du chatten. Fråga vår AI om din affärsmodell, be om förbättringsförslag eller få hjälp att förstå krångliga ord.",
    icon: <BrainCircuit className="text-amber-600" size={48} />,
    color: "bg-amber-100",
    feature: "AI Chat"
  }
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
          >
          {/* Header */}
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl shadow-slate-900/10">
                <HelpCircle size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight leading-none">Plattformsguide</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1.5 flex items-center gap-2">
                  <span className="text-slate-900">Steg {currentStep + 1} av {STEPS.length}</span>
                  {STEPS[currentStep].feature && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span>Modul: {STEPS[currentStep].feature}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar (Visual structure) */}
          <div className="h-1 bg-slate-50 flex">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-amber-400' : 'bg-transparent'}`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-10 sm:p-14 relative group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
               <ShieldCheck size={280} />
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className={`w-40 h-40 ${STEPS[currentStep].color} rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner border border-white/50 relative`}
              >
                <div className="absolute -top-3 -right-3 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-slate-100 text-slate-900 font-semibold text-sm">
                   0{currentStep + 1}
                </div>
                {STEPS[currentStep].icon}
              </motion.div>
              
              <motion.div
                key={`text-${currentStep}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-semibold text-slate-900 uppercase tracking-tight leading-tight">
                  {STEPS[currentStep].title}
                </h3>
                <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto font-medium whitespace-pre-line">
                  {STEPS[currentStep].description}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-10 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-2">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-10 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              {currentStep > 0 && (
                <button 
                  onClick={prevStep}
                  className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-slate-500 font-semibold text-xs uppercase tracking-wide hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Föregående
                </button>
              )}
              <button 
                onClick={nextStep}
                className="flex-1 sm:flex-none bg-slate-900 text-white px-10 py-4 rounded-[1.2rem] font-semibold text-xs uppercase tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95"
              >
                {currentStep === STEPS.length - 1 ? 'Börja använda systemet' : 'Nästa steg'}
                {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
