
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface FinancialSectionProps {
  title: string | React.ReactNode;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onTitleChange?: (newTitle: string) => void;
  onDelete?: () => void;
  isCustomCategory?: boolean;
  columns?: 1 | 2;
}

export const FinancialSection: React.FC<FinancialSectionProps> = ({ 
  title, 
  description,
  icon, 
  children, 
  defaultOpen = false,
  onTitleChange,
  onDelete,
  isCustomCategory = false,
  columns = 2
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 group overflow-hidden">
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm transition-transform group-hover:scale-105">
            {icon}
          </div>
          <div className="flex flex-col">
            {typeof title === 'string' && onTitleChange ? (
              <input 
                className="font-bold text-slate-900 text-sm tracking-tight bg-white/50 border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white px-2 py-0.5 rounded-lg transition-all outline-none focus:ring-0 uppercase w-full"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="font-bold text-slate-900 text-sm tracking-tight uppercase flex items-center gap-2">
                {title}
              </div>
            )}
            {description && (
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">{description}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Radera kategori"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="p-1 px-2 flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tight">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="hidden sm:inline">{isOpen ? 'Dölj' : 'Visa'}</span>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className={`px-6 pb-8 pt-6 grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-5 animate-in fade-in slide-in-from-top-1 duration-200`}>
          {children}
        </div>
      )}
    </div>
  );
};
