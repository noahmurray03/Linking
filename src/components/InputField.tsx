
import React, { useState, useEffect } from 'react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  suffix?: string;
}

const formatNumber = (val: number) => {
  if (val === Infinity) return '∞';
  if (val === undefined || val === null || isNaN(val)) return '0';
  
  const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false });
    
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(",");
};

export const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, suffix = "SEK" }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString().replace('.', ','));

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString().replace('.', ','));
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const cleaned = inputValue.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onChange(num);
    } else {
      setInputValue(value.toString().replace('.', ','));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value.toString().replace('.', ','));
  };

  const displayValue = isFocused ? inputValue : formatNumber(value);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="relative group">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      </div>
    </div>
  );
};
