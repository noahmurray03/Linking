
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Calculator } from 'lucide-react';

interface InfoTooltipProps {
  text?: string | React.ReactNode;
  definition?: string | React.ReactNode;
  calculation?: string | React.ReactNode;
  example?: string | React.ReactNode;
  iconSize?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, definition, calculation, example, iconSize = 12 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      setCoords({
        top: rect.bottom,
        left: rect.left + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const tooltipContent = isVisible && (
    <div 
      className="fixed mt-2 w-72 p-5 bg-slate-900 text-white text-xs leading-relaxed rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[999999] border border-slate-700/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 origin-top pointer-events-auto"
      style={{
        top: `${Math.max(20, Math.min(window.innerHeight - 300, coords.top + 8))}px`,
        left: `${Math.max(150, Math.min(window.innerWidth - 150, coords.left))}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      <div className="flex items-center gap-2 mb-3 border-b border-slate-700/50 pb-3">
        <div className="bg-amber-400/20 p-1.5 rounded-lg">
          <Calculator size={14} className="text-amber-400" />
        </div>
        <span className="font-semibold uppercase tracking-wider text-xs text-amber-400">Förklaring</span>
      </div>
      <div className="flex flex-col gap-4">
        {text && (
          <div className="text-slate-200 font-medium not-">
            {text}
          </div>
        )}
        {definition && (
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-1 opacity-80">Vad är detta?</h5>
            <div className="text-slate-200 font-medium not-pb-1 border-b border-white/5">{definition}</div>
          </div>
        )}
        {calculation && (
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-1 opacity-80">Så påverkar det kalkylen</h5>
            <div className="text-slate-200 font-medium not-pb-1 border-b border-white/5">{calculation}</div>
          </div>
        )}
        {example && (
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-1 opacity-80">Exempel</h5>
            <div className="text-slate-200 font-medium not-pb-1">{example}</div>
          </div>
        )}
      </div>
      <div 
        className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"
        style={{
          left: `${Math.max(20, Math.min(window.innerWidth - 20, coords.left)) - Math.max(150, Math.min(window.innerWidth - 150, coords.left)) + 150}px`
        }}
      ></div>
    </div>
  );

  return (
    <div className="relative inline-block ml-1" ref={containerRef}>
      <button 
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
        className="focus:outline-none flex items-center justify-center p-0.5"
      >
        <HelpCircle 
          size={iconSize} 
          className={`${isVisible ? 'text-amber-500 scale-110' : 'text-slate-400'} hover:text-amber-500 cursor-pointer transition-all duration-200`} 
        />
      </button>
      {isVisible && createPortal(tooltipContent, document.body)}
    </div>
  );
};
