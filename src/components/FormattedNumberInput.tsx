
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { formatNumber } from '../lib/calculations';

interface FormattedNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  decimals?: number;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  label?: string;
  disabled?: boolean;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({ 
  value, onChange, className, placeholder, decimals, min, max, allowNegative = false, label, disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState((value ?? 0).toString().replace('.', ','));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setInputValue((value ?? 0).toString().replace('.', ','));
      setError(null);
    }
  }, [value, isFocused]);

  const validate = (val: number): string | null => {
    const fieldName = label ? `"${label}"` : "Värdet";
    if (isNaN(val)) return `${fieldName} är inte ett giltigt nummer`;
    if (!allowNegative && val < 0) return `${fieldName} kan inte vara negativt`;
    if (min !== undefined && val < min) return `${fieldName} måste vara minst ${formatNumber(min)}`;
    if (max !== undefined && val > max) return `${fieldName} får vara högst ${formatNumber(max)}`;
    return null;
  };

  const handleBlur = () => {
    if (disabled) return;
    setIsFocused(false);
    const cleaned = inputValue.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    
    const validationError = validate(num);
    if (validationError) {
      setError(validationError);
      setTimeout(() => {
        setInputValue((value ?? 0).toString().replace('.', ','));
        setError(null);
      }, 2000);
    } else if (!isNaN(num)) {
      onChange(num);
      setError(null);
    } else {
      setInputValue((value ?? 0).toString().replace('.', ','));
      setError(null);
    }
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    setInputValue((value ?? 0).toString().replace('.', ','));
    setError(null);
  };

  const displayValue = isFocused ? inputValue : formatNumber(value ?? 0, decimals);

  return (
    <div className="relative w-full group">
      <input
        type="text"
        disabled={disabled}
        className={`${className} ${error ? 'border-red-500 ring-2 ring-red-100' : ''} transition-all duration-200 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}
        value={displayValue}
        onChange={(e) => {
          if (disabled) return;
          setInputValue(e.target.value);
          setError(null);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 -bottom-10 bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg flex items-center gap-2 pointer-events-none"
          >
            <AlertTriangle size={12} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
