
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, BrainCircuit, Sparkles, User, Bot, 
  MessageCircle, LifeBuoy, CheckCircle2, Trash2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestions?: string[];
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  onSuggestionClick,
  onClearChat
}) => {
  const [input, setInput] = React.useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const INITIAL_SUGGESTIONS = [
    "Hur kan jag förbättra min vinstmarginal?",
    "Vad är min burn rate och hur sänker jag den?",
    "Analysera min likviditet för nästa år",
    "Hur påverkar en nyanställning min runway?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 400, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.95 }}
          className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-slate-50 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] z-[150] flex flex-col border-l border-slate-200"
        >
          <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                <BrainCircuit className="text-amber-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">AI Strateg</h2>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {isLoading ? 'Analyserar...' : 'Online & Redo'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button 
                  onClick={onClearChat}
                  className="p-3 hover:bg-red-50 rounded-2xl transition-all text-slate-300 hover:text-red-500"
                  title="Rensa konversation"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 space-y-6"
              >
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border border-slate-100 relative">
                  <Sparkles className="text-amber-400" size={40} />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 uppercase tracking-tight">Välkommen till AI Lasse</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed px-10">
                    Jag är AI Lasse. Fråga mig om likviditet, skalning eller optimering av dina nyckeltal.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 px-4 pt-4">
                  {INITIAL_SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick(suggestion)}
                      className="text-left p-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:border-amber-400 hover:bg-amber-50 transition-all shadow-sm flex items-center gap-3 group"
                    >
                      <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Sparkles size={12} className="text-slate-400 group-hover:text-amber-600" />
                      </div>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-white'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {msg.role === 'user' ? 'Du' : 'AI Lasse'}
                      </span>
                      {msg.role === 'model' && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded uppercase tracking-tight border border-emerald-100">
                          Verifierad Strateg
                        </span>
                      )}
                    </div>
                    
                    <div className={`p-5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-amber-400 text-slate-900 border-amber-300 rounded-tr-none' 
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <div className="markdown-content prose prose-slate prose-xs max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 pl-11 pr-4"
                  >
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => onSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm disabled:opacity-50 group flex items-center gap-2"
                      >
                        <Sparkles size={10} className="text-amber-400 group-hover:scale-125 transition-transform" />
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex gap-1.5 items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Tänker</span>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-amber-400 rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-amber-400 rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-amber-400 rounded-full"></motion.div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-8 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Skriv ett meddelande till AI Lasse..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs outline-none focus:ring-2 focus:ring-amber-400 transition-all font-medium placeholder:text-slate-400"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
