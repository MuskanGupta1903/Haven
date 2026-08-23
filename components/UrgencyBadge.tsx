import React from 'react';
import { UrgencyLevel } from '../types';

export const UrgencyBadge: React.FC<{ level: UrgencyLevel }> = ({ level }) => {
  const config = {
    CRITICAL: {
      classes: 'bg-coral-100 text-coral-700 ring-coral-500/30 dark:bg-coral-900/30 dark:text-coral-300 dark:ring-coral-400/20',
      dot: 'bg-coral-500',
      label: 'CRITICAL',
    },
    MODERATE: {
      classes: 'bg-amber-100 text-amber-700 ring-amber-500/30 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-400/20',
      dot: 'bg-amber-500',
      label: 'MODERATE',
    },
    LOW: {
      classes: 'bg-emerald-100 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20',
      dot: 'bg-emerald-500',
      label: 'LOW',
    },
    UNKNOWN: {
      classes: 'bg-slate-100 text-slate-600 ring-slate-400/20 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-500/20',
      dot: 'bg-slate-400',
      label: 'UNKNOWN',
    },
  };

  const { classes, dot, label } = config[level] ?? config.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot} ${level === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};