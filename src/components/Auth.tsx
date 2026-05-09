import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  confirmPasswordReset,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Mail, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ShieldCheck, Zap, Globe, BrainCircuit, Database, Lock as LockIcon,
  Activity, Target, Sparkles, LayoutDashboard, BarChart3, PieChart, Users, Settings,
  TrendingUp, Layers, Cpu, Calculator, Coins, Percent, Calendar, Wand2, User as UserIcon,
  Briefcase, Mountain, Building2, FlaskConical, Rocket, Handshake, Globe2, Award, Diamond, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'landing' | 'login' | 'register' | 'forgot' | 'reset';

export const Auth: React.FC<{ onAuthSuccess: (user: FirebaseUser) => void }> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const code = urlParams.get('oobCode');
    if (modeParam === 'resetPassword' && code) {
      setMode('reset');
      setOobCode(code);
    }
  }, []);

  useEffect(() => {
    setError(null);
    setMessage(null);
    // Only clear sensitive fields when switching modes to avoid frustration but ensure security
    if (mode !== 'reset') {
      setPassword('');
      setConfirmPassword('');
    }
  }, [mode]);

  const validatePassword = (pass: string) => {
    const errors: string[] = [];
    if (pass.length < 8) errors.push('minst 8 tecken');
    if (!/[A-ZÅÄÖ]/.test(pass)) errors.push('en stor bokstav');
    if (!/[0-9]/.test(pass)) errors.push('en siffra');
    
    if (errors.length > 0) {
      return `Lösenordet saknar: ${errors.join(', ')}.`;
    }
    return null;
  };

  const getAuthErrorMessage = (err: any, code: string | null): string => {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Inloggningen misslyckades. Kontrollera dina uppgifter eller prova en annan inloggningsmetod.';
      case 'auth/account-exists-with-different-credential':
        return 'E-postadressen används redan med en annan inloggningsmetod (t.ex. Google). Prova att logga in med Google istället.';
      case 'auth/credential-already-in-use':
        return 'Dessa uppgifter används redan av ett annat konto.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Felaktig e-postadress eller lösenord.';
      case 'auth/email-already-in-use':
        return 'E-postadressen används redan.';
      case 'auth/weak-password':
        return 'Lösenordet är för svagt (minst 8 tecken, en stor bokstav, en siffra).';
      case 'auth/invalid-email':
        return 'E-postadressen har ett ogiltigt format.';
      case 'auth/too-many-requests':
        return 'För många försök. Kontot har tillfälligt låsts. Prova igen senare.';
      case 'auth/network-request-failed':
        return 'Nätverksfel. Kontrollera din anslutning.';
      case 'auth/popup-closed-by-user':
        return 'Inloggningsfönstret stängdes.';
      case 'auth/cancelled-popup-request':
        return ''; // Silent
      case 'auth/operation-not-allowed':
        return 'Denna inloggningsmetod är inte aktiverad.';
      default:
        if (err?.message === 'Lösenorden matchar inte.') return err.message;
        return 'Ett oväntat fel uppstod vid inloggningen. Prova igen senare.';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedPassword = password; // Passwords should not be trimmed usually
    const trimmedConfirm = confirmPassword;

    try {
      if (mode === 'login') {
        setLoading(true);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else if (mode === 'register') {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Ange både förnamn och efternamn.');
        }
        if (trimmedPassword !== trimmedConfirm) {
          throw new Error('Lösenorden matchar inte.');
        }
        
        const passError = validatePassword(trimmedPassword);
        if (passError) {
          throw new Error(passError);
        }

        setLoading(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName.trim()} ${lastName.trim()}`
        });
        onAuthSuccess(userCredential.user);
      } else if (mode === 'forgot') {
        setLoading(true);
        await sendPasswordResetEmail(auth, email);
        setMessage('Ett mejl för återställning har skickats till din e-postadress.');
      } else if (mode === 'reset' && oobCode) {
        if (trimmedPassword !== trimmedConfirm) {
          throw new Error('Lösenorden matchar inte.');
        }

        const passError = validatePassword(trimmedPassword);
        if (passError) {
          throw new Error(passError);
        }

        setLoading(true);
        await confirmPasswordReset(auth, oobCode, password);
        setMessage('Ditt lösenord har återställts. Du kan nu logga in.');
        setMode('login');
      }
    } catch (err: any) {
      setLoading(false);
      const errorCode = err?.code || 
                        (err?.message?.includes('auth/') ? err.message.match(/auth\/[a-z0-9-]+/)?.[0] : null) ||
                        (err?.name === 'FirebaseError' ? 'auth/invalid-credential' : null);
      
      const errorMsg = getAuthErrorMessage(err, errorCode);
      if (errorMsg) setError(errorMsg);
    } finally {
      // Re-evaluating finally block: we set loading false here if not already done
      // but if onAuthSuccess is called, we might not want to set loading false instantly
      // However, usually it's fine.
      if (mode !== 'login' && mode !== 'register') {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      onAuthSuccess(result.user);
    } catch (err: any) {
      const errorCode = err?.code || 
                        (err?.message?.includes('auth/') ? err.message.match(/auth\/[a-z0-9-]+/)?.[0] : null) ||
                        (err?.name === 'FirebaseError' ? 'auth/invalid-credential' : null);
      
      const errorMsg = getAuthErrorMessage(err, errorCode);
      if (errorMsg) setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-slate-200 overflow-x-hidden text-slate-900">
        {/* Navigation */}
        <nav className="p-6 md:px-12 flex justify-between items-center max-w-[1400px] mx-auto w-full bg-white z-[100]">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold tracking-wide">
              Linking
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMode('login')}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Logga in
            </button>
            <button 
              onClick={() => setMode('register')}
              className="hidden sm:inline-flex items-center justify-center text-sm font-medium text-white bg-slate-900 px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-all"
            >
              Kom igång
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center">
          
          <section className="px-6 pt-24 pb-20 md:pt-32 md:pb-32 max-w-4xl mx-auto text-center w-full">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-[5.5rem] font-semibold tracking-tight text-slate-900 mb-6 leading-[1.05]"
            >
              Se när din affär faktiskt <br className="hidden md:block" />
              börjar tjäna pengar.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            >
              Slipp trasiga Excelfiler. Vi hjälper dig att snabbt bygga en stabil ekonomisk plan – oavsett om du precis ska starta eller vill ta bolaget till nästa nivå.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <button 
                onClick={() => setMode('register')}
                className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
              >
                Kom igång gratis
              </button>
            </motion.div>
          </section>

          {/* Minimal App Preview */}
          <section className="w-full max-w-5xl mx-auto px-6 mb-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="rounded-xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200 bg-slate-50 aspect-[16/10] md:aspect-[21/9] flex flex-col"
            >
              <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
              <div className="flex-1 p-6 md:p-10 flex gap-6">
                <div className="hidden md:flex flex-col gap-4 w-1/4">
                  <div className="h-4 bg-slate-200 w-16 rounded mb-2" />
                  <div className="h-10 bg-white rounded-lg shadow-sm border border-slate-200" />
                  <div className="h-10 bg-white rounded-lg shadow-sm border border-slate-200" />
                  <div className="h-10 bg-white rounded-lg shadow-sm border border-slate-200" />
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex gap-4 h-24">
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
                      <div className="w-8 h-2 bg-slate-100 rounded" />
                      <div className="w-16 h-4 bg-slate-200 rounded" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
                      <div className="w-8 h-2 bg-slate-100 rounded" />
                      <div className="w-16 h-4 bg-slate-200 rounded" />
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-md">
                      <div className="w-8 h-2 bg-slate-700 rounded" />
                      <div className="w-16 h-4 bg-white rounded" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Features */}
          <section className="w-full py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <div className="mb-20">
                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Verktygen som hjälper din verksamhet framåt.</h3>
                <p className="text-slate-500 max-w-xl text-lg">Enkla och tydliga funktioner för att du ska kunna fokusera på att driva företag, inte räkna på formler.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-x-16 md:gap-y-24">
                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <Zap className="text-slate-900" size={18} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Testa direkt</h4>
                  <p className="text-slate-600 leading-relaxed">Ändra pris eller justera en kostnad, och se direkt vad som händer med din vinst på sikt. Allt uppdateras på skärmen i realtid, utan att du behöver klicka runt i kalkylblad.</p>
                </div>
                
                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <Calendar className="text-slate-900" size={18} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Se 5 år in i framtiden</h4>
                  <p className="text-slate-600 leading-relaxed">Få en glasklar bild av hur ditt företags kassa och försäljning ser ut de närmaste åren. Du vet precis när du har råd att anställa eller göra nya inköp.</p>
                </div>

                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <Target className="text-slate-900" size={18} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Full koll på marginalen</h4>
                  <p className="text-slate-600 leading-relaxed">Vissa saker säljer du mycket av, andra tjänar du mer på per styck. Systemet bryter ner exakt vilka delar av din verksamhet som faktiskt bidrar till vinsten.</p>
                </div>

                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <Layers className="text-slate-900" size={18} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Allt hänger ihop</h4>
                  <p className="text-slate-600 leading-relaxed">Mata in det du tror på – intäkter, materialkostnader och löner. Vi ser till att allt räknas ihop till en komplett helhet som håller när din plan prövas.</p>
                </div>
              </div>

              <div className="mt-32 max-w-3xl border-t border-slate-100 pt-16">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Kort sagt</p>
                <p className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900 leading-[1.3]">
                  Allt du behöver för att förstå, styra och växa ditt företag – på ett och samma ställe, utan krångligheter.
                </p>
              </div>
            </div>
          </section>

          {/* Value Prop Alternating / Trust */}
          <section className="w-full py-32 bg-slate-50 border-t border-slate-200/60">
            <div className="max-w-5xl mx-auto px-6">
               <div className="flex flex-col md:flex-row items-center gap-16">
                  <div className="flex-1">
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-900 mb-6">
                      Svara på bankens frågor innan de ens hinner ställa dem.
                    </h3>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                      När du söker lån eller pratar med investerare krävs ofta tydliga underlag som visar att du har koll på hur affären skalas upp.
                    </p>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Ladda hem proffsiga utskrifter och rapporter direkt från verktyget. Du får ett material som ser ut att vara framtaget av en erfaren ekonomichef.
                    </p>
                  </div>
                  <div className="flex-1 bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-sm w-full">
                    <div className="space-y-8">
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="text-slate-900 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">Tydliga rapporter</p>
                          <p className="text-slate-500 text-base mt-1">Exportera resultaträkning och kassaflöde direkt.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="text-slate-900 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">Hitta riskerna</p>
                          <p className="text-slate-500 text-base mt-1">Låt systemet peka ut fallgropar i likviditeten i förväg.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="text-slate-900 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">Redo för mötet</p>
                          <p className="text-slate-500 text-base mt-1">En strukturerad plan som utstrålar seriositet.</p>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* CTA */}
          <section className="w-full py-40 bg-white text-center">
            <div className="max-w-3xl mx-auto px-6">
              <h3 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">Redo att ta kontroll över siffrorna?</h3>
              <p className="text-xl text-slate-500 mb-10">Börja planera ekonomin för ditt bolag redan i dag. Helt utan risk.</p>
              
              <button 
                onClick={() => setMode('register')}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-lg shadow-slate-900/10"
              >
                Skapa ditt konto gratis <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </main>

        <footer className="py-8 border-t border-slate-100 flex flex-col items-center bg-white">
           <p className="text-sm font-medium text-slate-400">© 2026 Linking Group. Alla rättigheter reserverade.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.05),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative z-10"
      >
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <button 
              onClick={() => setMode('landing')}
              className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-6 shadow-lg ring-4 ring-slate-100 hover:rotate-6 transition-transform"
            >
              <Globe className="text-amber-400" size={32} />
            </button>
            <h2 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight">
              {mode === 'login' ? 'Välkommen tillbaka' : 
               mode === 'register' ? 'Skapa konto' : 
               mode === 'forgot' ? 'Glömt lösenord' : 'Återställ lösenord'}
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-2">
              {mode === 'login' ? 'Logga in för att hantera din affärsstrategi' : 
               mode === 'register' ? 'Börja bygga din finansiella framtid idag' : 
               mode === 'forgot' ? 'Vi skickar en länk för att återställa ditt konto' : 'Välj ett nytt säkert lösenord'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'login' && (
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white border border-slate-200 text-slate-700 rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all mb-4 shadow-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                Fortsätt med Google
              </button>
            )}

            {mode === 'login' && (
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-4 bg-white text-xs font-semibold text-slate-400 uppercase tracking-wide">Eller e-post</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </motion.div>
              )}

              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3"
                >
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-bold text-emerald-600">{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {mode === 'register' && (
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block ml-1">Förnamn</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                        placeholder="Förnamn"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block ml-1">Efternamn</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                        placeholder="Efternamn"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode !== 'reset' && (
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block ml-1">E-postadress</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      placeholder="namn@exempel.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block ml-1">Lösenord</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {(mode === 'register' || mode === 'reset') && (
                    <div className="mt-3 space-y-1.5 ml-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className={`text-xs font-semibold uppercase tracking-wide ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>Minst 8 tecken</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-ZÅÄÖ]/.test(password) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className={`text-xs font-semibold uppercase tracking-wide ${/[A-ZÅÄÖ]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>En stor bokstav (A-Z, ÅÄÖ)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className={`text-xs font-semibold uppercase tracking-wide ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>Minst en siffra</p>
                      </div>
                      {(mode === 'register' || mode === 'reset') && confirmPassword && (
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <p className={`text-xs font-semibold uppercase tracking-wide ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                            {password === confirmPassword ? 'Lösenorden matchar' : 'Lösenorden matchar inte'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(mode === 'register' || mode === 'reset') && (
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block ml-1">Bekräfta lösenord</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  Glömt lösenord?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-semibold text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? 'Logga in' : 
                   mode === 'register' ? 'Skapa konto' : 
                   mode === 'forgot' ? 'Skicka länk' : 'Återställ lösenord'}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center space-y-4">
            {mode === 'login' ? (
              <p className="text-xs font-bold text-slate-400">
                Har du inget konto?{' '}
                <button 
                  onClick={() => setMode('register')}
                  className="text-slate-900 hover:underline"
                >
                  Registrera dig här
                </button>
              </p>
            ) : (
              <button 
                onClick={() => setMode('login')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={16} />
                Logga in
              </button>
            )}

            <div className="pt-4">
              <button 
                onClick={() => setMode('landing')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors"
              >
                Tillbaka till startsidan
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
