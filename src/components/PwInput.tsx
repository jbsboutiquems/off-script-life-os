import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Password input with a show/hide eye toggle. */
export const PwInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  autoComplete?: string;
  /** Exposed for automation + screen readers (Appium/UIAutomator). */
  'aria-label'?: string;
  required?: boolean;
  minLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}> = ({ value, onChange, placeholder, className, id, autoComplete, 'aria-label': ariaLabel, required, minLength, onKeyDown }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        required={required}
        minLength={minLength}
        className={`${className || ''} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        title={show ? 'Hide password' : 'Show password'}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
