import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name || crypto.randomUUID();
  
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 bg-white/80 dark:bg-slate-900/80 border rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-ocean-900 dark:text-ocean-100 font-bold focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all ${
          error ? 'border-coral-500' : 'border-slate-300 dark:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-xs font-medium text-coral-600 dark:text-coral-400">{error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name || crypto.randomUUID();
  
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`w-full px-4 py-3 bg-white/80 dark:bg-slate-900/80 border rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-ocean-900 dark:text-ocean-100 font-bold focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all ${
          error ? 'border-coral-500' : 'border-slate-300 dark:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-xs font-medium text-coral-600 dark:text-coral-400">{error}</p>}
    </div>
  );
};