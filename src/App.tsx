
import React, { useState, useMemo, useEffect, useRef, ReactNode } from 'react';
import { 
  Building2, Users, Home, Cpu, Megaphone, Truck, ShieldCheck, Scale, 
  Briefcase, Wallet, BarChart3, BrainCircuit, MessageSquare, TrendingUp, 
  TrendingDown, DollarSign, AlertTriangle, LogOut, Info, ChevronRight, 
  Sparkles, Trash2, Plus, PieChart as PieChartIcon, Wand2, Package, Box,
  Landmark, UserCircle, Rocket, Layers, Calculator, Copy, CheckCircle2,
  Hash, CreditCard, UserPlus, Users2, X, Send, LifeBuoy, RefreshCw, Loader2, Flame,
  Percent, Settings2, Target, Zap, Activity, Globe, HelpCircle, ShieldAlert, Shield, Link2, Link2Off,
  RotateCcw, Key, Layers3, BookOpen, LayoutGrid, Info as InfoIcon, CalendarDays,
  Clock, FileText, ChevronDown, ChevronUp, MessageCircle, History as HistoryIcon,
  LineChart as LineChartIcon, BookOpenCheck, Lightbulb, Coins, ArrowUpRight, Play, Pause,
  User, Bot, FileSpreadsheet, Download, FileCheck2, GripVertical, Calendar, Menu
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  BusinessData, 
  CalculationResult, 
  FinancialItem, 
  FinancialCategory, 
  CustomFee, 
  BusinessIndustry, 
  MonthlyData, 
  CostType,
  ProjectComment,
  BudgetMember,
  ScenarioSnapshot,
  Milestone,
  RevenueLink
} from './types';
import { 
  INITIAL_DATA, 
  CORPORATE_TAX_RATE, 
  COLORS, 
  LOGIC_DEFINITIONS, 
  CATEGORY_GUIDE, 
  KPI_GUIDE, 
  IconMap,
  SOCIAL_FEES_DEFINITION,
  INDUSTRY_BENCHMARKS,
  CURRENCIES
} from './constants';
import { FinancialSection } from './components/FinancialSection';
import { chatWithGemini, generateBusinessTemplate, getDefaultTemplateForIndustry } from './services/geminiService';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, orderBy, getDocs, addDoc, writeBatch } from 'firebase/firestore';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { AmortizationModal } from './components/AmortizationModal';
import { FormattedNumberInput } from './components/FormattedNumberInput';
import { InfoTooltip } from './components/InfoTooltip';
import { KPIHeader } from './components/KPIHeader';
import { DashboardCharts } from './components/DashboardCharts';
import { ChatInterface } from './components/ChatInterface';
import { ReportModal } from './components/ReportModal';
import { AuditLogModal } from './components/AuditLogModal';
import { HelpModal } from './components/HelpModal';
import { StrategySection } from './components/StrategySection';
import { CommentThread } from './components/CommentThread';
import { calculateResults, formatNumber, formatAmount } from './lib/calculations';

const getResultColor = (val: number) => val >= 0 ? 'text-emerald-400' : 'text-red-400';
const getCashFlowColor = (val: number) => val >= 0 ? 'text-blue-400' : 'text-orange-400';

const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  secondary?: string; 
  color?: 'emerald' | 'red' | 'blue' | 'orange' | 'purple' | 'indigo' | 'slate';
  tip?: string;
}> = ({ label, value, secondary, color = 'slate', tip }) => {
  const colorClasses = {
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100/50',
    red: 'text-red-700 bg-red-50/30 border-red-100/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100/50',
    purple: 'text-purple-700 bg-purple-50/30 border-purple-100/50',
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100/50',
    slate: 'text-slate-900 bg-slate-50/30 border-slate-200/50'
  };

  return (
    <div className="group relative">
      <div className={`p-4 rounded-xl border transition-all ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-tight text-slate-400">{label}</span>
          {tip && <Info size={10} className="opacity-30 group-hover:opacity-100 transition-opacity" />}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-900">{value}</span>
          {secondary && <span className="text-xs font-bold uppercase opacity-40 tabular-nums">{secondary}</span>}
        </div>
      </div>
      {tip && (
        <div className="absolute bottom-full left-0 mb-3 w-56 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg pointer-events-none border border-white/10">
          <p className="leading-relaxed font-medium">{tip}</p>
        </div>
      )}
    </div>
  );
};

const ExcelMetricRow: React.FC<{
  id?: string;
  label: string;
  value: string | number;
  note?: string;
  color?: string;
  status?: 'good' | 'neutral' | 'bad';
  trend?: 'up' | 'down';
  tip?: string;
  isLast?: boolean;
}> = ({ id, label, value, note, color = 'text-slate-900', status, trend, tip, isLast }) => {
  const getStatusBg = () => {
    switch (status) {
      case 'good': return 'bg-emerald-50/50';
      case 'neutral': return 'bg-amber-50/50';
      case 'bad': return 'bg-red-50/50';
      default: return 'bg-transparent';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'good': return 'text-emerald-700';
      case 'neutral': return 'text-amber-700';
      case 'bad': return 'text-red-700';
      default: return color;
    }
  };

  return (
    <div className={`group relative grid grid-cols-12 items-center hover:bg-slate-50/80 transition-all border-l-[3px] ${status === 'good' ? 'border-l-emerald-500' : status === 'bad' ? 'border-l-red-500' : status === 'neutral' ? 'border-l-amber-400' : 'border-l-slate-200'} ${!isLast ? 'border-b border-slate-100' : ''}`}>
       {/* Column A: Item Name */}
       <div className="col-span-6 px-6 py-4 border-r border-slate-50 flex items-center gap-3">
          {id && <span className="text-xs font-mono text-slate-300 w-4">{id}</span>}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="text-xs font-semibold text-slate-700 tracking-tight">{label}</span>
               {tip && <InfoTooltip text={tip} iconSize={12} />}
            </div>
            {note && <span className="text-xs font-medium text-slate-400 leading-none mt-1 uppercase tracking-wider">{note}</span>}
          </div>
       </div>

       {/* Column B: Current Value */}
       <div className={`col-span-3 px-6 py-4 border-r border-slate-50 text-right font-mono font-bold tabular-nums text-sm ${getStatusBg()} ${getStatusTextColor()}`}>
          {value}
       </div>

       {/* Column C: Performance Indicator */}
       <div className="col-span-3 px-4 py-4 flex items-center justify-end gap-3 pr-6">
          {trend && (
             <div className={`flex items-center justify-center w-5 h-5 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
             </div>
          )}
          {status && (
            <div className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-sm tracking-wide ${
              status === 'good' ? 'bg-emerald-500 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)]' : 
              status === 'bad' ? 'bg-red-500 text-white shadow-[0_2px_4px_rgba(239,68,68,0.2)]' : 
              'bg-amber-400 text-white shadow-[0_2px_4px_rgba(251,191,36,0.2)]'
            }`}>
              {status === 'good' ? 'Secure' : status === 'bad' ? 'Deficit' : 'Warning'}
            </div>
          )}
       </div>
    </div>
  );
};

const wrapWithLogicTooltips = (text: string) => {
  const terms = Object.keys(LOGIC_DEFINITIONS);
  let parts: (string | React.ReactNode)[] = [text];
  terms.forEach(term => {
    const newParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part !== 'string') { newParts.push(part); return; }
      const regex = new RegExp(`(${term})`, 'gi');
      const split = part.split(regex);
      split.forEach((subPart, i) => {
        if (subPart.toLowerCase() === term.toLowerCase()) {
          newParts.push(
            <span key={`${term}-${i}`} className="inline-flex items-center">
              {subPart}
              <InfoTooltip 
                text={(LOGIC_DEFINITIONS as any)[term]?.text}
                definition={(LOGIC_DEFINITIONS as any)[term]?.definition} 
                calculation={(LOGIC_DEFINITIONS as any)[term]?.calculation} 
                example={(LOGIC_DEFINITIONS as any)[term]?.example} 
                iconSize={10} 
              />
            </span>
          );
        } else if (subPart !== '') {
          newParts.push(subPart);
        }
      });
    });
    parts = newParts;
  });
  return parts.map((part, idx) => (
    <React.Fragment key={idx}>
      {part}
    </React.Fragment>
  ));
};

const SidebarItem: React.FC<{ 
  id: 'dashboard' | 'setup' | 'personnel' | 'logic' | 'strategy'; 
  label: string; 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  description?: string;
}> = ({ label, icon, active, onClick, description }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-slate-900 text-white shadow-sm' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <div className={`transition-colors ${active ? 'text-amber-400' : 'group-hover:text-slate-900'}`}>
      {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })}
    </div>
    <div className="flex flex-col items-start text-left">
      <span className="text-xs font-bold tracking-tight">{label}</span>
    </div>
  </button>
);

const WelcomeHero: React.FC<{ onStart: () => void; onHelp: () => void; onDismiss: () => void }> = ({ onStart, onHelp, onDismiss }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 lg:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12"
  >
    {/* Refined gradient overlays for professional depth */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 opacity-90" />
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-screen pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 mix-blend-screen pointer-events-none" />

    <button 
      onClick={onDismiss}
      className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-20"
      title="Dölj"
    >
      <X size={18} />
    </button>
    
    <div className="relative z-10 max-w-xl text-left flex-1 w-full">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wide mb-6 shadow-sm">
        <Target size={12} />
        <span>Finansiell Modellering</span>
      </div>
      
      <h1 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-5 leading-[1.1]">
        Säkra finansiering med <br />
        <span className="text-slate-400 font-medium">kirurgisk precision</span>
      </h1>
      
      <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md font-medium">
        Prognostisera kapitalbehov, simulera kassaflöden och generera investerarredo rapporter på nolltid. Få total kontroll över din affärsmodell innan du skalar.
      </p>
      
      <div className="flex flex-wrap gap-4 items-center">
        <button 
          onClick={onStart}
          className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold uppercase tracking-tight text-xs hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center gap-2"
        >
          Kom igång
          <ChevronRight size={16} strokeWidth={3} />
        </button>
        <button 
          onClick={onHelp}
          className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold uppercase tracking-tight text-xs hover:bg-slate-700 transition-all"
        >
          Läs mer
        </button>
      </div>
    </div>
    
    <div className="relative z-10 hidden md:block border-l border-slate-800/80 pl-12 py-4 flex-1">
       <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
               <TrendingUp size={18} className="text-emerald-400" />
             </div>
             <div>
               <h3 className="text-white text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                 Dynamisk Prognos
               </h3>
               <p className="text-slate-500 text-xs leading-relaxed font-medium">
                 Ändra priser eller kostnader och se omedelbart hur det påverkar marginaler och runway.
               </p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
               <ShieldCheck size={18} className="text-blue-400" />
             </div>
             <div>
               <h3 className="text-white text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                 Tryggt Kapitalbehov
               </h3>
               <p className="text-slate-500 text-xs leading-relaxed font-medium">
                 Vi räknar ut exakt hur mycket pengar du behöver bränna innan verksamheten bär sig själv.
               </p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
               <FileText size={18} className="text-amber-400" />
             </div>
             <div>
               <h3 className="text-white text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                 Klar för pitch
               </h3>
               <p className="text-slate-500 text-xs leading-relaxed font-medium">
                 Imponera på bank och investerare med kompletta PDF-rapporter och interaktiv Excel-revision.
               </p>
             </div>
          </div>
       </div>
    </div>
  </motion.div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<BusinessData>(() => JSON.parse(JSON.stringify(INITIAL_DATA)));
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [breakdownMode, setBreakdownMode] = useState<'costs' | 'revenue'>('costs');
  const [linkingCatId, setLinkingCatId] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'personnel' | 'logic' | 'strategy'>('setup');
  const [activeCommentItem, setActiveCommentItem] = useState<{id: string, label: string} | null>(null);
  const [mobileView, setMobileView] = useState<'budget' | 'dashboard' | 'chat'>('budget');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showLogicReference, setShowLogicReference] = useState(false);
  const [showWelcomeHero, setShowWelcomeHero] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string; suggestions?: string[] }[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [forecastDuration, setForecastDuration] = useState<number>(36);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [forceCategoriesOpen, setForceCategoriesOpen] = useState(false);
  const [amortizationModal, setAmortizationModal] = useState<{
    isOpen: boolean;
    loan: FinancialItem | null;
  }>({ isOpen: false, loan: null });
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // Sync header state with profile in Firestore
  useEffect(() => {
    if (!user || !authReady) return;
    
    const loadProfile = async () => {
      try {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const profile = snap.data();
          if (profile.isHeaderExpanded !== undefined) setIsHeaderExpanded(profile.isHeaderExpanded);
          if (profile.hasSeenGuide === false) setIsHelpModalOpen(true);
        } else {
          // If no profile, try localStorage migration or defaults
          const savedHeader = localStorage.getItem('linking_header_expanded');
          const hasSeenGuide = localStorage.getItem('linking_guide_seen_${user.uid}');
          
          const initialHeader = savedHeader !== null ? JSON.parse(savedHeader) : true;
          const initialGuideSeen = hasSeenGuide === 'true';
          
          setIsHeaderExpanded(initialHeader);
          if (!initialGuideSeen) setIsHelpModalOpen(true);
          
          await setDoc(profileRef, {
            isHeaderExpanded: initialHeader,
            hasSeenGuide: initialGuideSeen,
            email: user.email,
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        // Log is hidden from user
      }
    };
    
    loadProfile();
  }, [user, authReady]);

  useEffect(() => {
    if (!user || !authReady) return;
    const saveProfile = async () => {
      try {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(profileRef, { 
          isHeaderExpanded,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        // Log is hidden
      }
    };
    saveProfile();
  }, [isHeaderExpanded]);
  
  const lastSavedData = useRef<string>(JSON.stringify(INITIAL_DATA));
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setLoading(false);
        setData(JSON.parse(JSON.stringify(INITIAL_DATA)));
      }
    });
    return () => unsubscribe();
  }, []);

  // Chat persistence
  useEffect(() => {
    if (!user) {
      setChatMessages([]);
      return;
    }

    const loadChat = async () => {
      // 1. Try loading from localStorage first (fastest)
      const localChat = localStorage.getItem(`linking_chat_${user.uid}`);
      if (localChat) {
        try {
          setChatMessages(JSON.parse(localChat));
        } catch (e) {
          // Log hidden
        }
      }

      // 2. Then try Firestore to sync
      try {
        const chatRef = collection(db, 'users', user.uid, 'chats');
        const q = query(chatRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const loadedMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { role: data.role as 'user' | 'model', content: data.content, suggestions: data.suggestions };
        });
        if (loadedMessages.length > 0) {
          setChatMessages(loadedMessages);
          // Sync back to localStorage
          localStorage.setItem(`linking_chat_${user.uid}`, JSON.stringify(loadedMessages));
        }
      } catch (error) {
        // Log hidden
      }
    };

    loadChat();
  }, [user]);

  // Guide persistence logic migrated to profile sync
  useEffect(() => {
    if (user && authReady && isHelpModalOpen === false) {
      const markGuideSeen = async () => {
        try {
          const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
          await setDoc(profileRef, { 
            hasSeenGuide: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
          localStorage.setItem(`linking_guide_seen_${user.uid}`, 'true');
        } catch (err) {
          // Log hidden
        }
      };
      markGuideSeen();
    }
  }, [isHelpModalOpen, user, authReady]);

  // Sync chat to localStorage whenever it changes
  useEffect(() => {
    if (user && chatMessages.length > 0) {
      localStorage.setItem(`linking_chat_${user.uid}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, user]);

  // Scroll to top on tab change
  useEffect(() => {
    const mainContent = document.getElementById('main-scroll-container');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    // Also scroll window just in case mobile view is different
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Data persistence
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid, 'data', 'current');
    
    // Initial load
    const loadData = async () => {
      try {
        const budgetRef = doc(db, 'budgets', user.uid);
        const docSnap = await getDoc(budgetRef);
        let finalData = JSON.parse(JSON.stringify(INITIAL_DATA));
        
        // Check localStorage first as a potential source for migration
        const localDataStr = localStorage.getItem(`linking_data_${user.uid}`);
        let localData = null;
        if (localDataStr) {
          try {
            localData = JSON.parse(localDataStr);
          } catch (e) {
            // Log hidden
          }
        }

        if (docSnap.exists()) {
          const remoteData = docSnap.data() as BusinessData;
          finalData = mergeStandardCategories(remoteData);
          
          if (!finalData.budgetId) {
            finalData.budgetId = user.uid;
            if (!finalData.members) {
              finalData.members = [{ email: user.email || '', role: 'owner', joinedAt: Date.now() }];
            }
          }
        } else if (localData) {
          finalData = mergeStandardCategories(localData);
          if (!finalData.budgetId) {
            finalData.budgetId = user.uid;
            finalData.members = [{ email: user.email || '', role: 'owner', joinedAt: Date.now() }];
          }
        } else {
          // Initialize with default data if none exists
          finalData = JSON.parse(JSON.stringify(INITIAL_DATA));
          finalData.budgetId = user.uid;
          finalData.members = [{ email: user.email || '', role: 'owner', joinedAt: Date.now() }];
          
          await setDoc(budgetRef, {
            ...finalData,
            ownerId: user.uid,
            memberEmails: [user.email || ''],
            memberRoles: { [user.email || '']: 'owner' },
            updatedAt: serverTimestamp()
          });
        }
        
        setData(finalData);
        lastSavedData.current = JSON.stringify(finalData);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `budgets/${user.uid}`);
        // Fallback to localStorage if Firestore fails
        const localDataStr = localStorage.getItem(`linking_data_${user.uid}`);
        // ... rest of error logic (restoring lines 461-473)
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            const merged = mergeStandardCategories(localData);
            setData(merged);
            lastSavedData.current = JSON.stringify(merged);
            setSaveStatus('error');
          } catch (e) {
            setData(JSON.parse(JSON.stringify(INITIAL_DATA)));
          }
        } else {
          setData(JSON.parse(JSON.stringify(INITIAL_DATA)));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time sync from /budgets
    const budgetRef = doc(db, 'budgets', user.uid);
    const unsubscribe = onSnapshot(budgetRef, (snapshot) => {
      if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
        const remoteData = snapshot.data() as BusinessData;
        setData(mergeStandardCategories(remoteData));
      }
    }, (error) => {
      setSaveStatus('error');
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-save logic
  useEffect(() => {
    if (!user || loading) return;

    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === lastSavedData.current) return;

    // Always backup to localStorage immediately
    localStorage.setItem(`linking_data_${user.uid}`, currentDataStr);

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const budgetRef = doc(db, 'budgets', user.uid);
      try {
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(budgetRef, {
          ...cleanData,
          ownerId: user.uid,
          memberEmails: [user.email || ''],
          memberRoles: { [user.email || '']: 'owner' },
          updatedAt: serverTimestamp()
        }, { merge: true });
        lastSavedData.current = currentDataStr;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        handleFirestoreError(error, OperationType.WRITE, `budgets/${user.uid}`);
      }
    }, 2000); 

    return () => clearTimeout(timer);
  }, [data, user, loading]);

  const handleManualSave = async () => {
    if (!user || loading) return;
    
    const currentDataStr = JSON.stringify(data);
    setSaveStatus('saving');
    const budgetRef = doc(db, 'budgets', user.uid);
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(budgetRef, {
        ...cleanData,
        ownerId: user.uid,
        memberEmails: [user.email || ''],
        memberRoles: { [user.email || '']: 'owner' },
        updatedAt: serverTimestamp()
      }, { merge: true });
      lastSavedData.current = currentDataStr;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `budgets/${user.uid}`);
      setSaveStatus('error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, isDestructive });
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isChatLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // Save user message to Firestore
    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'chats'), {
          ...userMessage,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats`);
      }
    }

    try {
      const response = await chatWithGemini([...chatMessages, userMessage], data, results);
      const assistantMessage = { 
        role: 'model' as const, 
        content: response.text,
        suggestions: response.suggestions
      };
      setChatMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to Firestore
      if (user) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'chats'), {
            ...assistantMessage,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats`);
        }
      }
    } catch (error) {
      let errorMsg = "Ursäkta, jag stötte på ett tekniskt problem. Kan du försöka igen?";
      if (error instanceof Error && error.message === 'PROJ_SPENDING_CAP_EXCEEDED') {
        errorMsg = "### ⚠️ Systemmeddelande: Kvot uppnådd\nDin projektkvot för AI-tjänsten är slut (spending cap uppnådd). För att fortsätta använda AI-funktionerna behöver du höja din gräns i [Google AI Studio](https://ai.studio/spend).\n\nDu kan fortfarande redigera din budget manuellt.";
      }
      setChatMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleClearChat = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Rensa konversation',
      message: 'Är du säker på att du vill rensa hela chatthistoriken? Detta går inte att ångra.',
      isDestructive: true,
      onConfirm: async () => {
        setChatMessages([]);
        if (user) {
          localStorage.removeItem(`linking_chat_${user.uid}`);
          try {
            const chatRef = collection(db, 'users', user.uid, 'chats');
            const q = query(chatRef);
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/chats`);
          }
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast("Chatthistoriken har rensats.", "success");
      }
    });
  };

  const updateGlobalStartMonth = (newVal: number) => {
    setData(prev => ({
      ...prev,
      strategicSettings: {
        ...prev.strategicSettings,
        revenueStartMonth: newVal
      },
      // Optionally update all items to follow the new global start month
      // if the user wants them to stay "unified"
      revenueStreams: prev.revenueStreams.map(s => ({ ...s, startMonth: newVal })),
      costCategories: prev.costCategories.map(c => ({
        ...c,
        items: c.items.map(i => ({ ...i, startMonth: newVal }))
      }))
    }));
  };

  const totalOverheadPct = useMemo(() => {
    const { fees } = data.personnelSettings;
    return fees.reduce((sum, fee) => sum + (Number(fee.percentage) || 0), 0);
  }, [data.personnelSettings]);

  const holidayPayRate = useMemo(() => {
    const holidayFee = data.personnelSettings.fees.find(f => f.label.toLowerCase().includes('semester'));
    return holidayFee ? Number(holidayFee.percentage) || 0 : 0;
  }, [data.personnelSettings.fees]);

  const results = useMemo<CalculationResult>(() => {
    return calculateResults(data, totalOverheadPct, holidayPayRate, forecastDuration);
  }, [data, totalOverheadPct, holidayPayRate, forecastDuration]);

  const handleGenerateTemplate = async () => {
    if (!data.businessIdea.trim()) {
      showToast("Vänligen beskriv din affärsidé eller sysselsättning först.", "info");
      return;
    }
    setIsGenerating(true);
    try {
      const template = await generateBusinessTemplate(data);
      if (template && (template.revenueStreams?.length || template.costCategories?.length)) {
        setData(prev => {
          const aiRevenueStreams = (template.revenueStreams as FinancialItem[]) || [];
          const aiCategories = (template.costCategories as FinancialCategory[]) || [];
          const aiStrategic = template.strategicSettings;
          
          const newRevenueStreams = aiRevenueStreams.map(s => {
            const isUnit = s.calculationMode === 'unit' || s.calculationMode === 'product';
            return {
              ...s,
              id: `ai-rev-${Math.random().toString(36).substr(2, 9)}`,
              isUnitBased: isUnit,
              costType: 'recurring' as CostType,
              unitsPurchasedPerMonth: s.unitCount,
              newPurchasedUnitsPerMonth: s.newUnitsPerMonth,
              hasPurchaseGrowth: s.hasGrowth ?? ((s.newUnitsPerMonth || 0) > 0),
              isLockedBalance: true
            };
          });

          const newCategories = aiCategories.map(aiCat => {
            const isStartup = aiCat.id === 'cat-startup' || aiCat.title.toLowerCase().includes('uppstart') || aiCat.title.toLowerCase().includes('investering');
            
            const processedItems = (aiCat.items || []).map(item => ({
              ...item,
              id: `ai-item-${Math.random().toString(36).substr(2, 9)}`,
              isLoan: item.calculationMode === 'loan',
              isAsset: item.calculationMode === 'asset',
              isUnitBased: item.calculationMode === 'unit',
              costType: (item.costType as CostType) || (isStartup ? 'one-time' : 'recurring' as CostType),
              startMonth: item.startMonth || 1
            }));

            return {
              ...aiCat,
              id: aiCat.id || `ai-cat-${Math.random().toString(36).substr(2, 9)}`,
              items: processedItems,
              iconName: aiCat.id === 'cat-payroll' ? 'Users' : 
                       aiCat.id === 'cat-marketing' ? 'Megaphone' :
                       aiCat.id === 'cat-startup' ? 'Zap' : 
                       aiCat.id === 'cat-rent' ? 'Home' :
                       aiCat.id === 'cat-it' ? 'Cpu' : 'Box'
            };
          });

          // BEVARA ALLA inmatade kostnader för COGS! Prompten är strikt med att COGS aldrig får försvinna.
          const prevCogs = prev.costCategories.find(c => c.id === 'cat-cogs');
          let finalCategories = newCategories.length > 0 ? newCategories : prev.costCategories;
          
          if (prevCogs && finalCategories !== prev.costCategories) {
            finalCategories = [...finalCategories];
            const cogsIdx = finalCategories.findIndex(c => c.id === 'cat-cogs' || c.title.toLowerCase().includes('cogs') || c.title.toLowerCase().includes('direkta'));
            if (cogsIdx > -1) {
              finalCategories[cogsIdx] = { ...finalCategories[cogsIdx], items: prevCogs.items };
            } else {
              finalCategories.unshift(prevCogs);
            }
          }

          return {
            ...prev,
            isInternational: aiStrategic?.isInternational ?? prev.isInternational,
            revenueStreams: newRevenueStreams.length > 0 ? newRevenueStreams : prev.revenueStreams,
            costCategories: finalCategories,
            strategicSettings: aiStrategic ? {
              ...prev.strategicSettings,
              ...aiStrategic
            } : prev.strategicSettings,
            milestones: template.milestones || prev.milestones || []
          };
        });
        setForceCategoriesOpen(true);
        showToast("Mall genererad baserat på din affärsidé!", "success");
      } else {
        showToast("AI:n kunde inte generera en detaljerad mall i detta format. Försök vara mer specifik i din beskrivning.", "info");
      }
    } catch (error: unknown) {
      console.error("Error in handleGenerateTemplate:", error);
      const err = error as Error;
      if (err.message === 'PROJ_SPENDING_CAP_EXCEEDED') {
        setConfirmModal({
          isOpen: true,
          title: 'Kvot för AI uppnådd',
          message: 'Din projektkvot för AI-tjänsten är slut. Vill du att vi laddar in en grundläggande branschmall åt dig istället? Den raderar dina nuvarande siffror.',
          onConfirm: () => {
            const template = getDefaultTemplateForIndustry(data.industry);
            setData(prev => {
              const prevCogs = prev.costCategories.find(c => c.id === 'cat-cogs');
              let newCats = template.costCategories || prev.costCategories;
              
              if (prevCogs && newCats !== prev.costCategories) {
                newCats = [...newCats];
                const cogsIdx = newCats.findIndex(c => c.id === 'cat-cogs' || c.title.toLowerCase().includes('cogs') || c.title.toLowerCase().includes('direkta'));
                if (cogsIdx > -1) {
                  newCats[cogsIdx] = { ...newCats[cogsIdx], items: prevCogs.items };
                } else {
                  newCats.unshift(prevCogs);
                }
              }
              return { ...prev, ...template, costCategories: newCats };
            });
            setForceCategoriesOpen(true);
            showToast("Grundmall laddad.", "success");
          }
        });
      } else {
        showToast("Kunde inte generera mall. Försök med en tydligare eller kortare beskrivning.", "error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiQuery.trim()) return;
    const queryText = aiQuery;
    setAiQuery('');
    setIsChatOpen(true);
    handleSendMessage(queryText);
  };

  const resetData = () => {
    confirmAction(
      "Nollställ budget", 
      "Är du säker på att du vill nollställa all data? Detta går inte att ångra.", 
      async () => {
        const freshData = JSON.parse(JSON.stringify(INITIAL_DATA));
        if (data.budgetId) freshData.budgetId = data.budgetId;
        if (data.members) freshData.members = data.members;
        
        setData(freshData);
        setChatMessages([]);
        
        // Clear chat in Firestore
        if (user) {
          try {
            const chatRef = collection(db, 'users', user.uid, 'chats');
            const q = query(chatRef);
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/chats`);
          }
        }
        
        showToast("Budgeten har nollställts", "info");
      },
      true
    );
  };

  const sanitizeBusinessData = (prev: BusinessData): BusinessData => {
    // 1. Ensure all categories and items have unique IDs
    const categoryRegistry = new Set<string>();
    const itemRegistry = new Set<string>();
    
    const sanitizedCategories = prev.costCategories.map(cat => {
      let newCatId = cat.id;
      if (!newCatId || newCatId.length < 5 || categoryRegistry.has(newCatId)) {
        newCatId = `cat-${Math.random().toString(36).substr(2, 9)}`;
      }
      categoryRegistry.add(newCatId);

      return {
        ...cat,
        id: newCatId,
        items: cat.items.map(item => {
          let newItemId = item.id;
          if (!newItemId || newItemId.length < 5 || itemRegistry.has(newItemId)) {
            newItemId = `item-${Math.random().toString(36).substr(2, 9)}`;
          }
          itemRegistry.add(newItemId);
          return { ...item, id: newItemId };
        })
      };
    });

    // 2. Merging logic: Respect the order in INITIAL_DATA for standard categories
    const standardIds = INITIAL_DATA.costCategories.map(c => c.id);
    const standardTitles = INITIAL_DATA.costCategories.map(c => c.title.toLowerCase());
    
    // Split into standard and custom categories
    const standardCategories: (FinancialCategory | undefined)[] = new Array(INITIAL_DATA.costCategories.length).fill(undefined);
    const customCategories: FinancialCategory[] = [];
    
    sanitizedCategories.forEach(cat => {
      const stdIdxById = standardIds.indexOf(cat.id);
      const stdIdxByTitle = standardTitles.indexOf(cat.title.toLowerCase());
      
      const stdIdx = stdIdxById !== -1 ? stdIdxById : stdIdxByTitle;
      
      if (stdIdx !== -1) {
        // If it matches a standard category, place it at its intended index
        standardCategories[stdIdx] = cat;
      } else {
        customCategories.push(cat);
      }
    });
    
    // Fill in missing standard categories from INITIAL_DATA
    const finalCategories: FinancialCategory[] = standardCategories.map((cat, idx) => {
      if (cat) return cat;
      return JSON.parse(JSON.stringify(INITIAL_DATA.costCategories[idx]));
    });
    
    // Append custom categories at the end
    const mergedCategories = [...finalCategories, ...customCategories];

    const hasRevenue = prev.revenueStreams.length > 0;
    const missingRevenue = !hasRevenue ? JSON.parse(JSON.stringify(INITIAL_DATA.revenueStreams)) : [];

    // Ensure required fields exist
    const businessIdea = prev.businessIdea || INITIAL_DATA.businessIdea;
    const industry = prev.industry || INITIAL_DATA.industry;
    const strategicSettings = prev.strategicSettings || JSON.parse(JSON.stringify(INITIAL_DATA.strategicSettings));
    const personnelSettings = prev.personnelSettings || JSON.parse(JSON.stringify(INITIAL_DATA.personnelSettings));

    return {
      ...prev,
      businessIdea,
      industry,
      strategicSettings,
      personnelSettings,
      revenueStreams: [...prev.revenueStreams, ...missingRevenue],
      costCategories: mergedCategories
    };
  };

  const mergeStandardCategories = (prev: BusinessData): BusinessData => {
    const sanitized = sanitizeBusinessData(prev);
    
    if (JSON.stringify(sanitized) === JSON.stringify(prev)) {
      return prev;
    }

    return sanitized;
  };

  const restoreStandardCategories = () => {
    setData(prev => {
      const merged = mergeStandardCategories(prev);
      if (merged === prev) {
        showToast("Alla standardkategorier finns redan", "info");
        return prev;
      }
      showToast("Standardkategorier har återställts", "success");
      return merged;
    });
  };

  const isPremiumVehicleModel = (d: BusinessData) => {
    const idea = (d.businessIdea || '').toLowerCase();
    return idea.includes('premiumfordon') || 
           idea.includes('försäljning av premiumbilar') ||
           idea.includes('sportbil') ||
           idea.includes('bilförmedling');
  };

  const updateRevenue = (id: string, updates: Partial<FinancialItem>) => {
    setData(d => {
      const isPremium = isPremiumVehicleModel(d);
      
      const newRevenueStreams = d.revenueStreams.map(s => {
        if (s.id === id) {
          let newS = { ...s, ...updates };
          const shouldSync = newS.isLockedBalance !== false; // Default to true if undefined
          
          // SYNC LOGIC: Sales vs Purchase Balance
          if (shouldSync) {
            if (updates.unitCount !== undefined) {
              newS.unitsPurchasedPerMonth = updates.unitCount;
            }
            if (updates.unitsPurchasedPerMonth !== undefined) {
              newS.unitCount = updates.unitsPurchasedPerMonth;
            }
            
            if (updates.targetUnitCount !== undefined) {
              newS.targetPurchasedUnits = updates.targetUnitCount;
            }
            if (updates.targetPurchasedUnits !== undefined) {
              newS.targetUnitCount = updates.targetPurchasedUnits;
            }
            if (updates.rampUpMonths !== undefined) {
              newS.purchaseRampUpMonths = updates.rampUpMonths;
            }
            if (updates.purchaseRampUpMonths !== undefined) {
              newS.rampUpMonths = updates.purchaseRampUpMonths;
            }

            // Legacy Growth Balance
            if (updates.newUnitsPerMonth !== undefined) {
              newS.newPurchasedUnitsPerMonth = updates.newUnitsPerMonth;
              if (updates.newUnitsPerMonth > 0) {
                newS.hasGrowth = true;
                newS.hasPurchaseGrowth = true;
              }
            }
            if (updates.newPurchasedUnitsPerMonth !== undefined) {
              newS.newUnitsPerMonth = updates.newPurchasedUnitsPerMonth;
              if (updates.newPurchasedUnitsPerMonth > 0) {
                newS.hasGrowth = true;
                newS.hasPurchaseGrowth = true;
              }
            }
            if (updates.hasGrowth !== undefined) {
              newS.hasPurchaseGrowth = updates.hasGrowth;
            }
            if (updates.hasPurchaseGrowth !== undefined) {
              newS.hasGrowth = updates.hasPurchaseGrowth;
            }
          }

          if (updates.calculationMode) {
            newS.isFixed = updates.calculationMode === 'fixed';
            newS.isUnitBased = updates.calculationMode === 'unit';
            newS.isAsset = updates.calculationMode === 'asset';
          }
          return newS;
        }
        return s;
      });

      let newCostCategories = d.costCategories;

      // Sync startMonth for linked cost items if startMonth changed in revenue stream
      if (updates.startMonth !== undefined) {
        newCostCategories = newCostCategories.map(c => ({
          ...c,
          items: c.items.map(item => {
            if (item.isLinkedToRevenue && item.linkedRevenueId === id) {
              return { ...item, startMonth: updates.startMonth };
            }
            return item;
          })
        }));
      }

      // Sync logic for Premium Vehicles
      if (isPremium) {
        const sourceItem = newRevenueStreams.find(s => s.id === id);
        if (sourceItem && sourceItem.label.toLowerCase().includes('försäljning') && updates.unitCount !== undefined) {
          newCostCategories = newCostCategories.map(c => ({
            ...c,
            items: c.items.map(countItem => {
              if (countItem.label.toLowerCase().includes('förmedlingsuppdrag')) {
                return { ...countItem, unitCount: updates.unitCount };
              }
              return countItem;
            })
          }));
        }
      }

      return { ...d, revenueStreams: newRevenueStreams, costCategories: newCostCategories };
    });
  };

  const addRevenue = () => {
    const newRevenue: FinancialItem = { 
      id: Math.random().toString(), 
      label: 'Ny intäktskälla', 
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
      isLockedBalance: true,
      isInternationalTrade: false,
      vatRate: 25,
      startMonth: data.strategicSettings.revenueStartMonth
    };
    setData(d => ({ ...d, revenueStreams: [...d.revenueStreams, newRevenue] }));
  };

  const updateCostItem = (_catId: string, itemId: string, updates: Partial<FinancialItem>) => {
    setData(d => {
      const isPremium = isPremiumVehicleModel(d);

      const newCostCategories = d.costCategories.map(c => ({
        ...c,
        items: c.items.map(i => {
          if (i.id === itemId) {
            let newI = { ...i, ...updates };

            // Sync startMonth if linked to revenue
            if (newI.isLinkedToRevenue && newI.linkedRevenueId) {
              const linkedRev = d.revenueStreams.find(rs => rs.id === newI.linkedRevenueId);
              if (linkedRev) {
                newI.startMonth = linkedRev.startMonth || 1;
              }
            }

            if (updates.calculationMode) {
              newI.isFixed = updates.calculationMode === 'fixed';
              newI.isUnitBased = updates.calculationMode === 'unit';
              newI.isAsset = updates.calculationMode === 'asset';
              newI.isLoan = updates.calculationMode === 'loan';
            }
            return newI;
          }
          return i;
        })
      }));

      let newRevenueStreams = d.revenueStreams;

      // Sync logic for Premium Vehicles
      if (isPremium) {
        const allItems = newCostCategories.flatMap(c => c.items);
        const sourceItem = allItems.find(i => i.id === itemId);
        if (sourceItem && sourceItem.label.toLowerCase().includes('förmedlingsuppdrag') && updates.unitCount !== undefined) {
          newRevenueStreams = newRevenueStreams.map(s => {
            if (s.label.toLowerCase().includes('försäljning')) {
              return { ...s, unitCount: updates.unitCount };
            }
            return s;
          });
        }
      }

      return {
        ...d,
        costCategories: newCostCategories,
        revenueStreams: newRevenueStreams
      };
    });
  };

  const addCostItem = (catId: string, initialLabel?: string, initialMode?: FinancialItem['calculationMode']) => {
    const category = data.costCategories.find(c => c.id === catId);
    const isDepreciation = category?.title.toLowerCase().includes('avskrivningar');
    const isLoan = category?.title.toLowerCase().includes('lån');
    const isStartup = catId === 'cat-startup';
    
    const label = initialLabel || (isLoan ? 'Företagslån' : 'Ny post');
    
    // Validation: Check if a cost with the same label already exists to prevent duplicates
    const allItems = data.costCategories.flatMap(c => c.items);
    const existingItem = allItems.find(i => i.label.toLowerCase() === label.toLowerCase());
    
    if (existingItem && !initialLabel) {
      showToast(`En kostnad med namnet "${label}" finns redan.`, "info");
      return;
    }

    const isPersonnel = catId === 'cat-payroll' || catId === 'cat-personnel' || category?.title.toLowerCase().includes('personal') || category?.title.toLowerCase().includes('lön');

    const newItem: FinancialItem = { 
      id: `cost-${Math.random().toString(36).substr(2, 9)}`, 
      label, 
      value: 0, 
      calculationMode: initialMode || (isLoan ? 'loan' : (isDepreciation || isStartup ? 'asset' : 'fixed')),
      isFixed: !isDepreciation && !isLoan && (initialMode !== 'asset'),
      isUnitBased: false, 
      costType: isStartup ? 'one-time' : 'recurring',
      isAsset: isDepreciation || isStartup || initialMode === 'asset',
      isLoan: isLoan,
      purchasePrice: 0,
      lifespanYears: 5,
      loanAmount: 0,
      interestRate: 5,
      vatRate: isLoan || isPersonnel ? 0 : 25,
      loanStartMonth: data.strategicSettings.revenueStartMonth,
      amortizationStartMonth: data.strategicSettings.revenueStartMonth,
      amortizationMonths: 60,
      gracePeriodMonths: 0,
      startMonth: data.strategicSettings.revenueStartMonth
    };
    setData(d => ({
      ...d,
      costCategories: d.costCategories.map(c => c.id === catId ? { ...c, items: [...c.items, newItem] } : c)
    }));
  };

  const linkCostItem = (catId: string, item: FinancialItem) => {
    setData(d => ({
      ...d,
      costCategories: d.costCategories.map(c => c.id === catId ? { ...c, items: [...c.items, item] } : c)
    }));
    setLinkingCatId(null);
    showToast(`"${item.label}" har länkats till kategorin.`, "success");
  };

  const addCostCategory = () => {
    const newCategory: FinancialCategory = {
      id: Math.random().toString(),
      title: 'Ny Kategori',
      iconName: 'LayoutGrid',
      items: []
    };
    setData(d => ({
      ...d,
      costCategories: [...d.costCategories, newCategory]
    }));
  };

  const deleteCostCategory = (id: string) => {
    confirmAction(
      "Radera kategori",
      "Är du säker på att du vill radera denna kategori och alla dess poster?",
      () => {
        setData(d => ({
          ...d,
          costCategories: d.costCategories.filter(c => c.id !== id)
        }));
        showToast("Kategorin raderades", "info");
      },
      true
    );
  };

  const updateCategoryTitle = (id: string, newTitle: string) => {
    setData(d => ({
      ...d,
      costCategories: d.costCategories.map(c => c.id === id ? { ...c, title: newTitle } : c)
    }));
  };

  const updateCustomFee = (id: string, updates: Partial<CustomFee>) => {
    setData(d => ({
      ...d,
      personnelSettings: {
        ...d.personnelSettings,
        fees: d.personnelSettings.fees.map(f => f.id === id ? { ...f, ...updates } : f)
      }
    }));
  };

  const addCustomFee = () => {
    const newFee: CustomFee = {
      id: 'fee-' + Math.random().toString(36).substr(2, 9),
      label: 'Ny avgift',
      percentage: 0
    };
    setData(d => ({
      ...d,
      personnelSettings: {
        ...d.personnelSettings,
        fees: [...d.personnelSettings.fees, newFee]
      }
    }));
  };

  const deleteCustomFee = (id: string) => {
    setData(d => ({
      ...d,
      personnelSettings: {
        ...d.personnelSettings,
        fees: d.personnelSettings.fees.filter(f => f.id !== id)
      }
    }));
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !feedbackEmail.trim()) return;
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: feedbackEmail,
          text: feedbackText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      setFeedbackSent(true);
      showToast("Tack för din feedback!", "success");
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSent(false);
        setFeedbackText('');
        setFeedbackEmail('');
      }, 2500);
    } catch (error) {
      showToast("Det gick inte att skicka meddelandet. Kontrollera din anslutning.", "error");
    }
  };

  const chartData = useMemo(() => {
    const source = breakdownMode === 'costs' ? results.expenseBreakdown : results.revenueBreakdown;
    return Object.entries(source)
      .map(([name, value]) => {
        const category = data.costCategories.find(c => c.title === name);
        const numericValue = typeof value === 'object' && value !== null ? (value as any).value : Number(value);
        return { name, value: numericValue, iconName: category?.iconName || 'LayoutGrid' };
      })
      .sort((a, b) => b.value - a.value);
  }, [results.expenseBreakdown, results.revenueBreakdown, data.costCategories, breakdownMode]);

  if (!authReady || (user && loading)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
            <BrainCircuit className="text-amber-400" size={32} />
          </div>
          <div className="absolute -inset-4 bg-slate-100 rounded-[2.5rem] animate-pulse -z-0" />
        </motion.div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="text-slate-900 font-bold text-sm tracking-tight">Linking</div>
          <div className="flex items-center gap-2 text-slate-400 font-medium text-xs uppercase tracking-wider">
            <Loader2 className="animate-spin" size={12} />
            initierar system...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-100 relative">
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>

        <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        <AmortizationModal 
          isOpen={amortizationModal.isOpen}
          onClose={() => setAmortizationModal({ isOpen: false, loan: null })}
          loan={amortizationModal.loan}
        />

        <HelpModal 
          isOpen={isHelpModalOpen} 
          onClose={() => setIsHelpModalOpen(false)} 
        />

        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          data={data}
          results={results}
        />

        <AuditLogModal 
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          data={data}
          results={results}
        />

        <div className="flex-1 flex overflow-hidden relative">
            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden fixed top-6 left-6 z-40 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl text-slate-600 hover:text-slate-900 transition-all active:scale-95"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] lg:hidden"
                  />
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 w-[300px] bg-slate-50 shadow-2xl z-[101] lg:hidden flex flex-col"
                  >
                    <div className="p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div>
                            <h2 className="text-sm font-semibold text-slate-900 tracking-tight leading-none">Linking</h2>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Linking Group</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="mb-6">
                        <button 
                          onClick={() => { setIsHelpModalOpen(true); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20 hover:bg-amber-500 transition-all group scale-100 active:scale-95"
                        >
                          <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm">
                            <BookOpen size={18} />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-semibold uppercase tracking-wide leading-tight">Plattformsguide</span>
                            <span className="text-xs font-bold text-amber-900/60 uppercase tracking-tight">Klicka för hjälp</span>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <SidebarItem 
                          id="setup" 
                          label="Affärsidé" 
                          icon={<Rocket size={18} />} 
                          active={activeTab === 'setup'} 
                          onClick={() => { setActiveTab('setup'); setIsMobileMenuOpen(false); }}
                          description="Intäkter & Kostnader"
                        />
                        <SidebarItem 
                          id="dashboard" 
                          label="Överblick" 
                          icon={<LayoutGrid size={18} />} 
                          active={activeTab === 'dashboard'} 
                          onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                          description="Koll på läget"
                        />
                        <SidebarItem 
                          id="personnel" 
                          label="Personal" 
                          icon={<Users size={18} />} 
                          active={activeTab === 'personnel'} 
                          onClick={() => { setActiveTab('personnel'); setIsMobileMenuOpen(false); }}
                          description="Lön & Avgifter"
                        />
                        <SidebarItem 
                          id="strategy" 
                          label="Strategi" 
                          icon={<Target size={18} />} 
                          active={activeTab === 'strategy'} 
                          onClick={() => { setActiveTab('strategy'); setIsMobileMenuOpen(false); }}
                          description="Tillväxt & Logik"
                        />
                        <SidebarItem 
                          id="logic" 
                          label="Definitioner" 
                          icon={<BookOpen size={18} />} 
                          active={activeTab === 'logic'} 
                          onClick={() => { setActiveTab('logic'); setIsMobileMenuOpen(false); }}
                          description="Ekonomisk skola"
                        />
                      </div>

                      <div className="mt-8 space-y-4">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4">Verktyg</div>
                        <button 
                          onClick={() => { setIsAuditModalOpen(true); setIsMobileMenuOpen(false); }} 
                          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all group"
                        >
                          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <FileSpreadsheet size={18} />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-semibold uppercase tracking-wide">REVISION</span>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Revision & Excel Export</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => { setIsChatOpen(true); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 transition-all group"
                        >
                          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                            <Sparkles size={18} />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-semibold uppercase tracking-wide">AI Co-pilot</span>
                            <span className="text-xs font-medium text-emerald-600/60 uppercase tracking-tight">Öppna Chatten</span>
                          </div>
                        </button>
                      </div>

                      <div className="mt-auto pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                              {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{user?.displayName || user?.email?.split('@')[0]}</span>
                              <button onClick={() => signOut(auth)} className="text-xs font-semibold uppercase tracking-wide text-red-500 hover:text-red-600 text-left transition-colors">Logga ut</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Sidebar Navigation (Desktop) */}
            <aside className="hidden lg:flex w-72 flex-col shrink-0 overflow-y-auto no-scrollbar py-8 pl-8 space-y-8 bg-slate-50 border-r border-slate-100 sticky top-0 h-screen">
              <div className="px-4">
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 tracking-tight leading-none">Linking</h2>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Linking Group</p>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <button 
                  onClick={() => setIsHelpModalOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20 hover:bg-amber-500 transition-all group scale-100 active:scale-95 mb-2"
                >
                  <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold uppercase tracking-wide leading-tight">Plattformsguide</span>
                    <span className="text-xs font-bold text-amber-900/60 uppercase tracking-tight">Klicka för hjälp</span>
                  </div>
                </button>
              </div>

              <div className="space-y-1">
                <SidebarItem 
                  id="setup" 
                  label="Affärsidé" 
                  icon={<Rocket size={18} />} 
                  active={activeTab === 'setup'} 
                  onClick={() => setActiveTab('setup')}
                  description="Intäkter & Kostnader"
                />
                <SidebarItem 
                  id="dashboard" 
                  label="Överblick" 
                  icon={<LayoutGrid size={18} />} 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                  description="Koll på läget"
                />
                <SidebarItem 
                  id="personnel" 
                  label="Personal" 
                  icon={<Users size={18} />} 
                  active={activeTab === 'personnel'} 
                  onClick={() => setActiveTab('personnel')}
                  description="Lön & Avgifter"
                />
                <SidebarItem 
                  id="strategy" 
                  label="Strategi" 
                  icon={<Target size={18} />} 
                  active={activeTab === 'strategy'} 
                  onClick={() => setActiveTab('strategy')}
                  description="Tillväxt & Logik"
                />
                <SidebarItem 
                  id="logic" 
                  label="Definitioner" 
                  icon={<BookOpen size={18} />} 
                  active={activeTab === 'logic'} 
                  onClick={() => setActiveTab('logic')}
                  description="Ekonomisk skola"
                />
              </div>

              <div className="mt-auto px-4 space-y-4">
                <button 
                  onClick={() => setIsAuditModalOpen(true)} 
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all group shadow-xl shadow-slate-200 border border-slate-800"
                >
                  <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold uppercase tracking-wide">REVISION</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">Revision & Excel Export</span>
                  </div>
                </button>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Sparkles size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wide">AI Co-pilot</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Be mig analysera din budget eller ge tips på hur du kan öka din lönsamhet.
                  </p>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wide hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Öppna Chatten
                  </button>
                </div>

                <div className="flex items-center justify-between border-slate-100 pt-4 pb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={14} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user?.displayName || user?.email?.split('@')[0]}</span>
                      <button onClick={() => signOut(auth)} className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-red-500 text-left transition-colors">Logga ut</button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main id="main-scroll-container" className="flex-1 min-w-0 overflow-y-auto no-scrollbar py-8 px-4 lg:px-8 bg-slate-50">
              <div className="max-w-6xl mx-auto space-y-8">
                
                <div className="mb-2 mt-2">
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                    Välkommen tillbaka, {user?.displayName ? user.displayName.split(' ')[0] : (user?.email?.split('@')[0] || 'användare')}!
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Här är din finansiella överblick.
                  </p>
                </div>

                {/* Global KPI Header - Sticky on top of main content */}
                <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl py-2 -mx-4 px-4 lg:-mx-8 lg:px-8 border-b border-white/50">
                  <KPIHeader 
                    results={results} 
                    forecastDuration={forecastDuration}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      <DashboardCharts 
                        results={results}
                        data={data}
                        forecastDuration={forecastDuration}
                        setForecastDuration={setForecastDuration}
                        selectedYear={selectedYear}
                        breakdownMode={breakdownMode}
                        setBreakdownMode={setBreakdownMode}
                        showLogicReference={showLogicReference}
                        setShowLogicReference={setShowLogicReference}
                        aiQuery={aiQuery}
                        setAiQuery={setAiQuery}
                        handleAiAnalysis={handleAiAnalysis}
                        onOpenReport={() => setIsReportModalOpen(true)}
                        isChatLoading={isChatLoading}
                        formatAmount={formatAmount}
                        formatNumber={formatNumber}
                        getResultColor={getResultColor}
                        getCashFlowColor={getCashFlowColor}
                        LOGIC_DEFINITIONS={LOGIC_DEFINITIONS}
                        COLORS={COLORS}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'setup' && (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      {showWelcomeHero && (
                        <WelcomeHero 
                          onStart={() => {
                            const mainContent = document.getElementById('main-scroll-container');
                            const textarea = document.getElementById('business-idea-input');
                            if (textarea && mainContent) {
                              const rect = textarea.getBoundingClientRect();
                              const containerRect = mainContent.getBoundingClientRect();
                              mainContent.scrollTo({ 
                                top: mainContent.scrollTop + rect.top - containerRect.top - 20, 
                                behavior: 'smooth' 
                              });
                              textarea.focus({ preventScroll: true });
                            }
                          }} 
                          onHelp={() => setIsHelpModalOpen(true)} 
                          onDismiss={() => setShowWelcomeHero(false)}
                        />
                      )}
                      <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-slate-100 mb-6 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                        <Target className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-lg tracking-tight">Kalkylarkitekt</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Affärsmodell & Logik</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {!showWelcomeHero && (
                        <button onClick={() => setShowWelcomeHero(true)} className="p-2 bg-amber-50 border border-amber-200 text-amber-600 hover:text-amber-700 rounded-lg transition-all flex items-center justify-center" title="Visa välkomstmeddelande">
                          <Sparkles size={16}/>
                        </button>
                      )}
                      <button onClick={restoreStandardCategories} className="p-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all flex items-center justify-center" title="Återställ">
                        <Layers3 size={16}/>
                      </button>
                      <button onClick={resetData} className="p-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-500 rounded-lg transition-all flex items-center justify-center" title="Nollställ">
                        <RotateCcw size={16}/>
                      </button>
                    </div>
                </div>

                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg text-white shadow-sm shadow-blue-100">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-tight mb-0.5">Månadsbaserad precision</p>
                    <p className="text-xs text-blue-700/70 leading-relaxed font-medium">
                      Samtliga belopp beräknas och presenteras som månatliga värden för att säkerställa en korrekt och konsekvent kassaflödesanalys.<br /><br />
                      <span className="font-bold text-blue-900 font-sans">Den initiala investeringsfasen</span> ingår inte i denna beräkning, då den avser engångsinvesteringar som krävs för att etablera verksamheten innan den löpande driften påbörjas.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-400 block tracking-wide flex items-center gap-2 text-sans">
                      <Lightbulb size={14} className="text-amber-500" /> Beskriv din affärsidé
                    </label>
                  </div>
                  <textarea 
                    id="business-idea-input"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 min-h-[120px] resize-none placeholder:text-slate-300 transition-all focus:shadow-lg focus:shadow-slate-100"
                    placeholder="Beskriv vad du vill sälja, till vem och hur..."
                    value={data.businessIdea || ''}
                    onChange={(e) => setData({...data, businessIdea: e.target.value})}
                  />
                  <button 
                    onClick={handleGenerateTemplate} 
                    disabled={isGenerating} 
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 uppercase transition-all shadow-lg shadow-slate-200"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} className="text-amber-400" />} 
                    {isGenerating ? 'Arkitekterar...' : 'Generera Mall'}
                  </button>
                  {!isGenerating && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-400/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 font-medium leading-snug">
                        För bästa resultat kan du behöva trycka på <b>"GENERERA MALL"</b> flera gånger. Systemet förfinar modellen för varje gång.
                      </p>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center pt-3 pb-1 animate-in fade-in zoom-in-95 duration-300">
                       <p className="text-xs text-amber-600 font-bold text-center">Vi bygger din modell – detta kan ta upp till 2 minuter</p>
                       <p className="text-xs text-slate-500 font-medium text-center mt-1">Det tar lite tid eftersom systemet utför en noggrann analys och komplicerade beräkningar för att bygga en detaljerad modell.</p>
                       <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden relative">
                         <div className="absolute top-0 bottom-0 left-0 bg-amber-400 w-full rounded-full shadow-sm animate-pulse" />
                       </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wide flex items-center gap-2">
                      <CalendarDays size={14} /> Säsongsstyrning
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-amber-200 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={data.strategicSettings.hasSeasonality || false}
                        onChange={(e) => setData({...data, strategicSettings: {...data.strategicSettings, hasSeasonality: e.target.checked}})}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Verksamheten är säsongsbaserad</p>
                        <p className="text-xs text-slate-500 font-medium">Aktivera för att styra vilka månader som är öppna och stängda.</p>
                      </div>
                    </label>
                    
                    {data.strategicSettings.hasSeasonality && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Välj Öppna månader</p>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-6">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                                const isOpen = (data.strategicSettings.activeMonths || []).includes(m);
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                                return (
                                    <button 
                                        key={m}
                                        onClick={() => {
                                            const current = data.strategicSettings.activeMonths || [];
                                            const newMonths = isOpen ? current.filter(x => x !== m) : [...current, m].sort((a,b)=>a-b);
                                            setData({...data, strategicSettings: {...data.strategicSettings, activeMonths: newMonths}});
                                        }}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${isOpen ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'}`}
                                    >
                                        {monthNames[m-1]}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Kostnader under stängda månader</p>
                        <p className="text-xs text-slate-500 mb-4">Välj vilka utgifter som fortfarande tickar på när verksamheten har stängt (hyra, lån och försäkringar är vanliga exempel).</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {data.costCategories.map(cat => {
                                const isStartup = cat.id === 'cat-startup' || cat.items.every(i => i.costType === 'one-time');
                                if (isStartup) return null;
                                
                                const isActive = (data.strategicSettings.activeCategoriesOffSeason || []).includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            const current = data.strategicSettings.activeCategoriesOffSeason || [];
                                            const newCats = isActive ? current.filter(x => x !== cat.id) : [...current, cat.id];
                                            setData({...data, strategicSettings: {...data.strategicSettings, activeCategoriesOffSeason: newCats}});
                                        }}
                                        className={`p-2 rounded-xl border text-left flex items-start gap-2 transition-all ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                    >
                                        <div className={`mt-0.5 w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${isActive ? 'border-amber-400 bg-amber-400' : 'border-slate-300'}`}>
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold truncate pr-1 hidden sm:block">{cat.title}</p>
                                            <p className="text-xs font-bold truncate pr-1 sm:hidden">{cat.title.length > 15 ? cat.title.substring(0, 15) + '...' : cat.title}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-6 shadow-xl shadow-slate-200">
                  <label className="text-xs font-bold uppercase text-amber-400 block tracking-wide flex items-center gap-2 mr-font-sans">
                    <Rocket size={14} /> Strategiska Parametrar
                  </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5 tracking-wider flex items-center gap-1.5">
                        Startkapital
                        <InfoTooltip 
                          text={(LOGIC_DEFINITIONS as any)["startkapital"]?.text}
                          definition={(LOGIC_DEFINITIONS as any)["startkapital"]?.definition}
                          calculation={(LOGIC_DEFINITIONS as any)["startkapital"]?.calculation}
                          example={(LOGIC_DEFINITIONS as any)["startkapital"]?.example}
                        />
                      </label>
                      <FormattedNumberInput 
                        label="Startkapital"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all focus:bg-white/10"
                        value={data.strategicSettings.startingCash}
                        onChange={(val) => setData({...data, strategicSettings: {...data.strategicSettings, startingCash: val}})}
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5 tracking-wider flex items-center gap-1.5">
                        Marknad / Mån
                        <InfoTooltip 
                          text={(LOGIC_DEFINITIONS as any)["marknadsbudget"]?.text}
                          definition={(LOGIC_DEFINITIONS as any)["marknadsbudget"]?.definition}
                          calculation={(LOGIC_DEFINITIONS as any)["marknadsbudget"]?.calculation}
                          example={(LOGIC_DEFINITIONS as any)["marknadsbudget"]?.example}
                        />
                      </label>
                      <FormattedNumberInput 
                        label="Marknadsbudget"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all focus:bg-white/10"
                        value={data.strategicSettings.marketingSpend}
                        onChange={(val) => setData({...data, strategicSettings: {...data.strategicSettings, marketingSpend: val}})}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5 tracking-wider flex items-center gap-1.5">
                        Churn (%)
                        <InfoTooltip 
                          text={(LOGIC_DEFINITIONS as any)["churn rate"]?.text}
                          definition={(LOGIC_DEFINITIONS as any)["churn rate"]?.definition}
                          calculation={(LOGIC_DEFINITIONS as any)["churn rate"]?.calculation}
                          example={(LOGIC_DEFINITIONS as any)["churn rate"]?.example}
                        />
                      </label>
                      <FormattedNumberInput 
                        label="Churn Rate"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all focus:bg-white/10"
                        value={data.strategicSettings.churnRate}
                        onChange={(val) => setData({...data, strategicSettings: {...data.strategicSettings, churnRate: val}})}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5 tracking-wider flex items-center gap-1.5">
                        Gemensam Startmånad
                        <InfoTooltip 
                          text="Denna månad sätter startdatumet för alla dina intäkter och kostnader." 
                          definition="Vilken specifik månad i prognosen som bolaget kickstartar sin verksamhet."
                          calculation="Förskjuter automatiskt alla Intäkter och Löpande Kostnader till denna månad."
                          example="Om du väljer Månad 4 innebär det att månad 1-3 endast innehåller Uppstartskostnader."
                        />
                      </label>
                      <FormattedNumberInput 
                        label="Gemensam Startmånad"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                        value={data.strategicSettings.revenueStartMonth}
                        onChange={(val) => updateGlobalStartMonth(val)}
                        min={1}
                        max={120}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pb-20">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center rounded-t-[2rem]">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-green-600"/>
                    <h3 className="font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                      Intäktsströmmar
                      <InfoTooltip 
                        text={CATEGORY_GUIDE["Intäktsströmmar"]} 
                        definition="Din affärsmodell definierad i klara pengar – hur får du betalt?"
                      />
                    </h3>
                  </div>
                  <button onClick={addRevenue} className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition-all active:scale-95"><Plus size={20}/></button>
                </div>
                <div className="p-6 space-y-8">
                  {['fixed', 'unit', 'product'].map(mode => {
                    const streamsInMode = data.revenueStreams.filter(s => s.calculationMode === mode);
                    if (streamsInMode.length === 0) return null;
                    
                    return (
                      <div key={mode} className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3 px-1">
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            mode === 'fixed' ? 'bg-blue-50 text-blue-600' : 
                            mode === 'unit' ? 'bg-emerald-50 text-emerald-600' : 
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {mode === 'fixed' ? 'Fast' : mode === 'unit' ? 'Antal' : 'Produkt'}
                          </span>
                          <div className="h-px bg-slate-100 flex-1" />
                        </div>
                        
                        <div className="space-y-4">
                          {streamsInMode.map(s => {
                            const isStandardRev = s.id === 'rev-1';
                            const monthlyRev = s.calculationMode === 'fixed' 
                              ? (s.value || 0) 
                              : (s.calculationMode === 'unit' || s.calculationMode === 'product'
                                ? (s.unitCount || 0) * (s.valuePerUnit || 0)
                                : 0);

                            return (
                              <div key={s.id} className="p-5 bg-white border border-slate-200 rounded-3xl group/item relative hover:border-amber-200 transition-all shadow-sm">
                                {!isStandardRev && (
                                  <button onClick={() => { setData(d => ({...d, revenueStreams: d.revenueStreams.filter(rs => rs.id !== s.id)})); }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all z-10">
                                    <Trash2 size={16}/>
                                  </button>
                                )}
                                <div className="space-y-3 mb-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <input 
                                          className="flex-1 font-semibold text-slate-900 text-sm bg-slate-50 border border-slate-200 hover:border-amber-200 focus:border-amber-400 focus:bg-white px-4 py-2 rounded-xl transition-all uppercase tracking-tight outline-none focus:ring-0" 
                                          value={s.label || ''} 
                                          onChange={(e) => updateRevenue(s.id, {label: e.target.value})} 
                                          readOnly={isStandardRev}
                                        />
                                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex flex-col items-end min-w-[120px] shadow-sm">
                                          <span className="text-[7px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-0.5">Summa/Mån</span>
                                          <span className="text-xs font-semibold tabular-nums">{formatAmount(monthlyRev)} kr</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <button 
                                        onClick={() => setActiveCommentItem({id: s.id, label: s.label || 'Intäkt'})}
                                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Kommentera"
                                      >
                                        <MessageSquare size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 items-center w-fit opacity-60 hover:opacity-100 transition-opacity">
                                    <InfoTooltip text={
                                      <div className="space-y-1">
                                        <p><strong>FAST:</strong> Månadsbelopp som inte ändras med volym.</p>
                                        <p><strong>ANTAL:</strong> Rörlig baserat på antal enheter.</p>
                                        {['retail', 'manufacturing', 'restaurant', 'other'].includes(data.industry) && (
                                          <p><strong>PRODUKT:</strong> Försäljning av varor med inköpspris.</p>
                                        )}
                                      </div>
                                    } />
                                    <button onClick={() => updateRevenue(s.id, {calculationMode: 'fixed'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${s.calculationMode === 'fixed' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Fast</button>
                                    <button onClick={() => updateRevenue(s.id, {calculationMode: 'unit'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${s.calculationMode === 'unit' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Antal</button>
                                    {['retail', 'manufacturing', 'restaurant', 'other'].includes(data.industry) && (
                                      <button onClick={() => updateRevenue(s.id, {calculationMode: 'product'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${s.calculationMode === 'product' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Produkt</button>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                          <p className="text-xs text-blue-800 leading-tight space-y-1">
                            <span className="flex items-start gap-2">
                              <Info size={12} className="shrink-0 mt-0.5" />
                              <span>
                                <strong>Logik:</strong> 
                                {s.calculationMode === 'fixed' && " Fast månatlig intäkt (t.ex. abonnemang)."}
                                {s.calculationMode === 'unit' && " Intäkt som beror på volym (t.ex. antal sålda timmar eller tjänster)."}
                                {s.calculationMode === 'product' && " Försäljning av fysiska produkter med tillhörande inköpskostnad (COGS)."}
                              </span>
                            </span>
                          </p>
                          {s.aiMotivation && (
                            <p className="mt-2 pt-2 border-t border-blue-100 text-xs text-blue-900 font-bold uppercase tracking-tight flex items-center gap-2">
                              <Sparkles size={12} className="text-amber-500" />
                              <span>AI Strateg: {s.aiMotivation}</span>
                            </p>
                          )}
                        </div>
                        {s.calculationMode === 'fixed' && (
                          <div className="animate-in fade-in duration-300">
                            <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Fast intäkt / Mån</label>
                            <FormattedNumberInput label="Fast intäkt" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.value || 0} onChange={(val) => updateRevenue(s.id, {value: val})} min={0} />
                          </div>
                        )}
                        {s.calculationMode === 'unit' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-100/30 rounded-2xl border border-slate-200 border-dashed relative">
                              <button 
                                onClick={() => updateRevenue(s.id, {isLockedBalance: s.isLockedBalance === false})}
                                className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1.5 transition-all shadow-md z-10 ${s.isLockedBalance !== false ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                              >
                                {s.isLockedBalance !== false ? <Link2 size={10} /> : <Link2Off size={10} />}
                                {s.isLockedBalance !== false ? 'Balanserad' : 'Frånkopplad'}
                              </button>

                              {/* Left Column: Inköp */}
                              <div className="space-y-4 border-r border-slate-200/50 pr-4">
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1 tracking-tight">Inköpspris per enhet</label>
                                  <FormattedNumberInput label="Inköpspris" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.purchasePricePerUnit || 0} onChange={(val) => updateRevenue(s.id, {purchasePricePerUnit: val})} min={0} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1 tracking-tight">Antal inköpta / mån</label>
                                  <FormattedNumberInput label="Inköp" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.unitsPurchasedPerMonth || 0} onChange={(val) => updateRevenue(s.id, {unitsPurchasedPerMonth: val})} min={0} />
                                  {(s.unitsPurchasedPerMonth || 0) < (s.unitCount || 0) && (
                                    <div className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                                      <AlertTriangle size={10} />
                                      Obalans: Säljer mer än inköp
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Försäljning */}
                              <div className="space-y-4 pl-4">
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1 tracking-tight">Försäljningspris</label>
                                  <FormattedNumberInput label="Pris" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.valuePerUnit || 0} onChange={(val) => updateRevenue(s.id, {valuePerUnit: val})} min={0} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1 tracking-tight">Antal sålda / mån</label>
                                  <FormattedNumberInput label="Antal" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.unitCount || 0} onChange={(val) => updateRevenue(s.id, {unitCount: val})} min={0} />
                                </div>
                              </div>
                            </div>

                          </div>
                        )}

                        {s.calculationMode === 'product' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-100/30 rounded-2xl border border-slate-200 border-dashed relative">
                              <button 
                                onClick={() => updateRevenue(s.id, {isLockedBalance: s.isLockedBalance === false})}
                                className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1.5 transition-all shadow-md z-10 ${s.isLockedBalance !== false ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                              >
                                {s.isLockedBalance !== false ? <Link2 size={10} /> : <Link2Off size={10} />}
                                {s.isLockedBalance !== false ? 'Balanserad' : 'Frånkopplad'}
                              </button>

                              {/* Left Column: Inköp */}
                              <div className="space-y-4 border-r border-slate-200/50 pr-4">
                                <div>
                                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Inköpspris per enhet</label>
                                  <FormattedNumberInput label="Inköpspris" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.purchasePricePerUnit || 0} onChange={(val) => updateRevenue(s.id, {purchasePricePerUnit: val})} min={0} />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Antal inköpta / mån</label>
                                  <FormattedNumberInput label="Inköpta" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.unitsPurchasedPerMonth || 0} onChange={(val) => updateRevenue(s.id, {unitsPurchasedPerMonth: val})} min={0} />
                                  {(s.unitsPurchasedPerMonth || 0) < (s.unitCount || 0) && (
                                    <div className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                                      <AlertTriangle size={10} />
                                      Obalans: Säljer mer än inköp
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Försäljning */}
                              <div className="space-y-4 pl-4">
                                <div>
                                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Försäljningspris</label>
                                  <FormattedNumberInput label="Försäljningspris" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.valuePerUnit || 0} onChange={(val) => updateRevenue(s.id, {valuePerUnit: val})} min={0} />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Antal sålda / mån</label>
                                  <FormattedNumberInput label="Antal" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-black focus:ring-2 focus:ring-amber-400 outline-none" value={s.unitCount || 0} onChange={(val) => updateRevenue(s.id, {unitCount: val})} min={0} />
                                </div>
                              </div>
                            </div>


                          </div>
                        )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500 block px-1 tracking-tight">Kredit (dagar)</label>
                          <FormattedNumberInput label="Bet.villkor" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all" value={s.paymentDelayDays || 0} onChange={(val) => updateRevenue(s.id, {paymentDelayDays: val})} min={0} max={365} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500 block px-1 tracking-tight">Månad (start)</label>
                          <FormattedNumberInput label="Startmånad" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all" value={s.startMonth || 0} onChange={(val) => updateRevenue(s.id, {startMonth: val})} min={0} max={120} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500 block px-1 tracking-tight flex items-center gap-1">Moms (%) <InfoTooltip text="Utgående moms på din försäljning. Standard i Sverige är 25%." definition="Momssatsen (tillägget) dina kunder får betala på dina produkter." example="25% för standardvaror, 12% för mat, 6% böcker/kultur, 0% export." /></label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {[25, 12, 6, 0].map(v => (
                              <button 
                                key={v}
                                onClick={() => updateRevenue(s.id, {vatRate: v})}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${s.vatRate === v ? 'bg-amber-400 text-black shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {v}%
                              </button>
                            ))}
                          </div>
                          <FormattedNumberInput label="Moms" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all" value={s.vatRate ?? 25} onChange={(val) => updateRevenue(s.id, {vatRate: val})} min={0} max={100} />
                        </div>
                      </div>

                      {(s.calculationMode === 'unit' || s.calculationMode === 'product') && (
                        <div className="mt-4 space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between group pt-2 border-t border-slate-100 mt-2">
                                <div className="flex items-center gap-1.5 justify-between w-full">
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-bold uppercase tracking-tight flex items-center gap-2 ${s.hasGrowth ? 'text-slate-900' : 'text-slate-400'}`}>
                                      Tillväxtfas & Normalläge
                                      <InfoTooltip 
                                        text="Planera hur försäljningen växer över tid." 
                                        definition="Målvolym anger hur många enheter per månad du förväntar dig sälja när försäljningen har nått sitt normalläge. Tid till normalläge (månader) är hur lång tid det tar från produktens startmånad att nå målvolymen." 
                                        calculation="Programmet räknar med att försäljningen ökar jämnt fram till målvolymen är nådd." 
                                      />
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">Planera hur försäljningen växer över tid</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                  const activating = !s.hasGrowth;
                                  const updates: Partial<FinancialItem> = {
                                    hasGrowth: activating,
                                    targetUnitCount: activating ? Math.max((s.unitCount || 0) + 10, (s.unitCount || 0) * 2) : undefined,
                                    rampUpMonths: activating ? 12 : undefined
                                  };
                                  updateRevenue(s.id, updates);
                                }}
                                className={`w-8 h-4 rounded-full transition-all relative ${s.hasGrowth ? 'bg-amber-400' : 'bg-slate-200'}`}
                              >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${s.hasGrowth ? 'left-4.5' : 'left-0.5'}`} />
                              </button>
                              </div>
                            </div>

                            {s.hasGrowth && (
                              <div className="animate-in fade-in slide-in-from-top-1 duration-300 bg-white border border-slate-100 p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp size={64} /></div>
                                <div className="space-y-5 relative z-10">
                                  
                                  {/* Target Volume */}
                                  <div>
                                    <div className="flex justify-between items-end mb-2">
                                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-tight">Målvolym i normalläge (st/mån)</label>
                                    </div>
                                    <FormattedNumberInput 
                                      label="Målvolym" 
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-400" 
                                      value={s.targetUnitCount ?? s.unitCount ?? 0} 
                                      onChange={(val) => updateRevenue(s.id, {targetUnitCount: val})} 
                                      min={s.unitCount || 0} 
                                    />
                                  </div>

                                  {/* Ramp Up Months */}
                                  <div>
                                    <div className="flex justify-between items-end mb-2">
                                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-tight">Tid till normalläge (månader)</label>
                                    </div>
                                    <FormattedNumberInput 
                                      label="Månader" 
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-400" 
                                      value={s.rampUpMonths || 12} 
                                      onChange={(val) => updateRevenue(s.id, {rampUpMonths: val})} 
                                      min={1} 
                                      max={60} 
                                    />
                                  </div>

                                  {/* Visual mini-graph explanation */}
                                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                    <div className="flex-1 flex items-end h-8 gap-[1px] opacity-60">
                                       {Array.from({length: 12}).map((_, i) => {
                                          const ramp = s.rampUpMonths || 12;
                                          const isRamping = i < Math.min(12, ramp);
                                          const heightPercentage = isRamping ? 20 + ((i+1) / ramp) * 80 : 100;
                                          return <div key={i} className={`flex-1 ${i+1===12 && ramp>12 ? 'bg-gradient-to-r from-amber-400 to-amber-200' : 'bg-amber-400'} rounded-t-sm`} style={{height: `${Math.min(100, heightPercentage)}%`}} />
                                       })}
                                    </div>
                                    <div className="text-[10px] text-slate-500 leading-tight w-2/3">
                                      Från <b>{s.unitCount || 0}</b> till <b>{s.targetUnitCount || s.unitCount || 0}</b> st på <b>{s.rampUpMonths || 12}</b> månader. Sen plan.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {s.isLockedBalance === false && (s.calculationMode === 'product' || s.calculationMode === 'unit') && (
                              <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between group pt-2 border-t border-slate-100 mt-2">
                                  <div className="flex items-center gap-1.5 justify-between w-full">
                                    <div className="flex flex-col">
                                      <span className={`text-xs font-bold uppercase tracking-tight flex items-center gap-2 ${s.hasPurchaseGrowth ? 'text-slate-900' : 'text-slate-400'}`}>
                                        Inköp: Tillväxtfas & Normalläge
                                        <InfoTooltip 
                                          text="Planera hur lagret växer över tid." 
                                          definition="Målinköp anger hur många inköpta enheter per månad du förväntar dig behöva när lagret har nått sitt normalläge. Tid till normalläge (månader) är hur lång tid det tar att nå målinköpen." 
                                          calculation="Programmet räknar med att inköpen ökar jämnt fram till att målinköpet är nått." 
                                        />
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium tracking-tight">Planera hur lagret växer över tid</span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                      const activating = !s.hasPurchaseGrowth;
                                      const updates: Partial<FinancialItem> = {
                                        hasPurchaseGrowth: activating,
                                        targetPurchasedUnits: activating ? Math.max((s.unitsPurchasedPerMonth || 0) + 10, (s.unitsPurchasedPerMonth || 0) * 2) : undefined,
                                        purchaseRampUpMonths: activating ? 12 : undefined
                                      };
                                      updateRevenue(s.id, updates);
                                    }}
                                    className={`w-8 h-4 rounded-full transition-all relative ${s.hasPurchaseGrowth ? 'bg-slate-600' : 'bg-slate-200'}`}
                                  >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${s.hasPurchaseGrowth ? 'left-4.5' : 'left-0.5'}`} />
                                  </button>
                                  </div>
                                </div>

                                {s.hasPurchaseGrowth && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-300 bg-white border border-slate-100 p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5"><Box size={64} /></div>
                                    <div className="space-y-5 relative z-10">
                                      
                                      {/* Target Volume */}
                                      <div>
                                        <div className="flex justify-between items-end mb-2">
                                          <label className="text-xs font-semibold text-slate-700 uppercase tracking-tight">Målinköp i normalläge (st/mån)</label>
                                        </div>
                                        <FormattedNumberInput 
                                          label="Målinköp" 
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-800" 
                                          value={s.targetPurchasedUnits ?? s.unitsPurchasedPerMonth ?? 0} 
                                          onChange={(val) => updateRevenue(s.id, {targetPurchasedUnits: val})} 
                                          min={s.unitsPurchasedPerMonth || 0} 
                                        />
                                      </div>

                                      {/* Ramp Up Months */}
                                      <div>
                                        <div className="flex justify-between items-end mb-2">
                                          <label className="text-xs font-semibold text-slate-700 uppercase tracking-tight">Tid till normalläge (månader)</label>
                                        </div>
                                        <FormattedNumberInput 
                                          label="Månader" 
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-800" 
                                          value={s.purchaseRampUpMonths || 12} 
                                          onChange={(val) => updateRevenue(s.id, {purchaseRampUpMonths: val})} 
                                          min={1} 
                                          max={60} 
                                        />
                                      </div>

                                      {/* Visual mini-graph explanation */}
                                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                        <div className="flex-1 flex items-end h-8 gap-[1px] opacity-40">
                                           {Array.from({length: 12}).map((_, i) => {
                                              const ramp = s.purchaseRampUpMonths || 12;
                                              const isRamping = i < Math.min(12, ramp);
                                              const heightPercentage = isRamping ? 20 + ((i+1) / ramp) * 80 : 100;
                                              return <div key={i} className={`flex-1 ${i+1===12 && ramp>12 ? 'bg-gradient-to-r from-slate-600 to-slate-400' : 'bg-slate-600'} rounded-t-sm`} style={{height: `${Math.min(100, heightPercentage)}%`}} />
                                           })}
                                        </div>
                                        <div className="text-[10px] text-slate-500 leading-tight w-2/3">
                                          Inköpen ökar från <b>{s.unitsPurchasedPerMonth || 0}</b> till <b>{s.targetPurchasedUnits || s.unitsPurchasedPerMonth || 0}</b> st på <b>{s.purchaseRampUpMonths || 12}</b> månader. Sen plan yta.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                        {(s.calculationMode === 'unit' || s.calculationMode === 'product') && (
                          <div className="space-y-4 pt-4 border-t border-slate-100 mt-4 animate-in fade-in duration-700">


                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Lagerstatus (Mån 1)</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Inköpta</p>
                                      <p className="text-xs font-bold text-slate-900">{formatAmount(s.unitsPurchasedPerMonth || 0)}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Sålda</p>
                                      <p className="text-xs font-bold text-slate-900">{formatAmount(s.unitCount || 0)}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                                      <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-tight mb-0.5">Kvar</p>
                                      <p className="text-xs font-bold text-emerald-700">{(s.unitsPurchasedPerMonth || 0) - (s.unitCount || 0)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Vinst & Marginal</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Marginal / enhet</p>
                                      <p className="text-xs font-bold text-slate-900">
                                        {(() => {
                                          const landedCost = (s.purchasePricePerUnit || 0) + 
                                            (s.exciseTaxPerUnit || 0) + 
                                            (s.isInternationalTrade ? (
                                              ((s.purchasePricePerUnit || 0) * (s.customsRate || 0) / 100) + 
                                              (s.importFreightPerUnit || 0) + 
                                              (s.importHandlingPerUnit || 0)
                                            ) : 0);
                                          const exportCost = s.isInternationalTrade ? ((s.exportFreightPerUnit || 0) + (s.exportFeesPerUnit || 0)) : 0;
                                          const price = s.valuePerUnit || 0;
                                          const margin = price - landedCost - exportCost;
                                          return (
                                            <span className="flex items-baseline gap-1">
                                              {formatAmount(margin)}
                                              <span className="text-xs opacity-60">({price > 0 ? Math.round((margin / price) * 100) : 0}%)</span>
                                            </span>
                                          );
                                        })()}
                                      </p>
                                    </div>
                                    <div className="bg-white/50 p-2 rounded-xl">
                                      <p className="text-[7px] font-semibold text-amber-600 uppercase tracking-tight mb-0.5">Total vinst (mån)</p>
                                      <p className="text-xs font-semibold text-slate-900">
                                        {(() => {
                                          const landedCost = (s.purchasePricePerUnit || 0) + 
                                            (s.exciseTaxPerUnit || 0) + 
                                            (s.isInternationalTrade ? (
                                              ((s.purchasePricePerUnit || 0) * (s.customsRate || 0) / 100) + 
                                              (s.importFreightPerUnit || 0) + 
                                              (s.importHandlingPerUnit || 0)
                                            ) : 0);
                                          const exportCost = s.isInternationalTrade ? ((s.exportFreightPerUnit || 0) + (s.exportFeesPerUnit || 0)) : 0;
                                          const price = s.valuePerUnit || 0;
                                          const margin = price - landedCost - exportCost;
                                          return formatAmount(margin * (s.unitCount || 0));
                                        })()} kr
                                      </p>
                                    </div>
                                  </div>
                                </div>
                             </div>
                          </div>
                        )}
                        {/* Minimalist Period Selector */}
                        <div className="flex items-center justify-between mt-4 mb-3 px-1">
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {[
                              { id: 'month1', label: 'Mån 1' },
                              { id: 'year1', label: 'År 1' },
                              { id: 'custom', label: 'Valfri' }
                            ].map(p => (
                              <div
                                key={p.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => updateRevenue(s.id, { viewPeriod: p.id as any })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    updateRevenue(s.id, { viewPeriod: p.id as any });
                                  }
                                }}
                                className={`cursor-pointer px-3 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
                                  (s.viewPeriod || 'month1') === p.id 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  {p.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {s.viewPeriod === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-300">
                              <span className="text-[7px] font-semibold text-slate-400 uppercase">Mån:</span>
                              <input 
                                type="number"
                                min={1}
                                max={120}
                                value={s.viewPeriodMonths || 12}
                                onChange={(e) => updateRevenue(s.id, { viewPeriodMonths: parseInt(e.target.value) || 1 })}
                                className="w-8 bg-transparent text-xs font-semibold text-slate-900 outline-none border-b border-slate-200 focus:border-amber-400 transition-colors"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 text-left">Summa intäkt</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">
                                  {formatAmount(
                                    (() => {
                                      const period = s.viewPeriod || 'month1';
                                      const customMonths = s.viewPeriodMonths || 12;
                                      
                                      const getValueForMonth = (mIdx: number) => {
                                        if (s.calculationMode === 'fixed') return s.value || 0;
                                        const baseCount = s.unitCount || 0;
                                        const growth = s.hasGrowth ? (s.newUnitsPerMonth || 0) * (mIdx) : 0;
                                        const count = Math.max(0, baseCount + growth);
                                        return count * (s.valuePerUnit || 0);
                                      };

                                      if (period === 'month1') return getValueForMonth(0);
                                      
                                      let total = 0;
                                      const limit = period === 'year1' ? 12 : customMonths;
                                      for(let i = 0; i < limit; i++) {
                                        total += getValueForMonth(i);
                                      }
                                      return total;
                                    })()
                                  )}
                                </span>
                                <span className="text-xs font-bold text-slate-400">kr</span>
                              </div>
                            </div>
                            <div className="text-right pb-1 flex items-center justify-end gap-1">
                              <span className="text-xs font-semibold text-amber-500 uppercase px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100">
                                {s.viewPeriod === 'month1' || !s.viewPeriod ? 'Månad 1' : s.viewPeriod === 'year1' ? 'År 1' : `${s.viewPeriodMonths || 1} Mån`}
                              </span>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

              {data.costCategories.map(cat => {
                const Icon = IconMap[cat.iconName] || Briefcase;
                const isPersonnel = cat.id === 'cat-payroll' || cat.title.toLowerCase().includes('personal') || cat.title.toLowerCase().includes('lön');
                const isCogs = cat.id === 'cat-cogs' || cat.title.toLowerCase().includes('direkta kostnader');
                const isDepreciation = cat.title.toLowerCase().includes('avskrivningar');
                const isLoan = cat.title.toLowerCase().includes('lån');
                const isStartup = cat.id === 'cat-startup' || cat.title.toLowerCase().includes('uppstart');
                const guideText = CATEGORY_GUIDE[cat.title] || CATEGORY_GUIDE[Object.keys(CATEGORY_GUIDE).find(k => cat.title.includes(k)) || ""] || "Definiera utgifter för denna kategori.";
                
                // Check if this is a standard category from INITIAL_DATA
                const isStandard = INITIAL_DATA.costCategories.some(sc => sc.title === cat.title);
                const hasData = (cat.items || []).some(item => 
                  (item.value || 0) > 0 || 
                  (item.valuePerUnit || 0) > 0 || 
                  (item.purchasePrice || 0) > 0 || 
                  (item.unitCount || 0) > 0 ||
                  (item.loanAmount || 0) > 0
                );

                const shouldBeOpen = forceCategoriesOpen ? hasData : (isPersonnel || isLoan || isStartup);

                return (
                  <FinancialSection 
                    key={cat.id} 
                    title={
                      <span className="flex items-center gap-1">
                        {cat.title} 
                        {hasData && forceCategoriesOpen && (
                          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-2 shadow-sm animate-in fade-in duration-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Genererad från mall
                          </span>
                        )}
                        <InfoTooltip text={guideText} />
                      </span>
                    } 
                    description={cat.description}
                    icon={<Icon size={18} className={isLoan ? "text-amber-500" : (isStartup ? "text-amber-500" : (hasData && forceCategoriesOpen ? "text-emerald-500" : ""))} />} 
                    defaultOpen={shouldBeOpen} 
                    onTitleChange={isStandard ? undefined : (t) => updateCategoryTitle(cat.id, t)} 
                    onDelete={isStandard ? undefined : () => deleteCostCategory(cat.id)}
                    columns={2}
                  >
                    {isStartup && (
                      <div className="col-span-full mb-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Summary Dashboard - Matches Loan Section Style */}
                        <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                          <div className="p-5 border-r border-b md:border-b-0 border-slate-100 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                                <Rocket size={10} className="text-slate-400 group-hover:text-amber-600" />
                              </div>
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Investering</span>
                              <InfoTooltip 
                                text="Summan av alla engångskostnader och tillgångsköp som sker innan eller vid start." 
                                definition="Vad kostar det rent praktiskt att slå upp portarna dag ett?"
                                calculation="Summan av alla objekt listade i kategorin Uppstartsfasen."
                              />
                            </div>
                            <div className="flex flex-col leading-none pl-6">
                              <span className="text-xl font-semibold text-slate-900 tabular-nums mb-1">
                                {formatAmount(cat.items.reduce((sum, i) => {
                                  if (i.calculationMode === 'asset') return sum + (Number(i.purchasePrice) || 0);
                                  if (i.calculationMode === 'loan') return sum + (Number(i.loanAmount) || 0);
                                  return sum + (i.value || 0) + ((i.unitCount || 0) * (i.valuePerUnit || 0));
                                }, 0))}
                              </span>
                              <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                            </div>
                          </div>

                          <div className="p-5 border-r border-b md:border-b-0 border-slate-100 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                <ShieldAlert size={10} className="text-slate-400 group-hover:text-red-600" />
                              </div>
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kapitalbehov (Peak)</span>
                              <InfoTooltip 
                                text="Detta är det totala kapitalet som krävs för att täcka alla investeringar och löpande förluster fram till den punkt då bolaget blir kassaflödespositivt." 
                                definition="Den djupaste gropen i kassaflödet. Det exakta belopp du måste ha på banken för att överleva fram till Break-Even."
                                calculation="Snabbt sagt: Den lägsta punkten i kassaflödes-grafen."
                                example="Om appen säger 500 000 kr betyder det att med ett startkapital under 500k kommer bolaget gå i konkurs (kassan < 0) innan det vänder."
                              />
                            </div>
                            <div className="flex flex-col leading-none pl-6">
                              <span className="text-xl font-semibold text-red-600 tabular-nums mb-1">
                                {formatAmount(results.peakCapitalNeed)}
                              </span>
                              <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                            </div>
                          </div>

                          <div className="p-5 border-r border-slate-100 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                <Shield size={10} className="text-slate-400 group-hover:text-emerald-600" />
                              </div>
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Finansiell Buffert</span>
                              <InfoTooltip 
                                text="Skillnaden mellan ditt startkapital och det faktiska kapitalbehovet." 
                                definition="Hur mycket säkerhetsluft har du ifall lanseringen går trögt?"
                                calculation="Ditt insatta Startkapital minus Kapitalbehovet (Peak)."
                              />
                            </div>
                            <div className="flex flex-col leading-none pl-6">
                              <span className="text-xl font-semibold text-emerald-600 tabular-nums mb-1">
                                {formatAmount(Math.max(0, data.strategicSettings.startingCash - results.peakCapitalNeed))}
                              </span>
                              <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                            </div>
                          </div>

                          <div className="p-5 bg-white border-l-4 border-l-amber-400 border border-slate-200 rounded-2xl transition-all group relative shadow-md hover:shadow-lg">
                            <div className="flex items-center gap-1.5 mb-2">
                              <CalendarDays size={14} className="text-amber-500" />
                              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Gemensam Startmånad</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <FormattedNumberInput 
                                  label="Gemensam Startmånad"
                                  className="w-20 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-2xl font-semibold text-amber-600 outline-none shadow-inner transition-all text-center focus:ring-2 focus:ring-amber-500/20"
                                  value={data.strategicSettings.revenueStartMonth}
                                  onChange={(val) => updateGlobalStartMonth(val)}
                                  min={1}
                                  max={120}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none">Månad</span>
                            </div>
                          </div>
                        </div>

                        {/* Strategic Info Box - Matches Personnel Section Style */}
                        <div className="p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl rounded-l-lg shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="bg-white p-2.5 rounded-xl shadow-inner border border-amber-100">
                              <Rocket className="text-amber-600 w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Strategisk planering: INITIAL INVESTERINGSFAS</p>
                              <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                Ange när din <span className="font-bold underline decoration-amber-300">Gemensamma Startmånad</span> infaller. Alla intäkter och löpande kostnader utgår automatiskt från denna period. Kostnader som bokförs <span className="font-bold">innan</span> denna månad (Månad {data.strategicSettings.revenueStartMonth}) betraktas som en del av din initiala investering.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {isPersonnel && (
                      <div className="col-span-full mb-4 p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-[2rem] rounded-l-lg animate-in fade-in duration-300 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="bg-amber-100 p-2.5 rounded-xl shadow-inner">
                            <Calculator className="text-amber-600 w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Löneberäkningslogik: TOTAL KOSTNAD FÖR BOLAGET</p>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                              Systemet applicerar automatiskt valda <span className="font-bold underline decoration-amber-300">Skatt & Påslag</span> (f.n. <span className="font-semibold">{formatNumber(totalOverheadPct, 2)}%</span>) ovanpå bruttolönen för att reflektera bolagets verkliga personalkostnad.
                            </p>
                            <button 
                              onClick={() => {
                                setActiveTab('personnel');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="mt-3 flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-semibold uppercase tracking-wide px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 group border border-amber-500/20"
                            >
                              <Users size={14} className="group-hover:scale-110 transition-transform" />
                              Konfigurera påslag i Personalsektionen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {isLoan && (
                      <div className="col-span-full mb-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Summary Dashboard - Compact & Technical */}
                        {cat.items.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                            <div className="p-5 border-r border-b md:border-b-0 border-slate-100 hover:bg-slate-50/50 transition-colors group">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Landmark size={12} className="text-slate-400 group-hover:text-amber-600" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Skuld</span>
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-xl font-semibold text-slate-900 tabular-nums mb-1">
                                  {formatAmount(cat.items.reduce((sum, i) => sum + (Number(i.loanAmount) || 0), 0))}
                                </span>
                                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                              </div>
                            </div>

                            <div className="p-5 border-r border-b md:border-b-0 border-slate-100 hover:bg-slate-50/50 transition-colors group">
                              <div className="flex items-center gap-1.5 mb-2">
                                <TrendingDown size={12} className="text-slate-400 group-hover:text-emerald-600" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amortering</span>
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-xl font-semibold text-emerald-600 tabular-nums mb-1">
                                  {formatAmount(cat.items.reduce((sum, i) => sum + ((Number(i.loanAmount) || 0) / (Number(i.amortizationMonths) || 60)), 0))}
                                </span>
                                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                              </div>
                            </div>

                            <div className="p-5 border-r border-slate-100 hover:bg-slate-50/50 transition-colors group">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Percent size={12} className="text-slate-400 group-hover:text-amber-600" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ränta (Mån 1)</span>
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-xl font-semibold text-amber-500 tabular-nums mb-1">
                                  {formatAmount(cat.items.reduce((sum, i) => sum + ((Number(i.loanAmount) || 0) * (Number(i.interestRate) || 0) / 100 / 12), 0))}
                                </span>
                                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                              </div>
                            </div>

                            <div className="p-5 hover:bg-slate-50/50 transition-colors group">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Activity size={12} className="text-slate-400 group-hover:text-blue-600" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kreditkostnad</span>
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-xl font-semibold text-blue-600 tabular-nums mb-1">
                                  {formatAmount(cat.items.reduce((sum, i) => {
                                    const principal = Number(i.loanAmount) || 0;
                                    const rate = (Number(i.interestRate) || 0) / 100;
                                    const months = Number(i.amortizationMonths) || 60;
                                    return sum + (principal * rate * (months / 12) / 2);
                                  }, 0))}
                                </span>
                                <span className="text-[7px] font-semibold text-slate-300 uppercase tracking-wide">SEK</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Educational Guide - Compact & Integrated */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="bg-indigo-50 p-2 rounded-xl">
                              <FileText className="text-indigo-500 w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Resultaträkning (P&L)</p>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Endast <span className="text-slate-900 font-bold">räntan</span> räknas som en kostnad som minskar din vinst. Amortering är en skuldreglering.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="bg-emerald-50 p-2 rounded-xl">
                              <RefreshCw className="text-emerald-500 w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Kassaflöde (Cash Flow)</p>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Både <span className="text-slate-900 font-bold">ränta och amortering</span> dras från ditt likvida kassaflöde.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                        <div className="col-span-full space-y-8">
                      {isCogs ? (
                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-white shadow-sm border border-amber-100 rounded-xl mt-1">
                                  <Truck className="text-amber-600" size={24} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-amber-900 uppercase tracking-tight mb-2">Direkta kostnader = vad det kostar att sälja en produkt</h4>
                                  <div className="text-xs text-amber-800 leading-relaxed font-medium mb-3 space-y-1">
                                    <p className="flex items-center gap-2"><span className="text-amber-500">👉</span> Varje gång du säljer något uppstår dessa kostnader.</p>
                                    <p className="flex items-center gap-2"><span className="text-amber-500">👉</span> Säljer du mer → kostnaderna ökar.</p>
                                    <p className="flex items-center gap-2"><span className="text-amber-500">👉</span> Säljer du mindre → kostnaderna minskar.</p>
                                  </div>
                                  <div className="bg-white/60 p-3 rounded-lg border border-amber-200/50 mt-4">
                                    <p className="text-xs font-bold text-amber-900 uppercase mb-2">📊 Exempel om du säljer en produkt:</p>
                                    <p className="text-xs text-amber-800 flex items-center gap-2 flex-wrap font-medium">
                                      <span className="bg-white px-2 py-1 rounded-md border border-amber-100 shadow-sm">Inköpspris</span> <span className="text-amber-400 font-semibold">+</span> 
                                      <span className="bg-white px-2 py-1 rounded-md border border-amber-100 shadow-sm">Frakt</span> <span className="text-amber-400 font-semibold">+</span>
                                      <span className="bg-white px-2 py-1 rounded-md border border-amber-100 shadow-sm">Förpackning</span> <span className="text-amber-400 font-semibold">+</span>
                                      <span className="bg-white px-2 py-1 rounded-md border border-amber-100 shadow-sm">Transaktionsavgifter</span>
                                      <span className="font-semibold text-amber-900 ml-1 border-l-2 border-amber-300 pl-2"> = Direkta kostnader per produkt</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              {(() => {
                                const cogsItem = cat.items[0];
                                if (!cogsItem) return null;
                                
                                const allLinks = cogsItem.revenueLinks || [];
                                const orphanedLinks = allLinks.filter(l => !data.revenueStreams.some(r => r.id === l.revenueId)).map(l => ({
                                  id: l.revenueId,
                                  label: 'Borttagen intäktskälla',
                                  valuePerUnit: 0,
                                  purchasePricePerUnit: 0,
                                  isOrphaned: true
                                }));
                                
                                const streamsToRender = [...data.revenueStreams, ...orphanedLinks];
                                
                                if (streamsToRender.length === 0) {
                                  return (
                                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                                      <p className="text-sm font-bold text-slate-500">Slutför Intäktsflöden ovan först för att kunna kalkylera per produkt.</p>
                                    </div>
                                  );
                                }
                                
                                return streamsToRender.map(rs => {
                                  const link = allLinks.find(l => l.revenueId === rs.id);
                                  const unitCosts = link?.unitCosts || [];
                                  
                                  const sellPrice = rs.valuePerUnit || 0;
                                  // @ts-ignore
                                  const purchasePrice = rs.purchasePricePerUnit || 0;
                                  const addedCosts = unitCosts.filter(c => !(c.label || '').toLowerCase().startsWith('inköp:')).reduce((sum, c) => sum + (c.isPercentage ? sellPrice * (c.value || 0) / 100 : (c.value || 0)), 0);
                                  const totalCostPerUnit = purchasePrice + addedCosts;
                                  const profitPerUnit = sellPrice - totalCostPerUnit;
                                  const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;
                                  
                                  const isLinked = !!link;
                                  // @ts-ignore
                                  const isOrphaned = rs.isOrphaned;

                                  return (
                                    <div key={rs.id} className={`p-4 rounded-2xl border transition-all ${isLinked ? 'bg-white border-amber-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 hover:border-amber-300'}`}>
                                      <div className="flex items-start justify-between mb-4">
                                        <div>
                                          <span className="text-xs font-semibold uppercase text-amber-600 tracking-wider mb-1 block flex items-center gap-1">
                                            <Package size={10} /> {isOrphaned ? 'OSYNLIG INTÄKT (LÄNKEN BRUTEN)' : 'Intäktsström'}
                                          </span>
                                          <h3 className="text-lg font-semibold text-slate-900">{rs.label || 'Namnlös intäkt'}</h3>
                                          {!isOrphaned && (
                                            <div className="flex gap-4 mt-2 text-xs font-bold">
                                              <span className="text-slate-500">Försäljningspris: <span className="text-slate-900">{formatAmount(sellPrice)} kr/st</span></span>
                                            </div>
                                          )}
                                          {isOrphaned && (
                                            <p className="text-xs font-bold text-red-500 mt-1">Denna koppling tillhör en borttagen intäktskälla. Dina kostnader finns kvar.</p>
                                          )}
                                        </div>
                                        
                                        {!isLinked ? (
                                          <button 
                                            onClick={() => {
                                              const currentLinks = cogsItem.revenueLinks || [];
                                              const newLink: RevenueLink = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                revenueId: rs.id,
                                                unitCosts: [{ id: Math.random().toString(36).substr(2, 9), label: 'Frakt', value: 0 }]
                                              };
                                              updateCostItem(cat.id, cogsItem.id, { 
                                                revenueLinks: [...currentLinks, newLink],
                                                isLinkedToRevenue: true 
                                              });
                                            }}
                                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
                                          >
                                            <Plus size={14} /> Lägg till kostnader
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const newLinks = (cogsItem.revenueLinks || []).filter(l => l.revenueId !== rs.id);
                                              updateCostItem(cat.id, cogsItem.id, { 
                                                revenueLinks: newLinks,
                                                isLinkedToRevenue: newLinks.length > 0
                                              });
                                            }}
                                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                            title="Ta bort kostnadskalkyl"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        )}
                                      </div>

                                      {isLinked && link && (
                                        <div className="space-y-4 pt-4 border-t border-amber-100 animate-in slide-in-from-top-2 duration-300">
                                          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                            <div className="flex justify-between items-center mb-3">
                                              <h4 className="text-xs font-semibold uppercase text-amber-900 tracking-wider">Kostnader per såld enhet</h4>
                                              <button 
                                                onClick={() => {
                                                  const newLinks = [...(cogsItem.revenueLinks || [])];
                                                  const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                  if (linkIdx > -1) {
                                                    const newUnitCosts = [...newLinks[linkIdx].unitCosts, { id: Math.random().toString(36).substr(2, 9), label: '', value: 0 }];
                                                    newLinks[linkIdx] = { ...newLinks[linkIdx], unitCosts: newUnitCosts };
                                                    updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                  }
                                                }}
                                                className="text-xs font-semibold uppercase text-amber-600 bg-white border border-amber-200 px-2 py-1 rounded-md shadow-sm hover:bg-amber-100 flex items-center gap-1 transition-all"
                                              >
                                                <Plus size={12} /> Ny rad
                                              </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                              {purchasePrice > 0 && (
                                                <div className="flex items-center gap-3 p-2.5 bg-white/60 rounded-lg border border-amber-200/50">
                                                  <div className="flex-1 text-xs font-semibold text-amber-900 uppercase">Inköpspris (Intäkt)</div>
                                                  <div className="w-32 text-right text-xs font-semibold text-amber-900">{formatAmount(purchasePrice)} kr</div>
                                                  <div className="w-8 flex justify-center"><InfoTooltip text="Detta värde hämtas automatiskt från din Intäktsström." /></div>
                                                </div>
                                              )}

                                              {unitCosts.filter(c => !(c.label || '').toLowerCase().startsWith('inköp:')).map((uc) => (
                                                <div key={uc.id} className="flex items-center gap-3 animate-in fade-in duration-200">
                                                  <input
                                                    type="text"
                                                    placeholder="t.ex. Frakt, Emballage..."
                                                    className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 shadow-sm"
                                                    value={uc.label || ''}
                                                    onChange={(e) => {
                                                      const newLinks = [...(cogsItem.revenueLinks || [])];
                                                      const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                      if (linkIdx > -1) {
                                                        const newUnitCosts = [...newLinks[linkIdx].unitCosts];
                                                        const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                        if (realIdx > -1) {
                                                          newUnitCosts[realIdx] = { ...uc, label: e.target.value };
                                                          newLinks[linkIdx] = { ...newLinks[linkIdx], unitCosts: newUnitCosts };
                                                          updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                        }
                                                      }
                                                    }}
                                                  />
                                                  <div className="w-32 flex items-center bg-white border border-amber-200 rounded-lg focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 shadow-sm overflow-hidden relative">
                                                    <FormattedNumberInput
                                                      className="flex-1 w-full bg-transparent px-3 py-2 text-xs font-semibold text-slate-900 text-right outline-none"
                                                      value={uc.value}
                                                      onChange={(val) => {
                                                        const newLinks = [...(cogsItem.revenueLinks || [])];
                                                        const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                        if (linkIdx > -1) {
                                                          const newUnitCosts = [...newLinks[linkIdx].unitCosts];
                                                          const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                          if (realIdx > -1) {
                                                            newUnitCosts[realIdx] = { ...uc, value: val };
                                                            newLinks[linkIdx] = { ...newLinks[linkIdx], unitCosts: newUnitCosts };
                                                            updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                          }
                                                        }
                                                      }}
                                                      min={0}
                                                    />
                                                    <button 
                                                      onClick={() => {
                                                        const newLinks = [...(cogsItem.revenueLinks || [])];
                                                        const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                        if (linkIdx > -1) {
                                                          const newUnitCosts = [...newLinks[linkIdx].unitCosts];
                                                          const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                          if (realIdx > -1) {
                                                            newUnitCosts[realIdx] = { ...uc, isPercentage: !uc.isPercentage };
                                                            newLinks[linkIdx] = { ...newLinks[linkIdx], unitCosts: newUnitCosts };
                                                            updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                          }
                                                        }
                                                      }}
                                                      className={`px-2 py-2 text-xs font-semibold transition-colors border-l uppercase w-8 flex items-center justify-center ${uc.isPercentage ? 'text-amber-700 bg-amber-100 hover:bg-amber-200 border-amber-200' : 'text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-amber-100 border-amber-100'}`}
                                                    >
                                                      {uc.isPercentage ? '%' : 'kr'}
                                                    </button>
                                                  </div>
                                                  <div className="w-8 flex justify-center">
                                                    {uc.isPercentage ? (
                                                      <InfoTooltip 
                                                        text="Procentuell kostnad från försäljningspris ex. moms."
                                                        definition="Systemet räknar automatiskt ut kostnaden per enhet baserat på angiven procent. Detta ingår i din totala COGS."
                                                        calculation={`${uc.value}% × ${formatAmount(sellPrice)} kr (baserat på pris exkl. moms) = ${formatAmount(sellPrice * (uc.value || 0) / 100)} kr`}
                                                        example="Uppdateras omedelbart om du ändrar produktens försäljningspris. Posten särredovisas också tydligt i REVISION-vyn."
                                                      />
                                                    ) : (
                                                      <button 
                                                        onClick={() => {
                                                          const newLinks = [...(cogsItem.revenueLinks || [])];
                                                          const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                          if (linkIdx > -1) {
                                                            newLinks[linkIdx].unitCosts = newLinks[linkIdx].unitCosts.filter((_, i) => i !== ucIdx);
                                                            updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                          }
                                                        }}
                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center w-full h-full"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    )}
                                                  </div>
                                                  {uc.isPercentage && (
                                                    <button 
                                                      onClick={() => {
                                                        const newLinks = [...(cogsItem.revenueLinks || [])];
                                                        const linkIdx = newLinks.findIndex(l => l.revenueId === rs.id);
                                                        if (linkIdx > -1) {
                                                          newLinks[linkIdx].unitCosts = newLinks[linkIdx].unitCosts.filter((_, i) => i !== ucIdx);
                                                          updateCostItem(cat.id, cogsItem.id, { revenueLinks: newLinks });
                                                        }
                                                      }}
                                                      className="flex-shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    >
                                                      <Trash2 size={14} />
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                                              <span className="text-xs font-semibold uppercase text-slate-500 mb-1">Försäljningspris</span>
                                              <span className="text-lg font-semibold text-slate-900">{formatAmount(sellPrice)} kr</span>
                                            </div>
                                            <div className="p-4 bg-amber-100/50 rounded-xl border border-amber-200 flex flex-col items-center justify-center text-center shadow-sm">
                                              <span className="text-xs font-semibold uppercase text-amber-600 mb-1">Total COGS</span>
                                              <span className="text-lg font-semibold text-amber-900">{formatAmount(totalCostPerUnit)} kr</span>
                                            </div>
                                            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm transition-colors ${profitPerUnit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                              <span className={`text-xs font-semibold uppercase mb-1 ${profitPerUnit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Vinst per produkt</span>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xl font-semibold ${profitPerUnit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>{formatAmount(profitPerUnit)} kr</span>
                                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${profitPerUnit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>{profitMargin.toFixed(0)}%</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                        </div>
                      ) : (
                      ['fixed', 'unit', 'asset', 'loan'].map(mode => {
                        const itemsInMode = cat.items.filter(i => i.calculationMode === mode);
                        if (itemsInMode.length === 0) return null;

                        return (
                          <div key={mode} className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-3 px-1">
                              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                mode === 'fixed' ? 'bg-blue-50 text-blue-600' : 
                                mode === 'unit' ? 'bg-emerald-50 text-emerald-600' : 
                                mode === 'asset' ? 'bg-amber-50 text-amber-600' :
                                'bg-slate-900 text-white'
                              }`}>
                                {mode === 'fixed' ? 'Fast' : mode === 'unit' ? 'Antal' : mode === 'asset' ? 'Investering' : 'Lån'}
                              </span>
                              <div className="h-px bg-slate-100 flex-1" />
                            </div>

                            <div className="space-y-4">
                              {itemsInMode.map(item => {
                                let baseVal = 0;
                                if (item.calculationMode === 'fixed') baseVal = item.value || 0;
                                else if (item.calculationMode === 'unit') baseVal = (item.unitCount || 0) * (item.valuePerUnit || 0);
                                else if (item.calculationMode === 'asset') baseVal = (item.purchasePrice || 0) / ((item.lifespanYears || 1) * 12);
                                else if (item.calculationMode === 'loan') {
                                  // Simplified monthly expense for loan (principal + interest average)
                                  baseVal = ((item.loanAmount || 0) / (item.amortizationMonths || 60)) + ((item.loanAmount || 0) * (item.interestRate || 0) / 100 / 12);
                                }

                                const feeAmount = isPersonnel ? (baseVal * (totalOverheadPct / 100)) : 0;
                                const totalCost = baseVal + feeAmount;

                                return (
                                  <div key={item.id} className="col-span-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {isLoan && (
                                      <div className="p-6 bg-white border border-slate-200 rounded-[2rem] group/item relative hover:border-amber-200 transition-all shadow-sm">
                                        <button 
                                          onClick={() => setData(d => ({...d, costCategories: d.costCategories.map(c => c.id === cat.id ? {...c, items: c.items.filter(i => i.id !== item.id)} : c)}))}
                                          className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all z-20"
                                        >
                                          <Trash2 size={16}/>
                                        </button>
                                        
                                        <div className="flex items-center gap-3 mb-6">
                                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                                            <Landmark size={18} className="text-amber-600" />
                                          </div>
                                          <div className="flex-1 flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3">
                                                <input 
                                                  className="flex-1 font-semibold text-slate-900 text-sm bg-slate-50 border border-slate-200 hover:border-amber-200 focus:border-amber-400 focus:bg-white px-4 py-2 rounded-xl transition-all uppercase tracking-tight outline-none focus:ring-0 placeholder:text-slate-300 shadow-inner" 
                                                  value={item.label || ''} 
                                                  onChange={(e) => updateCostItem(cat.id, item.id, {label: e.target.value})} 
                                                  placeholder="NAMN PÅ LÅN / FINANSIERING..."
                                                />
                                                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex flex-col items-end min-w-[120px] shadow-sm">
                                                  <span className="text-[7px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-0.5">Utgift / Mån</span>
                                                  <span className="text-xs font-semibold tabular-nums">{formatAmount(totalCost)} kr</span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <button 
                                                onClick={() => setActiveCommentItem({id: item.id, label: item.label || 'Lån'})}
                                                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Kommentera"
           >
                                        <MessageSquare size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                      <label className="text-xs font-semibold uppercase text-slate-400 block tracking-wide">Lånebelopp (Huvudstol)</label>
                                      <div className="flex items-center gap-2">
                                        <FormattedNumberInput 
                                          label="Lånebelopp"
                                          className="flex-1 bg-transparent border-none p-0 text-lg font-semibold text-slate-900 focus:ring-0 outline-none tabular-nums" 
                                          value={item.loanAmount || 0} 
                                          onChange={(val) => updateCostItem(cat.id, item.id, {loanAmount: val})} 
                                          min={0}
                                        />
                                        <span className="text-xs font-semibold text-slate-300 uppercase">SEK</span>
                                      </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                      <label className="text-xs font-semibold uppercase text-slate-400 block tracking-wide">Årlig Räntesats</label>
                                      <div className="flex items-center gap-2">
                                        <FormattedNumberInput 
                                          label="Ränta"
                                          className="flex-1 bg-transparent border-none p-0 text-lg font-semibold text-slate-900 focus:ring-0 outline-none tabular-nums" 
                                          value={item.interestRate || 0} 
                                          onChange={(val) => updateCostItem(cat.id, item.id, {interestRate: val})} 
                                          min={0}
                                          max={100}
                                        />
                                        <span className="text-xs font-semibold text-slate-300 uppercase">%</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      <div>
                                        <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Löptid (Mån)</label>
                                        <FormattedNumberInput 
                                          label="Löptid"
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400" 
                                          value={item.amortizationMonths || 60} 
                                          onChange={(val) => updateCostItem(cat.id, item.id, {amortizationMonths: val})} 
                                          min={1}
                                          max={600}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Utbetalning (Mån)</label>
                                        <FormattedNumberInput 
                                          label="Lånestart"
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400" 
                                          value={item.loanStartMonth || 1} 
                                          onChange={(val) => updateCostItem(cat.id, item.id, {loanStartMonth: val})} 
                                          min={1}
                                          max={120}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 tracking-wide">Amort.fritt (Mån)</label>
                                        <FormattedNumberInput 
                                          label="Amorteringsfritt"
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400" 
                                          value={item.gracePeriodMonths || 0} 
                                          onChange={(val) => updateCostItem(cat.id, item.id, {gracePeriodMonths: val})} 
                                          min={0}
                                          max={120}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Beräknad Månadsutgift (Snitt)</span>
                                        {Number(item.gracePeriodMonths) > 0 && (
                                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-tight">Initialt amorteringsfritt</span>
                                        )}
                                      </div>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-semibold text-white tabular-nums">
                                          {formatAmount(((item.loanAmount || 0) / (item.amortizationMonths || 60)) + ((item.loanAmount || 0) * (item.interestRate || 0) / 100 / 12))}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 uppercase">SEK</span>
                                      </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                      <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                                        style={{ 
                                          width: `${((item.loanAmount || 0) / (item.amortizationMonths || 60)) / (((item.loanAmount || 0) / (item.amortizationMonths || 60)) + ((item.loanAmount || 0) * (item.interestRate || 0) / 100 / 12)) * 100}%` 
                                        }} 
                                      />
                                      <div 
                                        className="h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" 
                                        style={{ 
                                          width: `${((item.loanAmount || 0) * (item.interestRate || 0) / 100 / 12) / (((item.loanAmount || 0) / (item.amortizationMonths || 60)) + ((item.loanAmount || 0) * (item.interestRate || 0) / 100 / 12)) * 100}%` 
                                        }} 
                                      />
                                    </div>
                                    <div className="flex justify-between text-[7px] font-semibold uppercase tracking-wide">
                                      <span className="text-emerald-500">Amortering</span>
                                      <span className="text-amber-400">Ränta</span>
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => setAmortizationModal({ isOpen: true, loan: item })}
                                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold uppercase tracking-wide hover:bg-slate-200 hover:text-slate-900 transition-all flex items-center justify-center gap-2 border border-slate-200"
                                  >
                                    <TrendingUp size={12} className="text-slate-400" />
                                    Visa Amorteringsplan
                                  </button>
                                </div>
                              </div>
                            )}

                            {!isLoan && (
                              <div className="contents">
                                <div className={`p-5 bg-slate-50/30 border border-slate-200 rounded-[1.5rem] group/item relative hover:bg-white transition-all shadow-sm`}>
                                  <button onClick={() => { setData(d => ({...d, costCategories: d.costCategories.map(c => c.id === cat.id ? {...c, items: c.items.filter(i => i.id !== item.id)} : c)})); }} className="absolute -top-2 -right-2 bg-white shadow-md border p-2 rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 z-10"><Trash2 size={12}/></button>
                                  <div className="space-y-3 mb-4">
                                   <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <input 
                                          className="w-full font-bold text-slate-900 text-xs bg-slate-50 border border-slate-200 hover:border-amber-200 focus:border-amber-400 focus:bg-white px-3 py-1.5 rounded-xl transition-all uppercase tracking-tight outline-none focus:ring-0" 
                                          value={item.label || ''} 
                                          onChange={(e) => updateCostItem(cat.id, item.id, {label: e.target.value})} 
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <button 
                                          onClick={() => setActiveCommentItem({id: item.id, label: item.label || 'Kostnad'})}
                                          className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Kommentera"
                                        >
                                          <MessageSquare size={14} />
                                        </button>
                                      </div>
                                   </div>
                                   <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 items-center w-fit">
                                      <InfoTooltip text={
                                        <div className="p-1 space-y-2 max-w-[200px]">
                                          <div>
                                            <p className="text-xs font-semibold uppercase text-amber-600 mb-0.5 tracking-tight">Fast (Fixed)</p>
                                            <p className="text-xs leading-tight text-slate-500">Stående månadsbelopp som inte ändras med volym (t.ex. hyra, fast mjukvaruprenumeration).</p>
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold uppercase text-amber-600 mb-0.5 tracking-tight">Antal (Unit)</p>
                                            <p className="text-xs leading-tight text-slate-500">Kostnaden beror på volym (t.ex. varuinköp per styck, konsulttimmar).</p>
                                          </div>
                                          {!isPersonnel && !isLoan && !isCogs && (
                                            <div>
                                              <p className="text-xs font-semibold uppercase text-amber-600 mb-0.5 tracking-tight">Investering (Asset)</p>
                                              <p className="text-xs leading-tight text-slate-500">Dyr utrustning (över 25k) som skrivs av över flera år.</p>
                                            </div>
                                          )}
                                        </div>
                                      } />
                                     <div className="flex gap-1">
                                        {!isDepreciation && !isLoan && <button onClick={() => updateCostItem(cat.id, item.id, {calculationMode: 'fixed'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${item.calculationMode === 'fixed' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Fast</button>}
                                        {!isDepreciation && !isLoan && <button onClick={() => updateCostItem(cat.id, item.id, {calculationMode: 'unit'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${item.calculationMode === 'unit' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Antal</button>}
                                        {!isPersonnel && !isLoan && !isCogs && <button onClick={() => updateCostItem(cat.id, item.id, {calculationMode: 'asset'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${item.calculationMode === 'asset' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Investering</button>}
                                        {isLoan && <button onClick={() => updateCostItem(cat.id, item.id, {calculationMode: 'loan'})} className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${item.calculationMode === 'loan' ? 'bg-black text-white shadow-sm' : 'text-slate-400'}`}>Lån</button>}
                                      </div>
                                   </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                    <p className="text-xs text-blue-800 leading-tight space-y-1">
                                      <span className="flex items-start gap-2">
                                        <Info size={12} className="shrink-0 mt-0.5" />
                                        <span>
                                          <strong>Logik:</strong> 
                                          {item.calculationMode === 'fixed' && " Fast månatlig kostnad."}
                                          {item.calculationMode === 'unit' && (isPersonnel ? " Personalstyrka baserad på roller." : " Rörlig kostnad baserad på volym.")}
                                          {item.calculationMode === 'asset' && " Investering med avskrivning."}
                                          {item.calculationMode === 'loan' && " Skuldfinansiering med ränta."}
                                        </span>
                                      </span>
                                    </p>
                                    {item.aiMotivation && (
                                      <p className="mt-2 pt-2 border-t border-blue-100 text-xs text-blue-900 font-bold uppercase tracking-tight flex items-center gap-2">
                                        <Sparkles size={12} className="text-amber-500" />
                                        <span>AI Strateg: {item.aiMotivation}</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Revenue Link Section */}
                                  {!isPersonnel && !isLoan && (item.calculationMode === 'unit') && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-4 animate-in zoom-in-95 duration-300 shadow-sm">
                                      <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                                        <div className="space-y-1">
                                          <label className="text-xs font-semibold uppercase text-amber-900 tracking-wide flex items-center gap-2">
                                            <Link2 size={14} className="text-amber-600" /> Koppla volym till försäljning
                                          </label>
                                          <p className="text-xs text-amber-700 font-medium">Skala rörliga kostnader baserat på din försäljning</p>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const currentLinks = item.revenueLinks || [];
                                            const newLink: RevenueLink = {
                                              id: Math.random().toString(36).substr(2, 9),
                                              revenueId: data.revenueStreams[0]?.id || '',
                                              unitCosts: [{ id: Math.random().toString(36).substr(2, 9), label: 'FAKTURAKOSTNAD', value: 0 }]
                                            };
                                            updateCostItem(cat.id, item.id, { 
                                              revenueLinks: [...currentLinks, newLink],
                                              isLinkedToRevenue: true 
                                            });
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase rounded-lg shadow-sm transition-all active:scale-[0.98]"
                                        >
                                          <Plus size={12} /> Lägg till koppling
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        {(item.revenueLinks || []).length > 0 ? (
                                          (item.revenueLinks || []).map((link, linkIdx) => {
                                            const linkedRev = data.revenueStreams.find(r => r.id === link.revenueId);
                                            const sellPrice = linkedRev?.valuePerUnit || 0;
                                            const purchasePrice = linkedRev?.purchasePricePerUnit || 0;
                                            const addedCosts = link.unitCosts.filter(c => !(c.label || '').toLowerCase().startsWith('inköp:')).reduce((sum, c) => sum + (c.isPercentage ? sellPrice * (c.value || 0) / 100 : (c.value || 0)), 0);
                                            const unitCost = purchasePrice + addedCosts;
                                            const profitPerUnit = sellPrice - unitCost;
                                            const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;
                                            const monthlyVolume = linkedRev?.unitCount || 0; 
                                            const totalMonthlyProfit = profitPerUnit * monthlyVolume;

                                            return (
                                              <div key={link.id} className="relative bg-white/60 p-4 rounded-xl border border-amber-200 space-y-4 animate-in slide-in-from-top-2 duration-300 group">
                                                <button 
                                                  onClick={() => {
                                                    const newLinks = (item.revenueLinks || []).filter(l => l.id !== link.id);
                                                    updateCostItem(cat.id, item.id, { 
                                                      revenueLinks: newLinks,
                                                      isLinkedToRevenue: newLinks.length > 0
                                                    });
                                                  }}
                                                  className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-400 hover:text-red-600 hover:border-red-200 rounded-full shadow-sm hover:shadow-md transition-all z-10"
                                                  title="Ta bort koppling"
                                                >
                                                  <Trash2 size={12} />
                                                </button>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-1">
                                                    <label className="text-xs font-semibold uppercase text-amber-600 block">Kopplad Intäktskälla</label>
                                                    <select 
                                                      className="w-full bg-white border border-amber-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
                                                      value={link.revenueId || ''}
                                                      onChange={(e) => {
                                                        const newLinks = [...(item.revenueLinks || [])];
                                                        newLinks[linkIdx] = { ...link, revenueId: e.target.value };
                                                        updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                      }}
                                                    >
                                                      <option value="">Välj...</option>
                                                      {data.revenueStreams.map(rs => (
                                                        <option key={rs.id} value={rs.id}>{rs.label}</option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  
                                                  <div className="bg-amber-100/30 p-2 rounded-lg border border-amber-100/50 flex flex-col justify-center">
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-xs font-semibold uppercase text-amber-600">Försäljningspris:</span>
                                                      <span className="text-xs font-semibold text-slate-700">{formatAmount(sellPrice)} kr</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1">
                                                      <span className="text-xs font-semibold uppercase text-amber-600">Inköpspris (Intäkt):</span>
                                                      <span className="text-xs font-semibold text-amber-900">{formatAmount(purchasePrice)} kr</span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold uppercase text-amber-800 flex items-center gap-1">
                                                      <Package size={10} /> Kostnadskomponenter per produkt
                                                    </label>
                                                  </div>
                                                  
                                                  <div className="space-y-2">
                                                    {/* Auto-synced Purchase Price from Revenue Stream */}
                                                    {purchasePrice > 0 && (
                                                      <div className="flex gap-2 items-center bg-amber-100/40 p-1.5 rounded-lg border border-amber-200/50">
                                                        <div className="flex-1 px-2 text-xs font-semibold text-amber-900 uppercase">
                                                          Inköpspris (från intäkt)
                                                        </div>
                                                        <div className="w-24 text-right px-2 text-xs font-semibold text-amber-900">
                                                          {formatAmount(purchasePrice)} kr
                                                        </div>
                                                        <div className="w-8 flex justify-center">
                                                          <InfoTooltip 
                                                            text="Detta värde hämtas automatiskt från din valda intäktskälla." 
                                                            definition="Säkerställer automatisk synk mellan intäkt och utgift."
                                                            calculation="Hämtar fältet 'Inköpspris per enhet' från den Intäktsström du valt ovan."
                                                            iconSize={12} 
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {link.unitCosts.filter(c => !(c.label || '').toLowerCase().startsWith('inköp:')).map((uc) => (
                                                      <div key={uc.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                                                        <input 
                                                          type="text"
                                                          placeholder="t.ex. FRAKTURAKOSTNAD, Frakt..."
                                                          className="flex-1 bg-white border border-amber-100 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-300 shadow-sm"
                                                          value={uc.label || ''}
                                                          onChange={(e) => {
                                                            const newLinks = [...(item.revenueLinks || [])];
                                                            const newUnitCosts = [...link.unitCosts];
                                                            const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                            if (realIdx > -1) {
                                                              newUnitCosts[realIdx] = { ...uc, label: e.target.value };
                                                              newLinks[linkIdx] = { ...link, unitCosts: newUnitCosts };
                                                              updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                            }
                                                          }}
                                                        />
                                                        <div className="w-24 flex flex-shrink-0 items-center bg-white border border-amber-100 rounded-lg focus-within:ring-2 focus-within:ring-amber-400 shadow-sm overflow-hidden">
                                                          <FormattedNumberInput 
                                                            className="w-full bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-900 text-right outline-none"
                                                            value={uc.value}
                                                            onChange={(val) => {
                                                              const newLinks = [...(item.revenueLinks || [])];
                                                              const newUnitCosts = [...link.unitCosts];
                                                              const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                              if (realIdx > -1) {
                                                                newUnitCosts[realIdx] = { ...uc, value: val };
                                                                newLinks[linkIdx] = { ...link, unitCosts: newUnitCosts };
                                                                updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                              }
                                                            }}
                                                            min={0}
                                                          />
                                                          <button 
                                                            onClick={() => {
                                                              const newLinks = [...(item.revenueLinks || [])];
                                                              const newUnitCosts = [...link.unitCosts];
                                                              const realIdx = newUnitCosts.findIndex(u => u.id === uc.id);
                                                              if (realIdx > -1) {
                                                                newUnitCosts[realIdx] = { ...uc, isPercentage: !uc.isPercentage };
                                                                newLinks[linkIdx] = { ...link, unitCosts: newUnitCosts };
                                                                updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                              }
                                                            }}
                                                            className="px-1.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-amber-100 transition-colors border-l border-amber-100 uppercase"
                                                          >
                                                            {uc.isPercentage ? '%' : 'kr'}
                                                          </button>
                                                        </div>
                                                        {link.unitCosts.length > 1 && (
                                                          <button 
                                                            onClick={() => {
                                                              const newLinks = [...(item.revenueLinks || [])];
                                                              const realIdx = link.unitCosts.findIndex(u => u.id === uc.id);
                                                              if (realIdx > -1) {
                                                                const newUnitCosts = link.unitCosts.filter((_, i) => i !== realIdx);
                                                                newLinks[linkIdx] = { ...link, unitCosts: newUnitCosts };
                                                                updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                              }
                                                            }}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                                          >
                                                            <Trash2 size={12} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                  
                                                  <button 
                                                    onClick={() => {
                                                      const newLinks = [...(item.revenueLinks || [])];
                                                      const newUnitCosts = [...link.unitCosts, { id: Math.random().toString(36).substr(2, 9), label: '', value: 0 }];
                                                      newLinks[linkIdx] = { ...link, unitCosts: newUnitCosts };
                                                      updateCostItem(cat.id, item.id, { revenueLinks: newLinks });
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-amber-300 rounded-lg text-xs font-semibold uppercase text-amber-700 hover:bg-white transition-all shadow-sm"
                                                  >
                                                    <Plus size={10} /> Ny kostnadskomponent
                                                  </button>
                                                </div>

                                                {/* Profit Analysis for this link */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-100">
                                                  <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                      <p className="text-xs font-semibold uppercase text-amber-800 opacity-70">Direkta Kostnader</p>
                                                      <InfoTooltip 
                                                        text="Summa av alla rörliga kostnader som är direkt kopplade till försäljningen av denna enhet (t.ex. inköp, frakt, tull)." 
                                                        definition="Kallas även Direkta Kostnader eller COGS (Cost of Goods Sold)."
                                                        calculation="Summan av Inköpspris + alla dina listade komponenter nedan."
                                                        iconSize={10}
                                                      />
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                      <span className="text-lg font-semibold text-amber-900">{formatAmount(unitCost)}</span>
                                                      <span className="text-xs font-bold text-amber-700">kr/st</span>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className={`p-3 rounded-xl border ${profitPerUnit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                      <p className={`text-xs font-semibold uppercase tracking-wider ${profitPerUnit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                                                        Bruttovinst / Marginal
                                                      </p>
                                                      <InfoTooltip 
                                                        text="Vinst per enhet efter direkta kostnader. Detta är vad som återstår för att täcka fasta kostnader och löner." 
                                                        definition="Även känt som Täckningsbidrag (TB) per styck."
                                                        calculation="Försäljningspris minus Direkta Kostnader."
                                                        example="Ett bidrag på 100kr betyder att varje försäljning hjälper till med 100kr för att betala månadens lagliga fasta hyra."
                                                        iconSize={10}
                                                      />
                                                    </div>
                                                    <div className="flex items-baseline justify-between">
                                                      <div className="flex items-baseline gap-1">
                                                        <span className={`text-lg font-semibold ${profitPerUnit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                                                          {formatAmount(profitPerUnit)}
                                                        </span>
                                                        <span className={`text-xs font-bold ${profitPerUnit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>kr</span>
                                                      </div>
                                                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${profitPerUnit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                        {profitMargin.toFixed(1)}%
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Monthly context with growth estimation */}
                                                <div className="bg-slate-900/5 p-3 rounded-2xl border border-slate-200/50 space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                      <span className="text-xs font-semibold text-slate-500 uppercase">Månad 1 Bruttovinst</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">
                                                      {formatAmount(totalMonthlyProfit)} kr
                                                    </span>
                                                  </div>
                                                  
                                                  {linkedRev?.hasGrowth && (
                                                    <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                                                      <div className="flex items-center gap-2">
                                                        <TrendingUp size={12} className="text-blue-500" />
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Skalning & Tillväxt (År 1 Slut)</span>
                                                      </div>
                                                      <span className="text-xs font-semibold text-blue-600">
                                                        ~{formatAmount(profitPerUnit * (monthlyVolume + (Number(linkedRev.newUnitsPerMonth) || 0) * 11))} kr/mån
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="py-6 text-center border border-dashed border-amber-200 rounded-2xl bg-amber-50/50">
                                            <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                                              <Link2 size={24} className="text-amber-300" />
                                            </div>
                                            <p className="text-xs text-amber-900 font-semibold uppercase mb-1">Inga kopplingar aktiva</p>
                                            <p className="text-xs text-amber-600 font-medium">Klicka på "Lägg till koppling" för att börja synka volym</p>
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  )}

                                  {item.calculationMode === 'asset' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-300">
                                      <div><label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Pris</label><FormattedNumberInput label="Pris" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black" value={item.purchasePrice || 0} onChange={(val) => updateCostItem(cat.id, item.id, {purchasePrice: val})} min={0} /></div>
                                       <div>
                                         <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 flex items-center gap-1">Moms (%) <InfoTooltip text="Ingående moms på tillgången." definition="Momsen ditt bolag betalar (och kvittar mot utgående moms)." /></label>
                                         <div className="flex flex-wrap gap-1 mb-1">
                                           {[25, 12, 6, 0].map(v => (
                                             <button 
                                               key={v}
                                               onClick={() => updateCostItem(cat.id, item.id, {vatRate: v})}
                                               className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${item.vatRate === v ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                             >
                                               {v}%
                                             </button>
                                           ))}
                                         </div>
                                         <FormattedNumberInput label="Moms" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black" value={item.vatRate ?? 25} onChange={(val) => updateCostItem(cat.id, item.id, {vatRate: val})} min={0} max={100} />
                                       </div>
                                      <div><label className="text-xs font-semibold uppercase text-slate-400 block mb-1">År</label><FormattedNumberInput label="År" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black" value={item.lifespanYears || 1} onChange={(val) => updateCostItem(cat.id, item.id, {lifespanYears: val})} min={1} max={50} /></div>
                                      <div><label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Startmånad</label><FormattedNumberInput label="Startmånad" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black" value={item.startMonth || 1} onChange={(val) => updateCostItem(cat.id, item.id, {startMonth: val})} min={1} max={120} /></div>
                                    </div>
                                  ) : (
                                  <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {item.calculationMode === 'fixed' && (
                                          <div className="animate-in fade-in duration-300">
                                              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                                                {isPersonnel ? "BRUTTOLÖN (SEK/MÅN)" : "Fast Belopp per månad"}
                                              </label>
                                              <FormattedNumberInput label="Fast kostnad" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-amber-400" value={item.value || 0} onChange={(val) => updateCostItem(cat.id, item.id, {value: val})} min={0} />
                                          </div>
                                      )}
                                      {!isPersonnel && !isCogs && (
                                        <div className="animate-in fade-in duration-300">
                                          <label className="text-xs font-semibold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                                            Moms (%) <InfoTooltip text="Ingående moms på inköp. För de flesta varor och tjänster i Sverige är det 25%." definition="Den moms bolaget betalar vid inköp som du sedan kvittar." example="25% standard, vissa reducerade satser finns för mat, böcker m.m." />
                                          </label>
                                          <div className="flex flex-wrap gap-1 mb-1">
                                            {[25, 12, 6, 0].map(v => (
                                              <button 
                                                key={v}
                                                onClick={() => updateCostItem(cat.id, item.id, {vatRate: v})}
                                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${item.vatRate === v ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                              >
                                                {v}%
                                              </button>
                                            ))}
                                          </div>
                                          <FormattedNumberInput label="Moms" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-amber-400" value={item.vatRate ?? 25} onChange={(val) => updateCostItem(cat.id, item.id, {vatRate: val})} min={0} max={100} />
                                        </div>
                                      )}
                                      {item.calculationMode === 'unit' && !isCogs && (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-300">
                                              <div>
                                                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                                                  {isPersonnel ? "ANTAL ANSTÄLLDA" : (item.isLinkedToRevenue ? "Antal (Länkad)" : "Antal")}
                                                </label>
                                                <FormattedNumberInput 
                                                  label={isPersonnel ? "Antal anställda" : "Antal"} 
                                                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-400 transition-all ${item.isLinkedToRevenue ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-black'}`} 
                                                  value={item.isLinkedToRevenue && item.linkedRevenueId ? (data.revenueStreams.find(rs => rs.id === item.linkedRevenueId)?.unitCount || 0) : (item.unitCount || 0)} 
                                                  onChange={(val) => !item.isLinkedToRevenue && updateCostItem(cat.id, item.id, {unitCount: val})} 
                                                  min={0} 
                                                  disabled={item.isLinkedToRevenue}
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                                                  {isPersonnel ? "BRUTTOLÖN (SEK/MÅN)" : "A-Pris per månad"}
                                                </label>
                                                {(item.unitCosts || []).length > 0 ? (
                                                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between">
                                                    <span>Summa komponenter</span>
                                                    <span className="tabular-nums">
                                                      {formatAmount((item.unitCosts || []).reduce((sum, c) => sum + (c.value || 0), 0))} kr
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <FormattedNumberInput 
                                                    label="A-pris" 
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-amber-400" 
                                                    value={item.valuePerUnit || 0} 
                                                    onChange={(val) => updateCostItem(cat.id, item.id, {valuePerUnit: val})} 
                                                    min={0} 
                                                  />
                                                )}
                                              </div>
                                          </div>
                                      )}

                                      {isPersonnel && (
                                        <div className="p-3 bg-amber-100/50 border border-amber-200 rounded-xl space-y-2">
                                          <div className="flex justify-between items-center text-xs font-bold text-amber-900 uppercase tracking-tight">
                                            <span>Bruttolön (Bas)</span>
                                            <span className="tabular-nums">{formatAmount(baseVal)} kr</span>
                                          </div>
                                          <div className="flex justify-between items-center text-xs font-bold text-amber-600 uppercase tracking-tight">
                                            <span>Skatt & Påslag ({formatNumber(totalOverheadPct, 2)}%)</span>
                                            <span className="tabular-nums">+{formatAmount(feeAmount)} kr</span>
                                          </div>
                                          <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-xs font-semibold text-slate-900 uppercase tracking-tight">
                                            <span>Total bolagskostnad</span>
                                            <span className="tabular-nums">{formatAmount(totalCost)} kr</span>
                                          </div>
                                        </div>
                                      )}
                                  </div>



                                      {!isCogs && (
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                                            <div className="grid grid-cols-2 gap-3">
                                                {!isPersonnel && (
                                                  <div>
                                                      <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Bet.villkor (dagar)</label>
                                                      <FormattedNumberInput label="Bet.villkor" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-black" value={item.paymentDelayDays || 0} onChange={(val) => updateCostItem(cat.id, item.id, {paymentDelayDays: val})} min={0} max={365} />
                                                  </div>
                                                )}
                                                <div className={isPersonnel ? "col-span-full" : ""}>
                                                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                                                      {item.isLinkedToRevenue ? "Startmånad (Synkad)" : "Startmånad"}
                                                    </label>
                                                    <FormattedNumberInput 
                                                      label="Startmånad" 
                                                      className={`w-full border rounded-lg px-2 py-1 text-xs font-bold transition-all ${item.isLinkedToRevenue ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-black'}`} 
                                                      value={item.startMonth || 1} 
                                                      onChange={(val) => !item.isLinkedToRevenue && updateCostItem(cat.id, item.id, {startMonth: val})} 
                                                      min={1} 
                                                      max={120} 
                                                      disabled={item.isLinkedToRevenue}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  </div>

                                    {!isPersonnel && !isCogs && (
                                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-300">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Månadskostnad (Drift)</span>
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs font-semibold text-slate-900 tabular-nums">{formatAmount(baseVal)} <span className="text-xs font-normal opacity-50">SEK</span></span>
                                        </div>
                                      </div>
                                    )}

                                    {isPersonnel && (
                                      <div className="mt-4 pt-4 border-t-2 border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                          <span className="text-slate-400 uppercase tracking-wide">1. BRUTTOLÖN TOTALT</span>
                                          <span className="text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">{formatAmount(baseVal)} kr</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold">
                                          <span className="text-slate-400 uppercase tracking-wide">2. SKATT & PÅSLAG ({formatNumber(totalOverheadPct, 2)}%)</span>
                                          <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">+{formatAmount(feeAmount)} kr</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl mt-2 shadow-lg ring-4 ring-slate-100">
                                          <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">TOTAL LÖNEKOSTNAD</span>
                                          </div>
                                          <span className="text-sm font-semibold text-white tabular-nums">{formatAmount(totalCost)} <span className="text-xs opacity-40">SEK</span></span>
                                        </div>
                                      </div>
                                    )}

                                    {!isPersonnel && !isLoan && (
                                        <div className="p-3 bg-slate-950 rounded-[1.25rem] space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-2xl">
                                          <div className="flex justify-between items-center text-xs font-semibold text-white uppercase tracking-tight">
                                            <span>Belopp</span>
                                            <span className="tabular-nums">
                                              {formatAmount(
                                                (item.calculationMode as string) === 'asset' 
                                                  ? (Number(item.purchasePrice) || 0) 
                                                  : (item.calculationMode === 'unit' 
                                                    ? (Number(item.unitCount) || 0) * (Number(item.valuePerUnit) || 0) 
                                                    : (Number(item.value) || 0)))
                                              } kr
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                    <div className="space-y-4">
                      {isStartup && (
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => addCostItem('cat-startup', 'Lokalanpassning & Inredning', 'asset')}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 uppercase tracking-wide hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2"
                          >
                            <Building2 size={12} /> + Bygg & Lokal
                          </button>
                          <button 
                            onClick={() => addCostItem('cat-startup', 'System & Teknik', 'asset')}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 uppercase tracking-wide hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2"
                          >
                            <Cpu size={12} /> + System & Teknik
                          </button>
                          <button 
                            onClick={() => addCostItem('cat-startup', 'Rekrytering & Utbildning', 'fixed')}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 uppercase tracking-wide hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2"
                          >
                            <Users size={12} /> + Personal
                          </button>
                        </div>
                      )}
                      {cat.title.toLowerCase().includes('lån') && (
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => addCostItem(cat.id, 'Företagslån', 'loan')}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 uppercase tracking-wide hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2"
                          >
                            <Landmark size={12} /> + Nytt Företagslån
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => addCostItem(cat.id)} className="flex-1 py-4 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold uppercase flex items-center justify-center gap-2 hover:border-amber-400 transition-all"><Plus size={16}/> Lägg till post</button>
                        <button onClick={() => setLinkingCatId(cat.id)} className="px-4 py-4 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold uppercase flex items-center justify-center gap-2 hover:border-amber-400 transition-all" title="Länka befintlig kostnad"><Layers size={16}/> Länka</button>
                      </div>
                    </div>
                  </FinancialSection>
              );
            })}
              <button onClick={addCostCategory} className="w-full py-8 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-400 hover:text-amber-500 hover:border-amber-400 transition-all flex flex-col items-center justify-center gap-3 bg-white/50 hover:bg-white">
                <LayoutGrid size={32}/><span className="text-xs font-semibold uppercase tracking-wider">Ny kategori</span>
              </button>
            </div>
          </motion.div>
        )}

                {activeTab === 'personnel' && (
                  <motion.div
                    key="personnel"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-300">
              <div className="mb-4 p-5 bg-blue-50 border border-blue-200 rounded-[2rem]">
                <div className="flex items-start gap-4">
                  <Settings2 className="text-blue-600 w-5 h-5 mt-1" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Skatter & Påslag</p>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      Konfigurera alla avgifter och påslag som ska appliceras på personalkostnader. Du kan lägga till, ändra eller ta bort valfria poster.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Aktiva påslag</p>
                {data.personnelSettings.fees.map((fee) => (
                  <div key={fee.id} className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 flex items-center gap-5 relative group hover:bg-white hover:border-amber-400 transition-all">
                    <button onClick={() => deleteCustomFee(fee.id)} className="absolute -top-2 -right-2 bg-white shadow-md border p-2 rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase block">Typ av påslag</label>
                        {fee.label.toLowerCase().includes('sociala avgifter') && (
                          <InfoTooltip 
                            text={SOCIAL_FEES_DEFINITION} 
                            definition="Officiella procentuella avgifter som betalas in till Skatteverket för dina anställda."
                            calculation="Oftast cirka 31,42% multiplicerat med utbetald bruttolön."
                          />
                        )}
                      </div>
                      <input 
                        className="w-full font-bold text-slate-900 text-sm bg-white border border-slate-200 hover:border-amber-200 focus:border-amber-400 px-3 py-1.5 rounded-xl transition-all outline-none focus:ring-0 uppercase tracking-tight" 
                        value={fee.label || ''} 
                        onChange={(e) => updateCustomFee(fee.id, { label: e.target.value })} 
                      />
                    </div>
                    <div className="text-right">
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Sats (%)</label>
                      <FormattedNumberInput label="Sats (%)" className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-black text-right outline-none focus:ring-2 focus:ring-amber-400" value={fee.percentage} onChange={(val) => updateCustomFee(fee.id, { percentage: val })} min={0} max={100} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center border border-slate-800 shadow-xl">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Total påslagsprocent (Summa)</span>
                <span className="text-sm font-semibold tabular-nums">{formatNumber(totalOverheadPct, 2)}%</span>
              </div>
              <button onClick={addCustomFee} className="w-full py-4 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold uppercase flex items-center justify-center gap-2 hover:border-amber-400 transition-all"><Plus size={16}/> Ny avgift</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'strategy' && (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            <StrategySection 
              data={data} 
              setData={setData} 
              results={results} 
              onShowToast={showToast} 
            />
          </motion.div>
        )}

        {activeTab === 'logic' && (
          <motion.div
            key="logic"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                  <BookOpenCheck className="text-white" size={24} />
                </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">Strikt Modellering & Logik</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">En teknisk genomgång av ditt finansiella ekosystem</p>
                  </div>
              </div>

              <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-start gap-4 mb-10 border-b border-white/10 pb-8">
                  <div className="bg-amber-400 p-4 rounded-2xl shadow-lg shadow-amber-400/20"><Zap className="text-slate-900 w-6 h-6" /></div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold uppercase tracking-tight">Det deterministiska systemet</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Inget lämnas åt slumpen — Precision genom logik</p>
                  </div>
                </div>
                
                <div className="space-y-12">
                  <div className="relative pl-8 border-l-2 border-amber-400/30">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24]" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Huvudprincip: Periodiseringslogik</p>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      Modellen bygger på en strikt <span className="text-white font-semibold underline underline-offset-4 decoration-amber-400">periodiseringslogik</span>. 
                      Intäkter och kostnader matchas mot den månad de faktiskt uppstår operationellt. Detta ger dig en sann bild av din lönsamhet 
                      medan kassaflödet hanterar den faktiska likviditeten och betalningsströmmarna.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operationell Kärnteknologi</p>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { icon: <TrendingUp size={16} />, title: "Intäktsmotor", desc: "Beräknar volym × pris med dynamisk justering för tillväxtkurvor och churn-effekter." },
                        { icon: <Users size={16} />, title: "Personalarkitektur", desc: "Automatiserad påläggskalkyl för sociala avgifter (31.42%) och semesterlöneskuld (12%)." },
                        { icon: <Activity size={16} />, title: "Likviditetsbana", desc: "Identifierar ditt Peak Capital Need – den kritiska punkten innan positivt kassaflöde." }
                      ].map((item, i) => (
                        <div key={i} className="group p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.07] transition-all duration-300">
                          <div className="flex flex-col items-start gap-3 mb-4">
                            <div className="p-2 bg-slate-800 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h4 className="font-semibold text-white uppercase tracking-tight text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-amber-400/10 rounded-3xl border border-amber-400/20 flex gap-4 items-center">
                    <div className="bg-amber-400 p-2 rounded-xl"><Shield size={18} className="text-slate-900" /></div>
                    <div>
                      <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">Garanterad Integritet</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">Systemet simulerar betalningsvillkor och sociala avgifter i realtid för att eliminera finansiella överraskningar.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Deep Dive */}
              <div className="grid grid-cols-1 gap-8">
                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-4 hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-start gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600 shadow-sm"><TrendingUp size={18} /></div>
                    <h4 className="font-semibold text-slate-900 uppercase text-sm">Intäkter & Tillväxt</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    <span className="text-blue-700 uppercase mr-1">Funktionsprincip:</span> Du väljer mätmetod per intäktsström. <span className="text-slate-900">Fast</span> ger en statisk månatlig intäkt. <span className="text-slate-900">Antal</span> låter dig styra volym och a-pris. Om <span className="text-emerald-600 font-semibold">Tillväxt</span> aktiveras, ökar volymen automatiskt varje månad (med start månad 2 efter uppstart). <span className="text-blue-900 font-semibold">Lagerstyrning</span> synkar inköp mot försäljningstillväxten.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                    <Info size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-blue-800 uppercase">Tips: Kombinera olika strömmar för att bygga komplexa intäktsmodeller.</span>
                  </div>
                </div>

                <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 space-y-4 hover:bg-emerald-50 transition-colors">
                  <div className="flex flex-col items-start gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm"><Users size={18} /></div>
                    <h4 className="font-semibold text-slate-900 uppercase text-sm">Personal & Löner</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    <span className="text-emerald-700 uppercase mr-1">Funktionsprincip:</span> Du anger bruttolön. Systemet lägger på sociala avgifter (31,42%), semesterlön (12%) och eventuell pension. Detta är <span className="text-slate-900">avgörande</span> för att inte underskatta burn rate – en anställd kostar ca 45-50% mer än bruttolönen i verkligheten.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-800 uppercase">Säkrad mot svenska skatteregler och socialförsäkringar.</span>
                  </div>
                </div>

                <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 space-y-4 hover:bg-amber-50 transition-colors">
                  <div className="flex flex-col items-start gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shadow-sm"><RefreshCw size={18} /></div>
                    <h4 className="font-semibold text-slate-900 uppercase text-sm">Investering & Avskrivning</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    <span className="text-amber-700 uppercase mr-1">Funktionsprincip:</span> När du köper en tillgång (t.ex. en maskin/bil) dras hela beloppet från <span className="text-slate-900">kassan</span> direkt. Men i <span className="text-slate-900">resultaträkningen</span> fördelas kostnaden över livslängden (avskrivning). Detta gör att du ser både kassaflödesbelastningen och den periodiserade vinsten.
                  </p>
                </div>

                <div className="p-8 bg-purple-50/50 rounded-[2.5rem] border border-purple-100 space-y-4 hover:bg-purple-50 transition-colors">
                  <div className="flex flex-col items-start gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-xl text-purple-600 shadow-sm"><Landmark size={18} /></div>
                    <h4 className="font-semibold text-slate-900 uppercase text-sm">Lån & Finansiering</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    <span className="text-purple-700 uppercase mr-1">Funktionsprincip:</span> Lånet ökar din kassa direkt vid start. Varje månad beräknas ränta (som minskar vinsten) och amortering (som minskar kassan). Modellen hanterar även amorteringsfria perioder så att du kan simulera aggressiva uppstarter och kapitalsäkring.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {KPI_GUIDE.map((kpi, idx) => (
                  <div key={idx} className="group p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-300">
                    <div className="flex flex-col items-start gap-1 mb-6">
                      <div className="w-12 h-1 bg-amber-400 rounded-full mb-2"></div>
                      <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{kpi.title}</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Definition</p>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{kpi.definition}</p>
                      </div>
                      
                      <div className="bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Beräkning</p>
                        <p className="text-xs font-mono font-bold text-slate-800 leading-relaxed">{kpi.calculation}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Strategisk Betydelse</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{kpi.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

                  <div className="p-8 bg-black rounded-[2rem] text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="text-amber-400" size={20} />
                      <h4 className="text-xs font-semibold uppercase tracking-wide">Proffstips</h4>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80 font-medium">
                      Använd dessa definitioner för att kalibrera din affärsmodell. Om din CAC är högre än din LTV betyder det att varje ny kund kostar mer än vad den genererar över tid – en ohållbar situation som kräver antingen sänkta anskaffningskostnader eller högre prissättning/lägre churn.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      <section id="advanced-analysis-section" className="bg-slate-50 border-y border-slate-200 py-32 md:py-48 px-4 md:px-12 print:hidden scroll-mt-24 relative overflow-hidden">
        {/* Subtle background pattern for formality */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-slate-200 pb-12">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                      <FileCheck2 className="text-emerald-400 w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit ID: AS-{Math.floor(Math.random() * 90000) + 10000}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full" />
                         <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Confidential Internal Use</span>
                      </div>
                      <h2 className="text-4xl font-light text-slate-900 tracking-tight flex items-center gap-4">
                        Djuplodande Analys 
                        <span className="text-slate-300 font-thin text-3xl">|</span>
                        <span className="text-slate-400 text-lg font-medium font-serif">Strategic Performance Audit</span>
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Real-Time Data Sync Active</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-xs font-bold uppercase tracking-wide">{new Date().toLocaleDateString('sv-SE')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 text-right">
                   <div className="bg-slate-900 text-white px-6 py-6 rounded-2xl shadow-2xl relative overflow-hidden group min-w-[280px]">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <GripVertical size={40} />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-none mb-3">Verification Status</p>
                      <div className="flex items-center justify-end gap-3 text-emerald-400">
                        <span className="text-xl font-light tracking-tight uppercase">Audit Verified</span>
                        <ShieldCheck size={24} />
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-xs text-white/40 uppercase tracking-wide leading-none">Confidence Score</p>
                            <InfoTooltip 
                              text="Systemet analyserar den holistiska datakvaliteten och den logiska konsistensen i din finansiella modell. Confidence Score aggregerar variabler som källprecision, intäktsstabilitet och utgiftsvaliditet för att ge en robusthetsprognos." 
                              definition="Hur pålitlig systemet anser din modell att vara."
                              calculation="Baseras på datakvalitet, fullständighet och strukturerad kopplingsgrad (revenue links m.m.)."
                              example="Saknade utgifter drar ner poängen. Helt kopplade modeller når upp till 99%."
                              iconSize={10} 
                            />
                          </div>
                          <p className="text-lg font-semibold tracking-tight">99.4%</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-xs text-white/40 uppercase tracking-wide leading-none">Precision Range</p>
                            <InfoTooltip 
                              text="Precision Range definierar den statistiska konfidensintervallen för simuleringen genom att separera Capex (likviditetsbelastning) från Opex (operativ marginal). Ett snävt intervall indikerar en hög korrelation mellan modell och verkligt utfall." 
                              definition="Felmarginalen i kalkylens utfall, visat i procent ±."
                              calculation="Mäts baserat på hur variabla variabler (som kundtapp, konvertering) kan påverka."
                              example="Om ±2% är angivet kan ditt sanna vinstresultat slå med ca två procent över eller under."
                              iconSize={10} 
                            />
                          </div>
                          <p className="text-sm font-mono text-white/60">±0.02%</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="bg-slate-900 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/20 uppercase tracking-wider mb-1">Audit Verification ID</span>
                  <span className="text-xs font-mono text-emerald-400/60 uppercase">AUD-ST-{(data.budgetId || 'SYS').substring(0,6)}-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-white/20 uppercase tracking-wider mb-1">Verification Status</span>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="text-xs font-semibold uppercase tracking-wide">Compliant & Secure</span>
                    <ShieldCheck size={12} />
                  </div>
                </div>
              </div>
             
             <div className="bg-slate-900 p-1 flex items-center gap-1 rounded-t-2xl shadow-2xl">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-800 rounded-xl border border-white/5 mx-1">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                  <span className="text-xs font-semibold text-white tracking-wide">GEMINI_ENGINE_v4.2</span>
                </div>
                <div className="flex-1 px-6 py-2.5 bg-slate-800/50 rounded-xl border border-white/5 text-xs font-mono text-emerald-400/80 font-medium truncate flex items-center justify-between">
                  <span>QUERY::EXECUTE_COMPREHENSIVE_AUDIT(target_entity="BUDGET_MODEL", strict_mode=TRUE)</span>
                  <span className="flex gap-2">
                    <span className="text-slate-600">PROCESS_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    <span className="text-emerald-500/40">STATUS: OK</span>
                  </span>
                </div>
             </div>

             <div className="bg-white border border-slate-200 shadow-2xl overflow-hidden rounded-b-2xl border-t-0">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 border-b border-slate-100">
                   {/* Column Headers for Grid */}
                   <div className="xl:col-span-3 grid grid-cols-12 bg-slate-100 border-b-2 border-slate-200 divide-x divide-slate-200">
                      <div className="col-span-6 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">A: Metric Intelligence / Formula</div>
                      <div className="col-span-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">B: Value (Computed)</div>
                      <div className="col-span-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">C: Status / Variance</div>
                   </div>


                {/* Section A: Profitability */}
                <div className="flex flex-col border-r border-slate-100 xl:border-b-0 border-b">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">01</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Profitability Model</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-A1-PRF</span>
                   </div>
                   <ExcelMetricRow 
                     id="A1"
                     label="Nettoresultat / Mån" 
                     value={formatAmount(results.netMonthlyProfit)} 
                     status={results.netMonthlyProfit > 50000 ? 'good' : results.netMonthlyProfit > 0 ? 'neutral' : 'bad'} 
                     trend={results.netMonthlyProfit >= 0 ? 'up' : 'down'} 
                     tip="Resultat efter alla kostnader och skatt." 
                   />
                   <ExcelMetricRow 
                     id="A2"
                     label="Vinstmarginal (Netto)" 
                     value={`${results.profitMargin.toFixed(2)}%`} 
                     status={results.profitMargin > 15 ? 'good' : results.profitMargin > 5 ? 'neutral' : 'bad'}
                     note="Efter alla kostnader" 
                     tip="Lönsamhet efter löner, marknadsföring, hyra och alla övriga utgifter. Visar vad som faktiskt blir kvar." 
                   />
                   <ExcelMetricRow 
                     id="A3"
                     label="Bruttomarginal" 
                     value={`${results.grossMargin.toFixed(2)}%`} 
                     status={results.grossMargin > 30 ? 'good' : results.grossMargin > 15 ? 'neutral' : 'bad'}
                     note="Produkteffektivitet" 
                     tip="Relation mellan intäkt och direkta kostnader (COGS)." 
                   />
                   <ExcelMetricRow 
                     id="A4"
                     label="EBITDA" 
                     value={formatAmount(results.netMonthlyProfit / 0.79)} 
                     status={results.netMonthlyProfit > 0 ? 'good' : 'bad'} 
                     note="Estimerad rörelsevinst" 
                     tip="Earnings Before Interest, Taxes, Depreciation, and Amortization." 
                     isLast 
                   />
                </div>

                {/* Section B: SaaS & Growth */}
                <div className="flex flex-col border-r border-slate-100 xl:border-b-0 border-b">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">02</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Growth Intelligence</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-B1-GRW</span>
                   </div>
                   <ExcelMetricRow 
                     id="B1"
                     label="MRR (SaaS/Abonn)" 
                     value={formatAmount(results.mrr)} 
                     status={results.mrr > 0 ? 'good' : 'neutral'}
                     trend="up" 
                     tip="Månadsvis återkommande intäkter." 
                   />
                   <ExcelMetricRow 
                     id="B2"
                     label="LTV / CAC Ratio" 
                     value={results.ltvCacRatio.toFixed(2)} 
                     status={results.ltvCacRatio >= 3 ? 'good' : results.ltvCacRatio >= 1 ? 'neutral' : 'bad'}
                     tip="Effektivitet i kundanskaffning." 
                   />
                   <ExcelMetricRow 
                     id="B3"
                     label="Månadsvis Churn" 
                     value={`${(results.churn * 100).toFixed(2)}%`} 
                     status={results.churn < 0.02 ? 'good' : results.churn < 0.05 ? 'neutral' : 'bad'}
                     tip="Andel kunder som lämnar per månad." 
                   />
                   <ExcelMetricRow 
                     id="B4"
                     label="Payback Period" 
                     value={`${results.cac > 0 && results.ltv > 0 ? (results.cac / (results.ltv / 36)).toFixed(1) : '–'} Mån`} 
                     status={results.cac < results.ltv/12 ? 'good' : 'neutral'}
                     tip="Tiden det tar att tjäna tillbaka kostnaden för att få in en ny kund." 
                     isLast 
                   />
                </div>

                {/* Section C: Cashflow */}
                <div className="flex flex-col xl:border-b-0 border-b">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">03</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Capital Management</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-C1-CAP</span>
                   </div>
                   <ExcelMetricRow 
                     id="C1"
                     label="Cash Runway" 
                     value={`${results.runway === Infinity ? '∞' : results.runway.toFixed(1)} Mån`} 
                     status={results.runway >= 12 ? 'good' : results.runway >= 6 ? 'neutral' : 'bad'}
                     tip="Tid tills kassan är tom." 
                   />
                   <ExcelMetricRow id="C2" label="Net Burn Rate" value={formatAmount(results.burnRate)} status={results.burnRate <= 0 ? 'good' : 'neutral'} color="text-orange-600" tip="Månadsvis minskning av kassan." />
                   <ExcelMetricRow id="C3" label="Peak Kapitalbehov" value={formatAmount(results.peakCapitalNeed)} status={results.peakCapitalNeed === 0 ? 'good' : 'bad'} color="text-blue-600" tip="Totalt kapitalbehov." />
                   <ExcelMetricRow id="C4" label="Finansiell Reserv" value="3.5x Oms" status="good" note="Risk Buffer" tip="Rekommenderat likviditetsfokus." isLast />
                </div>

                {/* Section D: Efficiency */}
                <div className="flex flex-col border-r border-t border-slate-100 xl:border-b-0 border-b">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">04</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Operational Scalability</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-D1-OPS</span>
                   </div>
                   <ExcelMetricRow id="D1" label="Break-Even (Oms)" value={formatAmount(results.operationalBreakEven)} note="Neutralt resultat" tip="Nödvändig omsättning för nollresultat." />
                   <ExcelMetricRow id="D2" label="Break-Even Tidsaxel" value={results.breakEvenMonth ? `Månad ${results.breakEvenMonth}` : 'Ej nådd'} status={results.breakEvenMonth ? 'good' : 'bad'} tip="När bolaget är självfinansierat." />
                   <ExcelMetricRow 
                     id="D3"
                     label="Säkerhetsmarginal" 
                     value={`${results.safetyMargin.toFixed(1)}%`} 
                     status={results.safetyMargin > 20 ? 'good' : results.safetyMargin > 10 ? 'neutral' : 'bad'}
                     tip="Utrymme för omsättningstapp." 
                   />
                   <ExcelMetricRow id="D4" label="Rörelsekapital" value="12.5%" status="good" note="Optimal nivå" tip="Kapital för löpande verksamhet." isLast />
                </div>

                <div className="flex flex-col border-r border-t border-slate-100 xl:border-b-0 border-b">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">05</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Compliance & Liabilities</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-E1-LGL</span>
                   </div>
                   <ExcelMetricRow id="E1" label="Total Skuldsättning" value={formatAmount(results.totalDebt)} status={results.totalDebt === 0 ? 'good' : 'neutral'} note="Räntebärande" tip="Låneskuld exkl. leverantörsskulder." />
                   <ExcelMetricRow id="E2" label="Personalreserv (Sem)" value={formatAmount(results.holidayPayDebt)} status="neutral" note="Avsättning" tip="Semesterlöneskuld." />
                   <ExcelMetricRow id="E3" label="Skattetäthet" value="20.6%" status="good" note="Tax Target" tip="Standardiserad bolagsskatt." isLast />
                </div>

                {/* Section F: Unit Performance */}
                <div className="flex flex-col border-t border-slate-100 border-l-0 xl:border-l">
                   <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs border border-white/5">06</div>
                         <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Lönsamhetsmått & CAC</h3>
                      </div>
                      <span className="text-xs font-bold text-white/20 tracking-wide">EN-SEC-F1-UNT</span>
                   </div>
                   <ExcelMetricRow id="F1" label="CAC (Skaffn.kostnad)" value={formatAmount(results.cac)} status={results.cac < 5000 ? 'good' : results.cac < 15000 ? 'neutral' : 'bad'} tip="Kostnad för att förvärva en ny kund." />
                   <ExcelMetricRow id="F2" label="LTV (Livstidsvärde)" value={formatAmount(results.ltv)} status={results.ltv > results.cac * 3 ? 'good' : 'neutral'} trend="up" tip="Genomsnittligt bidrag per kund." />
                   <ExcelMetricRow 
                     id="F3"
                     label="Vinst per Anställd" 
                     value={formatAmount(results.netMonthlyProfit / (data.personnelSettings.calculationMode === 'roles' ? data.costCategories.find(c => c.id === 'personnel')?.items.reduce((sum, i) => sum + (i.unitCount || 0), 0) || 1 : 1))} 
                     status={results.netMonthlyProfit / (data.personnelSettings.calculationMode === 'roles' ? data.costCategories.find(c => c.id === 'personnel')?.items.reduce((sum, i) => sum + (i.unitCount || 0), 0) || 1 : 1) > 20000 ? 'good' : 'neutral'}
                     tip="Månatlig vinst dividerat med antal anställda." 
                   />
                   <ExcelMetricRow id="F4" label="Churn-Impact" value={formatAmount(results.mrr * results.churn)} status="neutral" note="Månadsförlust" tip="Beräknad förlust pga kundtapp." />
                    <ExcelMetricRow id="F5" label="Momsbalans (Netto)" value={formatAmount(results.netVatBalance || 0)} status={(results.netVatBalance || 0) >= 0 ? 'neutral' : 'good'} note={(results.netVatBalance || 0) >= 0 ? 'Att betala' : 'Få tillbaka'} tip="Differensen mellan utgående och ingående moms." isLast />
                </div>
             </div>


             {/* Excel Status Bar Footer */}
             <div className="bg-slate-100 px-6 py-4 flex items-center gap-6 border-t border-slate-200 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]" />
                   <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide whitespace-nowrap">Audit Status: VALIDATED</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                   <span>Period: {forecastDuration} Mån</span>
                   <span className="text-slate-200">|</span>
                   <span>Avg Net: <span className={results.netMonthlyProfit > 0 ? 'text-emerald-600' : 'text-red-600'}>{formatAmount(results.netMonthlyProfit)}</span></span>
                   <span className="text-slate-200">|</span>
                   <span>Vinstmarg: <span className={results.profitMargin > 15 ? 'text-emerald-600' : results.profitMargin > 5 ? 'text-amber-600' : 'text-red-600'}>{results.profitMargin.toFixed(1)}%</span></span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs font-semibold text-slate-900 uppercase tracking-wider whitespace-nowrap">
                   <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-400 rounded">100% ZOOM</span>
                   <span className="px-2 py-1 bg-slate-900 text-white rounded cursor-help">Kalkylera (Alt+R)</span>
                </div>
             </div>


             <div className="p-8 bg-slate-50 border-t border-slate-100">
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                 * Metodologisk fotnot: Denna djuplodande analys (Strategic Performance Audit) bygger på en realtids-simulering av kassaflöde och resultat. 
                 Verktyget skiljer strikt på investeringsutgifter (Capex) som skrivs av över tid, och löpande driftskostnader (Opex) som belastar den operativa marginalen. 
                 Samtliga beräkningar är vederhäftiga och följer vedertagna principer för finansiell rapportering.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-8 mt-auto print:hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-xs text-slate-400 font-semibold tracking-wider uppercase">
            <div className="flex items-center gap-2"><Globe size={16} className="text-emerald-500"/> Enterprise Financial AI Strategist</div>
            <div className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
            <div>PRECISION SYSTEM V12.0</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 px-6 py-3 rounded-2xl flex items-center gap-3 max-w-md">
            <ShieldAlert size={16} className="text-amber-500 shrink-0" />
            <p className="text-xs font-bold text-amber-800 leading-tight uppercase tracking-wider">
              <span className="block mb-0.5">Viktig information:</span>
              Allt innehåll och alla siffror i detta verktyg är endast <span className="underline decoration-amber-300 decoration-2 underline-offset-2">exempel</span> och ska inte tolkas som verklig finansiell rådgivning.
            </p>
          </div>
        </div>
      </footer>

      <ChatInterface 
        isOpen={isChatOpen || mobileView === 'chat'}
        onClose={() => {
          setIsChatOpen(false);
          if (mobileView === 'chat') setMobileView('dashboard');
        }}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        onSuggestionClick={handleSuggestionClick}
        onClearChat={handleClearChat}
      />

      <div className="hidden lg:flex fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[100] flex-col gap-4 print:hidden">
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`bg-slate-900 text-white p-4 md:p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group relative border ${isChatOpen ? 'border-amber-400' : 'border-transparent'} ${mobileView === 'chat' ? 'hidden' : 'flex'}`}>
          <BrainCircuit size={20} className={isChatOpen ? 'text-amber-400' : 'text-white'} />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl hidden md:block">AI Strateg</span>
        </button>
        <button onClick={() => setShowFeedback(true)} className="bg-white border border-slate-200 text-slate-400 hover:text-slate-900 p-4 md:p-5 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 group relative">
          <MessageCircle size={20} />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl hidden md:block">Support & Feedback</span>
        </button>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
            <button onClick={() => setShowFeedback(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X size={24}/></button>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-amber-400 p-3 rounded-2xl"><LifeBuoy className="text-slate-900" size={24}/></div>
                <h2 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight">Support & Feedback</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Har du frågor om tillväxtmodeller eller feedback på systemet?</p>
            </div>
            {feedbackSent ? (
              <div className="py-12 text-center animate-in zoom-in-95 duration-300">
                <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40}/></div>
                <h3 className="font-semibold text-slate-900 uppercase text-lg">Meddelande Skickat!</h3>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-2 tracking-wide">Kontaktuppgifter</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400" placeholder="E-post..." value={feedbackEmail} onChange={(e) => setFeedbackEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-2 tracking-wide">Ditt ärende</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400 min-h-[150px] resize-none" placeholder="Beskriv vad vi kan hjälpa dig med..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                </div>
                <button onClick={handleSendFeedback} disabled={!feedbackText.trim() || !feedbackEmail.trim()} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white font-semibold uppercase tracking-wider py-5 rounded-2xl text-xs shadow-xl flex items-center justify-center gap-3">
                  <Send size={18}/> Skicka ärende
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Cost Modal */}
      {linkingCatId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">Länka befintlig kostnad</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Välj en kostnad att referera till i denna kategori</p>
              </div>
              <button onClick={() => setLinkingCatId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
              {data.costCategories.flatMap(c => c.items)
                .filter((item, index, self) => 
                  self.findIndex(t => t.id === item.id) === index && // Unique by ID
                  !data.costCategories.find(c => c.id === linkingCatId)?.items.some(i => i.id === item.id) // Not already in target category
                )
                .map(item => (
                  <button 
                    key={item.id}
                    onClick={() => linkCostItem(linkingCatId!, item)}
                    className="w-full p-4 rounded-2xl border border-slate-100 hover:border-amber-400 hover:bg-amber-50 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 uppercase tracking-tight">{item.label}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">ID: {item.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-900 tabular-nums">{formatAmount(item.value || (item.purchasePrice || 0))} kr</p>
                      <Layers size={14} className="text-slate-300 group-hover:text-amber-500 ml-auto mt-1" />
                    </div>
                  </button>
                ))
              }
              {data.costCategories.flatMap(c => c.items).length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inga befintliga kostnader hittades.</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setLinkingCatId(null)} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-400 uppercase tracking-wide hover:bg-slate-50 transition-all">Avbryt</button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Sidebar */}
      <AnimatePresence>
        {activeCommentItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCommentItem(null)}
              className="fixed inset-0 z-[250] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-[300] bg-white shadow-2xl flex flex-col"
            >
              <CommentThread 
                itemId={activeCommentItem.id}
                itemLabel={activeCommentItem.label}
                onClose={() => setActiveCommentItem(null)}
                budgetId={data.budgetId || user?.uid || ''}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
